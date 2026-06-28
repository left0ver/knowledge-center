所有代码均可在[train_my_tokenizer.py](https://github.com/left0ver/study-transformer/blob/main/train_my_tokenizer.py)中找到

# 如何使用 tokenizers 库训练自己的 tokenizer

tokenizers 包含五个组件，分别是 Normalizers，Pre-tokenizers，Models，Post-Processors，Decoders

## Normalizers

`normalizers.NFC`: 会将基础字符和附加字符组合成一个单一的预组合字符，例如`e` + `´` → `é`

`normalizers.NFD`: NFC 逆过来，将一些预组合字符分解为基础字符和附加字符，如：`é` → `e` + `´`。

`normalizers.Lowercase`：转为小写

`normalizers.Strip`：去除左右两边的空格（可以配置只去除左边或者只去除右边），但是对于 llm 模型来说，通常会需要处理代码问题，这时候空格就变得比较重要了，因此大多数时候不会去除空格

`normalizers.StripAccents`:移除字符上的重音或变音符号。例如：`"déjà vu"` → `"deja vu"`（通常先使用 NFD 进行分解，然后去除重音符号）

`normalizers.Replace`：使用正则表达式/字符串替换文本

`normalizers.Replace`: 在字符串开头添加前缀

`normalizers.ByteLevel`:将字符串转为字节序列（一般是 UTF-8 编码），byte—bpe 会用到



**实践**

> 测试了一下想要使用 StripAccents 去除重音符号，必须先使用 NFD()将重音字符分解，即 é`→`e`+`´ ,然后 StripAccents 可以去除`´`

```python
tokenizer.normalizer = normalizers.Sequence([normalizers.Strip(), normalizers.StripAccents(),normalizers.Lowercase()])

print(tokenizer.normalizer.normalize_str("  Hello, my friend, how are you?Ġ  ")) # hello, my friend, how are you?ġ

tokenizer.normalizer = normalizers.Sequence(
    [
        normalizers.Strip(),
        normalizers.Lowercase(),
        normalizers.NFD(),
        normalizers.StripAccents(),
    ]
)
print(tokenizer.normalizer.normalize_str("  Hello, my friend, Héllò hôw are ü?résuméĠ  ")) # hello, my friend, hello how are u?resumeg
```

## Pre-tokenizers

通过一组规则对输入进行拆分，即将输入的文本切分成小块，后续的 model 不过扩多个块构建 token，例如我们按空格切分.

`hello world` 切分为`[hello,world]`,构建 token 的时候会将 hello 和 world 别算作一个词来构建词表

有以下的 pre_tokenizer：

`ByteLevel`: 在空格处进行分割，使用 utf-8 编码并将词元转为字节流。`hello my friend, how are you? -> [hello,Ġmy,Ġfriend,",",Ġhow,Ġare,Ġyou,?]`  

> add_prefix_space=True 在句子前面加上空格

> Ġ代表空格

> 因此我们可以使用 256 个 byte 来表示任何 token，因此可以不需要 unk token

`Whitespace`: 使用空格和所有不是字母、数字或下划线的字符进行分割。 `hello world！-> [hello,world,!]`

`WhitespaceSplit`: 按最常见的空格字符划分.`hello world! -> [hello,world!]`

`Digits`: 将数字分离出来.`hello123world -> [hello,123,world]`

`Punctuation`:将所有标点符号分离出来。`hello-world! -> [hello,-,world,!]`

`CharDelimiterSplit`：根据所给的字符分割。例如根据 x 分割，`helloxworld -> [hello,world]`

`Split`: 根据所给的`pattern`(字符串/正则表达式)拆分, 拆分之后

假设我们设置`pattern = "-"`

- removed：找到分隔符进行拆分，然后分隔符丢弃。`hello-world ->[hello,world]`
- isolated: 分隔符切分完文本之后，分隔符会作为一个独立的词。 `hello-world -> [hello,-,world]`
- merged_with_previous: 和前一个词合并。 `hello-world -> [hello-,world]`
- merged_with_next: 和后一个词合并。 `hello-world -> [hello,-world]`
- contiguous: 用来处理多个分隔符连续出现的情况，将连续出现的分隔符合并为一个单独的词元。 `hello--world ->[hello,--,world]`,和 isolated 的行为有点点差别

```python
PreTokenizer = pre_tokenizers.PreTokenizer
BertPreTokenizer = pre_tokenizers.BertPreTokenizer
ByteLevel = pre_tokenizers.ByteLevel
CharDelimiterSplit = pre_tokenizers.CharDelimiterSplit
Digits = pre_tokenizers.Digits
FixedLength = pre_tokenizers.FixedLength
Metaspace = pre_tokenizers.Metaspace
Punctuation = pre_tokenizers.Punctuation
Sequence = pre_tokenizers.Sequence
Split = pre_tokenizers.Split
UnicodeScripts = pre_tokenizers.UnicodeScripts
Whitespace = pre_tokenizers.Whitespace
WhitespaceSplit = pre_tokenizers.WhitespaceSplit
```

接下来就实践一下：

```python
tokenizer = Tokenizer(model =  models.BPE(byte_fallback =True))
tokenizer.normalizer = normalizers.Sequence([normalizers.Strip(), normalizers.StripAccents(),normalizers.Lowercase()])

tokenizer.pre_tokenizer = pre_tokenizers.WhitespaceSplit()
print(tokenizer.pre_tokenizer.pre_tokenize_str("Let's test pre-tokenization!")) # [("Let's", (0, 5)), ('test', (6, 10)), ('pre-tokenization!', (11, 28))] 

tokenizer.pre_tokenizer = pre_tokenizers.Whitespace()
print(tokenizer.pre_tokenizer.pre_tokenize_str("Let's test pre-tokenization!")) # [('Let', (0, 3)), ("'", (3, 4)), ('s', (4, 5)), ('test', (6, 10)), ('pre', (11, 14)), ('-', (14, 15)), ('tokenization', (15, 27)), ('!', (27, 28))]


tokenizer.pre_tokenizer = pre_tokenizers.ByteLevel(add_prefix_space=False)
print(tokenizer.pre_tokenizer.pre_tokenize_str("Let's test pre-tokenization!")) # [('Let', (0, 3)), ("'s", (3, 5)), ('Ġtest', (5, 10)), ('Ġpre', (10, 14)), ('-', (14, 15)), ('tokenization', (15, 27)), ('!', (27, 28))]


tokenizer.pre_tokenizer = pre_tokenizers.ByteLevel(add_prefix_space=True)# add_prefix_space=True 在句子前面加上空格
print(tokenizer.pre_tokenizer.pre_tokenize_str("Let's test pre-tokenization!"))# [('ĠLet', (0, 3)), ("'s", (3, 5)), ('Ġtest', (5, 10)), ('Ġpre', (10, 14)), ('-', (14, 15)), ('tokenization', (15, 27)), ('!', (27, 28))]
```

## Models

models 即用来 tokenizer 的算法，通常由 bpe，wordpiece（用于 bert 等），Unigram ，WordLevel

- WordLevel：直接将 pre-tokenizer 切分之后的词映射到对应的 ids，不会做其他任何操作

models 通常在训练的时候会用到

```python
trainer = trainers.BpeTrainer(
        show_progress=True,
        min_frequency=2,
        # 因为我们使用的是ByteLevel，所以不需要添加特殊的token
        special_tokens=["[SOS]", "[EOS]", "[PAD]"],
    )

    tokenizer.train_from_iterator(
        get_all_sentences(ds_raw, config["lang_src"]),
        trainer=trainer,
    )
    tokenizer.save(str(tokenizer_path))
```



## Post-Processors

有时候我们想要将 tokenizer 的字符串在输入模型之前插入一些特殊的 token，例如 bert 中就会在开头和末尾分别插入[CLS]和[SEP]

```python
post_processor = processors.TemplateProcessing(single="[SOS] $A [EOS]",pair="[SOS] $A [EOS] $B [EOS]",special_tokens=("[SOS]", "[EOS]"))
# input:("hello world","how are you")
#output:("[SOS] hello world [EOS] how are you [EOS]")
```



**实践：** 

### TemplateProcessing

设置 Template，这个 template 跟 bert 的很类似，只是特殊 token 不一样

```python
    tokenizer.post_processor = processors.TemplateProcessing(
        single=f"[SOS]:0 $A:0 [EOS]:0",
        pair=f"[SOS]:0 $A:0 [EOS]:0 $B:1 [EOS]:1",
        special_tokens=[
            ("[SOS]", tokenizer.token_to_id("[SOS]")),
            ("[EOS]", tokenizer.token_to_id("[EOS]")),
        ],
    )
```



- 单个句子

```python
sentence = "Let's test this tokenizer."
encoding = tokenizer.encode(sentence)
print(encoding) # 无post_processor ，tokens = ['let', "'s", 'Ġtest', 'Ġthis', 'Ġtoken', 'iz', 'er', '.']

tokenizer.post_processor  = processors.TemplateProcessing(single="[SOS] $A [EOS]",pair="[SOS] $A [EOS] $B [EOS]",special_tokens=[("[SOS]",0), ("[EOS]",1)])

post_processor_res =tokenizer.post_processor.process(encoding)

print(post_processor_res) # ['[SOS]', 'let', "'s", 'Ġtest', 'Ġthis', 'Ġtoken', 'iz', 'er', '.', '[EOS]']


# 尝试了一下
```




- 一对句子（save 的时候没有设置 post_processor,然后从文件中加载 tokenizer，再设置 post_processor，先调用 encode，然后再调用 process，测了一下会有问题）

```python
encoding = tokenizer.encode("hello world", "Let's test this tokenizer.")
print(encoding.tokens)
post_processor_res = tokenizer.post_processor.process(encoding)
print(post_processor_res.tokens)
```
- 一对句子，如果提前设置好了 post_processor,调用 encode 时候会自动调用后处理的方法，然后得到如下的结果

```python
encoding = tokenizer.encode("hello world", "Let's test this tokenizer.")
print(encoding.tokens)
# encoding.tokens
#['[SOS]', 'he', 'll', 'o', 'Ġworld', '[EOS]', 'let', "'s", 'Ġtest', 'Ġthis', 'Ġtoken', 'iz', 'er', '.', '[EOS]']
#encoding.type_ids
#[0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1]
```

 ### ByteLevel

```python
tokenizer.post_processor = processors.ByteLevel(trim_offsets=False)
encoding = tokenizer.encode("Let's test this tokenizer.")
# encoding.tokens
#['let', "'s", 'Ġtest', 'Ġthis', 'Ġtoken', 'iz', 'er', '.']
# start, end = encoding.offsets[3] 
# sentence[start:end]
# ' this'

tokenizer.post_processor = processors.ByteLevel(trim_offsets=True)
encoding = tokenizer.encode("Let's test this tokenizer.")
# encoding.tokens
#['let', "'s", 'Ġtest', 'Ġthis', 'Ġtoken', 'iz', 'er', '.']
# start, end = encoding.offsets[3] 
# sentence[start:end]
# 'this'
```



## Decoder

decoder 的作用就是将 ids 转为 text

`decoders.ByteLevel`:  将字节序列转为原始的 utf-8 文本

```python
sentence = "Let's test this tokenizer."
encoding = tokenizer.encode(sentence)
print(encoding.tokens) # Let's test this tokenizer.
tokenizer.decoder = decoders.ByteLevel()
decoding = tokenizer.decode( encoding.ids)
print(decoding)# Let's test this tokenizer.
```



## 封装到 PreTrainedTokenizerFast 类中

要在 transformers 中使用 tokenizer，只要封装到`PreTrainedTokenizerFast`中即可

```python
tokenizer = PreTrainedTokenizerFast(tokenizer_object = tokenizer)
output = tokenizer.tokenize(sentence)
tokenizer.save_pretrained("./my_tokenizer")
```

使用`PreTrainedTokenizerFast`加载

```python
tokenizer =PreTrainedTokenizerFast.from_pretrained("./my_tokenizer")
print(tokenizer.tokenize(sentence))
```

# 有关 tokenization 的一些问题

1. 为什么大模型对于一些简单的任务做的不好,例如一些拼写问题（star）、简单的算术 、 将字符串反转

   - 例如 strawberry 有多少个 r?我们使用[Tiktokenizer](https://tiktokenizer.vercel.app/?model=gpt-4)可视化 strawberry 的分词结果可以看出，strawberry 这个单词被拆分成了三部分，即 3 个 token，而不是一个 token

   <img src="https://img.leftover.cn/img-md/202507221805350.png" alt="Snipaste_2025-07-22_18-05-06"  />

   - 例如让 chatgpt 将`.DefaultCellStyle`反转，直接让他进行反转就会得到错误答案，但如果我们先让它使用空格将每个字符分开，再让他进行反转操作就可以答对

> 这些问题其实并不是大语言模型本身的限制导致的，而是 tokenizer

2. 为什么不使用 unicode 编码作为 vocabulary
   1. unicode 编码虽然可以表示所有的字符，但是他太大的，有 15w 个单词，这会导致训练的 Embedding 层很大，并且在最后面进行 softmax 的时候计算量很大
   2. 并且 unicode 编码在不断扩大，因为他不是固定不变的，如果使用 Unicode 编码作为 vocabulary 的话，这会导致你需要频繁的该模型结构
   3. 如果使用 Unicode 编码作为 vocabulary，这时候空格表示一个 token，在面对编程语言等问题的时候，编程语言通常会包含大量的空格，这样的话就会导致序列长度很长，从而模型效果差。因为通常我们会将多个空格编码为一个 token，这样就可以避免序列长度很差的问题

3. 为什么不使用 UTF-16 或者 UTF-32 编码，而使用 UTF-8 编码

   `UTF-32`是定长编码，使用 4 个字节来存储，如果使用 UTF-32 的来进行编码的话会产生大量的 0，尤其是对于英文来说，浪费空间且 BPE 的合并效果也不好

   `UTF-16`使用两个字节/四个字节来存储，同样相对于 UTF-8 编码来说，会产生大量的 0，浪费空间并且 BPE 的合并效果不好

   `UTF-8`是变成编码，并且兼容 ASCII 码，因此使用 UTF-8 编码是最节省空间的并且效果也是最好的

4. 为什么 GPT 在一些小语种上的效果很差？例如老挝语、泰语
   - 从 tokenizer 角度回答：因为互联网上大多数是英文语料，而老挝语、泰语的语料很少，这会导致在使用 BPE 算法训练 tokenizer 的时候，只有少量的老挝语的 token 会被合并，因此 LLM 在进行回答的时候，如果是老挝语的语言，他的输入的 token sequence 就会更长，自然模型的效果不好。因为在训练 tokenizer 的时候很多是英文的语料，这就导致大量的英文相关的 token 被合并，所以如果输入的是英语，这时候输入就会 token sequence 就会更短，因此模型的效果很会更好
   - 从模型训练的角度回答：LLM 在预训练的时候，是使用互联网的语料使用自回归的方式进行训练的，而老挝语等语言的语料少，自然对于老挝语的训练效果差，因此在使用老挝语等语言输入 LLM 的时候，回答效果就不好

5. 怎么设置 vocab_size

   这通常是一个经验的超参数，一般在 1w 或者 10w 左右

6. 我怎样增加 vocabulary 的大小

   - 修改 Embedding 层，为新加的词汇初始化对应的向量，可以使用 0 初始化，也可以随机初始化，当然也有一些其他的更加高级的初始化方法

   - 其次，修改模型最后面的 Projection_layer(投影层),修改对应的词表的大小

     ```python
     class ProjectionLayer(nn.Module):
         def __init__(self, embedding_dim: int, vocab_size: int):
             super().__init__()
             self.proj = nn.Linear(embedding_dim, vocab_size)
     ```

     

7. 为什么 vocab_size 不能设置为特别大？

   - 从上面可以看到，如果我们的 vocab_size 变大，那么投影层的参数量和 Embedding 层的参数量也会变大，导致模型需要更大的算力和显存
   - 其次，我们 vocab_size 很大的话，那么每个 token 在训练中出现的频率就会变低，这可能导致模型欠拟合，
   - 同时 vocab_size 很大的话就表明有很多小的 token 合并为了一个大的 token，因此对于一个大的 token，它包含的语义信息比较多，模型可能不能完全学到对应的语义信息

8. 为什么 vocab_size 不能设置为特别小？

   - vocab_size 很小的话，会导致输入模型的时候序列长度很大，同时 seq_len 很长，导致其捕捉不到 token 之间的语义关系。

   - 同时 vocab_size 很小的话，会导致一句话里面有大量相同的 token，尤其是输入是代码的时候，包含大量的空格等信息



# Reference

1. [Let's build the GPT Tokenizer](https://www.youtube.com/watch?v=zduSFxRajkE)
2. [模块化构建 tokenizer](https://huggingface.co/learn/llm-course/zh-CN/chapter6/8?fw=pt)

3. [tokenizer 的文档](https://huggingface.co/docs/tokenizers/components)
