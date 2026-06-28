## 准备工作
1. 现在电脑上安装 uv
2. 创建虚拟环境，python 的话使用 3.12 版本
3. 我们需要先确定 torch 的版本，尤其是 unsloth 和 vllm，torch 的版本对这二者的安装影响很大。

## TIPS
前面两步 vllm 和 unsloth 的时候我们确定了 torch 的版本，我们可以先单独把 torch 安装完，然后再安装 LlamaFactory，再安装 unsloth、最后安装 vllm，因为 LlamaFactory 的有些库用的版本比较老，安装 unsloth 的时候会覆盖掉，而 LlamaFactory 对一些库的版本的依赖并没有很严格，因此一些非核心的库的版本不符合 LlamaFactory 的要求也能使用，只需要使用`**DISABLE_VERSION_CHECK=1**`来跳过 LlamaFactory 的版本检查即可

## 安装
### 安装 vllm
我们先使用`uv pip install vllm --torch-backend=cu124`

> 这里我的 CUDA 驱动的版本为 12.8，因此我这里选择 cu124，这里根据自己的 CUDA 版本来选，建议选 cu128、cu124、cu118
>

然后看一下这里安装的 torch 版本是多少，我这里安装的是`torch2.6.0+cu124`

![](https://img.leftover.cn/img-md/1769168210820-f3a95ddc-8dc3-48eb-80fa-da82f65f214b.png)

### 安装 unsloth
我们可以先在 unsloth 的[手动安装部分的文档](https://unsloth.ai/docs/get-started/install/pip-install)上看到

![](https://img.leftover.cn/img-md/1769167948684-802e3b08-5fa9-41e8-a082-24a0fe2f0c2c.png)

上面 vllm 安装的 pytorch 版本最好和 unsloth 的匹配起来，上面安装的是`torch2.6.0+cu124`,刚好和 unsloth 这里有对应的`cu124-torch260`，可以使用官网上的这个命令来确定 unsloth 的安装命令

```shell
wget -qO- https://raw.githubusercontent.com/unslothai/unsloth/main/unsloth/_auto_install.py | python -
```

![](https://img.leftover.cn/img-md/1769168465789-1e1be4be-ca0f-43a2-8ad2-59837dc262ea.png)

### 安装 LlamaFactory
根据官网的教程安装即可

```shell
git clone --depth 1 https://github.com/hiyouga/LlamaFactory.git
cd LlamaFactory
pip install -e .
pip install -r requirements/metrics.txt
```

> 这部分可能会有依赖冲突，比如 datasets 和 peft 的依赖，LlamaFactory 用的是比较老的版本，而 unsloth 使用的是比较新的版本，这里我们以 unsloth 的为准安装更新的版本，**LlamaFactory 在启动的时候会进行依赖的版本检查，这些不是特别核心的库，版本影响不大，我们直接使用**`**DISABLE_VERSION_CHECK=1**`**来跳过 LlamaFactory 的版本检查**
>

```shell
DISABLE_VERSION_CHECK=1 llamafactory-cli webui
```

## 
