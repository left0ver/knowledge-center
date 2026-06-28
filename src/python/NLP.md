# NLP 任务

1. 词性标注（Part-of-Speech Tagging）（POS）：即为文本中的每个单词分配一个词性标签，例如名词、动词、代词、限定词等

2. 文本分类：通常包括情感分类、垃圾邮件分类、新闻分类等

3. 命名实体识别（Named Entity Recognition，NER）：即从文本中识别出人名、地名、组织名等实体

   > 例如：李雷和韩梅梅是北京市海淀区的居民，他们计划在 2024 年 4 月 7 日去上海旅行。
   >
   >输出：[("李雷", "人名"), ("韩梅梅", "人名"), ("北京市海淀区", "地名"), ("2024 年 4 月 7 日", "日期"), ("上海", "地名")]

4. 关系抽取（Relation Extraction）：旨在识别和分类文本中的实体之间存在的语义关系。简单来说，就是从文本中找出“谁和谁是什么关系”或者“什么和什么有什么联系”

   > 例如：
   >
   >(猫, is-a, 哺乳动物)
   >
   >(引擎, part-of, 汽车)
   >
   >(史蒂夫·乔布斯, 创始人, 苹果公司)
   >
   >(埃菲尔铁塔, 位于, 巴黎)

5. 文本摘要：大概就是生成一段简洁的摘要来概括原文的主要内容。根据生成方式的不同，文本摘要分为两类：抽取式摘要 和 生成式摘要

   - **抽取式摘要：**从原文中直接抽取关键的句子或短语，然后将他们组合起来形成摘要
   - **生成式摘要：**理解原文的内容，然后模型利用自己的“语言”重新组织和表达，生成新的句子来构成摘要。生成式摘要通常需要更复杂的模型，如基于注意力机制的 Seq2Seq

6. 机器翻译：即将一种语言翻译为另一种语言

7. 自动问答（QA）：即使模型能够理解自然语言提出的问题，并根据数据源来自动提供准确的答案

   1. 根据答案的来源：
      - 基于知识库的问答：从知识库中查找答案
      - 检索式问答：通过搜索引擎等从大量文本中检索答案

   2. 根据答案的形式：
      - 抽取式问答：答案直接从源文本中抽取出来，是原文的一个子串
      - 生成式问答：模型自己组织语言生成答案
   
8. 因果语言模型（Casual Language Model，CLM）：基于一个自然语言序列的前面所有的 token 来预测下一个 token，通过不断重复该过程来实现目标文本序列的生成

# 分词方法

BPE、WordPiece 、Unigram 等分词算法都是基于子词的分词算法，旨在解决词汇表过大，OOV 问题，单词内部结构丢失等问题

## BPE（Byte Pair Encoding）

### 分词规则

BPE 算法从单个字符开始，迭代地合并最**频繁**的相邻单元（它会选择频率最高的相邻字符进行合并）

例如：

我们语料库中有

```python
"hug", "pug", "pun", "bun", "hugs"
```

则初始的语料库为

```python
["b", "g", "h", "n", "p", "s", "u"]
```

之后我们通过`合并规则`来添加新的 tokens，直到到达期望的词汇表大小/或者达到指定的迭代次数。

假设单词的频率为

```python
("hug", 10), ("pug", 5), ("pun", 12), ("bun", 4), ("hugs", 5)
```

则我们现在可以根据词汇表中的词对单词进行拆分

("h" "u" "g", 10), ("p" "u" "g", 5), ("p" "u" "n", 12), ("b" "u" "n", 4), ("h" "u" "g" "s", 5)

计算相邻词对出现的次数，其中("u","g")出现了 20 次，出现次数最多，因此我们第一轮将 u 、g 进行合并，并将 ug 添加到词汇表中，之后词汇表 和 语料库变为：

```python
词汇表: ["b", "g", "h", "n", "p", "s", "u", "ug"]
语料库: ("h" "ug", 10), ("p" "ug", 5), ("p" "u" "n", 12), ("b" "u" "n", 4), ("h" "ug" "s", 5)
```

