1. 若是安装了驱动的话，建议使用`nvidia-smi` 看一下支持的 CUDA 版本，再把驱动删除，因为下载`cuda-toolkit`的时候会帮你下载驱动

   若是没有安装驱动，则需要使用`ubuntu-drivers devices` 看一下你可用的显卡驱动版本，找到一个你想要下载的驱动版本,再去[这里](https://docs.nvidia.com/cuda/cuda-toolkit-release-notes/index.html)找到你这个驱动支持的 CUDA 版本，这个 CUDA 版本就是你待会下载`cuda-toolkit`的版本
   
   ```python
   # 卸载驱动的方法
   sudo apt-get purge nvidia-*
   sudo apt-get update
   sudo apt-get autoremove
   ```
   
1. 查找可用的驱动版本

   ```python
   ubuntu-drivers devices
   ```

   ![image-20250304191954337](https://img.leftover.cn/img-md/202503041919438.png)

3. 在[cuda-toolkit](https://developer.nvidia.com/cuda-toolkit-archive)找到自己要下载的 CUDA 版本，下载的 cuda-toolkit 的版本不能超过显卡支持的 CUDA 版本,根据电脑选择即可，按照它的下载命令下载

   <img src="https://img.leftover.cn/img-md/202503042210815.png" alt="image-20250304221014693" style="zoom:33%;" />

   运行的时候会帮你安装驱动

4. 之后再配置一下环境变量

   `vim ~/.bashrc`

   ```python
   # 修改一下对应的cuda版本就ok了
   export CUDA_HOME=/usr/local/cuda-12.2
   export LD_LIBRARY_PATH=/usr/local/cuda-12.2/lib64:$LD_LIBRARY_PATH
   export PATH=/usr/local/cuda-12.2/bin:$PATH
   ```

   使其生效 `source ~/.bashrc`

5. 安装 cudnn

   在 cudnn 官网下载跟你版本匹配的 cudnn，之后传到服务器上，

   ```python
   tar -xvf cudnn-linux-x86_64-8.9.5.30_cuda11-archive.tar.xz
   ```
   
   ```python
   sudo cp cudnn-*-archive/include/cudnn*.h /usr/local/cuda/include
   sudo cp -P cudnn-*-archive/lib/libcudnn* /usr/local/cuda/lib64
   sudo chmod a+r /usr/local/cuda/include/cudnn*.h /usr/local/cuda/lib64/libcudnn*
   
   ```
   
   
   
   ```python
   # 验证是否安装成功
   cat /usr/local/cuda/include/cudnn_version.h | grep CUDNN_MAJOR -A 2
   
   ```
   
   
   
6. 之后安装`miniconda`

在[官网](https://www.anaconda.com/docs/getting-started/miniconda/install#macos-linux-installation)上匹配一下自己的系统架构，使用它的命令下载即可,安装完了之后需要运行`source ~/.bashrc`

```python
# conda 设置不自动进入base(最基础)环境
conda config --set auto_activate_base false
# 添加conda-forge的channel
conda config --add channels conda-forge
```
