FSDP 类似于 deepspeed 的 zero，是一个数据并行方法。在 DDP 中，模型的参数、优化器状态会复制到所有的 GPU 上，而 FSDP 则将模型参数、优化器状态、梯度进行分片到不同的 GPU 上

## 使用
使用起来还是比较简单的，只需要在原来的 model 后面使用 FSDP 包裹一层即可，之后再声明 optimizer

```python
    model = resnet50()
    model = FSDP(
        model,
        # auto_wrap_policy=size_based_auto_wrap_policy,
        auto_wrap_policy=partial(size_based_auto_wrap_policy, min_num_params=4000),
        # auto_wrap_policy= always_wrap_policy,
        # auto_wrap_policy= partial(_module_wrap_policy,module_classes = [nn.Conv2d, nn.Linear]),
        # offload_params=True ，则可以实现将参数和显存卸载到CPU上 ，类似于zero-offload，如果显存比较紧张的时候可以使用这个
        cpu_offload=CPUOffload(offload_params=False),
        # 默认的分片策略为FULL_SHARD，即zero3
        # SHARD_GRAD_OP 为zero2
        # NO_SHARD不分片，退化为DDP
        # HYBRID_SHARD: 在单个节点上做FULL_SHARD （适合多机多卡）
        # _HYBRID_SHARD_ZERO2:在单个节点上做SHARD_GRAD_OP （适合多机多卡）
        sharding_strategy=ShardingStrategy.FULL_SHARD,
        # mixed_precision=MixedPrecision(
        #     # 参数
        #     param_dtype=torch.float16,
        #     # 梯度
        #     reduce_dtype=torch.float16,
        # ),
        sync_module_states=True,
        use_orig_params=False,
        device_id=local_rank,
    )
    optimizer = optim.Adam(model.parameters(), lr=0.1)
```

然后其他的就和 DDP 一样，使用`DistributedSampler`进行采样，让每个 GPU 上执行不同的 batch

## 保存检查点
通常 FSDP 会有两种保存方式，一种叫`FULL_STATE_DICT`、一种叫`SHARDED_STATE_DICT`

+ `FULL_STATE_DICT` 一般是将模型状态、优化器状态等 offload 到 CPU 上，再聚合到 rank0 上，再由 rank0 保存为一个文件
+ `SHARDED_STATE_DICT` 则是每个 GPU 分别保存自己的对应分片上的模型状态和优化器状态

> 加载检查点也是同理
>

**FULL_STATE_DICT 的保存**

```python
        full_state_dict_config = FullStateDictConfig(
            offload_to_cpu=True, rank0_only=True
        )
        full_optim_config = FullOptimStateDictConfig(
            offload_to_cpu=True, rank0_only=True
        )

        with FSDP.state_dict_type(
            model,
            StateDictType.FULL_STATE_DICT,
            full_state_dict_config,
            full_optim_config,
        ):
            # 需要每个进程都调用
            model_state_dict = model.state_dict()
            optim_state_dict = FSDP.optim_state_dict(model, optimizer)
            state_dict = {
                "model": model_state_dict,
                "optimizer": optim_state_dict,
                "train_state": {
                    "epoch": num_epochs,
                },
            }
            if local_rank == 0:
                torch.save(state_dict, f"{args.model}_fsdp1_final.pth")
                print(f"keys : {state_dict.keys()}")
                print(f"模型已保存到 {args.model}_fsdp1_final.pth")
            dist.barrier()  # 确保所有进程在保存后再继续
```

> 1. 保存的时候需要每个进程都调用对应的 state_dict 方法
> 2. 获得优化器的 state_dict 得用专门的`FSDP.optim_state_dict(model, optimizer)`
> 3. 只需要 rank0 进行保存即可
>

**SHARDED_STATE_DICT **

```python
        model_state_dict, optimizer_state_dict = get_state_dict(model, optimizer)
        sharded_state = {
            "model": model_state_dict,
            "optimizer": optimizer_state_dict,
            "train_state": {
                "epoch": num_epochs,
            },
        }

        dist_checkpoint.save(
            sharded_state,
            storage_writer=dist_checkpoint.FileSystemWriter(
                f"sharded_{args.model}_fsdp1", overwrite=True
            ),
        )
```

> 现在 pytorch 出了 DCP，可以使用 DCP 的 api 很简单地保存和加载分片的检查点，就和 torch.save 的流程差不多
>

## 加载检查点
**FULL_STATE_DICT**

