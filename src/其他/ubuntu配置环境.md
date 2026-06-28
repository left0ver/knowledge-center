添加 nvidia 驱动仓库

```plain
sudo add-apt-repository ppa:graphics-drivers/ppa
sudo apt update
```

## 安装 Nvidia 驱动
`ubuntu-drivers devices`命令查看适合的驱动版本

![](https://img.leftover.cn/img-md/1757571763757-a9bcdecc-4b3c-4f05-821b-57dcbd0e5b5a.png)

安装推荐的即可，`apt install nvidia-driver-555`

之后`reboot`重启，之后`nvidia-smi`验证有没有安装成功

## 安装 CUDA
### 安装 CUDA 套件
`apt search cuda-toolkit` 查看有哪些版本的 CUDA

然后使用`nvidia-smi`查看驱动支持的 CUDA 版本，下载合适的就行

我下载`apt install cuda-toolkit-12-8`

### 配置环境变量
这里建议使用 root 用户安装，然后配置环境变量到系统的环境变量里面，这样所有用户就都可以使用，不需要每个用户都安装一个

```plain
echo 'export PATH=/usr/local/cuda-12.8/bin${PATH:+:${PATH}}' >> /etc/profile
echo 'export LD_LIBRARY_PATH=/usr/local/cuda-12.8/lib64${LD_LIBRARY_PATH:+:${LD_LIBRARY_PATH}}' >> /etc/profile
source /etc/profile
```

使用`nvcc -V`来验证是否安装成功

![](https://img.leftover.cn/img-md/1757572353874-f56d8606-9733-494d-8743-42403300860c.png)

## 安装 cudnn 
1. 安装

`sudo apt install libcudnn9-cuda-12 libcudnn9-dev-cuda-12 libcudnn9-samples`

2. 检查 cudnn 版本

`dpkg -l | grep cudnn`



## 安装 miniconda
### 安装
1. 去[官网](https://www.anaconda.com/docs/getting-started/miniconda/install#linux-2)找到安装的命令，通常是

`<font style="color:rgb(149, 56, 0);">wget</font><font style="color:rgb(10, 48, 105);"> https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh</font><font style="color:rgb(5, 80, 174);"> -O</font><font style="color:rgb(10, 48, 105);"> miniconda.sh</font>`

2.  `<font style="color:rgb(10, 48, 105);">bash miniconda.sh</font>``，根据提示操作即可
3. `source ~/.bashrc` 激活环境变量
4. `conda --version` 验证是否安装成功

> miniconda 建议使用当前用户安装即可，每个用户隔离开来，这样不会混乱
>

### 配置源
```plain
conda config --add channels https://mirrors.tuna.tsinghua.edu.cn/anaconda/pkgs/free/
conda config --add channels https://mirrors.tuna.tsinghua.edu.cn/anaconda/pkgs/main/
conda config --add channels https://mirrors.tuna.tsinghua.edu.cn/anaconda/cloud/conda-forge/
```

设置搜索的时候显示 channel 的地址

```bash
conda config --set show_channel_urls yes
```

## 安装指定的 python
> 这里我们最好下载一个指定的 python 版本，以便我们之后可以通过 vscode 快速地创建环境以及快速的下载 pytorch，当然你如果使用 conda 来创建虚拟环境的话，就不需要这个，我有时候会使用 vscode 的快捷创建虚拟环境的方法，在项目的内部创建虚拟环境，然后由于 pytorch 的 gpu 版本比较大，下载速度比较慢，但是 pip 会将其缓存，因此我们只要保证 python 版本和每次下载的 python 版本一致即可，例如我的 python=3.12.10，pytorch=2.71+cu128
>



1. 在 python 官网找到你需要的那个 python 版本下载到本地之后上传到服务器并解压
2. 安装一些必要的依赖

```bash
sudo apt update
sudo apt install -y build-essential zlib1g-dev libncurses5-dev libgdbm-dev libnss3-dev libssl-dev libreadline-dev libffi-dev libsqlite3-dev wget libbz2-dev
```

3. 进入到上传的对应的 python 目录里面

```bash
cd /opt/Python-3.12.10
```

4. 运行配置脚本

```bash
./configure --enable-optimizations --prefix=/usr/local
```

5. 编译源码

```bash
make -j $(nproc)
```

6. 安装 python

使用 altinstall 安装，避免和系统默认的 python 或 python3 冲突

```bash
sudo make altinstall
```

7. 验证安装

> 注意我的是 3.12 版本，所以这里是 python3.12
>

```bash
/usr/local/bin/python3.12 --version
/usr/local/bin/pip3.12 --version
```

8. 创建软连接

之后就可以直接使用 python 和 pip 命令了

```bash
sudo ln -s /usr/local/bin/python3.12 /usr/local/bin/python
sudo ln -s /usr/local/bin/pip3.12 /usr/local/bin/pip
```

> 之后可能得运行 source /etc/profile 来使环境变量生效
>

9. 配置 pip 源

配置一下当前用户对应的全局的 pip 源

```bash
vim ~/.pip/pip.conf
```

添加以下内容

```bash
[global]
index-url = http://pypi.tuna.tsinghua.edu.cn/simple/
[install]
trusted-host = pypi.tuna.tsinghua.edu.cn
```

之后使用`pip config get global.index-url` 查看



## 下载 Git
```bash
apt install git
```

## 下载 uv
我们也可以使用 uv 来管理我们的 python 项目，因此也可以安装一下 uv

### 安装
在[uv-custom](https://www.anaconda.com/docs/getting-started/miniconda/install#linux-2)中找到 uv 对于的国内加速版，使用它给的命令安装即可，他会自动配置 pip 的源

```bash
curl -LsSf https://gitee.com/wangnov/uv-custom/releases/download/0.8.17/uv-installer-custom.sh | sh
```

> 因为网络原因，直接从 uv 的官网常常下载不了，因此我们通过这个项目的安装
>



## github 镜像站
只需要将 github 替换为 kkgithub 即可，例如

`pip install "unsloth[cu128-torch271] @ git+[https://github.com/https://github.com/unslothai/unsloth.git"](https://kgithub.com/https://github.com/unslothai/unsloth.git")` 替换为`pip install "unsloth[cu128-torch271] @ git+[https://kkgithub.com/unslothai/unsloth.git"](https://kgithub.com/https://github.com/unslothai/unsloth.git")`

