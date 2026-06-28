### 准备工作

1. 分别注册[pipy](https://pypi.org/) 和[testpipy](https://test.pypi.org/) 的账号，并开启 2FA
2. pip install setuptools
3. 配置`setup.py`，主要是有关分发包的一些信息

```python
from setuptools import setup, find_packages

# 读取 README 文件内容作为长描述
def get_long_description():
    """Read long description from README"""
    with open("README.md", encoding="utf-8") as f:
        long_description = f.read()
    return long_description


setup(
    name="label-tool",  # 包名
    version="0.0.1a2",  # 版本号
    author="leftover",  # 作者
    author_email="hi.leftover@qq.com",  # 作者邮箱
    description="A simple command-line interface tool",
    long_description=get_long_description(),  # 长描述，通常从 README.md 读取
    long_description_content_type="text/markdown",  # 长描述格式，通常为 Markdown
    url="https://github.com/left0ver/label-tool",
    license="MIT",
    keywords="label convert, labelme convert yolo, yolo convert labelme, labelme,yolo",
    packages=find_packages(),  # 自动查找包（所有目录下有 `__init__.py` 的目录会被认为是包）
    classifiers=[  # 分类，便于 Python 包索引 (PyPI) 查找
        "Intended Audience :: Developers",
        "Natural Language :: English",
        "Programming Language :: Python :: 3.10",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.10",
    install_requires=[
        "click>=8.0",
    ],
    extras_require={
        "dev": [
            "flake8",  # 代码检查工具
            "black",  # 代码格式化工具
        ]
    },
    entry_points={
        "console_scripts": [
            "lt=cli.cli:cli",
        ],
    },
    include_package_data=True,  # 包含额外的文件（如静态文件、配置文件等）
    zip_safe=False,  # 是否支持压缩包
)

```

4. 创建`pyproject.toml` 并配置构建系统，即使用什么来打包

   ```plain
   [build-system]
   requires = ["setuptools", "wheel"]
   build-backend = "setuptools.build_meta"
   ```

5. 创建`MANIFEST.in` 并配置哪些额外的文件要打包进去,并在`setup.py`中设置`include_package_data=True`,

   ```python
   # copy from https://github.com/CVHub520/X-AnyLabeling/blob/main/MANIFEST.in
   # MANIFEST.in
   recursive-include anylabeling/configs *
   recursive-include anylabeling/views/labeling/icons *
   global-include *.ui
   ```

### build

1. 生成要分发的文件，存放在 dist 文件夹下面

 ```shell
 	rm -rf dist
   python setup.py sdist bdist_wheel
 ```

2. 现在不推荐直接运行 setup.py 进行打包，推荐使用[build](https://github.com/pypa/build)来打包

   ```shell
   pip install build
   # build and will generator dist dir
   python -m build
   ```

### 上传到 pipy

1. touch `~/$HOME/.pypirc` ,在 pipy 和 testpipy 上面分别生成 token，在`.pipyrc`中配置 pypi 和 pypitest 发布包时候的 token

```python
[distutils]
index-servers =
    pypi
    testpypi
[pypi]
username = __token__
password = [your token]# 填自己的pypi的token
[testpypi]
repository = https://test.pypi.org/legacy/
username: __token__
password: [your token] # 填自己的testpipy的token
```

2. `pip install twine`，使用 twine 来将打包文件上传到`pypi`或者`testpipy`,通常我们可以先上传到`testpipy`,测试完成没问题之后再上传到`pipy`

```shell
python setup.py sdist bdist_wheel
# 上传到testpipy
twine upload --repository testpypi dist/* --verbose

# 对上传的package进行测试
pip install --index-url https://test.pypi.org/simple/ your_package_name==package_version

# 没问题之后,上传到pipy
rm -rf dist
python setup.py sdist bdist_wheel
twine upload --repository pypi dist/*  --verbose

# 可能大家都是用的国内的镜像源，可能上传到pipy之后还没有同步到国内的源上面，因此这时候我们需要使用pipy到官方源来进行下载
pip install --index-url https://pypi.org/simple  your_package_name==package_version
```

### 版本编写规则

1. **核心版本号格式**

[pep440](https://peps.python.org/pep-0440/)中定义了 python 库的版本的规则，在决定包的版本时，通常会遵循`semver` 规则，一般格式为

```shell
<major>.<minor>.<micro>
```

- major：重大变化，可能引入不兼容的更改。
- minor：引入新功能，但是向后兼容。
- micro：bug 修复，文档改动等一些小改动。

2. **预发布版本**

   预发布版本用于在正式发布之前发布测试版本，如 alpha、beta 或候选版本。

   ```python
   <release>.<pre-release-label><pre-release-number>
   ```

   - release: 要发布的正式版本
   - pre-release-label：预发布标签。
     - a 或 alpha（Alpha 版本）
     - b 或 beta（Beta 版本）
     - rc 或 c（Release Candidate，候选版本）
   - pre-release-number:预发布版本号，从 1 开始递增

   ```python
   #例如
   1.2.3a1 
   2.3.1b2
   1.0.0rc3
   #排序规则
   1.0.0a1 < 1.0.0a2 < 1.0.0b1 < 1.0.0rc1 < 1.0.0
   ```

3. **开发版本**

   开发版本用于标识不稳定的开发中版本。

   ```python
   <release>.dev<dev-number>
   ```

   例如

   ```python
   1.0.1.dev1
   1.0.1.dev2
   # 排序
   1.0.0.dev1 < 1.0.0a1 < 1.0.0
   ```

4. **后发布版本**

   后发布版本用于修正已经发布的版本（例如修复元数据或文档）。

   ```python
   <release>.post<post-number>
   ```

   ```python
   1.0.0.post1   # 修复发布后的版本 1
   1.0.0.post2   # 修复发布后的版本 2
   # 排序
   1.0.0 < 1.0.0.post1 < 1.0.0.post2
   ```

### 其他

1. 在开发包的时候，我们常常要生成`requirements.txt`文件，此时可以使用[pipreqs](https://github.com/bndr/pipreqs)来生成项目的`requirements.txt`

2. 使用 flake8 进行 lint ，使用 black 进行代码格式化，black 与 pycharm 的集成请查看[Editor integration](https://black.readthedocs.io/en/stable/integrations/editors.html)

3. 使用 make 编写一些命令，这样可以开发起来更方便,pycharm 建议下载一个 makefile 的[插件](https://plugins.jetbrains.com/plugin/9333-makefile-language)

   ```makefile
   lint:
   	flake8 ./cli
   
   test-dir:
   	python -m cli.cli yolo2json 0410蚕宝宝labels_yolo -o output -i 0410蚕宝宝   -m classes.txt -t segment
   
   test-file:
   	python -m cli.cli yolo2json 0410蚕宝宝labels_yolo/IMG_20240410_093915.txt -o output -i 0410蚕宝宝/IMG_20240410_093915.jpg  -m classes.txt -t segment
   
   test:
   	make test-dir
   	make test-file
   build:clean
   	python -m build
   publish-test: build
   	twine upload --repository testpypi dist/*  --verbose
   
   publish: build
   	twine upload --repository pypi dist/*  --verbose
   
   clean:
   	rm -rf dist
   ```

   ```shell
   # Usage
   make lint
   make test
   ```

### 迁移到 pyproject.toml

现在已经不推荐使用 setup.py 来管理项目的一些配置信息，推荐使用 pyproject.toml，很多工具都已经支持 pyproject.toml

```toml
[project]
name = "label-tool"
dynamic = ["version"] # dynamic import
description = "A simple command-line interface tool"
readme = "README.md"
authors = [
    { name = "leftover", email = "hi.leftover@qq.com" }
]
license = { text = "MIT" }
requires-python = ">=3.10"
dependencies = [
    "click>=8.1.8",
    "opencv-python>=4.10.0.84",
]
classifiers = [# 分类，便于 Python 包索引 (PyPI) 查找
    "Intended Audience :: Developers",
    "Natural Language :: English",
    "License :: OSI Approved :: MIT License",
    "Operating System :: OS Independent",
    "Programming Language :: Python",
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3 :: Only",
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
    "Programming Language :: Python :: 3.13",
]

[project.urls]
Homepage = "https://github.com/left0ver/label-tool"
Documentation = "https://github.com/left0ver/label-tool"
"Release notes" = "https://github.com/left0ver/label-tool/releases"
Source = "https://github.com/left0ver/label-tool"

[build-system]
requires = ["setuptools>=42", "wheel"]
build-backend = "setuptools.build_meta"

[project.scripts]
lt = "cli.cli:cli"

# black config
[tool.black]
line-length = 88

[dependency-groups]
dev = [
    "black>=24.10.0",
    "flake8>=7.1.1",
]
[tool.setuptools.dynamic]
version = { attr = "cli.__version__" } # read from cli.__init__.py
```

`dynamic` 属性可以让 pyproject.toml 中的某些属性动态加载，例如上面让 version 从`cli.__init__.py`中加载

### 使用 uv 管理项目

[uv](https://example.com)是一个用 rust 编写的一个项目管理器，相比使用 pip，uv 的体验会好上很多，例如`uv tool run xxx` 提供了类似 pipx 的功能，在隔离的环境下安装命令行工具，可以下载多个 python 版本并且随意切换，可以管理项目依赖关系，支持 lock file 和 workspace，类似于 poetry

`uv` 使用 `pyproject.toml` 配置文件来管理项目，不再使用`setup.py`。