第二轮合并：按照合并规则，选择出现次数最多的词对，即("u","n"),即将 u、n 进行合并，并将其添加到词汇表中。

```python
词汇表: ["b", "g", "h", "n", "p", "s", "u", "ug", "un"]
语料库: ("h" "ug", 10), ("p" "ug", 5), ("p" "un", 12), ("b" "un", 4), ("h" "ug" "s", 5)
```

一直这样合并，直到到达指定的词汇表大小/到达规定的迭代次数



### 分词器的使用

假定我们需要对"hugs"这个词进行分词，BPE 会使用贪婪匹配算法来进行分词，即尽可能找最长的单词进行分词，例如

hugs 则会被分为(h,ug,s),词汇表中 h 开头的词，只有 h，则 h 会被分为一个词，对于 ugs 来说，词汇表中包含 u 和 ug，因此 ugs 会被分为 ug、s，最后由于 s 为一个字母，不可再分。因此 hugs 会变为分为(h,ug,s),当然这是在上面只进行了两次合并的情况下进行的分词。

## B-BPE（Byte-BPE）

GPT、GPT-2、RoBERTa、BART 和 DeBERTa 等模型都在使用 BPE 分词算法

上面我们讲了使用 BPE 算法来对英文单词进行分词，但是 BPE 算法对中文的效果并不好**，一方面中文的基本词汇很多，大概有 5w 个，而英文的基本字符很小，只有 26 个字母。因此如果使用 BPE 对中文进行分词，则基础词汇表会很大，并且对于中文的词来说，中文并没有像英文那样词根（un、ly 之类的）**

### UTF-8 编码

utf-8 是一种变长的字符编码，它将 Unicode 中的代码点转换为字节序列，使用 1-4 个字节来表示一个 unicode 字符。UTF-8 是兼容 ASCII 的，在 UTF-8 中，ASCII 使用一个字节表示，因此 ASCII 字符在 UTF-8 中使用相同的字节表示。中文通常使用 3-4 个字节表示



### BBPE 的实现

由于 1 个字节有 8 位，因此一个字节有 256 中表示方式。因此 BBPE 的基础词汇表最大为 256。

和 BPE 的实现类似，BBPE 只是在构建基础词汇方面有些区别，合并规则和 BPE 一样

BBPE 会将词汇表中的词汇使用 UTF-8 编码表示，先构建一个基础词汇表，最后根据**频率最高的字节对**进行合并（这里的合并规则和 BPE 类似）



### 优缺点

1. BBPE 的基础词汇表很小，最大为 256
2. 因为 UTF-8 可以表示各种语言，因此 BBPE 算法可以实现多种语言的统一



## WordPiece 

google 开发的用于 bert 的预训练分词算法，很多基于 BERT 的 Transformer 模型都复用了这种方法，比如 DistilBERT，MobileBERT，Funnel Transformers 和 MPNET。

我们使用和 BPE 相同的语料库

```python
("hug", 10), ("pug", 5), ("pun", 12), ("bun", 4), ("hugs", 5)
```

构建初始的词汇表

```python
("h" "##u" "##g", 10), ("p" "##u" "##g", 5), ("p" "##u" "##n", 12), ("b" "##u" "##n", 4), ("h" "##u" "##g" "##s", 5)
```

> 词内部的字符会被添加## 



### 合并规则

BPE 是选择出现频率最高的词对进行合并，而 WordPiece 则是对每个词对计算一个得分,选择得分最高的词对进行合并

```python
score=(freq_of_pair)/(freq_of_first_element×freq_of_second_element)
```

第一轮迭代：

```python
词汇表: ["b", "h", "p", "##g", "##n", "##s", "##u", "##gs"]
语料库: ("h" "##u" "##g", 10), ("p" "##u" "##g", 5), ("p" "##u" "##n", 12), ("b" "##u" "##n", 4), ("h" "##u" "##gs", 5)
```

合并的时候会删除两个词中间的`##`,并将新词添加到词汇表

