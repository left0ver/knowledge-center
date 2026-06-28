## 使用
使用起来也很简单，大家具体可以看官网

1. 去掉 dist.init_process_group(backend="nccl", rank=rank, world_size=world_size)这段代码，改为 deepspeed.init_distributed()
2. 在原来的 model 和 optimizer 后面新加

```python
model_engine, optimizer, train_loader, _ = deepspeed.initialize(
    model=model,
    optimizer=optimizer,
    training_data=train_dataset,
    dist_init_required=True,
    config="deepspeed_config.json",
)

device = model_engine.device
```

3. 替换一下反向传播的代码

```python
            # loss.backward()
            # optimizer.step()
            # 新加
            model_engine.backward(loss)
            model_engine.step()
```



## 保存检查点
在 deepspeed 中保存和加载检查点就简单许多，因为已经封装好了

```python
model_engine.save_checkpoint(f"resnet_deepspeed_epoch_{num_epochs}",client_state = {'epoch': num_epochs})
```



## 加载检查点
```python
_,client_state = model_engine.load_checkpoint(args.resume)
print(f"Loaded checkpoint from {args.resume}, resume-epoch: {client_state["epoch"]}")
```



## deepspeed.config 解析
这里提供了部分的 deepspeed.config 的解析，deepspeed 的配置实在太多了

