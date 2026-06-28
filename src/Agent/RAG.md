  

<img src="https://img.leftover.cn/img-md/202506071728822.png" alt="image-20250607172830519" style="zoom: 50%;" />

<img src="https://img.leftover.cn/img-md/202506071738429.png" alt="302837092-54a2d76c-b07e-49e7-b4ce-fc45667360a1" style="zoom:67%;" />

# 文档的加载

<img src="https://img.leftover.cn/img-md/202506071807169.png" alt="image-20250607180727890" style="zoom: 33%;" />

例如对于复杂的文档，我们可以将其使用 pdf 转 md 的工具，先将其转为 markdown（转为 markdown 的时候需要保证文档的结构），例如我们可以使用[marker-pdf](https://github.com/datalab-to/marker) 、 [MinerU](https://github.com/opendatalab/MinerU) 、[llamaparse](https://www.llamaindex.ai/llamaparse)将 pdf 转为 markdown， 再对 markdown 文件进行解析

llamaparse 需要调用它的 api，因此速度较慢

> 这部分工具在将 pdf 转为 markdown 的时候调用了很多个模型，例如检测文档的结构，OCR 提取文本等



## PDF 的解析

PDF 的解析通常有基于规则的解析方法，基于深度学习的解析方法，基于多模态大模型的解析

1. 基于规则的解析:

   - 直接从 PDF 文件的内部结构提取文本，使用 PDF 格式规范解析文档结构

   > 处理速度块，比较适合有文字的 PDF/ 图文并茂的 PDF，对于扫描件之类的 PDF 文档就效果不太行

2. 基于深度学习的解析:

   此类方法的主要原理就是：先将 PDF 转为图像，然后使用 OCR 技术来提取图像中的文字，

   例如我们可以使用`pdf2image` 将 pdf 转为图像，然后使用 pytesseract 来进行 OCR

   > 这类方法一般适合处理扫描件的 pdf
   >
   >这里一般会需要使用到预训练模型，因此速度来说相对较慢

3. 基于多模态大模型的解析

   使用多模态大模型来解析 PDF，这种方法比较好，多模态大模型可以理解图片中的文字、图像、表格等，但同时其成本也最大，速度较慢。

### 基于规则的解析

1. pypdf: 相对来说比较高效，轻量。提取的结果其实并不准确，效果不如 pymupdf，一般只适合那种很简单的 pdf 文档（对于一些空格之类的无法很好地处理）
2. pymupdf：这个库相比于 pypdf 来说，效果更好很多，并且支持 OCR 的集成，可以使用 OCR 技术提取 PDF 中的图片中的文字，提取效果挺不错的

> 以上两种都是基于规则的解析方式，即通过读取 pdf 文件中的内部对象

### 基于深度学习模型

这种方法通常使用布局的模型 和 对象检测模型 和 OCR 模型来进行检测。通过使用 layout 模型来识别整个文档的布局，对象检测模型来检测位置，使用 OCR 模型来提取文本。

1. unstructured：我感觉解析的效果整体来说一般般，就是容易把页眉页脚检测出来，`后面需要探索一下如何去掉页眉页脚`

   <img src="https://img.leftover.cn/img-md/202506091416967.png" alt="image-20250609141626876" style="zoom:50%;" />

   

## PDF 转 markdown

对于一些非常复杂的 PDF，我们可以将其使用 pdf 转 md 的工具，先将其转为 markdown（转为 markdown 的时候需要保证文档的结构），例如我们可以使用[marker-pdf](https://github.com/datalab-to/marker) 、 [MinerU](https://github.com/opendatalab/MinerU) 、docling、[llamaparse](https://www.llamaindex.ai/llamaparse)将 pdf 转为 markdown， 再对 markdown 文件进行解析

> 对 marker-pdf 和 mineru 分别进行了测试，marker-pdf 对英文的解析效果会好一点，mineru 对中文的解析效果更好，但是 mineru 对文档的结构的识别好像不如 marker-pdf 准确，有点文档是左右排布的，但是它的结构识别不准确

docling：这个工具一般用来将 pdf 转为 markdown，

**优点：**

- 其对 pdf 的解析还是挺准确的，尤其是表格的解析，并且解析的时候会忽略掉页眉页脚，并且对于跨页面的表格也处理的很好，只有少部分的表格解析错误。
- 其能够比较好地处理左右布局的 pdf，能够准确地理解布局

**缺点：**

- 对于类似于扫描件，其解析的不准，效果很差，而且解析的效果依赖于 OCR 引擎，easyocr 对于此类 pdf 就解析的不行，tesseract 稍微好一点，但是对于扫描件来说，docling 不如 marker-pdf 和 mineru



marker-pdf: 

**优点：**

- 对英文的解析效果更好，并且对于扫描件的解析也比 docling 更好，对于表格的提取也还行，可以处理那种跨页的情况

**缺点：**

- 但是 marker 处理出来的 markdown 也有一些问题，例如它的文档的父子层级没有处理对，有些表格的上面的年份没有识别出来



 mineru：

**优点：**

- 对于中文的解析好一点，并且对于扫描件的解析也比 docling 更好，对于表格的提取也还行，同样可以处理那种跨页的情况

> mineru 提取出来的表格是用 html 的语法表示的，而不是用 markdown 的语法表示的，不过对于大模型来说也无所谓

**缺点：**

- 有些表格中的单元格的内容没有提取到，有点单元格加了一些奇怪的内容

> 因此 对于扫描件我们可以使用 mineru 和 marker ，对于表格的提取，以及不是扫描件，可以使用 docling



markitdown: [markitdown](https://github.com/microsoft/markitdown) 也可以解析 pdf，但是解析效果很差，即没有保留原本的 pdf 中的结构，也不能提取公式，只能单纯地把文本提取出来

## PDF 文档解析的 debug

对 unstructured 解析的 pdf 进行可视化，这样可以更好地看到解析的结构

```python
def render_pdf_image (file_path, page_num, docs_list):
    """
    file_path: str, path to the PDF file
    page_num: int, page number to render,要可视化哪一页
    docs_list: list, list of Document objects containing metadata for each element
    """
    pdf_page = fitz.open(file_path).load_page(page_num-1)
    elements_meta = [doc.metadata for doc in docs_list if doc.metadata.get("page_number") == page_num]
    
    pix = pdf_page.get_pixmap()
    pil_image = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    fig, ax = plt.subplots(figsize=(10, 10))
    ax.imshow(pil_image)
    category_to_color = {"Title": "orchid", "Image": "forestgreen", "Table": "tomato"}
    categories = set()
    for meta in elements_meta:
        points  = meta["coordinates"]["points"]
        layout_width = meta["coordinates"]["layout_width"]
        layout_height = meta["coordinates"]["layout_height"]
        scaled_points = [
            (x * pix.width / layout_width, y * pix.height / layout_height) for x, y in points
        ]
        box_color = category_to_color.get(meta["category"], "deepskyblue")
        categories.add(meta["category"])
        rect = patches.Polygon(scaled_points, linewidth=1, edgecolor=box_color, facecolor="none")
        ax.add_patch(rect)

    legend_handles = [patches.Patch(color="deepskyblue", label="Text")]
    for category, color in category_to_color.items():
        if category in categories:
            legend_handles.append(patches.Patch(color=color, label=category))
    ax.axis("off")
    ax.legend(handles=legend_handles, loc="upper right")
    plt.tight_layout()    
    plt.savefig(f"./output/{file_path}{page_num}.png")

```

## PDF 读取表格

### Camelot

[camelot](https://github.com/camelot-dev/camelot) 主要是用来提取表格的，但是它只能把表格的内容提取出来，不能把表格和表格上面的内容关联起来。单纯就表格的提取来说，camelot 还是很准确的，并且它可以将提取的表格转为 DataFrame 格式

> camelot 不能处理扫描件的格式

### PDFPlumber

**[pdfplumber](https://github.com/jsvine/pdfplumber)** 主要是用来提取表格的，但是它只能把表格的内容提取出来，不能把表格和表格上面的内容关联起来。同样，我们可以使用 pandas 将提取的表格转为 DataFrame 格式



> camelot 和 pdfplumber 算是差不多类型的库

### Unstructed

解析效果不是很好，感觉 unstructured 很容易受到页眉页脚的干扰，把页眉页脚当成了表的标题了，不过找了半天没找到 unstructured 如何去除页眉页脚的方法。效果一般般

```python
from langchain_unstructured import UnstructuredLoader

from unstructured.partition.auto import partition
from unstructured.partition.pdf import partition_pdf
from langchain_docling.loader import DoclingLoader

import fitz
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from PIL import Image 

file_path = "./data/90-文档-Data/复杂PDF/billionaires_page-1-5.pdf"

elements= partition_pdf(file_path, strategy="hi_res", infer_table_structure=True, languages = ["zh", "en"])
element_map = {element.id: element for element in elements if hasattr(element, 'id')}

for element  in elements:
    if element.category == "Table":
        print("\n表格数据:")
        print("表格元数据:", vars(element.metadata))  # 使用vars()显示所有元数据属性
        print("表格内容:")
        print(element.text)  # 打印表格文本内容
        
        # 获取并打印父节点信息
        parent_id = getattr(element.metadata, 'parent_id', None)
        if parent_id and parent_id in element_map:
            parent_element = element_map[parent_id]
            print("\n父节点信息:")
            print(f"类型: {parent_element.category}")
            print(f"内容: {parent_element.text}")
            if hasattr(parent_element, 'metadata'):
                print(f"父节点元数据: {vars(parent_element.metadata)}")  # 同样使用vars()显示所有元数据
        else:
            print(f"未找到父节点 (ID: {parent_id})")
        print("-" * 50)

```

### llamaParser

[llamaparser](https://cloud.llamaindex.ai/) 对于表格和 pdf 的解析都很不错，它有一个`complexTables` 的预设，使用了`complexTables` 的预设,llamaparer 对于 pdf 和 表格的解析都很准确的，不过它需要付费，比 docling 要好

并且可以通过`bbox_top` 参数和 `bbox_bottom` 参数来设置去除掉页眉页脚。

```python
from dotenv import load_dotenv

# 加载环境变量（确保有OpenAI API密钥）
load_dotenv()
# from llama_index.llms.openai import OpenAI
# from llama_index.embeddings.openai import OpenAIEmbedding
# from llama_index.core import Settings
# from llama_parse import LlamaParse
from llama_cloud_services import LlamaParse
from llama_cloud_services.parse.utils import ResultType

parsing_instruction = "请将此PDF文档转换为结构良好的Markdown格式。"
parse = LlamaParse(
    preset="complexTables",
    # verbose=True,
    # skip_diagonal_text=True,
    # # bounding_box="0.1,0.1,0.1,0.1",
    # # bbox_left=0.1,
    # # bbox_right=0.1,
    bbox_top=0.05,
    bbox_bottom=0.05,
    # preserve_layout_alignment_across_pages=True,
    # result_type=ResultType.MD,
    # system_prompt=parsing_instruction,
    # premium_mode =True
)

result = parse.parse("data/90-文档-Data/复杂PDF/billionaires_page-1-5.pdf")
with open("hhh.md", "w", encoding="utf-8") as f:
    f.write(result.get_markdown_documents()[0].text)
```
### chatdoc
[chatdoc](https://pdfparser.io/): 也是一个 PDF 解析工具，整体的效果还不错,对于表格的读取也挺准确的，不过好像对于一些复杂的布局，尤其是左右布局的那种 pdf 好像提取的不准确,例如像下面这段这样的文本，chatdoc 就提取的不准确，应该是对于布局识别的不准确。比 llamaparser 稍差一点

<img src="https://img.leftover.cn/img-md/202506102152089.png" alt="image-20250610215254968" style="zoom:50%;" />





# 文本分块

## 为什么要分块

1. 一般来说虽然生成模型的上下文比较长， 但是 embedding 模型的上下文一般不会特别大，因此如果不分块的话，embedding 模型处理不了这么长的上下文（虽然 embedding 模型可能会进行 truncate，把超过的部分裁剪掉）
2. 就是 embedding 模型可以处理很大的上下文，如果向量数据库中的向量都是长文本生成的，那么进行检索的时候效果就会很差，因此进行分块也有利于提高检索的准确度

## 分块方法

### Langchain 中的分块方法

1. CharacterTextSplitter:  该方法会先根据分隔符将文档进行切分，默认是"\n\n"，即按段落进行切分，之后从上到下把切分的段落进行合并，若 1，2，3 加起来的长度小于`chunk_size`的大小，且 1，2，3,4 加起来的长度大于`chunk_size`,就会把这 1,2,3 这三个块合并为一个块。之后的块也是类似的合并操作。

2. RecursiveCharacterTextSplitter：该方法会传入一个分隔符列表`separators`,默认为`["\n\n", "\n", " ", ""]`, RecursiveCharacterTextSplitter 方法的思想则是根据`separators` 列表进行切分依据第一个分隔符开始切分，若切分过后的块仍然过大，即> `chunk_size` , 则在该块上选择第 2 个分隔符进行切分，以此类推。之后把根据`chunk_size` 把切分之后的内容合并起来，例如可能会得到下面这样的块。由于设置了`chunk_overlap`,因此这两个块之间有 10 个字符重叠

   ![image-20250611132826517](https://img.leftover.cn/img-md/202506111328595.png)

3. MarkdownTextSplitter： 该类继承了 RecursiveCharacterTextSplitter ，因此其切割过程和 RecursiveCharacterTextSplitter 类似，只是`separators` 不一样而已，MarkdownTextSplitter 使用了 markdown 语法里面的一些可能的 separators。

   等价于

   ```python
   RecursiveCharacterTextSplitter.from_language(Language = Language.MARKDOWN)
   ```

4. MarkdownHeaderTextSplitter: 根据 title 来进行切分

   若在第一步中，将 pdf 转为 markdown 的时候，文档的结构保留的比较好的话，这种方法效果还是不错的，他会根据 title 来进行 chunk

   ```python
   markheader_splitter = MarkdownHeaderTextSplitter(
       headers_to_split_on=[
           ("#", "Header 1"),
           ("##", "Header 2"),
           ("###", "Header 3"),
       ]
   )
   content = open(
       "docling转为markdown的结果/billionaires_page-1-5.md", "r", encoding="utf-8"
   ).read()
   chunks = markheader_splitter.split_text(content)
   print("\n=== 文档分块结果 ===")
   for i, chunk in enumerate(chunks, 1):
       print(f"\n--- 第 {i} 个文档块 ---")
       print(f"内容: {chunk.page_content}")
       print(f"元数据: {chunk.metadata}")
       print("-" * 50)
   ```

### unstructured 中的分块

![image-20250612134441253](https://img.leftover.cn/img-md/202506121344389.png)



- basic 分块：

  - max_characters: 定义一个块的最大的字符数 （称为 hard-max）

  - include_orig_elements

  - new_after_n_chars：定义 soft-max，当一个块的字符数超过了这个值之后，会在下一个合适的元素边界处开始一个新的块，这有助于防止形成过大的、接近 `max_characters` 的块，使得块的大小分布更均匀。

    > **例如我们可以设置 new_after_n_chars =1000，max_characters=1500**

  - overlap：将上一个块的 n 个字符作为下一个块的前缀

  - overlap_all: 这是一个对 `overlap` 功能的扩展。如果设置为 `True`，那么 `overlap` 参数定义的重叠会**在所有相邻的块之间**强制应用，无论这些块是否来自同一个原始元素。若设置为`False`,则只有在同一个元素的内部进行切割的时候，才会使用 overlap 参数

    > 一般情况下使用 False 即可

> basic 分块方式有点类似与 langchain 中的 CharacterTextSplitter 分块方式

- by-title 分块方式

### docling 中的分块

docling 中有 2 种分块方式，分别为：`HierarchicalChunker` 和 `HybridChunker`

> 对十大富翁的 markdown 文件测试了一下这两种分块方式，感觉都不太行，不如 langchain 的那个 markdown 的分块方式

**HierarchicalChunker:** 按文档结构进行分块，但是这个 api 有点简单，能设置的东西，比较少，效果也不太行

**HybridChunker：** HybridChunker 继承了 HierarchicalChunker ，它基于用户提供的 tokenizer



### 父子文本块

**这部分的分块方式跟后面的检索紧密相关，其实这个分块方式只是在原本的基础之上，在分块的时候，同时链接到了父文档**

进行切分的时候将一个大的文档切分很多个小文档，小文档会存入进入向量数据库（可以通过 metadata 来保存父文档的 ID，之后可以根据这个 ID 来找到父文档），大文档则存入内存中

之后检索的时候向量数据库检索出对应的子文档，然后根据 metadata 找到的父文档

> 例如一个 PDF 可以作为一个大文档，或者 PDF 的一页当作一个大文档

具体的实现[parent_document_retriever](https://python.langchain.com/docs/how_to/parent_document_retriever/)

### 按语义分块

使用`SemanticChunker` 进行按语义分块，

`他会先将句子拆分，再使用embedding模型对其embedding，最后再求余弦相似度，若大于对应的给定阈值，则说明语义相近，合并到一起`

```python
from langchain_experimental.text_splitter import SemanticChunker
from langchain_community.document_loaders import TextLoader
from langchain_openai.embeddings import OpenAIEmbeddings
from langchain_community.embeddings import DashScopeEmbeddings
import os
from dotenv import load_dotenv
load_dotenv()

embeddings =DashScopeEmbeddings(model ="text-embedding-v4",dashscope_api_key = os.getenv("OPENAI_API_KEY"))
text_splitter = SemanticChunker(embeddings,breakpoint_threshold_amount = 0.97,batch_size =4)

file_path ="data/90-文档-Data/黑悟空/黑悟空wiki.txt"
with open(file_path) as f:
    state_of_the_union = f.read()
docs = text_splitter.create_documents([state_of_the_union])
for doc in docs:
    print(doc.metadata)
    print(doc.page_content)
```



### 带滑动窗口的句子切分



# 嵌入（Embedding）

如何寻找嵌入模型：hugging face 上的[mteb leaderboard](https://huggingface.co/spaces/mteb/leaderboard)

比较有名的嵌入模型：

1. openai 家的模型:https://platform.openai.com/docs/guides/embeddings/embedding-models

2. google 的嵌入模型:https://ai.google.dev/gemini-api/docs/models?hl=zh-cn#text-embedding-and-embedding

3. voyage 的嵌入模型：https://docs.voyageai.com/docs/embeddings

4. BAII 的 BGE 系列的模型（开源）：https://github.com/FlagOpen/FlagEmbedding 

5. jina 的嵌入模型（开源）：https://jina.ai/

   > 不过他们家的不一定能商用

6. qwen 系列的嵌入模型





## 稀疏嵌入 vs 密集嵌入 vs 混合嵌入

1. 密集嵌入：现在这些 word2vec，embedding 等模型得到的向量都是密集嵌入，它的向量的维度不会像稀疏嵌入那么大
2. 稀疏嵌入：早期的 NLP 的文本表示就是使用的稀疏嵌入，例如词袋模型，TF-IDF.它的特点就是向量的维度很大，通常等于词表的大小，但是其中大部分都是 0，因此这种矩阵很适合用稀疏矩阵的表示方法
3. 稀疏嵌入的简化形式 Binary Vector：早期的文本向量化的方法就类似于这样，即 1 表示这个词出现了，0 表示没出现

<img src="https://img.leftover.cn/img-md/202506122154668.png" alt="image-20250612215437422" style="zoom:50%;" />



> 我感觉这种嵌入有点类似于关键词检索 （但不完全相同）

4. 混合嵌入：将稀疏向量和密集向量都嵌入向量数据库，先用稀疏向量高效召回相关日志，再用密集向量进行排序

   > 有点类似于说先进行关键词检索，再在检索出的文档中进一步检索

## BM25: 典型的稀疏嵌入的实现

![image-20250612215917947](https://img.leftover.cn/img-md/202506122159061.png)

![image-20250612220021664](https://img.leftover.cn/img-md/202506122200785.png)

- TF：词出现的频率（词频）
- IDF（逆文档频率）：表示词的稀有程度
- k1 和 b: 是两个超参数，k1 （1\~2）控制词频的权重，b(0\~1)用来表示文档长度归一化的程度





# 检索

## 混合检索

混合检索是将基于关键词的老式搜索和基于语义的现代搜索结合起来，现在新出的很多 embedding 模型都可以返回稀疏向量和稠密向量,在有些向量数据库,例如 milvus,qdrant，opensearch,pinecone 等已经原生支持混合检索了。

> 稀疏检索器擅长根据关键词查找相关文档，而密集检索器则擅长根据语义相似性查找相关文档。

### milvus 中使用混合检索

```python
from pymilvus.model.hybrid import BGEM3EmbeddingFunction
import pandas as pd
from pymilvus import (
    connections,
    utility,
    FieldSchema,
    CollectionSchema,
    DataType,
    Collection,
)
from pymilvus import IndexType

from pymilvus import (
    AnnSearchRequest,
    WeightedRanker,
    RRFRanker
)

# from pymilvus.types import MetricType
file_path = "data/quora_duplicate_questions.tsv"
df = pd.read_csv(file_path, sep="\t")
questions = set()
for _, row in df.iterrows():
    obj = row.to_dict()
    questions.add(obj["question1"][:512])
    questions.add(obj["question2"][:512])
    if len(questions) > 500:  # Skip this if you want to use the full dataset
        break

docs = list(questions)

# example question
print(docs[0])

ef = BGEM3EmbeddingFunction(
    model_name="/home/zwc/large-model/bge-m3",
    device="cuda:0",
    use_fp16=False,
)

dense_dim = ef.dim["dense"]
print(f"Dense dimension: {dense_dim}")
docs_embeddings = ef(docs)


uri = "http://localhost:19530"
connections.connect(uri=uri)

fields = [
    FieldSchema(
        "pk", dtype=DataType.VARCHAR, is_primary=True, auto_id=True, max_length=64
    ),
    FieldSchema("text", dtype=DataType.VARCHAR, max_length=512),
    FieldSchema(
        "sparse_vector",
        dtype=DataType.SPARSE_FLOAT_VECTOR,
    ),
    FieldSchema("dense_vector", dtype=DataType.FLOAT_VECTOR, dim=dense_dim),
]

schema = CollectionSchema(fields)
collection_name = "hybrid_demo"

if utility.has_collection(collection_name):
    utility.drop_collection(collection_name)

collection = Collection(
    name=collection_name, schema=schema, consistency_level="Bounded"
)

# 创建索引
# 稀疏向量创建SPARSE_INVERTED_INDEX

collection.create_index(
    field_name="sparse_vector",
    index_params={
        "index_type": "SPARSE_INVERTED_INDEX",
        "metric_type": "IP",
    },
)

# 为了保证召回率，密集向量使用FLAT索引
collection.create_index(
    field_name="dense_vector",
    index_params={
        "index_type": IndexType.FLAT,
        "metric_type": "COSINE",
    },
)
collection.load()

batch_size = 50
for i in range(0, len(docs), batch_size):
    end = min(i + batch_size, len(docs))
    batched_entities = [
        docs[i:end],
        docs_embeddings["sparse"][i:end],
        docs_embeddings["dense"][i:end],
    ]
    collection.insert(batched_entities)

print("Number of entities inserted:", collection.num_entities)


query = input("Enter a question to search: ")
print(query)


query_embedding = ef([query])


def dense_search(collection, query_embedding, top_k=10):
    search_params = {
        "metric_type": "COSINE",
        # "params": {"nprobe": 10},
    }

    # 因为这里query 只有1个，因此最后面需要选取第一个结果
    result = collection.search(
        data=[query_embedding],
        anns_field="dense_vector",
        param=search_params,
        limit=top_k,
        output_fields=["text"],
    )[0]
    return [hit.get("text") for hit in result]


def sparse_search(collection, query_embedding, top_k=10):
    search_params = {
        "metric_type": "IP",
        # "params": {"nprobe": 10},
    }
    result = collection.search(
        data=[query_embedding],
        anns_field="sparse_vector",
        param=search_params,
        limit=top_k,
        output_fields=["text"],
    )[0]
    return [hit.get("text") for hit in result]


def hybrid_search(
    collection,
    query_dense_embedding,
    query_sparse_embedding,
    dense_weight,
    sparse_weight,
    top_k=10,
):
    dense_search_params = {"metric_type": "COSINE", "params": {}}
    sparse_search_params = {"metric_type": "IP", "params": {}}

    dense_req = AnnSearchRequest(
        [query_dense_embedding],
        anns_field="dense_vector",
        param=dense_search_params,
        limit=top_k,
    )

    sparse_req = AnnSearchRequest(
        [query_sparse_embedding],
        anns_field="sparse_vector",
        param=sparse_search_params,
        limit=top_k,
    )

    # rerank = WeightedRanker(sparse_weight, dense_weight)
    rerank = RRFRanker()
    result = collection.hybrid_search(
        reqs=[dense_req, sparse_req],
        rerank=rerank,
        limit=top_k,
        output_fields=["text"],
    )[0]

    return [hit.get("text") for hit in result]


dense_results = dense_search(collection, query_embedding["dense"][0])


sparse_results = sparse_search(collection, query_embedding["sparse"][[0]])

hybrid_results = hybrid_search(
    collection,
    query_embedding["dense"][0],
    query_embedding["sparse"][[0]],
    dense_weight=1.0,
    sparse_weight=0.7,
)

print(hybrid_results)
```

### langchain 中使用 milvus 的混合检索

主要是使用了 langchain_milvus 中的 MilvusCollectionHybridSearchRetriever 来实现的

同时自定义了一个 BGEM3SparseEmbedding 来生成 BGE-M3 的稀疏向量

```python
from langchain_milvus import MilvusCollectionHybridSearchRetriever
import pandas as pd
from typing import Dict, List
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_milvus import MilvusCollectionHybridSearchRetriever
from langchain_milvus.utils.sparse import BaseSparseEmbedding

from pymilvus import (
  connections,
  Collection,
  RRFRanker,
)
from FlagEmbedding import BGEM3FlagModel
from langchain_huggingface import HuggingFaceEmbeddings
from FlagEmbedding import BGEM3FlagModel
from langchain_milvus.utils.sparse import BaseSparseEmbedding
from typing import Dict, List


file_path = "data/quora_duplicate_questions.tsv"
df = pd.read_csv(file_path, sep="\t")
questions = set()
for _, row in df.iterrows():
    obj = row.to_dict()
    questions.add(obj["question1"][:512])
    questions.add(obj["question2"][:512])
    if len(questions) > 500:  # Skip this if you want to use the full dataset
        break

docs = list(questions)

print(docs[0])


# 这里是用了langchain_milvus 中的MilvusCollectionHybridSearchRetriever来实现的
# 而langchian混合检索.py文件中则是自定义了一个Retriever来实现的
# 自定义了一个BGEM3SparseEmbedding 来生成稀疏向量，因为langchain中没有提供有关milvus的稀疏向量的支持

class BGEM3SparseEmbedding(BaseSparseEmbedding):

    def __init__(
        self, model_name: str = "/home/zwc/large-model/bge-m3", device: str = "cuda:0"
    ):
        self.model = BGEM3FlagModel(
            model_name, devices=device, return_sparse=True, return_dense=False
        )

    def embed_query(self, query: str) -> Dict[int, float]:
        result = self.model.encode([query])["lexical_weights"][0]
        res = {int(k): v for k, v in result.items()}
        return res

    def embed_documents(self, texts: list[str]) -> List[Dict[int, float]]:
        sparse_embeddings = self.model.encode(texts)
        res = [{int(k): v for k, v in sparse_embedding.items()} for sparse_embedding in sparse_embeddings["lexical_weights"] ]
        return res

connections.connect(uri="http://localhost:19530")
collection = Collection(name="hybrid_demo", consistency_level="Bounded")
rerank = RRFRanker()
anns_fields = ["dense_vector", "sparse_vector"]
bgem3_sparse_embeddings = BGEM3SparseEmbedding(
    model_name="/home/zwc/large-model/bge-m3", device="cuda:0"
)
bge_dense_embeddings = HuggingFaceEmbeddings(
    model_name="/home/zwc/large-model/bge-m3",
    model_kwargs={"device": "cuda:0"},
)
field_embeddings = [bge_dense_embeddings, bgem3_sparse_embeddings]

field_search_params = [
    {"metric_type": "COSINE", },
    {"metric_type": "IP"},
]
field_limits = [10, 10]
output_fields = ["text"]
top_k = 10


hybrid_search_retriever = MilvusCollectionHybridSearchRetriever(
    collection=collection,
    rerank=rerank,
    anns_fields=anns_fields,
    field_embeddings=field_embeddings,
    field_search_params=field_search_params,
    field_limits=field_limits,
    output_fields=output_fields,
    top_k=top_k,
    )
docs =hybrid_search_retriever.invoke(
    "How to start learning programming?",
    )

for doc in docs:
    print(doc.page_content)
    print(doc.metadata)
    print("====================================")
```



##  多向量检索

[多向量检索](https://python.langchain.com/docs/how_to/multi_vector/#smaller-chunks)即为每个 document 创建多个向量。即我们可以 embedding 文档的多个块，并将这些 embedding 与父文档相关联，这样在检索的时候检索到这些块时，则会返回大文档。多向量检索通常包括

1. 父子文档：即将文档拆分为多个 chunk，并 embedding 这些 chunk，同时这些 chunk 链接到父文档
2. 摘要：为每个文档生成一个摘要，并将摘要进行 embedding，然后 query 的时候先根据用户的问题查找最相关的摘要，再找到对应的文档
3. 假设性问题：为每个文档创建一些合适的假设性问题（即用户可能会问的问题），并将这些问题进行 embedding，然后 query 的时候根据用户的问题查找最相关的假设性问题，之后再找到对应的文档

### 多向量检索-父子文档检索

```python
from langchain.retrievers import ParentDocumentRetriever
from langchain.storage import LocalFileStore
from langchain_milvus import  Milvus

from langchain_core.documents import Document
from langchain_community.llms.tongyi import Tongyi
from langchain.storage._lc_store import create_kv_docstore
from langchain_text_splitters import MarkdownTextSplitter
from dotenv import load_dotenv
from llama_cloud_services import LlamaParse
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.prompts import PromptTemplate
import os
from operator import itemgetter

load_dotenv()

# 第一次运行改为True，之后运行改为False
# 如果是第一次运行，则需要调用llama-parse的api解析PDF文档，并进行切块，将切块的结果存储到Milvus,并且将parent_doc（每一页）存储到磁盘
# 对于持久化 langchain 的 ParentDocumentRetrieve ，可以参考https://stackoverflow.com/questions/77385587/persist-parentdocumentretriever-of-langchain
is_first = True
file_path = "markdown_output/llamaparse解析的pdf.md"
pdf_file_path = "data/90-文档-Data/复杂PDF/billionaires_page-1-5.pdf"
parent_doc_path = "./parents_doc_store"

child_splitter = MarkdownTextSplitter(chunk_size = 1000, chunk_overlap=200, keep_separator=True)
bge_embeddings = HuggingFaceEmbeddings(
    model_name="/home/zwc/large-model/bge-m3",
    model_kwargs={"device": "cuda:0"},
)

vector_store = Milvus(
    embedding_function=bge_embeddings,
    collection_name="parent_sub_demo",
    connection_args={"uri": "http://localhost:19530"},
    index_params={
        "index_type": "FLAT",
        "metric_type": "IP",
    },
    vector_field="dense_vector",
    auto_id=True,
    search_params={"metric_type": "IP"},
)

# doc_store = InMemoryStore()
fs = LocalFileStore(root_path = parent_doc_path)
doc_store = create_kv_docstore(fs)

retriever = ParentDocumentRetriever(
    child_splitter=child_splitter, vectorstore=vector_store, docstore=doc_store
)

if is_first:
    parsing_instruction = "请将此PDF文档转换为结构良好的Markdown格式。"
    parse = LlamaParse(
        preset="complexTables",
        # verbose=True,
        # skip_diagonal_text=True,
        # # bounding_box="0.1,0.1,0.1,0.1",
        # # bbox_left=0.1,
        # # bbox_right=0.1,
        bbox_top=0.05,
        bbox_bottom=0.05,
        split_by_page=True,
        # preserve_layout_alignment_across_pages=True,
        # result_type=ResultType.MD,
        system_prompt=parsing_instruction,
        # premium_mode =True
    )

    parse_result = parse.parse(file_path=pdf_file_path)

    docs = []
    for page in parse_result.pages:
        page_content = page.md
        # 从1开始
        page_number = page.page
        doc = Document(
            page_content=page_content,
            metadata={
                "source": parse_result.file_name.split("/")[-1],
                "page_number": page_number,
            },
        )
        docs.append(doc)
    retriever.add_documents(docs)

query = "2023年世界首富是谁？他的财富是多少？"

sub_doc = vector_store.similarity_search(query)
retrieved_docs = retriever.invoke(query)

prompt = PromptTemplate(
    input_variables=["context", "question"],
    template="请根据我给的上下文回答问题\n\n上下文{context}\n\n,你只能根据我给的上下文来回答，如果你不能回答,请回答我不知道。问题：{question}",
)
llm = Tongyi(model = "qwen-max-2025-01-25", api_key =os.getenv("DASHSCOPE_API_KEY"))

# 将检索到的多个文档合并为一个上下文字符串
def format_docs(docs1):
  return "\n\n".join([f"文档{i+1}:\n{doc.page_content}" for i, doc in enumerate(docs1)])

chain = {"context": itemgetter("question") | retriever | format_docs, "question": itemgetter("question")} | prompt | llm
res =chain.invoke({"question": query})
print("查询结果：", res)
```

### 多向量检索-摘要

即我们先对文档进行 chunk，然后使用 llm 对 chunk 的内容进行 summary，将 summary 存入向量数据库，chunk 则存入硬盘或者内存或者另一个向量数据库，最后将 query 与 summary 进行相似度查询，找到 topk 的 summary，最后根据 summary 链接到对应的原本的 chunk。可以参考 langchain 的[教程](https://python.langchain.com/docs/how_to/multi_vector/#associating-summaries-with-a-document-for-retrieval)

```python
from langchain_milvus import Milvus
from langchain_community.llms.tongyi import Tongyi
from langchain_text_splitters import MarkdownTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.prompts import PromptTemplate
from langchain_core.prompts import ChatPromptTemplate
from langchain_docling.loader import DoclingLoader
import os
from operator import itemgetter
from dotenv import load_dotenv
from langchain_core.output_parsers import StrOutputParser
from langchain.retrievers.multi_vector import MultiVectorRetriever
from langchain.storage import  InMemoryStore
from langchain.retrievers.multi_vector import SearchType
from langchain_core.documents import Document
from typing import List
import uuid


load_dotenv()
md_paths = [
    "markdown_output/llamaparse解析的pdf.md",
    # "markdown_output/云冈石窟-en/auto/云冈石窟-en.md",
]
child_splitter = MarkdownTextSplitter(
    chunk_size=1000, chunk_overlap=200, keep_separator=True
)
bge_embeddings = HuggingFaceEmbeddings(
    model_name="/home/zwc/large-model/bge-m3",
    model_kwargs={"device": "cuda:0"},
)

loader = DoclingLoader(file_path=md_paths)
docs = child_splitter.split_documents(loader.load())

summary_llm = Tongyi(model="qwen-plus", api_key=os.getenv("DASHSCOPE_API_KEY"))


summary_chain = (
    {"doc": lambda x: x.page_content}
    | ChatPromptTemplate.from_template("Summarize the following document:\n\n{doc}")
    | summary_llm
    | StrOutputParser()
)


# summary_llm.agenerate()
summaries = summary_chain.batch(docs, {"max_concurrency": 5})

vector_store = Milvus(
    embedding_function=bge_embeddings,
    collection_name="summary_retriever_demo",
    connection_args={"uri": "http://localhost:19530"},
    index_params={
        "index_type": "FLAT",
        "metric_type": "IP",
    },
    vector_field="dense_vector",
    auto_id=True,
    search_params={"metric_type": "IP"},
)

store = InMemoryStore()

# please open it if you first run

id_key = "doc_id"
multi_vector_retriever = MultiVectorRetriever(
    vectorstore=vector_store,
    docstore=store,
    id_key=id_key,
    search_kwargs={"k": 5},
    search_type=SearchType.similarity,
)

doc_ids = [str(uuid.uuid4()) for _ in docs]
summary_docs = [
    Document(page_content=summary, metadata={id_key: doc_ids[i]})
    for i, summary in enumerate(summaries)
]

multi_vector_retriever.vectorstore.add_documents(summary_docs)
multi_vector_retriever.docstore.mset(list(zip(doc_ids, docs)))


query ="2023年的首富是谁"
retrieverd_docs =multi_vector_retriever.invoke(query)


prompt = PromptTemplate(
    input_variables=["context", "question"],
    template="请根据我给的上下文回答问题\n\n上下文{context}\n\n,你只能根据我给的上下文来回答，如果你不能回答,请回答我不知道。问题：{question}",
)
llm = Tongyi(model="qwen-max-2025-01-25", api_key=os.getenv("DASHSCOPE_API_KEY"))
def get_context(docs:List[Document]):
    context= ""
    for doc in docs:
        context += f"{doc.page_content}\n\n"
    return context

res_chain = {"context": itemgetter("question") | multi_vector_retriever| get_context , "question": itemgetter("question")} | prompt | llm
res =res_chain.invoke({"question": query})
print(res)

```



### 多向量检索-假设性问题

使用 llm 来对每个 chunk 生成 3 个假设性的问题，对应的 prompt 为

```python
生成能用下面文档来回答的三个假设性问题:\n\n{doc}
```

这里需要使用 chat 类，生成结构化的输出，比如这里生成 3 个假设性问题，存放在 list 中

```python

hypothetical_questions_llm = ChatTongyi(model ="qwen-plus", top_p=0.001, api_key=os.getenv("DASHSCOPE_API_KEY"))

class HypotheticalQuestions(BaseModel):
  questions: List[str] = Field(
    description="A list of hypothetical questions generated from the document."
  )
chain =(
    {"doc": lambda x: x.page_content}
    | ChatPromptTemplate.from_template("生成能用下面文档来回答的三个假设性问题:\n\n{doc}")
    # 生成结构化的输出
    | hypothetical_questions_llm.with_structured_output(HypotheticalQuestions)
    | (lambda x: x.questions)
  )
```

最后将生成的假设性问题存入向量数据库，之后再对 query 进行检索，找到相似的假设性问题之后返回对应的 chunk

```python
from langchain_milvus import Milvus
from langchain_community.llms.tongyi import Tongyi
from langchain_text_splitters import MarkdownTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.prompts import PromptTemplate
from langchain_core.prompts import ChatPromptTemplate
from langchain_docling.loader import DoclingLoader
import os
from operator import itemgetter
from dotenv import load_dotenv
from langchain_core.output_parsers import StrOutputParser
from langchain.retrievers.multi_vector import MultiVectorRetriever
from langchain.storage import  InMemoryStore
from langchain.retrievers.multi_vector import SearchType
from langchain_core.documents import Document
from typing import List
import uuid
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field
from langchain_community.chat_models import ChatTongyi
load_dotenv()


md_paths = [
    "markdown_output/llamaparse解析的pdf.md",
    # "markdown_output/云冈石窟-en/auto/云冈石窟-en.md",
]
child_splitter = MarkdownTextSplitter(
    chunk_size=1000, chunk_overlap=200, keep_separator=True
)
bge_embeddings = HuggingFaceEmbeddings(
    model_name="/home/zwc/large-model/bge-m3",
    model_kwargs={"device": "cuda:0"},
)

loader = DoclingLoader(file_path=md_paths)
docs = child_splitter.split_documents(loader.load())


hypothetical_questions_llm = ChatTongyi(model ="qwen-plus", top_p=0.001, api_key=os.getenv("DASHSCOPE_API_KEY"))

class HypotheticalQuestions(BaseModel):
  questions: List[str] = Field(
    description="A list of hypothetical questions generated from the document."
  )
chain =(
    {"doc": lambda x: x.page_content}
    | ChatPromptTemplate.from_template("生成能用下面文档来回答的三个假设性问题:\n\n{doc}")
    # 生成结构化的输出
    | hypothetical_questions_llm.with_structured_output(HypotheticalQuestions)
    | (lambda x: x.questions)
  )

# res = chain.invoke(docs[0])

hypothetical_questions = chain.batch(docs, {"max_concurrency": 5})


vector_store = Milvus(
    embedding_function=bge_embeddings,
    collection_name="hypothetical_questions_retriever_demo",
    connection_args={"uri": "http://localhost:19530"},
    index_params={
        "index_type": "FLAT",
        "metric_type": "IP",
    },
    vector_field="dense_vector",
    auto_id=True,
    search_params={"metric_type": "IP"},
)


store = InMemoryStore()


id_key = "doc_id"
multi_vector_retriever = MultiVectorRetriever(
    vectorstore=vector_store,
    docstore=store,
    id_key=id_key,
    search_kwargs={"k": 4},
    search_type=SearchType.similarity,
)

doc_ids = [str(uuid.uuid4()) for _ in docs]

question_docs:List[Document] = []
for i ,question_list in enumerate(hypothetical_questions):
    hypothetical_docs = [
        Document(page_content=question, metadata={id_key: doc_ids[i]})
        for question in question_list
    ]
    question_docs.extend(hypothetical_docs)

multi_vector_retriever.vectorstore.add_documents(question_docs)
multi_vector_retriever.docstore.mset(list(zip(doc_ids, docs)))


query ="2023年的首富是谁"
retrieverd_docs = multi_vector_retriever.invoke(query)

prompt = PromptTemplate(
    input_variables=["context", "question"],
    template="请根据我给的上下文回答问题\n\n上下文{context}\n\n,你只能根据我给的上下文来回答，如果你不能回答,请回答我不知道。问题：{question}",
)
llm = Tongyi(model="qwen-max-2025-01-25", api_key=os.getenv("DASHSCOPE_API_KEY"))
def get_context(docs:List[Document]):
    context= ""
    for doc in docs:
        context += f"{doc.page_content}\n\n"
    return context

res_chain = {"context": itemgetter("question") | multi_vector_retriever| get_context , "question": itemgetter("question")} | prompt | llm
res =res_chain.invoke({"question": query})
print(res)

```



## 句子窗口检索

`句子窗口检索`可以扩大上下文的范围，防止信息不全，导致回答质量不高。llama_index 中有`SentenceWindowNodeParser` 、`PrevNextNodePostprocessor`、`AutoPrevNextNodePostprocessor`等实现，langchain 中需要自己实现，具体来说就是把前后的 n 个句子放入 document 的元数据中。`这里我实现的是将前后的chunk的内容放入了metadata中。`

```python
from langchain_milvus import  Milvus
from langchain_community.llms.tongyi import Tongyi
from langchain.storage._lc_store import create_kv_docstore
from langchain_text_splitters import MarkdownTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.prompts import PromptTemplate
from langchain_docling.loader import DoclingLoader
from itertools import groupby
import os
from operator import itemgetter
from dotenv import load_dotenv
load_dotenv()

# 句子窗口检索
# langchain中没有对应的api，需要自己实现，这里是一个简单的实现示例
# llamaindex中有PrevNextNodePostprocessor 和 AutoPrevNextNodePostprocessor 的api


md_paths = ["markdown_output/llamaparse解析的pdf.md","markdown_output/云冈石窟-en/auto/云冈石窟-en.md"]

child_splitter = MarkdownTextSplitter(chunk_size = 1000, chunk_overlap=200, keep_separator=True)
bge_embeddings = HuggingFaceEmbeddings(
    model_name="/home/zwc/large-model/bge-m3",
    model_kwargs={"device": "cuda:0"},
)

loader =DoclingLoader(file_path=md_paths)
docs = child_splitter.split_documents(loader.load())
group_by_docs =groupby(docs,key =lambda x : x.metadata['source'])
processed_docs=[]
for filename, group_iter in group_by_docs:
    group_list = list(group_iter)
    for i, doc in enumerate(group_list):
      if i == 0:
          prev_page_content =""
          next_page_content = group_list[i+1].page_content
      elif i == len(list(group_list)) - 1:
          next_page_content = ""
          prev_page_content = group_list[i-1].page_content   
      else:
          prev_page_content = group_list[i-1].page_content
          next_page_content = group_list[i+1].page_content
      doc.metadata['prev_page_content'] = prev_page_content
      doc.metadata['next_page_content'] = next_page_content
      processed_docs.append(doc)


vector_store = Milvus(
    embedding_function=bge_embeddings,
    collection_name="sentence_window_retriever",
    connection_args={"uri": "http://localhost:19530"},
    index_params={
        "index_type": "FLAT",
        "metric_type": "IP",
    },
    vector_field="dense_vector",
    auto_id=True,
    search_params={"metric_type": "IP"},
)

# please open it if you first run
# vector_store.add_documents(processed_docs)
retriever =vector_store.as_retriever(search_kwargs = {"k": 5})

query ="2023年的首富是谁"
retrieverd_docs =retriever.invoke(query)


prompt = PromptTemplate(
    input_variables=["context", "question"],
    template="请根据我给的上下文回答问题\n\n上下文{context}\n\n,你只能根据我给的上下文来回答，如果你不能回答,请回答我不知道。问题：{question}",
)
llm = Tongyi(model = "qwen-max-2025-01-25", api_key =os.getenv("DASHSCOPE_API_KEY"))


def get_long_context(docs):
    top_doc = docs[0]
    return f"{top_doc.metadata['prev_page_content']}\n{top_doc.page_content}\n{top_doc.metadata['next_page_content']}"

chain = {"context": itemgetter("question") | retriever | get_long_context, "question": itemgetter("question")} | prompt | llm
res =chain.invoke({"question": query})
print(res)

```

## 层级索引(Hierarchical Retrieval)

层级检索和上面检索摘要的例子很相似，层级检索需要创建两个索引： 一个由摘要组成，另一个由文档块组成。搜索的时候分为两步：第一步通过摘要来筛选出相关文档，之后再在筛选出的文档中进一步地搜索，找到最相关的 chunk。

例如下面这个例子：我们会对每个 page 创建一个摘要，我们通过摘要检索出对应的 page（去重），之后再根据 page_number 再进行进一步的筛选，找到最相关的 chunk



这里设置过滤条件的时候要使用`filters`,如下

```python
# 设置过滤信息和top_k
chunk_retriever.search_kwargs["filters"] = {
    "page_number":  retrieved_pages
}
```

```python
from langchain_milvus import Milvus
from langchain_community.llms.tongyi import Tongyi
from langchain_text_splitters import MarkdownTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.prompts import PromptTemplate
from langchain_core.prompts import ChatPromptTemplate
import os
from operator import itemgetter
from dotenv import load_dotenv
from langchain_core.documents import Document
from langchain_core.output_parsers import StrOutputParser
from typing import List,cast
from llama_cloud_services import LlamaParse
from llama_cloud_services.parse.types import JobResult
load_dotenv()

splitter = MarkdownTextSplitter(
    chunk_size=512, chunk_overlap=100, keep_separator=True
)
bge_embeddings = HuggingFaceEmbeddings(
    model_name="/home/zwc/large-model/bge-m3",
    model_kwargs={"device": "cuda:0"},
)
pdf_file_path = "data/90-文档-Data/复杂PDF/billionaires_page-1-5.pdf"

# 对PDF进行解析
parsing_instruction = "请将此PDF文档转换为结构良好的Markdown格式。"
parse = LlamaParse(
    preset="complexTables",
    # verbose=True,
    # skip_diagonal_text=True,
    # # bounding_box="0.1,0.1,0.1,0.1",
    # # bbox_left=0.1,
    # # bbox_right=0.1,
    bbox_top=0.05,
    bbox_bottom=0.05,
    split_by_page=True,
    # preserve_layout_alignment_across_pages=True,
    # result_type=ResultType.MD,
    system_prompt=parsing_instruction,
    # premium_mode =True
)

parse_result = cast(List[JobResult],parse.parse(file_path=pdf_file_path))

docs = []
for page in parse_result.pages:
    page_content = page.md
    # 从1开始
    page_number = page.page
    doc = Document(
        page_content=page_content,
        metadata={
            "source": parse_result.file_name.split("/")[-1],
            "page_number": page_number,
        },
    )
    docs.append(doc)

# 生成summary
summary_llm = Tongyi(model="qwen-plus", top_p = 0.0001, api_key=os.getenv("DASHSCOPE_API_KEY"))
summary_chain = (
    {"doc": lambda x: x.page_content}
    | ChatPromptTemplate.from_template("Summarize the following document:\n\n{doc}")
    | summary_llm
    | StrOutputParser()
)
summaries = summary_chain.batch(docs, {"max_concurrency": 5})
summary_vector_store = Milvus(
    embedding_function=bge_embeddings,
    collection_name="hierarchical_retrieval_demo_summary",
    connection_args={"uri": "http://localhost:19530"},
    index_params={
        "index_type": "FLAT",
        "metric_type": "IP",
    },
    vector_field="dense_vector",
    auto_id=True,
    search_params={"metric_type": "IP"},
)
summary_retriever = summary_vector_store.as_retriever(search_kwargs={"k": 2})
summary_docs = [
   Document(page_content=summary, metadata={"page_number": doc.metadata["page_number"],"source": doc.metadata["source"]}) for summary,doc in zip(summaries, docs)
]
summary_retriever.vectorstore.add_documents(summary_docs)


chunk_vector_store = Milvus(
    embedding_function=bge_embeddings,
    collection_name="hierarchical_retrieval_demo_chunk",
    connection_args={"uri": "http://localhost:19530"},
    index_params={
        "index_type": "FLAT",
        "metric_type": "IP",
    },
    vector_field="dense_vector",
    auto_id=True,
    search_params={"metric_type": "IP"},
)
chunk_retriever = chunk_vector_store.as_retriever(search_kwargs={"k": 4})
chunk_docs =splitter.split_documents(docs)
chunk_retriever.vectorstore.add_documents(chunk_docs)


def get_retrieved_pages(retrieved_docs: List[Document]) -> List[int]:
    """
    从检索到的文档中提取页面编号
    """
    return sorted(set(doc.metadata["page_number"] for doc in retrieved_docs))

prompt = PromptTemplate(
    input_variables=["context", "question"],
    template="请根据我给的上下文回答问题\n\n上下文{context}\n\n,你只能根据我给的上下文来回答，如果你不能回答,请回答我不知道。问题：{question}",
)
llm = Tongyi(model="qwen-max-2025-01-25", api_key=os.getenv("DASHSCOPE_API_KEY"))
def get_context(docs):
    context= ""
    for doc in docs:
        context += f"{doc.page_content}\n\n"
    return context

query= "2023年的首富是谁?"
get_relevant_page_chain = (summary_retriever | get_retrieved_pages)
retrieved_pages = get_relevant_page_chain.invoke(query)

# 设置过滤信息和top_k
chunk_retriever.search_kwargs["filters"] = {
    "page_number":  retrieved_pages
}
top_k_per_page = 2
chunk_retriever.search_kwargs["k"] =  top_k_per_page * len(retrieved_pages)
# 生成最后的答案
res_chain = (
    {"context": itemgetter("question") | chunk_retriever | get_context , "question": itemgetter("question")}
    | prompt
    | llm
    )

res =res_chain.invoke({"question": query })
print(res)

```



##  SelfQueryRetriever




# 向量数据库 

1. 不同向量数据库的区别
2. 如何构建多个向量数据库，根据不同的问题查询不同的向量数据库,向量数据库的索引的选择



## Milvus 向量数据库

### 一些基本概念



## 向量数据库的索引

### FLAT 索引

1. FLAT 索引：每个查询向量和 collections 中的每个向量进行比较，最简单直接，100%的召回率，但是同时效率最低

### IVF 索引

1. IVF_FLAT 索引：将相似的向量进行聚类成若干个簇（cluster），在查询时，先计算查询向量与每个簇中心的距离，然后选择与查询向量最相似的前 n 个簇，接下来对这些簇的所有向量进行精确匹配。

> 在保证召回率的同时可以提高速度

### 图索引

HNSW（分层可导航小世界）：HNSW 构建了一个多层图，底层包含所有的数据点，上层则由底层采样的数据点子集组成

<img src="https://img.leftover.cn/img-md/202506192106597.png" alt="image-20250619210600506" style="zoom: 67%;" />

<img src="https://img.leftover.cn/img-md/202506192106422.png" alt="image-20250619210617321" style="zoom:50%;" />

###　DISKANN 索引

有时候我们的数据量很大，平常的索引可能不能存放在内存之中，**DISKANN**提供了一种基于磁盘的方法，可以在数据集大小超过可用 RAM 时保持较高的搜索精度和速度。适用于内存不足的场景，但同时其效率没有基于内存的索引块。

DISKANN 基于 Vamana 图 和 PQ（乘积量化）



### GPU 索引

ＧＰＵ索引则是建立的一个支持ＧＰＵ运算的索引，可以显著提高高吞吐量和高调用情况下的搜索性能。

## 量化

- 量化技术通过压缩向量来减少存储空间和计算量。通常由`标量量化（SQ）`、`乘积量化(PQ)`、`优化乘积量化(OPQ)`

- **标量量化:** 将浮点数的向量量化为低比特的整数，比如 8bit 或 4bit，可以减少存储需求，同时可能会导致较大的量化误差，影响检索的准确率

- **乘积量化：**

  1. 将一个高维向量分解为 m 个大小相等的低维子向量，每个子空间包含 D/m 维
  2. 在每个子空间内，算法会收集所有数据在该子空间上的子向量，使用 k-means 聚类来学习 K 个代表性向量（中心点），通常 K=256，这样每个聚类中心的 id 可以使用 1B 来表示，经过这一步，我们得到了 M 个码本，每个码本包含 K 个 D/M 维的聚类中心
  3. 当一个新的向量需要被索引时，它同样会被切分成 M 个子向量。对于每个子向量，我们会在对应的码本中找到距离它最近的那个聚类中心，并记录下该聚类中心的 ID。

  > 最终这个原始的 D 维向量被转换成了一个由 M 个 ID 组成的码字，例如，如果 M=8，K=256，那么一个 128 维的向量（128×4 字节 = 512 字节）就可以被压缩成一个 8 字节的编码。

<img src="https://img.leftover.cn/img-md/202506191855214.png" alt="image-20250619185556067" style="zoom:67%;" />





通过量化+ 索引类型组合

通常有`FlAT` 、`IVF_FLAT`、`IVF_SQ8` 、`IVF_PQ` 、`HNSW` 、`HNSW_SQ` 、`HNSW_PQ` 、`DISKANN` 、`BIN_IVF_FLAT` 、`BIN_FLA` 、`GPU_IVF_FLAT` 、`GPU_IVF_PQ`



## 精化器(Refiner)

量化会导致信息损失，为了保持召回率，量化通常会多返回候选结果，然后供精化器 refiner 使用更高的精度重新计算相似度来筛选出 topk。例如 FP32 精化器会使用 float32 重新计算距离，来替代使用量化向量计算出来的距离。

## 索引选用指南

FLAT： 精确搜索，100%召回率，但是速度慢

IVFFLAT：对查询速度有一定要求。要求尽可能高的召回率。

IVFSQ8: 可以压缩内存占用，速度也很快，召回率有轻微下降

IVFPQ： 可以大幅压缩内存占用，速度非常快，召回率有所下降

HNSW： 速度非常快，召回率也高，不过占用内存较多

HNSW_SQ:相比 HNSW，速度进一步提高，内存占用也更低，但是召回率稍微有所下降

HNSW_PQ: 和 HNSW_SQ 差不多

<img src="https://img.leftover.cn/img-md/202506192128658.png" alt="image-20250619212822529" style="zoom:80%;" />









# 检索前处理



## 查询重写

1. 有时候用户的输入可能表达不清晰，或者措辞不当，用户输入中包含大量冗余信息，例如

```python
hi there! I want to know the answer to a question. is that okay? 
lets assume it is. my name is harrison, the ceo of langchain. 
i like llms and openai. who is maisie peters?
```

我们想要回答的真正问题是 “who is maisie peters?”。但用户输入中有很多分散注意力的文本，如果直接拿着原始文本去检索，可能检索出很多无关的内容。

查询重写的思路也很简单，使用大模型来改写原本用户的问题，使用改写的问题进行 embedding 和检索。改写的 prompt 如下

```python
template = """Provide a better search query for \
web search engine to answer the given question, end \
the queries with ’**’. Question: \
{x} Answer:"""
rewrite_prompt = ChatPromptTemplate.from_template(template)
```

具体的教程可以看[rewrite.ipynb](https://github.com/langchain-ai/langchain/blob/master/cookbook/rewrite.ipynb)



2. 除了处理表达不清的用户输入，查询重写还经常用于处理聊天场景中的 **后续问题（Follow Up Questions）**。比如用户首先问 “合肥有哪些好玩的地方？”，接着用户又问 “那里有什么好吃的？”，如果直接使用最后一句话来 embedding 和检索的话，这样就会丢失掉`合肥` 这样的重要信息，这时候我们可以使用大模型来对问题进行重新。具体的重写的 prompt 如下：

   ```txt
   Given the following conversation and a follow up question, rephrase the follow up \
   question to be a standalone question.
    
   Chat History:
   {chat_history}
   Follow Up Input: {question}
   Standalone Question:
   ```

## 生成多个不同视角的查询 （MultiQueryRetriever）

可以根据用户的输入我们让 LLM 生成多个不同视角的提问，对于每个问题都会检索出对应的文档，最后取一个并集,可以通过`MultiQueryRetriever`来实现，具体看对应的[教程](https://python.langchain.com/docs/how_to/MultiQueryRetriever/)

## RAG 融合（RAG fusion）

RAG fusion 和 MultiQueryRetriever 的思路差不多，也是让 LLM 基于原问题，转化为多个相似但是不同的问题，对原始问题和新生成的问题执行并发的向量搜索；最后使用 RRF 算法进行重排序。



## 生成多个子问题 （Decomposition）

具体的思路就是让 LLM 生成多个子问题，对每个子问题分别检索出对应的文档, 这里根据子问题的类型的不同，对应的回答策略也不同

例如： 如果后面一个子问题依赖于前面的回答，则需要像下图这样让大模型进行回答生成

<img src="https://img.leftover.cn/img-md/202506211626007.png" alt="image-20250621162619905" style="zoom:50%;" />

如果多个子问题之间没有关系，例如*微软和苹果哪一个成立时间更早*,这时候我们需要拆分成两个子问题，如`微软的成立时间说多少`  和 `苹果的成立时间是多少`, 检索出对应的文档之后再全部给大模型，让大模型回答出源问题

<img src="https://img.leftover.cn/img-md/202506211635229.png" alt="image-20250621163526144" style="zoom:50%;" />

> 根据问题的不同，回答和查询的顺序都不一样，这部分需要灵活地变通



## 后退提示

让大模型生成一个更加通用、更加抽象的问题，例如`Jan Sindel’s was born in what country?`  其后退问题可以是：`what is Jan Sindel’s personal history?`

生成后退问题的 prompt 为：

```python
prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """You are an expert at world knowledge. Your task is to step back and paraphrase a question to a more generic step-back question, which is easier to answer. Here are a few examples:""",
        ),
        # Few shot examples
        few_shot_prompt,
        # New question
        ("user", "{question}"),
    ]
    )
```

之后把原问题检索出的文档，后退问题检索出的文档都给 LLM，让他生成回答，其 prompt 大致如下：

```python
response_prompt_template = """You are an expert of world knowledge. I am going to ask you a question. Your response should be comprehensive and not contradicted with the following context if they are relevant. Otherwise, ignore them if they are not relevant.

# {normal_context}
# {step_back_context}

# Original Question: {question}
# Answer:"""
```

具体教程可以看[stepback-qa](https://github.com/langchain-ai/langchain/blob/master/cookbook/stepback-qa.ipynb)  和 [rag_from_scratch_5_to_9](https://github.com/langchain-ai/rag-from-scratch/blob/main/rag_from_scratch_5_to_9.ipynb)

## HYDE (假设性文档)

当我们使用基于相似性的向量检索时，在原始问题上进行检索可能效果不佳，因为它们的嵌入可能与相关文档的嵌入不太相似，但是，如果让大模型根据你的问题生成一个/多个理想的答案（假设性文档），然后再用这个想象出来的答案去检索最相似的真实文档。最后把检索出来的文档当成 context 给到大模型。

具体的教程可以看[hypothetical_document_embeddings](https://github.com/langchain-ai/langchain/blob/master/cookbook/hypothetical_document_embeddings.ipynb)  和 [rag_from_scratch_5_to_9](https://github.com/langchain-ai/rag-from-scratch/blob/main/rag_from_scratch_5_to_9.ipynb)



## text2sql

对于一些需要查询数据库中的内容的时候，我们先要将自然语言转为 SQL，再从数据库中检索出对应的内容，然后让大模型回答

> 通常有两种思路：
>
>一种是类似于 Vanna 的思路，它使用 RAG 来生成对应的 SQL，大致就是我们先将数据库的 DDL，表的描述等信息存入向量数据库，然后根据用户的提问检索对应的表的 DDL 结构，然后构建一个 prompt 给大模型，让大模型生成 SQL。
>
>第二种：就是微调大模型来实现 text2sql,难度比较大，数据集构建难度比较大

# 查询路由





## 逻辑路由

例如我们有多个数据源，这时候可以根据用户输入的不同查询不同的数据源

## 语义路由

我们可能会有多套的提示词模板，我们可以根据用户的输入的不同来选择不同的提示词模板来回答问题，这个就是语义路由

> 路由本质上就是根据输入的不同选择不同的路径，这部分可以根据自己的业务来自定义
>
>在 langchain 中，我们可以根据 RunnableLambda  和 RunnableBranch 来自定义自定义路由



# 检索后处理



## 重排

### RRF 重排

使用 Reciprocal Rank Fusion（倒数排序融合）对检索出来的内容进行重排，这个方法通常用在对多个数据源检索出来的 documents 进行重排的时候，它使用下图中的公式计算 RRF-score,分数越高的排名越前

<img src="https://img.leftover.cn/img-md/202507102154981.png" alt="Snipaste_2025-07-10_21-54-32" style="zoom: 50%;" />

### Bi-Encoder

这里解释一些什么是 bi-Encoder，我们平常使用 RAG 进行检索的方式就是 Bi-Encoder，通常我们会使用 embedding 模型将文档转为一个词向量，存入向量数据库。检索阶段，将 query 转为词向量。最后对向量计算相似度得分（余弦相似度，IP 等）。效率较高，但是其精度不高

### ColBERT 重排

colbert 相比于 Bi-Encoder 有些许区别，colbert 对文档中的每个 token 生成一个向量，存入向量数据库；而 Bi-Encoder 是对整个文档/query 生成一个向量。检索阶段，也同样将 query 中的每个 token 转为词向量（query 最后转为一个矩阵）。最后对两个计算计算相似度分数（先将矩阵的每一行进行 L2 归一化，两个归一化后的向量之间的**余弦相似度 ** 就等同于它们的**点积 **，之后再对两个向量进行点积操作就可以得到余弦相似度）

### Cross-Encoder 重排

使用交叉编码器对检索出来的文档进行 rerank，相对来说，cross-encoder 的精确度较高，但是相对耗时也长





### 大语言模型重排

### 时效加权重排 （TimeWeightedVectorStoreRetriever）

这个 Retriever 会将得到的余弦形似度/IP 和时间长短进行一个加权（新文档的权重高），重新排名

## 压缩

![image-20250622215024451](https://img.leftover.cn/img-md/202506222150677.png)

### LLMLingua 压缩



## 校正

就是在检索完了之后会使用一个 llm 来对检索出的文章进行判断，判断检索出的 docs 是否与 query 相关，若都不相关，则重新改写问题之后再进行检索，或者使用联网搜索，若相关，则给生成 llm 进行回答

> 参考[CRAG](https://arxiv.org/abs/2401.15884)







# RAG 系统的评估

## RAG 的评估三角

<img src="https://img.leftover.cn/img-md/202507061619092.png" alt="image-20250706161957514" style="zoom: 33%;" />

> emm，这个评估三角就是使用一个 LLM 来进行评估，
>
>- 即使用 LLM 来评估检索出来的文档的相关性。
>- 使用 LLM 来评估大模型的回答是不是严格基于上下文进行回答的（即使上下文是错的）
>- 即使用 LLM 来评估大模型的回答是不是与用户的问题相关
>
>  但是现在的大模型都比较强，通常来说只要指令明确，大模型是能够严格基于上下文来对用户的问题进行回答的，所以我感觉对于后面两步，使用 LLM 来进行评估不太行。
>
>  对于使用 LLM 来评估检索出来的文档与问题的相关性，感觉有点像使用 LLM 来进行重排，或者使用 reranker 模型来进行重排，但是使用 reranker 模型来进行重排是给出一个文档的相关性的评分，我们不能够明确地确定哪些文档与问题相关，哪些文档与问题不相关（当然可以设置一个阈值，但也并不是说特别有效），而使用 LLM 来对检索出的文档与问题的相关性进行评分，感觉还不错（可以让大模型输出一个相关性分数以及给出是否相关的准确答案）所以，我感觉使用 LLM 来判断检索出来的文档与问题是否相关还挺有效的

