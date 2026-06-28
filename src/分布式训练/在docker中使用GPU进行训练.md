## 前置条件
1. 在你的系统上安装完了 CUDA
2. 下载了 docker

## Ubuntu24
对于一些比较新的系统，例如 Ubuntu20、Ubuntu22、Ubuntu24，可以直接使用这种方法，至于一些比较老的系统，例如 Ubuntu18，我看不在支持列表里面，因此没有使用这种方法，单独去网上找了教程，刚好实验室有两个服务器，因此在两个服务器上分别尝试了一下

参考[NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html)

![](https://img.leftover.cn/img-md/1764240223902-7528ecb9-1f74-48f1-9317-23a6bbcc0d42.png)



```shell
sudo apt-get update && sudo apt-get install -y --no-install-recommends \
   curl \
   gnupg2
```

```shell
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg \
  && curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
    sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
    sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
```

```shell
sudo apt-get update
```

下载<font style="color:rgb(26, 26, 26);">NVIDIA Container Toolkit packages</font>

```shell
export NVIDIA_CONTAINER_TOOLKIT_VERSION=1.18.0-1
  sudo apt-get install -y \
      nvidia-container-toolkit=${NVIDIA_CONTAINER_TOOLKIT_VERSION} \
      nvidia-container-toolkit-base=${NVIDIA_CONTAINER_TOOLKIT_VERSION} \
      libnvidia-container-tools=${NVIDIA_CONTAINER_TOOLKIT_VERSION} \
      libnvidia-container1=${NVIDIA_CONTAINER_TOOLKIT_VERSION}
```

配置容器运行时

```shell
sudo nvidia-ctk runtime configure --runtime=docker
```

重启<font style="color:rgb(26, 26, 26);">Docker daemon</font>

```shell
sudo systemctl restart docker
```

## Ubuntu18
Ubuntu18 的配置我参考了这篇[blog](https://grady1006.medium.com/ubuntu18-04%E5%AE%89%E8%A3%9Ddocker%E5%92%8Cnvidia-docker-%E4%BD%BF%E7%94%A8%E5%A4%96%E6%8E%A5%E9%A1%AF%E5%8D%A1-1e3c404c517d)

```shell
# 新增套件＆系统更新&安装
$ distribution=$(. /etc/os-release;echo $ID$VERSION_ID) 
$ curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add - 
$ curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list 

$ sudo apt-get update && sudo apt-get install -y nvidia-container-toolkit 
$ sudo systemctl restart docker
```



## 测试
查看 docker 是否可以访问宿主机的显卡

```shell
sudo docker run --gpus all nvidia/cuda:9.0-base nvidia-smi
```

## 在 docker 训练模型
要在 docker 中训练模型，我们需要下载 pytorch 的镜像，可以使用这个[渡渡鸟](https://docker.aityp.com/r/docker.io/pytorch/pytorch)的镜像，他将一些 docker 上比较常用的镜像同步到了华为云的容器平台，因此国内下载很快

```python
# dockerfile
FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/pytorch/pytorch:2.7.1-cuda11.8-cudnn9-runtime
WORKDIR /app

RUN pip install --no-cache-dir accelerate -i https://pypi.tuna.tsinghua.edu.cn/simple
# 将代码复制到容器中
COPY . .
# 设置容器启动时执行的命令
ENTRYPOINT ["python", "train.py"]

```



```python
import argparse
import os
import time

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


def main(args):
    transform_train = transforms.Compose(
        [
            transforms.RandomCrop(32, padding=4),
            transforms.RandomHorizontalFlip(),
            transforms.ToTensor(),
            transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2023, 0.1994, 0.2010)),
        ]
    )

    train_dataset = torchvision.datasets.CIFAR10(
        root="./data", train=True, download=True, transform=transform_train
    )

    # 数据进行分片
    train_dataset = torchvision.datasets.CIFAR10(
        root="./data", train=True, download=False, transform=transform_train
    )

    train_loader = DataLoader(
        train_dataset,
        batch_size=128,  # 单卡的 batch size
        shuffle=True,  # 必须为 False，因为 sampler 已经处理了随机性
        num_workers=4,
        pin_memory=True,
    )
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    if args.model == "resnet50":
        model = resnet50(num_classes=10).to(device)
    elif args.model == "resnet34":
        model = resnet34(num_classes=10).to(device)
    elif args.model == "resnet101":
        model = resnet101(num_classes=10).to(device)
    else:
        raise ValueError(f"不支持的模型类型: {args.model}")

    criterion = nn.CrossEntropyLoss().to(device)
    optimizer = optim.Adam(model.parameters(), lr=0.1)

    num_epochs = 2
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

            if i % 50 == 0:
                print(f"[Epoch {epoch}][Batch {i}] Loss: {loss.item():.4f}")

        avg_loss = running_loss / len(train_loader)
        print(f"Epoch {epoch} finished. Avg Loss: {avg_loss:.4f}")
    end_time = time.time()
    print(f"Training completed in {end_time - start_time:.2f} seconds.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--model",
        choices=["resnet34", "resnet50", "resnet101"],
        default="resnet50",
        help="model to train",
    )
    args = parser.parse_args()
    print(f"train model {args.model}")
    main(args)

```

打包镜像

```shell
docker build -t train_cifar-10
```

启动镜像并训练模型

```shell
docker run --gpus all --shm-size=8g train_cifar-10:latest  --model=resnet101
```

> --gpus all: 使用宿主机上的所有 GPU
>
> --shm-size：设置共享内存的大小，dataloader 加载数据以及分布式训练的时候，多进程之间需要共享数据，而 docker 默认的共享内存为 64MB，对于深度学习来说不太够用
>