参考：[关于 Deepspeed 的一些总结与心得](https://zhuanlan.zhihu.com/p/650824387)

```json
{
  // train_micro_batch_size_per_gpu 、train_batch_size、gradient_accumulation_steps这三个参数只需要设置2个即可
  //  train_batch_size = train_micro_batch_size_per_gpu  * gradient_accumulation_steps * GPU数量
  // 每个GPU上的训练微批量大小
  "train_micro_batch_size_per_gpu": 128,
  // 总训练批量大小，每个GPU上的mirco_size 加起来
  "train_batch_size": 512,
  // 梯度累积步数
  "gradient_accumulation_steps": 1,
  // 优化器的设置
  "optimizer": {
    "type": "Adam",
    "params": {
      "lr": 0.001,
      "betas": [
        0.8,
        0.999
      ],
      "eps": 1e-8,
      "weight_decay": 3e-7,
      "torch_adam": true,
      "adam_w_mode":true
    }
  },
  //  NOTICE：fp16这部分的参数建议直接设置enabled 为true即可，其他默认
  // "fp16": {
  //   // 是否启用fp16混合精度训练
  //   "enabled": false,
  //   // 是否自动将输入转为fp16
  //   "auto_cast": false,
  //   //   loss_scale: 0表示使用动态损失缩放，其他正数表示使用静态损失缩放
  //   //  因为fp16精度比较小，梯度容易下溢为0，导致NAN，训练不稳定，所有我们会对loss进行放大S倍，之后去更新权重之前，再对梯度除以S即可
  //   "loss_scale": 0.0,
  //   //   动态损失缩放初始值为2^initial_scale_power
  //   "initial_scale_power": 16,
  //   //  再一个窗口（loss_scale_window） 期内，如果没有发生溢出，则提升loss scale，检测到溢出则降低loss scale
  //   "loss_scale_window": 1000,
  //   // 不是一检测到溢出就立刻减小 loss_scale，而是需要累计达到 hysteresis 次溢出之后才真正把 scale 降下去。
  //   "hysteresis": 2,
  //   // 控制如何统计hysteresis 次数
  //   //  false（默认）：累计地计数，只要总共达到了 hysteresis 次溢出，就会按规则调整 loss_scale
  //   //  true： 连续的溢出达到hysteresis的次数才行
  //   "consecutive_hysteresis": false,
  //   // loss scale 的最小值
  //   "min_loss_scale": 1
  // },
  //  梯度裁剪
  "gradient_clipping": 1.0,
  // zero0,禁用分片
  // "zero_optimization": {
  //   "stage": 0
  // }
  // zero1
  // "zero_optimization": {
  //   "stage": 1
  // }
  //  zero2 
  // "zero_optimization": {
  //   "stage": 2,
  //   // stage 1
  //   //  stage 2的一些配置
  //   //  在每个step之后，使用all-gather手机更新后的参数
  //   "allgather_partitions": true,
  //   //  限制每个all-gather分区的大小，桶的数量更大，可以加速通信，但也需要更多内存存储中间结果
  //   "allgather_bucket_size": 5e8,
  //   // 在梯度的通信和计算之间重叠，类似于FSDP的prefetch操作，可以提高训练速度，但是会导致更高的峰值内存
  //   "overlap_comm": true,
  //   //  使用reduce scatter 或 reduce 来替代all-reduce来聚合梯度，可以减少通信开销，默认true 
  //   "reduce_scatter": true,
  //   // 用于控制Allreduce操作的分桶大小。将张量分为较小的桶有助于数据在通信过程中的更高效传输。随着reduce_bucket_size值的增大，每个桶的尺寸也随之增大，这或许能加速通信操作，但同时也需要更多内存来存储中间结果
  //   "reduce_bucket_size": 5e8,
  //   // 复制计算出的梯度到一个连续的内存块中，避免反向传播时的内存碎片问题，默认true
  //   "contiguous_gradients": true,
  //   // 从FP32或者FP16的检查点中初始化FP32的权重
  //   "load_from_fp32_weights": true
  // },
  //  zero3 
  "zero_optimization": {
    "stage": 3,
    //  将参数offload 到cpu 或者NVMe上，只有在zero3上有效
    // "offload_param": {
    //   "device": "cpu",
    //   "pin_memory": true
    // },
    // // 将优化器状态 offload 到cpu或者NVMe上，在zero1、2、3上都有效
    // "offload_optimizer": {
    //   "device": "cpu",
    //   "pin_memory": true
    // },
    "overlap_comm": true,
    "contiguous_gradients": true,
    "sub_group_size": 1e9,
    "reduce_bucket_size": 1e6,
    // prefetch 操作的桶的大小，值越小则占用内存越小，但是通信数量更多
    "stage3_prefetch_bucket_size": 4e6,
    "stage3_param_persistence_threshold": 1e4,
    //  每个GPU在释放内存前可保留的最大参数数量，越小则占用内存越小，但是通信数量更多
    "stage3_max_live_parameters": 1e9,
    "stage3_max_reuse_distance": 1e9,
    //  在保存模型之前会合并权重，因为权重分布在各个GPU上，因此如果模型比较大的话会占用较大的内存并且速度比较慢
    "stage3_gather_16bit_weights_on_model_save": false
  },
  // offload 到nvme
  // "offload_optimizer": {
  //   "device": "nvme",
  //   "nvme_path": "/dev/shm",
  //   "buffer_count": 4,
  //   "fast_init": false
  // },
  // "offload_param": {
  //   "device": "nvme",
  //   "nvme_path": "/dev/shm",
  //   "buffer_count": 5,
  //   "buffer_size": 1e8,
  //   "max_in_cpu": 1e9
  // }
  //  Asynchronous I/O
  "aio": {
    "block_size": 1048576,
    "queue_depth": 8,
    "thread_count": 1,
    "single_submit": false,
    "overlap_events": true
  },
  // logging
  "step_per_print": 10,
  //  启用前向、反向和更新训练阶段的时序计时，以分析时间延迟。
  "wall_clock_breakdown": false,
  // 在初始化后打印出DeepSpeed对象的状态信息
  "dump_state_dict": false,
  //  autotuning
  // "autotuning": {
  //   "enabled": false,
  //   //  autotuning的结果汉朝目录
  //   "results_dir": "autotuning_results",
  //   //  autotuning 实验目录
  //   "exps_dir": "autotuning_exps",
  //   //  是否覆盖已有的autotuning结果
  //   "overwrite": false,
  //   //  调优的目标指标，可以是"throughput"（吞吐量）、 latency（延迟）、FLOPS
  //   "metric": "throughput",
  //   // 从第几步开始性能剖析，前面几步通常是一个预热的状态
  //   "start_profile_step": 3,
  //   //  到第几步结束性能剖析
  //   "end_profile_step": 5,
  //   //   是否启用快速autotuning、仅针对zero_optimization 和  micro-batch sizes 进行调优
  //   "fast": true,
  //   //  限制最大的batch size
  //   "max_train_batch_size": null,
  //   // 模型并行度
  //   "mp_size": 1,
  //   //  探索多少种micro-batch size 的组合
  //   "num_tuning_micro_batch_sizes": 3,
  //   "tuner_type": "model_based",
  //   // 早停，超过最佳实验多少次不提升就停止
  //   "tuner_early_stopping": 5,
  //   //  在一个zero stage 内要搜索的最大实验次数
  //   "tuner_num_trials": 50,
  //   "arg_mappings": null
  // },
  // 激活检查点
  // "activation_checkpointing": {
  //   // 是否在模型并行维度上启用分片激活，即不是每个GPU都保存完整的激活，而是将激活分片存储在不同的GPU上，以节省内存
  //   "partition_activations": false,
  //   // 是否把partition_activations offload到cpu上进一步降低显存
  //   "cpu_checkpointing": false,
  //   // 将分片的激活数据复制到一块 连续的显存 buffer 中
  //   "contiguous_memory_optimization": false,
  //   //  检查点的数量
  //   "number_checkpoints": null,
  //   // 在每个检查点别边界上插入get_accelerator().synchronize()，让所有GPU同步
  //   "synchronize_checkpoint_boundary": false,
  //   // 记录每个检查点的forward和backward的时间
  //   "profile": false
  // }
}
```



## 所有代码
```python
import argparse
import os
import time

import deepspeed
import torch
import torch.distributed as dist
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
import torchvision
import torchvision.transforms as transforms
from torch.nn.parallel import DistributedDataParallel as DDP
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


def resnet34(num_classes=10):
    return ResNet(BasicBlock, [3, 4, 6, 3], num_classes=num_classes)


def resnet50(num_classes=10):
    return ResNet(Bottleneck, [3, 4, 6, 3], num_classes=num_classes)


def resnet101(num_classes=10):
    return ResNet(Bottleneck, [3, 4, 23, 3], num_classes=num_classes)


# def ddp_setup(rank, world_size):
#     dist.init_process_group(backend="nccl", rank=rank, world_size=world_size)
#     torch.cuda.set_device(rank)
#     print(
#         f"master_addr:{os.environ['MASTER_ADDR']}, master_port:{os.environ['MASTER_PORT']}"
#     )


def ddp_cleanup():
    dist.destroy_process_group()


def main(args):
    # 获取当前进程的 rank (全局ID) 和 local_rank (当前节点GPU ID)
    rank = int(os.environ["RANK"])
    local_rank = int(os.environ["LOCAL_RANK"])
    world_size = int(os.environ["WORLD_SIZE"])
    print(f"启动进程: Rank {rank} (Local Rank {local_rank}), World Size {world_size}")
    # ddp_setup(local_rank, world_size)
    deepspeed.init_distributed()

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
    dist.barrier()  # 等待 rank 0 下载完成

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
        model = resnet50(num_classes=10).to(device)
    elif args.model == "resnet34":
        model = resnet34(num_classes=10).to(device)
    elif args.model == "resnet101":
        model = resnet101(num_classes=10).to(device)
    else:
        raise ValueError(f"不支持的模型类型: {args.model}")
    # 将 BatchNorm 转换为 SyncBatchNorm
    model = nn.SyncBatchNorm.convert_sync_batchnorm(model)

    criterion = nn.CrossEntropyLoss().to(device)
    optimizer = optim.Adam(model.parameters(), lr=0.1)
    # 新加
    model_engine, optimizer, train_loader, _ = deepspeed.initialize(
        model=model,
        # 取消则会实验deepspeed.config中配置的优化器
        optimizer=optimizer,
        training_data=train_dataset,
        dist_init_required=True,
        config="deepspeed_config.json",
    )

    device = model_engine.device
    _, client_state = model_engine.load_checkpoint(args.resume)
    print(
        f"Loaded checkpoint from {args.resume}, resume-epoch: {client_state['epoch']}"
    )
    num_epochs = 1
    start_time = time.time()
    for epoch in range(num_epochs):
        model.train()
        running_loss = 0.0
        for i, (inputs, labels) in enumerate(train_loader):
            inputs, labels = inputs.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model_engine(inputs)
            loss = criterion(outputs, labels)
            # loss.backward()
            # optimizer.step()
            # 新加
            model_engine.backward(loss)
            model_engine.step()

            running_loss += loss.item()

            if i % 50 == 0 and local_rank == 0:
                print(f"[Epoch {epoch}][Batch {i}] Loss: {loss.item():.4f}")

        if local_rank == 0:
            avg_loss = running_loss / len(train_loader)
            print(f"Epoch {epoch} finished. Avg Loss: {avg_loss:.4f}")

            # 保存模型 (注意要保存 model.module)
            # torch.save(model.module.state_dict(), f"resnet34_epoch_{epoch}.pth")
    end_time = time.time()

    print(
        f"current rank:{local_rank}, total training time: {end_time - start_time:.2f} seconds"
    )
    model_engine.save_checkpoint(
        f"resnet_deepspeed_epoch_{num_epochs}", client_state={"epoch": num_epochs}
    )
    print(f"Model checkpoint saved at resnet_deepspeed_epoch_{num_epochs}")
    # 销毁进程组
    ddp_cleanup()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--model",
        choices=["resnet34", "resnet50", "resnet101"],
        default="resnet34",
        help="model to train",
    )
    parser.add_argument(
        "--local_rank", type=int, default=-1, help="local rank for distributed training"
    )
    parser.add_argument(
        "--resume", type=str, default=None, help="path to resume checkpoint"
    )
    args = parser.parse_args()
    print(f"train model {args.model}")
    print(f"resume path = {args.resume}")
    main(args)

```