第二轮迭代：

```python
词汇表: ["b", "h", "p", "##g", "##n", "##s", "##u", "##gs", "hu"]
语料库: ("hu" "##g", 10), ("p" "##u" "##g", 5), ("p" "##u" "##n", 12), ("b" "##u" "##n", 4), ("hu" "##gs", 5)
```

第三轮迭代：

```python
词汇表: ["b", "h", "p", "##g", "##n", "##s", "##u", "##gs", "hu", "hug"]
语料库: ("hug", 10), ("p" "##u" "##g", 5), ("p" "##u" "##n", 12), ("b" "##u" "##n", 4), ("hu" "##gs", 5)
```

按照合并规则，直到达到指定的词汇表大小/迭代次数

### tokenization 算法

和 BPE 类似，WordPiece 进行分词的时候也是使用的贪婪匹配的策略，例如对“bugs”进行分词，则被分为(b,##u,##gs).

## WordPiece 和 BPE 的区别

在进行分词的时候，若遇到词汇表中没有的词，WordPiece 则会将整个词标记为[UNK], 而 BPE 则只将不在词汇表中的单个字符标记为[UNK],例如 bum，WordPiece 的分词结果为["[UNK]"]，BPE 的分词结果为["b","u","[UNK]"]



## Unigram

该算法常被 AlBERT，T5，mBART，Big Bird 和 XLNet 等模型广泛采用

Unigram 算法的原理和 BPE、WordPiece 刚好相反，Unigram 从一个大词汇表开始，然后逐步删除词汇，直到达到目标词汇库大小。

> 1. 我们可以在具有大量词汇量的语料库上使用 BPE 得到一个初始语料库 
>2. 还可以选取预切分词汇中的最常见子串



### Unigram 分词规则

使用上面的语料库

```python
("hug", 10), ("pug", 5), ("pun", 12), ("bun", 4), ("hugs", 5)
```

使用所有的子串作为初始语料库

```python
["h", "u", "g", "hu", "ug", "p", "pu", "n", "un", "b", "bu", "s", "hug", "gs", "ugs"]
```

每次迭代，Unigram 算法都会在给定当前词汇的情况下计算语料库的损失。然后，对于词汇表中的每个 token，算法计算如果删除该 token，整体损失会增加多少，并寻找删除后损失增加最少的 token。

这个过程非常消耗计算资源，因此我们不只是删除与最低损失增长相关的单个符号，而是删除与最低损失增长相关的百分之/p （p 是一个可以控制的超参数，通常是 10 或 20）的符号。然后重复此过程，直到词汇库达到所需大小。

### tokenization 算法

以下是词汇表中所有的子词出现的频率

```python
("h", 15) ("u", 36) ("g", 20) ("hu", 15) ("ug", 20) ("p", 17) ("pu", 17) ("n", 16)
("un", 16) ("b", 4) ("bu", 4) ("s", 5) ("hug", 15) ("gs", 5) ("ugs", 5)
```

现在我们对"pug"进行分词，会查看所有可能的分词组合，并根据 Unigram 模型计算出每种可能的概率。由于所有的分词都被视为独立的，因此这个单词分词的概率就是每个子词概率的乘积。

例如
$$
P([p,u,g]) = P(p)\cdot P(u)\cdot P(g) = \frac{5}{210} \cdot  \frac{36}{210} \cdot  \frac{20}{210} =0.000389
$$
计算其所有分词方式,选择概率最高的方式进行分词

```python
["p", "u", "g"] : 0.000389
["p", "ug"] : 0.0022676
["pu", "g"] : 0.0022676
```





# Transformer 模型的架构

## Encoder-only

最著名的 encoder-only 的预训练模型应该就是 bert 了。模型整体由 Embedding、Encoder 和 prediction_heads 组成，prediction_heads 就是一个为了适配各种下游任务的分类头。encoder-only 模型通过使用 Encoder 提取特征，使用 prediction_heads 来适配不同的任务输出结果。因此 Encoder-only 常常适用于文本分类、MLM、词性标注等 NLU 任务。

<img src="https://img.leftover.cn/img-md/202506031354170.png" alt="image-20250603135456028" style="zoom:67%;" />



## Decoder-only

顾名思义，decoder-only 就是由 decoder 堆叠起来的模型，最有名的是 OpenAI 的 GPT（Generative Pre-Training Language Model），相比于 bert，Decoder-only 则更适用于文本生成任务，因此 Decoder-only 模型在进行预训练的时候一般都选择因果语言模型来作为训练任务（即基于一个自然语言序列的前面所有 token 来预测下一个 token）



Decoder-only 模型整体由 Embedding、Decoder、MLP 组成。文本被编码成 input_ids，通过 Embedding 层再加上 Positional Embedding 进行位置编码，得到隐藏状态，再送入 Decoder 中，Decoder 中的注意力的计算和 bert 一样，都是自注意力的计算，

> 但是 Decoder 由于只能看到之前的 token，不能看到未来的 token，因此在进行计算的时候通过 attention_mask 矩阵来遮蔽了未来 token 的自注意力权重。从而限制每一个 token 只能关注到它之前 token 的注意力，来实现掩码自注意力的计算。
>
>    而 bert 是 encoder-only 架构，它是可以看到所有的 token 的，因此在计算注意力的时候就不需要使用 attention_mask 矩阵来遮蔽了未来 token 的自注意力权重。

<img src="https://img.leftover.cn/img-md/202506031407097.png" alt="image-20250603140741040" style="zoom:50%;" />





## Encoder-Decoder 架构

Encoder-Decoder 架构中最有名的是 google 提出的 T5 模型，将不同的 NLP 任务，如文本分类，问答，翻译等都统一为输入文本到输出文本的转换。主要思路就是利用 Encoder 对输入序列进行编码，提取特征和语义信息，然后送入 Decoder 中进行输出

<img src="https://img.leftover.cn/img-md/202506031422608.png" alt="image-20250603142239486" style="zoom:50%;" />

# 预处理

## 文本处理的基本方法

1. 分词

2. 词性标注 （Part-of-Speech tagging ,简称 POS）(即将每个词的词性标注出来，例如动词、形容词)

3. 命名实体识别（named entity recognition NRE）（将人名、地名、机构名等专有名词标注出来）

   > 将人名、地名、机构名等专有名词统称命名实体



## 文本张量表示方法（将文本表示为张量）

### onehot 编码

例如目前我们的词表大小为 N，现在我们要将 5 个词转为 onehot 编码，我们会得到一个 5*N 的矩阵，找到词对应于词表的位置，将这个位置置为 1

> onehot 编码时间简单，但是非常浪费空间，同时也处理不了词表中没有的词（即 OOV 问题）

### word2Vec

word2vec 是在一个无监督的语料上，例如 CBOW 和 skipgram 都根据数据构造了 label，从而构造了一个有监督的任务 （后面被称为自监督）

> 广义的 word embedding: 用神经网络来训练我们的词向量
>
>- word2vec：浅层神经网络
>- word embedding：深层神经网络

#### CBOW (Continuous Bag-of-Words)

CBOW 的思想是**通过周围的词来预测中间的词**。我们假设希望学习的词向量的维度为 N，词汇表的大小为 V，上下文窗口为 C（中心词前后各取 C 个词）。

> 假设我们有如下的一段话:the quick brown fox jumps over the lazy dog
>
>假设窗口为 2，我们可以得到这些样本：
>
>1. input：the quick fox jumps。 label：brown 
>
>2. input：quick brown jumps over。 label：fox 
>
>3. input：brown fox over the。 label：jumps 
>
>   ...

其模型是一个多层感知机

输入层：输入为 2C 个上下文词，并将这些词转为 onehot 编码。得到的输入 tensor 形状为：[B，2C,V] （B 为 batchsize,V 为词表大小）

隐藏层（bias=False）：input_feature 为 V，output_feature=N。 （隐藏层的参数为 V*N 的矩阵）

输出层：input_feature=N ,output_feature =V。

<img src="https://img.leftover.cn/img-md/202505131410896.png" alt="image-20250513141014933" style="zoom:50%;" />

> 最终通过 softmax 进行归一化，再使用交叉熵损失函数进行 loss 计算，再反向传播

> 最后模型收敛之后，`隐藏层的参数（V*N）矩阵就是得到的每个词对应的词向量`，通过这种方式，我们将每个词映射为了一个长度为 N 的 vector

#### Skipgram

skipgram 的思想是**通过中间的词来预测周围的词，和 CBOW 相反。**

神经网络的构建和 CBOW 类似，区别就是在于输入和标签的选择不同。

#### 改进

想象一下，当我们的词表很大的时候（例如几十、上百万）时，此时进行 softmax 的效率就变得非常慢了，因为 cbow 和 skipgram 最终算是一个 V 分类的问题（V 为词表的大小），因此其 softmax 的复杂度为 O(V)

1. 分层 softmax

   主要思想就是根据词表中每个词的词频构建一个 huffman 树，词频较大的词处于浅层、词频较小的词处于深层。这样的话我们就将一个 V 分类的问题转为了一个 log（V）次的 2 分类问题，从而大大减少了计算量，时间复杂度为 O(log V)

2. 负采样

   这里举 CBOW 的例子，CBOW 使用周围词来预测中间词，正常来说我们需要 softmax 来得到 V 个词的概率，并通过梯度下降来使得目标词的概率尽可能大，非目标词的概率尽可能小。而正常的 softmax 计算量太大是因为他把其他的所有非目标词都当做负例了。负采样的思想就是：按一定的概率随机采样一些词当负例，从而计算损失，梯度更新的时候也只更新采集的负样本的词向量和目标词的词向量

> **这两种使用一种即可，负采样相比分层 softmax 更简单并且更高效，通常我们会使用负采样**

### Golve

对于 word2vec 来说，他在训练的时候仅使用中心词周围的词进行训练，并没有很好地利用全局的统计信息。而 Golve 则是先对整个语料库的词共线次数进行统计，得到一个共线矩阵，之后再进行训练，最终得到词语对应的词向量

0. 什么是共线 和 共线矩阵

   假定窗口大小为 10，假设此时的中心为单词 j，共线则是指单词 i 出现在单词 j 的上下文环境中（出现在以单词 j 为中心的左右 10 个单词区间）

   假定我们有如下的语料：

   I like deep learning

   窗口大小为 1，此时中心词为 like，则 I 和 like 共线，共线次数+1，like 和 deep 共线，共线次数+1

   最后统计完了之我们可以得到一个共线矩阵，矩阵中的每个值表示单词 i 和 单词 j 共线的次数（类似与下图，图片来源[这里](https://blog.csdn.net/buchidanhuang/article/details/98471741)）

   ![image-20250516103910168](https://img.leftover.cn/img-md/202505161039821.png)

   

1. 什么是共线概率？

   有了上述的共线矩阵，$x_i = \sum_k x_{ik}$ 为 任意词出现在以单词 i 为中心词的环境中的次数（即共线矩阵对行求和）
   $$
   P_{ij} = P(j|i) = \frac{x_{ij}}{x_i}
   $$

   > 很明显，$0 \le P_{ij} \le 1$ 当 $P_{ij} $ 越大，则说明单词 j 和单词 i 越相关

2. 共线概率比

   这是论文中的一组数据，第一和第二行是表示共线概率，第三行是共线概率比，即第一行共线概率/第二行的共线概率

   ![image-20250516104553345](https://img.leftover.cn/img-md/202505161045622.png)

   > 从图中我们可以得出：
   >
   >- 单词 solid 和 ice 比较相关，和 steam 不相关，因此他们的`共线概率比` >1
   >- gas 和 ice 不相关，和 steam 相关 ，因此他们的`共线概率比` < 1 
   >- water 和 ice 、steam 都相关，`共线概率比` 近似 1
   >- fashion 和 ice 、steam 都不相关，`共线概率比`近似 1

可以看出`共线概率比` 可以很好地表示 3 个单词之间的关系，因此作者就猜想如果能将 3 个单词的词向量经过某种计算可以表达共线概率比就好了（这就是 glove 的思想）

3. 词向量函数

   根据上面的思路，我们大概可以得到一个这样的函数
   $$
   f(v_i,v_j, \widetilde{v_k}) = \frac{P_{ik}}{P_{jk}}
   $$
   这里共线概率和共线概率比是可以事先通过语料库得到的，因此等式右边是一个已知的标量，因此我们可以设计一个模型，$\frac{P_{ik}}{P_{jk}}$ 作为 label，通过训练让模型的输出逼近这个值。

- 注意到上述的等式中，左边是一个向量、右边是一个标量,作者先对向量进行点积运算，得到下式
  $$
  f((v_i-v_j)^T\widetilde{v_k}) = \frac{P_{ik}}{P_{jk}}
  $$
  ![image-20250516121422155](https://img.leftover.cn/img-md/202505161214471.png)
  为了满足上面的两个性质
  $$
  f((v_i-v_j)^T\widetilde{v_k})  =  \frac{f(v_i^T \widetilde{v_k})}{f(v_j^T \widetilde{v_k})}
  $$
  很明显指数函数可以达到这样的效果，因此 f 为 exp 函数

  因此
  $$
  exp(v_i^T\widetilde{v_k}) = P_{ik} = \frac{x_{ik}}{x_i} \\
  exp(v_j^T\widetilde{v_k}) = P_{jk} = \frac{x_{jk}}{x_j} \\
  $$
  等式两边同时取对数
  $$
  v_i^T\widetilde{v_k} = \log(x_{ik}) - \log(x_i)\\
  v_j^T\widetilde{v_k} = \log(x_{jk}) - \log(x_j)
  $$

这里对上述式子的 ik 进行交换，$v_k^T\widetilde{v_i} = \log(x_{ki}) - \log(x_k)$

> 1. 对于同一个词，他作为中心词和作为背景词的词向量应该相等，因此$v_i^T\widetilde{v_k} = v_j^T\widetilde{v_k}$
>2. 很明显$\log(x_{ik}) = \log(x_{ki})$
>3. 但是$\log(x_i)!= \log(x_k)$
>
>因此上面的等式还不具备对称互换性

这里我们将$log(x_i)$ 替换为 $b_i + b_k$

得到
$$
v_i^T\widetilde{v_k} = \log(x_{ik}) - b_i - b_k
$$
移项得：

$$
v_i^T\widetilde{v_k} + b_i + b_k= \log(x_{ik})
$$



模型的目标就是让等式的左边无限接近于右边，因此损失函数为
$$
J = \sum_{i=1}^{N} \sum_{j=1}^N f(x_{ij}) [(v_i^T\widetilde{v_j}) + b_i +b_j -\log(x_{ij})]^2
$$
$f_(x_{ij})$ 是一个权重函数

![image-20250516123003749](https://img.leftover.cn/img-md/202505161230849.png)

> 这里对于出现次数更少的词对儿会给予更大的权重，经常出现的词的权重会更小，同时当$x_{ij}=0$ 时，loss =0，避免了$\log(x_{ij})$ 为无穷小导致 loss 为 inf 的问题

4. 如何训练

   - 从共现矩阵随机选择一个 batch 的词对（非 0），根据损失函数计算这个 batch 的 loss，反向传播时计算 loss 对于$v_i,v_j,b_i,b_j$的梯度，并更新参数

   - 训练结束之后对于词汇表的每个词我们都得到了两个词向量：$v_i,\widetilde{v_i}$ 。论文中建议将这两个词向量相加得到最终的词向量

     > 这里理论上来说，因为$x_{ij} = x_{ji}$,glove 拟合的是对称的$\log(x_{ij})$,因此 $v_i 和 \widetilde{v_i}$应该是相等的，因为但是由于初始化的不同，训练结束之后，这两个向量会有些许差异

5. 其他

   **在 glove 中，在训练的时候还考虑了共现的时候文本之间的距离的影响，若中心词和上下文词相距 d 个词，则对共线计数为 1/d。（论文 4.2）**

6. 参考

   [glove 论文](https://nlp.stanford.edu/pubs/glove.pdf)

   [动手学深度学习](https://zh.d2l.ai/chapter_natural-language-processing-pretraining/glove.html)

   [详解 GloVe 词向量模型](https://blog.csdn.net/buchidanhuang/article/details/98471741)

   [bilibil-动手学深度学习第十七课：GloVe、fastText 和使用预训练的词向量](https://www.bilibili.com/video/av18795160/?vd_source=3c93d521158d3aa4f74c71c5140ba8dc)

### FastText

fastText 是在 word2vec 上进行了一定的改进，提出了子词的思想，其他的和 skipgram 差不多

1. **子词**：word2vec 将每个单词识别一个独立的原子单位进行学习，学习这个词的词向量，但是这样的话就忽略了单词的内部结构。而 fasttext 则是将每个单词视为由字符的 n-gram 组成的集合。

> 例如，对于 where 这个单词，当 n=3 时，我们将获得长度为 3 的所有子词： “`<wh`”、“whe”、“her”、“ere”、“`re>`”和特殊子词“`<where>`”。其中 `<` 和 `>` 是特殊字符，用来标记单词的开头和结束

2. **词向量表示：** **fasttext 中一个单词的词向量是其所有字符的 n-gram 向量之和，因此即使出现了 OOV 的词，fasttext 也可以为其生成一个词向量（只要他的字词在词表中）**

3. **如何解决字词过多的问题？**

   为了解决 n-gram 数量过多的问题，fasttext 会使用 FNV-1a 哈希函数将所有的 n-gram 字符映射到一个固定大小的整数范围内（1-K）(论文中 k=$2*10^6$)

   但是由于 n-gram 数量可能远大于 K，因此肯定会出现 hash 冲突的问题，当发生冲突的时候，这些不同的 n-gram 将共享这个桶的向量表示（**由于一个单词是由多个子词组成的，因此即使其中一两个子词发生 hash 冲突，带来的影响不会很大**）

   **词典始终会保存每个出现频率高于规定阈值（minCount）的整词，并且这些整词有一个单独的词向量**

   > **词向量的最终表示：**一个单词的最终向量通常是其“词本身”的向量（如果存在）与它所有字符 n-gram 对应桶的向量的和

## 文本语料的数据分析

1. 分析标签的数量分布

2. 句子长度分布，例如单词长度是 20 的有多少个，15 的有多少个(`例如可以去掉长度小于5的样本`)

3. 统计训练集、验证集的不同单词数

4. 词频统计（`这里也不是说统计每个词的词频，例如我们在情感分析的任务中，我们可以只对形容词进行词频统计`），有了词的词频之后，我们可以使用 wordcloud 库生成对应的词云

   ![image-20250515210000098](https://img.leftover.cn/img-md/202505152100551.png)

## 文本特征处理

- 添加 n-gram 特征：在原本特征的基础上，还可以进一步多个相邻的词作为一个特征
- 文本长度的规范，我们需要保证每个 batch 的 seq 的长度是一样的，因此我们通常需要对数据进行 填充/截断

```python
def padding_collate_fn(batch):
    input_ids, labels = zip(*batch)
    input_ids = pad_sequence(input_ids, batch_first=True, padding_value=vocab.PAD_IDX)
    labels = torch.tensor(labels)
    return input_ids,labels
```



## 数据增强

1. 数据不够，如何增加语料（例如 `回译法`：中文-> 韩文-> 英文-> 中文）

   > 回译法的优点：
   >
   >- 操作简单，获得的新语料质量高
   >
   >缺点：
   >
   >- 在进行`短文本`回译的过程中，新语料和原语料可能存在很高的重复率，并不能有效增大样本的特征空间