```python
    full_state_dict_config = FullStateDictConfig(
        offload_to_cpu=True, rank0_only=True
    )
    full_optim_config = FullOptimStateDictConfig(
        offload_to_cpu=True, rank0_only=True
    )
    with FSDP.state_dict_type(
        model,
        StateDictType.FULL_STATE_DICT,
        full_state_dict_config,
        full_optim_config,
    ):


        print(f"从full的检查点{args.resume}恢复模型")
        state_dict = torch.load(
            args.resume, weights_only=False, map_location="cpu"
        )

        model.load_state_dict(state_dict["model"])
        FSDP.optim_state_dict_to_load(model, optimizer, state_dict["optimizer"])
```

> 1. 上面的代码需要在每个 rank 中执行
> 2. 加载优化器状态的时候需要使用这个`FSDP.optim_state_dict_to_load` api
>

**SHARDED_STATE_DICT**

```python
# 使用DCP 进行加载
if args.state_dict_type == "shard":
    model_state_dict, optimizer_state_dict = get_state_dict(model, optimizer)

    state_dict = {
        "model": model_state_dict,
        "optimizer": optimizer_state_dict,
        "train_state": {
            "epoch": None,
        },
    }
    assert args.resume is not None and os.path.isdir(args.resume)
    dist_checkpoint.load(state_dict, checkpoint_id=args.resume)
    print(f"train_state = {state_dict['train_state']}")
    set_state_dict(
        model,
        optimizer,
        model_state_dict=state_dict["model"],
        optim_state_dict=state_dict["optimizer"],
    )
```

> 1. 先必须声明 state_dict，因为 dist_checkpoint.load(state_dict, checkpoint_id=args.resume)会直接修改原来的传入的 state_dict
> 2. 再调用 set_state_dict 设置模型的参数和优化器的参数即可
>

## FSDP1 的一些配置
1. wrap 策略：通常有`size_based_auto_wrap_policy` 、`transformer_auto_wrap_policy`

> `size_based_auto_wrap_policy`  即将大于`min_num_params` 参数的 layer 合并到一起进行分片
>
> `transformer_auto_wrap_policy` 通常则是对每个 transformer block 进行分片
>

2. 分片策略：
+ 默认的分片策略为 FULL_SHARD，即 zero3
+  SHARD_GRAD_OP 为 zero2
+  NO_SHARD 不分片，退化为 DDP
+ HYBRID_SHARD: 在单个节点上做 FULL_SHARD （适合多机多卡）
+ _HYBRID_SHARD_ZERO2:在单个节点上做 SHARD_GRAD_OP （适合多机多卡）
3. CPUOffload: 可以将参数和梯度 offload 到 CPU 上，类似于 deepspeed-offload，由于参数的更新并不是特别消耗计算资源，因此可以 offload 到 cpu 上进行，可以进一步节省显存
4. sync_module_states：为 true，则初始化的时候会将 rank0 上的参数广播给其他 rank
5. `mixed_precision` ：可以开启混合精度训练，并配置参数、梯度、缓冲区对应的数据类型
6. `backward_prefetch`： 

