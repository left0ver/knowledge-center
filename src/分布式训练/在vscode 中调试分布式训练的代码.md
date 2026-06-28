## 一般方式
lunch.json 文件

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "分布式调试",
            "type": "debugpy",
            "request": "launch",
            // 设置为torch.distributed.run模块
            // 这里是torchrun，调试deepspeed 和  Megatron也是类似
            "module": "torch.distributed.run",
            "console": "integratedTerminal",
            // 这里设置torchrun的参数
            "args": [
                "--nproc_per_node=4",
              // 这里是你分布式训练的入口文件
                "distributed_training.py"
            ],
            "subProcess": true,
            "justMyCode": true,
        }
    ]
}
```

因为是分布式训练，会起多个进程同时进行 train，因此这里我们可以看到左边有多个子进程，我们可以单独对每个子进程进行 debug

![](https://img.leftover.cn/img-md/1763710065151-7d3c8cd2-4ae5-4735-841b-273bc1bd0d18.png)



## attach + debugpy
#### 第一种
1. 在 lunch.json 中加入这一段，使用 attach 的方式进行调试

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "attach_9501",
            "type": "debugpy",
            "request": "attach",
            "connect": {
                "host": "localhost",
                "port": 9501
            }
        }
    ]
}
```

2. 然后下载 debugpy

```python
pip install debugpy
```

3. 在入口代码中添加上这段代码

```python
import debugpy
try:
    debugpy.listen(("localhost", 9501))
    print("Waiting for debugger attach")
    debugpy.wait_for_client()
except Exception as e:
    pass
```

之后使用命令启动的时候，左边的调试那里启动调试连接到 9501 端口就行，这种方式会比较方便，不过需要临时在代码中加入上面的这段代码

**因为分布式训练的时候会开多个子进程，有时候需要对多个进程同时调试，但是这种添加代码的方式貌似不能对子进程调试，不知道是不是我哪里没设置好**

因此我通常会使用命令行的方式来启动，而不是在入口中添加代码,如下所示，和上面的等价，但是这种方式可以对多个子进程进行调试

```shell
python -m debugpy --listen 9501 --wait-for-client $(which torchrun) --nproc_per_node=4 letnet_train_fashion_mnist/train.py
```

#### 第二种
第一种是 debugpy 来监听某个端口等待我们的调试客户端连接上这个端口

而第二种则是反过来了，调试客户端监听某个端口，debugpy 来连接对应的端口

lunch.json 中这样配置

```json
{
    "version": "0.2.0",
    "configurations": [
        {

            "name": "listen_5678",
            "type": "python",
            "request": "attach",
            "subProcess": true,
            "listen": {
                "port": 5678,
            }
        }
    ]
}
```

同样在代码中可以加入这样的代码

```python
import debugpy

debugpy.connect(5678)
```

然后我们**首先 vscode 调试客户端先启动然后再运行代码**即可**，同样这种写在代码中的方式也不可以对多个子进程进行调试**，因此我们同样可以使用命令行的方式，等价于上面的代码

```shell
python -m debugpy --connect 5678 $(which torchrun)  --nproc_per_node=4 letnet_train_fashion_mnist/train.py --distributed
```