![](https://img.leftover.cn/img-md/1763981279805-a0d1ebba-af5d-4bf8-a754-e38e6a21b320.png)

+ `BACKWARD_PRE` ：在计算第 N 层的梯度之前，就 prefetchN-1 层的参数，可以重叠通信的开销和梯度的计算，以提高速度，**缺点就是会增加峰值的显存，峰值的时候同时存在当前层的参数、梯度、下一层的参数**
+ `BACKWARD_POST` ：在计算完当前层的梯度时，prefetch 第 N-1 层的参数，相比`BACKWARD_PRE` ，其峰值显存会更低，但速度的提升也没`BACKWARD_PRE` 那么多。显存峰值的时候会同时持有当前层的梯度、下一层的参数
7. limit_all_gathers：如果为 true，则会限制同时进行 all-gather 操作，防止显存占用突然上升导致 OOM
8. use_orig_params：默认为 false，如果为 true，FSDP 则会向外暴露原始的参数结构，建议为 true

## 所有代码
```python
import argparse
import os
import time
from functools import partial

import torch
import torch.distributed as dist
import torch.distributed.checkpoint as dist_checkpoint
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
import torchvision
import torchvision.transforms as transforms
from torch.distributed.checkpoint.state_dict import get_state_dict, set_state_dict

# FSDP 1.0
from torch.distributed.fsdp import (
    FullOptimStateDictConfig,
    FullStateDictConfig,
    ShardedStateDictConfig,
    StateDictType,
)
from torch.distributed.fsdp import FullyShardedDataParallel as FSDP
from torch.distributed.fsdp.fully_sharded_data_parallel import (
    BackwardPrefetch,
    CPUOffload,
    MixedPrecision,
    ShardingStrategy,
)
from torch.distributed.fsdp.wrap import (
    size_based_auto_wrap_policy,
)
from torch.utils.data import DataLoader
from torch.utils.data.distributed import DistributedSampler


class BasicBlock(nn.Module):
    expansion = 1

    def __init__(self, in_planes, planes, stride=1):
        super(BasicBlock, self).__init__()
        self.conv1 = nn.Conv2d(
            in_planes, planes, kernel_size=3, stride=stride, padding=1, bias=False
        )
        self.bn1 = nn.BatchNorm2d(planes)
        self.conv2 = nn.Conv2d(
            planes, planes, kernel_size=3, stride=1, padding=1, bias=False
        )
        self.bn2 = nn.BatchNorm2d(planes)
        self.shortcut = nn.Sequential()
        if stride != 1 or in_planes != self.expansion * planes:
            self.shortcut = nn.Sequential(
                nn.Conv2d(
                    in_planes,
                    self.expansion * planes,
                    kernel_size=1,
                    stride=stride,
                    bias=False,
                ),
                nn.BatchNorm2d(self.expansion * planes),
            )

    def forward(self, x):
        out = F.relu(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        out += self.shortcut(x)
        out = F.relu(out)
        return out


class Bottleneck(nn.Module):
    expansion = 4  # 输出通道数是输入通道数的 4 倍

    def __init__(self, in_planes, planes, stride=1):
        super(Bottleneck, self).__init__()

        # 1x1 卷积: 降维 (Compress)
        self.conv1 = nn.Conv2d(in_planes, planes, kernel_size=1, bias=False)
        self.bn1 = nn.BatchNorm2d(planes)

        # 3x3 卷积: 特征提取
        self.conv2 = nn.Conv2d(
            planes, planes, kernel_size=3, stride=stride, padding=1, bias=False
        )
        self.bn2 = nn.BatchNorm2d(planes)

        # 1x1 卷积: 升维 (Expand) -> planes * 4
        self.conv3 = nn.Conv2d(
            planes, self.expansion * planes, kernel_size=1, bias=False
        )
        self.bn3 = nn.BatchNorm2d(self.expansion * planes)

        # 快捷连接 (Shortcut)
        self.shortcut = nn.Sequential()
        # 如果 stride != 1 或者输入通道 != 输出通道，需要调整 shortcut 的维度
        if stride != 1 or in_planes != self.expansion * planes:
            self.shortcut = nn.Sequential(
                nn.Conv2d(
                    in_planes,
                    self.expansion * planes,
                    kernel_size=1,
                    stride=stride,
                    bias=False,
                ),
                nn.BatchNorm2d(self.expansion * planes),
            )

    def forward(self, x):
        out = F.relu(self.bn1(self.conv1(x)))
        out = F.relu(self.bn2(self.conv2(out)))
        out = self.bn3(self.conv3(out))

        out += self.shortcut(x)
        out = F.relu(out)
        return out


class ResNet(nn.Module):
    def __init__(self, block, num_blocks, num_classes=1000):
        super(ResNet, self).__init__()
        self.in_planes = 64
        # 针对 CIFAR-10 修改了第一层卷积 (kernel=3, stride=1) 以适应小图
        # 如果是 ImageNet，请改回 kernel=7, stride=2
        self.conv1 = nn.Conv2d(3, 64, kernel_size=3, stride=1, padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(64)
        self.relu = nn.ReLU(inplace=True)
        # self.maxpool = nn.MaxPool2d(...) # CIFAR-10 通常移除 maxpool

        self.layer1 = self._make_layer(block, 64, num_blocks[0], stride=1)
        self.layer2 = self._make_layer(block, 128, num_blocks[1], stride=2)
        self.layer3 = self._make_layer(block, 256, num_blocks[2], stride=2)
        self.layer4 = self._make_layer(block, 512, num_blocks[3], stride=2)
        self.avgpool = nn.AdaptiveAvgPool2d((1, 1))
        self.fc = nn.Linear(512 * block.expansion, num_classes)

    def _make_layer(self, block, planes, num_blocks, stride):
        strides = [stride] + [1] * (num_blocks - 1)
        layers = []
        for stride in strides:
            layers.append(block(self.in_planes, planes, stride))
            self.in_planes = planes * block.expansion
        return nn.Sequential(*layers)

    def forward(self, x):
        out = F.relu(self.bn1(self.conv1(x)))
        out = self.layer1(out)
        out = self.layer2(out)
        out = self.layer3(out)
        out = self.layer4(out)
        out = self.avgpool(out)
        out = torch.flatten(out, 1)
        out = self.fc(out)
        return out


def resnet34(num_classes=10):
    return ResNet(BasicBlock, [3, 4, 6, 3], num_classes=num_classes)


def resnet50(num_classes=10):
    return ResNet(Bottleneck, [3, 4, 6, 3], num_classes=num_classes)


def resnet101(num_classes=10):
    return ResNet(Bottleneck, [3, 4, 23, 3], num_classes=num_classes)


def ddp_setup(rank, world_size):
    dist.init_process_group(backend="nccl", rank=rank, world_size=world_size)
    torch.cuda.set_device(rank)
    print(
        f"master_addr:{os.environ['MASTER_ADDR']}, master_port:{os.environ['MASTER_PORT']}"
    )


def ddp_cleanup():
    dist.destroy_process_group()


def main(args):
    # 获取当前进程的 rank (全局ID) 和 local_rank (当前节点GPU ID)
    rank = int(os.environ["RANK"])
    local_rank = int(os.environ["LOCAL_RANK"])
    world_size = int(os.environ["WORLD_SIZE"])
    print(f"启动进程: Rank {rank} (Local Rank {local_rank}), World Size {world_size}")
    ddp_setup(local_rank, world_size)

    device = torch.device(f"cuda:{local_rank}")

    if local_rank == 0:
        print(f"启动分布式训练: World Size = {world_size}")
    transform_train = transforms.Compose(
        [
            transforms.RandomCrop(32, padding=4),
            transforms.RandomHorizontalFlip(),
            transforms.ToTensor(),
            transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2023, 0.1994, 0.2010)),
        ]
    )
    # 下载数据集
    if local_rank == 0:
        train_dataset = torchvision.datasets.CIFAR10(
            root="./data", train=True, download=True, transform=transform_train
        )
    dist.barrier(device_ids=[local_rank])  # 等待 rank 0 下载完成

    # 数据进行分片
    train_dataset = torchvision.datasets.CIFAR10(
        root="./data", train=True, download=False, transform=transform_train
    )
    train_sampler = DistributedSampler(
        train_dataset, shuffle=True, num_replicas=world_size, rank=rank
    )
    train_loader = DataLoader(
        train_dataset,
        batch_size=128,  # 单卡的 batch size
        shuffle=False,  # 必须为 False，因为 sampler 已经处理了随机性
        num_workers=4,
        pin_memory=True,
        sampler=train_sampler,
    )
    if args.model == "resnet50":
        model = resnet50(num_classes=10)
    elif args.model == "resnet34":
        model = resnet34(num_classes=10)
    elif args.model == "resnet101":
        model = resnet101(num_classes=10)
    else:
        raise ValueError(f"不支持的模型类型: {args.model}")

        # 将 BatchNorm 转换为 SyncBatchNorm
    model = nn.SyncBatchNorm.convert_sync_batchnorm(model)
    # NOTICE:需要先进行分片，再创建优化器
    # model = FSDP(model,auto_wrap_policy= partial(size_based_auto_wrap_policy, min_num_params=20000))
    model = FSDP(
        model,
        # auto_wrap_policy=size_based_auto_wrap_policy,
        auto_wrap_policy=partial(size_based_auto_wrap_policy, min_num_params=4000),
        # auto_wrap_policy= partial(_module_wrap_policy,module_classes = [nn.Conv2d, nn.Linear]),
        # offload_params=True ，则可以实现将参数和显存卸载到CPU上 ，类似于zero-offload，如果显存比较紧张的时候可以使用这个
        cpu_offload=CPUOffload(offload_params=False),
        # 默认的分片策略为FULL_SHARD，即zero3
        # SHARD_GRAD_OP 为zero2
        # NO_SHARD不分片，退化为DDP
        # HYBRID_SHARD: 在单个节点上做FULL_SHARD （适合多机多卡）
        # _HYBRID_SHARD_ZERO2:在单个节点上做SHARD_GRAD_OP （适合多机多卡）
        sharding_strategy=ShardingStrategy.FULL_SHARD,
        # mixed_precision=MixedPrecision(
        #     # 参数
        #     param_dtype=torch.float16,
        #     # 梯度
        #     reduce_dtype=torch.float16,
        # ),
        sync_module_states=True,
        use_orig_params=False,
        device_id=local_rank,
    )
    optimizer = optim.Adam(model.parameters(), lr=0.1)
    # resume
    if args.resume is not None:
        if args.state_dict_type == "full":
            full_state_dict_config = FullStateDictConfig(
                offload_to_cpu=True, rank0_only=True
            )
            full_optim_config = FullOptimStateDictConfig(
                offload_to_cpu=True, rank0_only=True
            )
            with FSDP.state_dict_type(
                model,
                StateDictType.FULL_STATE_DICT,
                full_state_dict_config,
                full_optim_config,
            ):


                print(f"从full的检查点{args.resume}恢复模型")
                state_dict = torch.load(
                    args.resume, weights_only=False, map_location="cpu"
                )

                model.load_state_dict(state_dict["model"])
                FSDP.optim_state_dict_to_load(model, optimizer, state_dict["optimizer"])
                print(state_dict.keys())
                print(
                    f" cur rank = {local_rank}, train_state = {state_dict['train_state']}"
                )
        # 使用DCP 进行加载
        if args.state_dict_type == "shard":
            model_state_dict, optimizer_state_dict = get_state_dict(model, optimizer)

            state_dict = {
                "model": model_state_dict,
                "optimizer": optimizer_state_dict,
                "train_state": {
                    "epoch": None,
                },
            }
            assert args.resume is not None and os.path.isdir(args.resume)
            dist_checkpoint.load(state_dict, checkpoint_id=args.resume)
            print(f"train_state = {state_dict['train_state']}")
            set_state_dict(
                model,
                optimizer,
                model_state_dict=state_dict["model"],
                optim_state_dict=state_dict["optimizer"],
            )

    criterion = nn.CrossEntropyLoss().to(device)
    num_epochs = 5
    start_time = time.time()
    for epoch in range(num_epochs):
        model.train()
        running_loss = 0.0
        for i, (inputs, labels) in enumerate(train_loader):
            inputs, labels = inputs.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item()

            if i % 50 == 0 and local_rank == 0:
                print(f"[Epoch {epoch}][Batch {i}] Loss: {loss.item():.4f}")

        if local_rank == 0:
            avg_loss = running_loss / len(train_loader)
            print(f"Epoch {epoch} finished. Avg Loss: {avg_loss:.4f}")
    end_time = time.time()
    print(
        f"current_rank:{local_rank}, Training completed in {end_time - start_time:.2f} seconds."
    )

    if args.state_dict_type == "full":
        full_state_dict_config = FullStateDictConfig(
            offload_to_cpu=True, rank0_only=True
        )
        full_optim_config = FullOptimStateDictConfig(
            offload_to_cpu=True, rank0_only=True
        )

        with FSDP.state_dict_type(
            model,
            StateDictType.FULL_STATE_DICT,
            full_state_dict_config,
            full_optim_config,
        ):
            # 需要每个进程都调用
            model_state_dict = model.state_dict()
            optim_state_dict = FSDP.optim_state_dict(model, optimizer)
            state_dict = {
                "model": model_state_dict,
                "optimizer": optim_state_dict,
                "train_state": {
                    "epoch": num_epochs,
                },
            }
            if local_rank == 0:
                torch.save(state_dict, f"{args.model}_fsdp1_final.pth")
                print(f"keys : {state_dict.keys()}")
                print(f"模型已保存到 {args.model}_fsdp1_final.pth")
            dist.barrier()  # 确保所有进程在保存后再继续

    elif args.state_dict_type == "shard":
        model_state_dict, optimizer_state_dict = get_state_dict(model, optimizer)
        sharded_state = {
            "model": model_state_dict,
            "optimizer": optimizer_state_dict,
            "train_state": {
                "epoch": num_epochs,
            },
        }

        dist_checkpoint.save(
            sharded_state,
            storage_writer=dist_checkpoint.FileSystemWriter(
                f"sharded_{args.model}_fsdp1", overwrite=True
            ),
        )
    # 销毁进程组
    ddp_cleanup()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--resume", required=False, help="path to resume checkpoint")
    parser.add_argument(
        "--model",
        choices=["resnet34", "resnet50", "resnet101"],
        default="resnet34",
        help="model to train",
    )
    parser.add_argument(
        "--state_dict_type",
        choices=["full", "shard"],
        default="full",
        help="state_dict_type to save",
    )
    args = parser.parse_args()
    print(f"resume path:{args.resume}")
    print(f"train model {args.model}")
    main(args)

```

