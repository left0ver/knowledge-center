# 第三章 注意力机制的实现



## 为什么需要注意力机制

![Snipaste_2025-08-24_12-15-52](https://img.leftover.cn/img-md/202508241215617.png)

在 transformer 之前，我们通常使用 RNN 来实现机器翻译，RNN 通过将前一步的输出作为当前步骤的输入的神经网络，如上图所示。而 Encoder-Decoder RNN 中，将源句子通过 Encoder 来捕捉语义的信息，然后将最后一个隐藏状态用来预测下一个单词。

而 Encoder-Decoder RNN 中，在 decoder 阶段，RNN 无法直接访问 Encoder 早期的隐藏状态，他只能依赖当前的隐藏状态，这个状态包含了所有相关信息。这可能导致上下文丢失，特别是在复杂句子中，依赖关系可能跨越较长的距离。（因此 RNN 在处理长依赖关系的时候存在缺陷）



## self-attention 中为什么要除以根号 d

注意力分数的计算:通常 先使用 q,k 进行点积运算（对应位置的元素相乘求和），之后再使用 softmax 进行归一化

而在 LLM 中，Embedding 的维度通常很大，通常>1000,因此这会导致点积之后的值很大。而 sfotmax 的时候如果存在较大的输入值的时候，softmax 的输出接近于 ont-hot 向量，会导致 softmax 函数的梯度接近于 0，这样会导致前面的层的梯度很小，导致训练停滞

> 因此我们通常会对嵌入维度的平方根进行缩放，因此这种自注意力机制也被叫做缩放点积注意力





# 第四章 实现 GPT 模型



## 计算模型的参数和 FLOPS

1. 计算模型的参数

```python
total_params = sum((p.numel()) for p in model.parameters())
print(f"Total number of parameters: {total_params:,}")
# 1.63亿参数
# GPT2是1.24亿，因为GPT-2 架构中使用了一个叫作权重共享（weight tying）的概念，即将token_embedding 层 作为输出层重复使用，这样大量减少了参数
print("Token embedding layer shape:", model.tok_emb.weight.shape)
print("Output layer shape:", model.out_head.weight.shape)
out_head_params = sum(p.numel() for p in model.out_head.parameters())
# 模型的参数为124MB
# 如果采用FP32存储每个参数，则模型大小为474.59 MB
print(
    f"GPT2 total params: {(total_params-out_head_params):,} params_size ={(total_params-out_head_params)/1000/1000:.2f}MB, model_size = {(total_params-out_head_params)*4 /1024/1024:.2f} MB"
)
```

2. 使用 thop 来计算模型的 FLOPS

   ```python
   # pip install ultralytics-thop
   import torch
   from thop import profile
   
   BASE_CONFIG = {
       "vocab_size": 50257,     # Vocabulary size
       "context_length": 1024,  # Context length
       "drop_rate": 0.0,        # Dropout rate
       "qkv_bias": True         # Query-key-value bias
   }
   
   model_configs = {
       "gpt-small (124M)": {"emb_dim": 768, "n_layers": 12, "n_heads": 12},
       "gpt-medium (355M)": {"emb_dim": 1024, "n_layers": 24, "n_heads": 16},
       "gpt-large (774M)": {"emb_dim": 1280, "n_layers": 36, "n_heads": 20},
       "gpt-xl (1558M)": {"emb_dim": 1600, "n_layers": 48, "n_heads": 25},
   }
   
   device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
   batch_size = 2
   input_tensor = torch.randint(0, 50257, (batch_size, 1024)).to(device)
   
   for size in model_configs:
       BASE_CONFIG.update(model_configs[size])
   
       model = GPTModel(BASE_CONFIG).bfloat16()
       model.to(device)
   
       # MACS = multiply-accumulate operations
       # MACS are typically counted as two FLOPS (one multiply and one accumulate)
       macs, params = profile(model, inputs=(input_tensor,), verbose=False)
       flops = 2*macs
       print(f"{size:18}: {flops:.1e} FLOPS")
   
       del model
       torch.cuda.empty_cache()
   ```

## KV cache   

KV cache 通常用于 LLM 的推理加速，LLM 是 decoder-only 架构，我们推理的时候是一个词一个词生成，**前面的词无需和后面的词做 attention 的计算**，因此，可以将原先计算出的 K 和 V 缓存起来，只需要将生成的最新的这个词（query）和 key 做 attention 计算即可

这个是加入了 KV cache 之后的 MultiHeadAttention 的计算

```python
class MultiHeadAttention(nn.Module):
    def __init__(self, d_in, d_out, context_length, dropout, num_heads, qkv_bias=False):
        super().__init__()
        assert d_out % num_heads == 0, "d_out must be divisible by num_heads"

        self.d_out = d_out
        self.num_heads = num_heads
        self.head_dim = (
            d_out // num_heads
        )  # Reduce the projection dim to match desired output dim

        self.W_query = nn.Linear(d_in, d_out, bias=qkv_bias)
        self.W_key = nn.Linear(d_in, d_out, bias=qkv_bias)
        self.W_value = nn.Linear(d_in, d_out, bias=qkv_bias)
        self.out_proj = nn.Linear(d_out, d_out)  # Linear layer to combine head outputs
        self.dropout = nn.Dropout(dropout)
        self.register_buffer(
            "mask",
            torch.triu(torch.ones(context_length, context_length), diagonal=1),
            persistent=False,
        )
        # 缓存的KV
        self.register_buffer("cache_k", None, persistent=False)
        self.register_buffer("cache_v", None, persistent=False)
        self.ptr_current_pos = 0

    def reset_cache(self):
        self.cache_k, self.cache_v = None, None
        self.ptr_current_pos = 0

    def forward(self, x, use_cache=False):
        b, num_tokens, d_in = x.shape

        keys_new = self.W_key(x)  # Shape: (b, num_tokens, d_out)
        values_new = self.W_value(x)
        queries = self.W_query(x)

        # Unroll last dim: (b, num_tokens, d_out) -> (b, num_tokens, num_heads, head_dim)
        keys_new = keys_new.view(b, num_tokens, self.num_heads, self.head_dim)
        values_new = values_new.view(b, num_tokens, self.num_heads, self.head_dim)
        queries = queries.view(b, num_tokens, self.num_heads, self.head_dim)

        ############################
        # NEW
        if use_cache:
            if self.cache_v is None:
                self.cache_k, self.cache_v = keys_new, values_new
            else:
              # 将之前缓存的KV 和 当前这个词对应的KVconcat起来
                self.cache_k = torch.cat((self.cache_k, keys_new), dim=1)
                self.cache_v = torch.cat((self.cache_v, values_new), dim=1)
            keys, values = self.cache_k, self.cache_v
        else:
            keys = keys_new
            values = values_new
        ########################################

        # Transpose: (b, num_tokens, num_heads, head_dim) -> (b, num_heads, num_tokens, head_dim)
        keys = keys.transpose(1, 2)
        queries = queries.transpose(1, 2)
        values = values.transpose(1, 2)

       # 只有第一次的时候seq_len= 输入的长度，后续的queries 的 seq_len 都为1，计算复杂度为O（n）
        attn_scores = queries @ keys.transpose(2, 3)  # Dot product for each head

        # Original mask truncated to the number of tokens and converted to boolean
        # mask_bool = self.mask.bool()[:num_tokens, :num_tokens]

        ###################
        # NEW
        num_tokens_Q = queries.shape[-2]
        num_tokens_K = keys.shape[-2]

        if use_cache:
            mask_bool = self.mask.bool()[
                self.ptr_current_pos : self.ptr_current_pos + num_tokens_Q,
                :num_tokens_K,
            ]
            self.ptr_current_pos += num_tokens_Q
        else:
            mask_bool = self.mask.bool()[:num_tokens_Q, :num_tokens_K]
        ####################

        # Use the mask to fill attention scores
        attn_scores.masked_fill_(mask_bool, -torch.inf)

        attn_weights = torch.softmax(attn_scores / keys.shape[-1] ** 0.5, dim=-1)
        attn_weights = self.dropout(attn_weights)
				
        # Shape: (b, num_tokens, num_heads, head_dim)
        context_vec = (attn_weights @ values).transpose(1, 2)
			
        # Combine heads, where self.d_out = self.num_heads * self.head_dim
        context_vec = context_vec.contiguous().view(b, num_tokens, self.d_out)
        context_vec = self.out_proj(context_vec)  # optional projection

        return context_vec

```



```python
class GPTModel(nn.Module):
    def __init__(self, cfg):
        super().__init__()
        self.tok_emb = nn.Embedding(cfg["vocab_size"], cfg["emb_dim"])
        self.pos_emb = nn.Embedding(cfg["context_length"], cfg["emb_dim"])
        self.drop_emb = nn.Dropout(cfg["drop_rate"])

        self.trf_blocks = nn.Sequential(
            *[TransformerBlock(cfg) for _ in range(cfg["n_layers"])]
        )

        self.final_norm = LayerNorm(cfg["emb_dim"])
        self.out_head = nn.Linear(cfg["emb_dim"], cfg["vocab_size"], bias=False)
        self.cur_pos = 0

    def reset_kv_cache(self):
        for blk in self.trf_blocks:
            blk.att.reset_cache()
        self.cur_pos = 0

    def forward(self, in_idx, use_cache=False):
        batch_size, seq_len = in_idx.shape
        tok_embeds = self.tok_emb(in_idx)
        # pos_embeds = self.pos_emb(torch.arange(seq_len, device=in_idx.device))

        ############################
        # NEW
        if use_cache:
          # 如果是use_cache，因为输入的token只有最新生成的，因此这里需要改变一下这个token的位置，以便得到的是正确的位置编码
            pos_ids = torch.arange(
                self.cur_pos,
                self.cur_pos + seq_len,
                device=in_idx.device,
                dtype=torch.long,
            )
            self.cur_pos += seq_len
        else:
            pos_ids = torch.arange(seq_len, device=in_idx.device, dtype=torch.long)

        pos_embeds = self.pos_emb(pos_ids).unsqueeze(0)
        ############################
        x = tok_embeds + pos_embeds  # Shape [batch_size, num_tokens, emb_size]
        x = self.drop_emb(x)
        for blk in self.trf_blocks:
            x = blk(x, use_cache)
        x = self.final_norm(x)
        logits = self.out_head(x)
        return logits

```



推理的时候我们首先将用户的输入全部输入到模型，得到 logits，后续只会将最新生成的 token 输入到模型中，使用 KV cache 结合当前的输入得到完整的 K 和 V

```python
def generate_text_simple_cached(
    model, idx, max_new_tokens, context_size, use_cache=True
):
    model.eval()
    with torch.no_grad():
        if use_cache:
            model.reset_kv_cache()
            logits = model(idx[:, -context_size:],use_cache=True)
            for _ in range(max_new_tokens):
                next_idx = logits[:, -1, :].argmax(dim=-1, keepdim=True)
                idx = torch.cat([idx, next_idx], dim=1)
                logits = model(next_idx, use_cache=True)

        else:
            for _ in range(max_new_tokens):
                idx_cond = idx[:, -context_size:]
                logits = model(idx_cond, use_cache=False)
                next_idx = logits[:, -1, :].argmax(dim=-1, keepdim=True)
                idx = torch.cat([idx, next_idx], dim=1)

    return idx

```

KV cache 可以加速推理，使得注意力机制的时间复杂度从 O（n^2）降为 O(n),随着生成的 token 序列的长度增加，每个新的 token 都会加到 KV cache 中，随着生成的序列越来越长，KV cache 会变得越来越大，占据大量的显存，当然也可以截断 KV cache，例如当生成的序列长度超过 1000 时，不再将新的 token 加入 KV cache，这样防止了 KV cache 的不断增长，但是提高的代码的复杂性

## KV cache 的优化

上面 KV cache 的实现中，有 2 个问题：

1. 我们每次生成新的 token 的时候，KV cache 都会使用 torch.cat 函数 concat 起来，这会导致频繁的内存的分配 和 重新分配

2. KV cache 会随着序列的变长而变得很大

> 我们可以一开始就分配一个足够大的 tensor，而不是每次都 concat 张量，这样可以减少内存的分配次数，减少开销,如下：

```python
                self.cache_k = torch.zeros(
                    b, self.num_heads, self.window_size, self.head_dim, device=x.device
                )
                self.cache_v = torch.zeros_like(self.cache_k)
```

> 为了避免 KV cache 变得越来越大，我们可以通过滑动窗口截断，当 KV cache 的大小超过 window_size 时，我们将移除最左边的 token 对应的 KV

```python
                if self.ptr_current_pos + num_tokens > self.window_size:
                    overflow = self.ptr_current_pos + num_tokens - self.window_size
      # 移除最左边的token对应的KV
                    self.cache_k[:, :, :-overflow, :] = self.cache_k[ :, :, overflow:, :].clone()
                    self.cache_v[:, :, :-overflow, :] = self.cache_v[:, :, overflow:, :].clone()
                    self.ptr_current_pos -= overflow
```

完整的实现：

```python
class MultiHeadAttention(nn.Module):
    def __init__(
        self,
        d_in,
        d_out,
        context_length,
        dropout,
        num_heads,
        qkv_bias=False,
        max_seq_len=None,
        window_size=None,
    ):
        super().__init__()
        assert d_out % num_heads == 0, "d_out must be divisible by num_heads"

        self.d_out = d_out
        self.num_heads = num_heads
        self.head_dim = (
            d_out // num_heads
        )  # Reduce the projection dim to match desired output dim

        self.W_query = nn.Linear(d_in, d_out, bias=qkv_bias)
        self.W_key = nn.Linear(d_in, d_out, bias=qkv_bias)
        self.W_value = nn.Linear(d_in, d_out, bias=qkv_bias)
        self.out_proj = nn.Linear(d_out, d_out)  # Linear layer to combine head outputs
        self.dropout = nn.Dropout(dropout)
        self.register_buffer(
            "mask",
            torch.triu(torch.ones(context_length, context_length), diagonal=1),
            persistent=False,
        )
        self.max_seq_len = max_seq_len or window_size
        self.window_size = window_size or self.max_seq_len
        self.register_buffer("cache_k", None, persistent=False)
        self.register_buffer("cache_v", None, persistent=False)
        self.ptr_current_pos = 0

    def reset_cache(self):
        self.cache_k, self.cache_v = None, None
        self.ptr_current_pos = 0

    def forward(self, x, use_cache=False):
        b, num_tokens, d_in = x.shape

        keys_new = self.W_key(x)  
        values_new = self.W_value(x)
        queries = self.W_query(x) # Shape: (b, num_tokens, d_out)

        # Unroll last dim: (b, num_tokens, d_out) -> (b, num_tokens, num_heads, head_dim)
        keys_new = keys_new.view(b, num_tokens, self.num_heads, self.head_dim)
        values_new = values_new.view(b, num_tokens, self.num_heads, self.head_dim)
        queries = queries.view(b, num_tokens, self.num_heads, self.head_dim)

        # Transpose: (b, num_tokens, num_heads, head_dim) -> (b, num_heads, num_tokens, head_dim)
        keys_new = keys_new.transpose(1, 2)
        queries = queries.transpose(1, 2)
        values_new = values_new.transpose(1, 2)
        ############################
        # NEW
        if use_cache:
            if self.cache_v is None:
                # self.cache_k, self.cache_v = keys_new, values_new
                self.cache_k = torch.zeros(
                    b, self.num_heads, self.window_size, self.head_dim, device=x.device
                )
                self.cache_v = torch.zeros_like(self.cache_k)
                self.ptr_current_pos = 0
            else:
                if self.ptr_current_pos + num_tokens > self.window_size:
                    overflow = self.ptr_current_pos + num_tokens - self.window_size
                    self.cache_k[:, :, :-overflow, :] = self.cache_k[
                        :, :, overflow:, :
                    ].clone()
                    self.cache_v[:, :, :-overflow, :] = self.cache_v[
                        :, :, overflow:, :
                    ].clone()
                    self.ptr_current_pos -= overflow
                # self.cache_k = torch.cat((self.cache_k, keys_new), dim=1)
                # self.cache_v = torch.cat((self.cache_v, values_new), dim=1)

            # keys, values = self.cache_k, self.cache_v
            self.cache_k[
                :, :, self.ptr_current_pos : self.ptr_current_pos + num_tokens, :
            ] = keys_new
            self.cache_v[
                :, :, self.ptr_current_pos : self.ptr_current_pos + num_tokens, :
            ] = values_new
            keys = self.cache_k[:, :, : self.ptr_current_pos + num_tokens, :]
            values = self.cache_v[:, :, : self.ptr_current_pos + num_tokens, :]

        else:
            keys, values = keys_new, values_new
            self.ptr_current_pos = 0

        ########################################



        # Compute scaled dot-product attention (aka self-attention) with a causal mask
        attn_scores = queries @ keys.transpose(2, 3)  # Dot product for each head

        # Original mask truncated to the number of tokens and converted to boolean
        # mask_bool = self.mask.bool()[:num_tokens, :num_tokens]

        ###################
        # NEW
        num_tokens_Q = queries.shape[-2]
        num_tokens_K = keys.shape[-2]

        if use_cache:
            mask_bool = self.mask.bool()[
                self.ptr_current_pos : self.ptr_current_pos + num_tokens_Q,
                :num_tokens_K,
            ]
            self.ptr_current_pos += num_tokens_Q
        else:
            mask_bool = self.mask.bool()[:num_tokens_Q, :num_tokens_K]
        ####################

        # Use the mask to fill attention scores
        attn_scores.masked_fill_(mask_bool, -torch.inf)

        attn_weights = torch.softmax(attn_scores / keys.shape[-1] ** 0.5, dim=-1)
        attn_weights = self.dropout(attn_weights)

        # Shape: (b, num_tokens, num_heads, head_dim)
        context_vec = (attn_weights @ values).transpose(1, 2)

        # Combine heads, where self.d_out = self.num_heads * self.head_dim
        context_vec = context_vec.contiguous().view(b, num_tokens, self.d_out)
        context_vec = self.out_proj(context_vec)  # optional projection

        return context_vec
```








# 第五章 在无标签数据上进行预训练



## 大语言模型的文本生成策略（温度，top-k 采样,top-p 采样）



### 温度缩放

在 LLM 中，我们的输入通过 model 得到输出（logits），再通过 softmax 函数转换为概率，然后使用`argmax` 函数取概率最大的那个词作为预测的下一个词，这被称为`贪婪解码`,对于相同的输入总是能得到相同的输出

而我们可以通过使用采样函数让输出更加地多样,如下:

```python
# 采样1000次
next_token_logits = torch.tensor(
 [4.51, 0.89, -1.90, 6.75, 1.63, -1.62, -1.89, 6.28, 1.79]
def print_sampled_tokens(probas):
    torch.manual_seed(123)
    sample = [torch.multinomial(probas, num_samples=1).item() for i in range(1_000)]
    sampled_ids = torch.bincount(torch.tensor(sample))
    for i, freq in enumerate(sampled_ids):
        print(f"{freq} x {inverse_vocab[i]}")


print_sampled_tokens(probas)
#71 x closer
#2 x every
#0 x effort
#544 x forward
#2 x inches
#1 x moves
#0 x pizza
#376 x toward
#4 x you

```

而我们可以通过温度缩放来进一步控制概率的分布和采样的过程,即我们将模型的输出(logits)除以一个温度(temperature),然后再进行 softmax 计算概率分布.

因此当 temperature =1 时，表示不进行缩放，直接使用模型输出的 logits 进行 softmax 计算概率分布。

当 temperature < 1 时，表示对 logits 进行放大，放大后的 logits 差异更大，经过 softmax 计算后，概率分布会更加集中，更倾向于选择概率最高的词元，从而生成的文本更加确定和一致。

当 temperature > 1 时，表示对 logits 进行缩小，缩小后的 logits 差异更小，经过 softmax 计算后，概率分布会更加均匀

因此当 temperature  很小的时候，接近于 0 时，使得 multinomial 函数几乎 100%选择最可能的词元，接近于 argmax 函数的行为

当 temperature 很大的时候，会导致更均匀的分布，使得 multinomial 函数更随机地选择词元，接近于均匀分布的行为。这可以为生成的文本增加更多变化，但也更容易生成无意义的文本。

```python
def softmax_with_temperature(logits,temperature):
  scaled_logits = logits / temperature
  return torch.softmax(scaled_logits,dim=0)
```

<img src="https://img.leftover.cn/img-md/202508251821286.png" alt="Snipaste_2025-08-25_18-21-55" style="zoom:50%;" />



### top-k 采样

temperature  缩放可以用来增加输出结果的多样性，

较高的温度会使得下一个 token 的概率分布更均匀，从而产生更加多样化的输出，这种方法允许探索概率较低但可能更具创造性和趣味性的生成路径。同时也可能导致输出无意义的文本

较低的温度会使得输出更加确定，当 temperature 接近于 0 时，输出接近于贪婪解码的行为，这种方法倾向于选择概率最高的 token，从而生成更连贯和一致的文本，但可能缺乏多样性和创造性。

`Top-k 采样`可以改善文本生成结果。在 Top-k 采样中，可以将采样的词元限制在前 k 个最可能的词元上，并通过 mask 掉其他词元的概率来实现这一点。这样可以避免选择概率非常低的词元，从而提高生成文本的质量和连贯性。

```python
def generate(
    model, idx, max_new_tokens, context_size, temperature=0.0, top_k=None, eos_id=None
):
    for _ in range(max_new_tokens):
        idx_cond = idx[:, -context_size:]
        with torch.no_grad():
            logits = model(idx_cond)
				
        logits= logits[:,-1,:]
        # 只选择topk个词
        if top_k is not None:
            top_logits, _ = torch.topk(logits, top_k)
					# 其他词的logits设置为-inf，这样softmax之后对应的概率为0，之后采样的时候也不会采样到它
            logits = torch.where(
                logits < top_logits[:,-1], 
                input=torch.tensor(float("-inf")).to(logits.device),
                 other=logits
            )
        # temperature 来增加输出结果的多样性
        if temperature > 0.0:
            logits = logits / temperature
            probas = torch.softmax(logits, dim=-1)
            idx_next = torch.multinomial(probas, num_samples=1)
        else:
          # temperature ==0 则使用概率最大的作为下一个词
            idx_next = torch.argmax(logits)
        if idx_next == eos_id:
            break
        idx = torch.concat((idx, idx_next), dim=1)
    return idx
```





### top-p 采样

top-k 采样有一个缺点：k 值是固定的，有时候概率分布比较均匀，这时候可能需要一个比较大的 k 值才能包含所有合理的选项，有时候概率分布很"尖"（特别不均匀），可能前 2 个词就占了 99%的概率，这时候大的 k 值反而会纳入不必要的词



而`top-p采样`则不关心词的数量，而关心概率的总量，从概率最高的词开始累加，直到这些词的累积概率总和超过一个阈值 P，然后就从这些词中进行采样。

例如 p =0.7，选择的词如下图所示：

<img src="https://img.leftover.cn/img-md/202508251833458.png" alt="Snipaste_2025-08-25_18-33-47" style="zoom:50%;" />

> 可以很容易看出，当 p=0 时 就等于 top1 采样，而当 p=1 时，就等于从所有的词中进行采样





# 第六章 针对分类的微调



## 分类微调

对 LLM 进行所谓的分类微调，其实和微调 bert 差不多，需要注意一些地方，

1. 和 bert 微调一样，我们同样需要修改最后的输出头

2. bert 使用的是 CLS 池化，而如果微调的是 LLM 的话，我们最后面向量是取的最后一个 sequence 对应的向量，因此 LLM 训练的时候，前面的词是看不到后面的词的，只有最后一个词才能看到所有的词，**因此我们取的是最后一个词对应的向量**

3. 由于模型已经经过了预训练，因此不需要微调所有的模型层。在基于神经网络的语言模型中，**较低层通常捕捉基本的语言结构和语义，适用于广泛的任务和数据集，最后几层（靠近输出的层）更侧重于捕捉细微的语言模式和特定任务的特征**。

   因此，只微调最后几层通常就足以将模型适应到新任务。同时，仅微调少量层在计算上也更加高效

4. 将数据 padding 到 max_length 来避免同一个 batch 内的 seq_len 长度不一致



在书中有这样的一道练习题

<img src="https://img.leftover.cn/img-md/202508252241803.png" alt="Snipaste_2025-08-25_22-40-47" style="zoom:50%;" />

我直接改变 max_length 为 1024,模型性能下降很多

<img src="https://img.leftover.cn/img-md/202508252241534.png" alt="Snipaste_2025-08-25_22-41-47" style="zoom: 67%;" />

我发现模型定义的时候 tok_emb 没有设置 padding_idx，因此当我们填充大量的 padding token 的时候，会很大程度影响模型的效果

由于教学的时候是没有针对 tok_emb 层进行微调的，因此我们直接在设置完需要训练的参数之后,手动将 padding 对应的向量设置为 0

```python
model.tok_emb.weight[50256] = 0
model.tok_emb.weight[50256]
```

然后再改变 max_length 为 1024，此时模型的性能并没有下降(如下图所示), 甚至比 max_length=120 的时候更好，**可见改变 max_length 的长度并不会影响模型的性能（只要模型设置正确），但是会极大程度影响训练的速度**

![Snipaste_2025-08-25_22-45-57](https://img.leftover.cn/img-md/202508252245644.png)



练习题 6.2

<img src="https://img.leftover.cn/img-md/202508261455975.png" alt="Snipaste_2025-08-26_14-54-59" style="zoom:50%;" />

设置了 model.tok_emb 的 padding_idx 为 50256，之和再尝试微调了整个模型，其最终的效果和微调最后一个 transformer 块差不多，可能是因为这个数据集比较小，但是微调整个模型的收敛速度会比只微调最后一个 transformer 块要慢。得多训练几个 epoch



# 第七章 通过微调遵循人类指令（指令微调 SFT）

## 数据集的构建

SFT 数据集格式通常有 Alpaca 格式 和 sharegpt 格式（支持多轮对话）

Alpaca 格式:

```json
[
  {
    "instruction": "human instruction (required)",
    "input": "human input (optional)",
    "output": "model response (required)",
    "system": "system prompt (optional)",
    "history": [
      ["human instruction in the first round (optional)", "model response in the first round (optional)"],
      ["human instruction in the second round (optional)", "model response in the second round (optional)"]
    ]
  }
]
```

sharegpt 格式

```json
[
  {
    "conversations": [
      {
        "from": "human",
        "value": "human instruction"
      },
      {
        "from": "function_call",
        "value": "tool arguments"
      },
      {
        "from": "observation",
        "value": "tool result"
      },
      {
        "from": "gpt",
        "value": "model response"
      }
    ],
    "system": "system prompt (optional)",
    "tools": "tool description (optional)"
  }
]
```



有了数据集之后，我们通常需要将其`instruction`,`input`,`output`拼接起来

```python
def format_input(entry):
    instruction_text = (
        f"Below is an instruction that describes a task. "
        f"Write a response that appropriately completes the request."
        f"\n\n### Instruction:\n{entry['instruction']}"
    )
    input_text = f"\n\n### Input:\n{entry["input"]}" if entry["input"] else ""
    return instruction_text + input_text
  
instruction_plus_input = format_input(entry)
            response_text = f"\n\n### Response:\n{entry['output']}"
full_text = instruction_plus_input + response_text  
```

再使用 tokenizer 转为 ids

之后构建 label，label 的构建和预训练差不多，input 向右移动一个词，最后加上一个`endoftext`

最后我们需要将 input 和 label 填充 到该 batch 的最大长度

对于 input，我们使用`endoftext`填充即可

对于 label，我们使用-100 进行填充，这样在算 loss 的时候不会计算这部分的 loss

> 在实践中，我们通常还会 mask 掉与指令相关 对应 label 的 token，只计算模型回复部分的 loss，因此，模型的训练更专注于生成准确的回复，而非记住指令，这样可以帮助减少过拟合，（*不过目前对于在 SFT 微调过程中是否 mask 指令部分的 loss 还没有定论*）,如下图所示

<img src="https://img.leftover.cn/img-md/202508271507285.png" alt="Snipaste_2025-08-27_15-07-56" style="zoom:50%;" />

```python
def custom_collate_fn(
    batch, pad_token_id=50256, ignore_index=-100, allowed_max_length=None, device="cpu"
):
    batch_max_length = max(len(item) + 1 for item in batch)
    inputs_lst = []
    targets_lst = []
    for item in batch:
        # 每个输入都以<endoftext>结尾
        new_item = item.copy() + [pad_token_id]
        # 填充到batch中的最大长度
        padded = new_item + [pad_token_id] * (batch_max_length - len(new_item))
        inputs = torch.tensor(padded[:-1])
        targets = torch.tensor(padded[1:])
        mask = targets == pad_token_id
        indices = mask.nonzero().squeeze()
        if indices.numel() >1:
            targets[indices[1:]] = ignore_index
        if allowed_max_length is not None:
            inputs = inputs[:allowed_max_length]
            targets = targets[:allowed_max_length]
        inputs_lst.append(inputs)
        targets_lst.append(targets)
    inputs_tensor = torch.stack(inputs_lst).to(device)
    targets_tensor = torch.stack(targets_lst).to(device)
    return inputs_tensor, targets_tensor
```

构建完了数据集之后，就可以开始训练了，这部分和预训练差不多，先把模型加载进来，并加载模型对应的参数，然后就是一些训练的代码，之后再使用微调之后的模型在测试集上生成 response

## 评估微调之后的 LLM

我们通常会采用多种方法对 SFT 之后的模型进行评估

例如:

1. 使用一些 benchmark 测试集来进行评估，例如 MMLU
2. 使用其他更强大的模型（例如 GPT4）进行打分
3. 和其他 LLM 进行人类偏好的比较
4. 人类评估



让另一个强大的 LLM 对对照标准答案对模型的回复进行打分

```python
import urllib.request


def query_model(prompt, model="llama3.1", url="http://localhost:11434/api/chat"):
    data = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "options": {"seed": 123, "temperature": 0, "num_ctx": 2048},
    }
    payload = json.dumps(data).encode("utf-8")
    request = urllib.request.Request(url, data=payload, method="POST")
    request.add_header("Content-Type", "application/json")
    response_data = ""
    with urllib.request.urlopen(request) as response:
        while True:
            line = response.readline().decode("utf-8")
            if not line:
                break
            response_json = json.loads(line)
            response_data += response_json["message"]["content"]
    return response_data

def generate_model_scores(json_data, json_key, model="llama3.1"):
    scores = []
    for entry in tqdm(json_data, desc="Scoring entries"):
        prompt = (
            f"Given the input `{format_input(entry)}` "
            f"and correct output `{entry['output']}`, "
            f"score the model response `{entry[json_key]}`"
            f" on a scale from 0 to 100, where 100 is the best score. "
            f"Respond with the integer number only."
        )
        score = query_model(prompt, model)
        try:
            scores.append(int(score))
        except ValueError:
            print(f"Could not convert score: {score}")
            continue
    return scores
```

# lora from scratch

如下图所示，我们将预训练的权重称为 W，而微调之后的权重称为 W'，因此更新的权重为ΔW=W'-W

假设我们的输入为 x，则

$$
x(W+\Delta W) = xW + x\Delta W
$$

因此我们我们只要知道原本的权重 W，和更新的权重ΔW 就可以计算出微调之后的结果

而$\Delta W$是一个低秩矩阵，因此我们可以使用奇异值分解的方法（SVD）将其分解为 A 和 B 两个矩阵的乘积，并且$\Delta W  \approx  AB$，这样在大大减少了微调时的参数量的同时有保证了微调的效果

由此得到：

$$
x(W+\Delta W) = xW + xAB
$$

<img src="https://img.leftover.cn/img-md/202509011909647.webp" width="500px">

下面的代码中我们将所有的线性层嵌入 lora 层，即微调所有的线性层，当然也可以只微调部分的线性层，将预训练的参数冻结住，只训练 lora adapter 的参数，即 A，B 矩阵，这样大大低减少了 finetune 的参数量

```python
import math
class LoraLayer(nn.Module):
    # r 越大，则AB就越接近于\Delta W，但是A，Ｂ矩阵的参数量也会增加
    def __init__(self, in_dim, out_dim, rank, alpha):
        super(LoraLayer, self).__init__()
        self.A = torch.nn.Parameter(torch.empty(in_dim, rank))
        torch.nn.init.kaiming_uniform_(self.A, a=math.sqrt(5))
        self.B = torch.nn.Parameter(torch.zeros(rank, out_dim))
        self.alpha = alpha

    def forward(self, x):
        x = self.alpha * (x @ self.A @ self.B)
        return x
```



```python
class LinearWithLoRA(torch.nn.Module):
    def __init__(self, linear, rank, alpha):
        super(LinearWithLoRA, self).__init__()
        self.linear = linear
        self.lora = LoraLayer(linear.in_features, linear.out_features, rank, alpha)
        
    def forward(self, x):
        return self.linear(x) + self.lora(x)
```

```python
# 替换所有的线性层
def replace_linear_with_lora(model, rank, alpha):
  for name ,moudle in model.named_children():
    if isinstance(moudle, torch.nn.Linear):
      setattr(model, name, LinearWithLoRA(moudle, rank, alpha))
    else:
      replace_linear_with_lora(moudle, rank, alpha)
```

```python
total_params = sum(p.numel() for p in model.parameters())
print(f"Total parameters before LoRA: {total_params:,}")

for params in model.parameters():
  params.requires_grad = False


total = sum(p.numel() for p in model.parameters() if p.requires_grad)
print(f"Trainable parameters before LoRA: {total:,}")

total_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
print(f"Total trainable LoRA parameters: {total_params:,}")
```



# DPO 偏好微调



KL 散度：即 P 分布相对于 Q 分布的相似程度，KL 散度的值始终大于 0，**P 和 Q 的分布越相似，KL 散度就越接近于 0**
$$
KL(P||Q)  = \sum_{x\in X} P (x) log(\frac{P(x)}{Q(x)})
$$

$$
KL(P||Q) != KL(Q||P)
$$



下面是总的对 DPO 的一个实现：

1. 数据集是这样

   <img src="https://img.leftover.cn/img-md/202509031652621.png" alt="Snipaste_2025-09-03_16-51-59" style="zoom:50%;" />

2. 我们先构建`chosen` 和 `rejected`,即 `instruction + input + chosen / rejected`，将其转为 ids，如下：


```python
import torch
from torch.utils.data import Dataset


class PreferenceDataset(Dataset):
    def __init__(self, data, tokenizer):
        self.data = data

        # Pre-tokenize texts
        self.encoded_texts = []
        for entry in data:
            prompt = format_input(entry)
            rejected_response = entry["rejected"]
            chosen_response = entry["chosen"]

            prompt_tokens = tokenizer.encode(prompt)
            chosen_full_text = f"{prompt}\n\n### Response:\n{chosen_response}"
            rejected_full_text = f"{prompt}\n\n### Response:\n{rejected_response}"
            chosen_full_tokens = tokenizer.encode(chosen_full_text)
            rejected_full_tokens = tokenizer.encode(rejected_full_text)

            self.encoded_texts.append({
                # input
                "prompt": prompt_tokens,
                # input + polite response
                "chosen": chosen_full_tokens,
                # input + impolite response
                "rejected": rejected_full_tokens,
            })

    def __getitem__(self, index):
        return self.encoded_texts[index]

    def __len__(self):
        return len(self.data)
```

3. 之后我们再对每个 batch 的数据进行 padding，然后 mask 掉 padding 的词，同时也可以 mask 掉 prompt 部分（即 prompt 部分不计算 loss）

```python
def custom_collate_fn(
    batch,
    pad_token_id=50256,
    allowed_max_length=None,
    mask_prompt_tokens=True,
    device="cpu"
):
    # Initialize lists to hold batch data
    batch_data = {
        "prompt": [],
        "chosen": [],
        "rejected": [],
        "rejected_mask": [],
        "chosen_mask": []

    }

    # Determine the longest sequence to set a common padding length
    max_length_common = 0
    if batch:
        for key in ["chosen", "rejected"]:
            current_max = max(len(item[key])+1 for item in batch)
            max_length_common = max(max_length_common, current_max)

    # Process each item in the batch
    for item in batch:
        prompt = torch.tensor(item["prompt"])
        batch_data["prompt"].append(prompt)

        for key in ["chosen", "rejected"]:
            # Adjust padding according to the common maximum length
            sequence = item[key]
            # padding 以保证每个batch的长度一致
            padded = sequence + [pad_token_id] * (max_length_common - len(sequence))
            mask = torch.ones(len(padded)).bool()

            # Set mask for all padding tokens to False
            mask[len(sequence):] = False

            # 将输入的指令部分mask掉,这部分不计算loss
            # Set mask for all input tokens to False
            # +2 sets the 2 newline ("\n") tokens before "### Response" to False
            if mask_prompt_tokens:
                mask[:prompt.shape[0]+2] = False

            batch_data[key].append(torch.tensor(padded))
            batch_data[f"{key}_mask"].append(mask)

    # Final processing
    for key in ["chosen", "rejected", "chosen_mask", "rejected_mask"]:
        # Stack all sequences into a tensor for the given key
        tensor_stack = torch.stack(batch_data[key])

        # Optionally truncate to maximum sequence length
        if allowed_max_length is not None:
            tensor_stack = tensor_stack[:, :allowed_max_length]

        # Move to the specified device
        batch_data[key] = tensor_stack.to(device)

    return batch_data
```

计算 DPO loss

4. 这里的 label 和输入其实和`预训练/SFT`的时候差不多，只是 loss 的计算方法不一样，input 就是整个的输入的训练，包括(`instruction + input + response`) ,然后 label 就是输入向左 shift 一个词，然后模型根据 input 得到输出 logits

5. 之后使用 logits 和 label 根据 dpo 的公式来计算 loss，代码如下：

   - $\pi_{\theta }$ 是 DPO 微调的模型，$\pi_{ref}$是原始的模型，一般是 SFT 之后的模型
   - $y_w$ 是人类偏好的 response,$y_l$ 则是人们不喜欢的答案
   - x 则是模型的输入
   - $\sigma $是 sigmoid 函数

   <img src="https://img.leftover.cn/img-md/202509031658161.png" alt="Snipaste_2025-09-03_16-58-16" style="zoom: 67%;" />

```python
def compute_logprobs(logits, labels, selection_mask=None):
    """
    Compute log probabilities.

    Args:
      logits: Tensor of shape (batch_size, num_tokens, vocab_size)
      labels: Tensor of shape (batch_size, num_tokens)
      selection_mask: Tensor for shape (batch_size, num_tokens)

    Returns:
      mean_log_prob: Mean log probability excluding padding tokens.
    """
    # labels 是input向右偏移一个词
    labels = labels[:, 1:].clone()
		# 对应的输出也要shift一个词
    logits = logits[:, :-1, :]

    log_probs = F.log_softmax(logits, dim=-1)  # b,num_tokens-1,vocab_size
    # 选出预测的概率中，label所对应的那个词的概率
    selected_log_prob = torch.gather(log_probs, dim=-1, index=labels.unsqueeze(-1)).squeeze(-1) # b,num_tokens-1
		# 如果有mask，则不计算mask对应位置的loss
    if selection_mask is not None:
        # 被mask掉的不会计算loss
        mask = selection_mask[:,1:].clone()
        selected_log_prob = selected_log_prob * mask
        # (batch_size)
        avg_log_prob = selected_log_prob.sum(-1) / mask.sum(-1)
        return avg_log_prob
    else:
        return selected_log_prob.mean(-1)    
```

对上面的函数的一个解释，上面的函数其实可以使用`cross_entropy`来实现， = `-cross_entropy`

```python
# Sample data
logits = torch.tensor(
    [[2.0, 1.0, 0.1],
     [0.5, 2.5, 0.3]])  # Shape: (2, 3)
targets = torch.tensor([0, 2])  # Shape: (2,)


# Manual loss using torch.gather
log_softmax_logits = F.log_softmax(logits, dim=1)  # Shape: (2, 3)
print(log_softmax_logits)
selected_log_probs = torch.gather(
    input=log_softmax_logits,
    dim=1,
    index=targets.unsqueeze(1), # Shape 2, 1
).squeeze(1)  # Shape: (2,)

print(selected_log_probs)

manual_loss = -selected_log_probs.mean()  # Averaging over the batch


# PyTorch loss
cross_entropy_loss = F.cross_entropy(logits, targets)

print(manual_loss, cross_entropy_loss) #一样
```

 计算 dpo loss

```python
def compute_dpo_loss(
      model_chosen_logprobs,
      model_rejected_logprobs,
      reference_chosen_logprobs,
      reference_rejected_logprobs,
      beta=0.1,
    ):
  model_logratios = model_chosen_logprobs  - model_rejected_logprobs
  reference_logratios  =  reference_chosen_logprobs - reference_rejected_logprobs
  logits = model_logratios - reference_logratios
  losses = -F .logsigmoid(beta*logits)

  chosen_reward = (model_chosen_logprobs - reference_chosen_logprobs).detach()
  rejected_rewards = (model_rejected_logprobs - reference_rejected_logprobs).detach()

  return losses.mean(),chosen_reward.mean(),rejected_rewards.mean()
```

计算每个 batch 的 dpo loss

```python
def compute_dpo_loss_batch(batch, policy_model, reference_model, beta):
    policy_chosen_log_probas = compute_logprobs(
        logits=policy_model(batch["chosen"]), 
        labels=batch["chosen"],
        selection_mask=batch["chosen_mask"],
    )
    policy_rejected_log_probas = compute_logprobs(
        logits=policy_model(batch["rejected"]),
        labels=batch["rejected"],
        selection_mask=batch["rejected_mask"],
    )
    # Reference model 不需要更新参数，因此不需要计算梯度
    with torch.no_grad():

        ref_chosen_log_probas = compute_logprobs(
            logits=reference_model(batch["chosen"]),
            labels=batch["chosen"],
            selection_mask=batch["chosen_mask"]
        )
        ref_rejected_log_probas = compute_logprobs(
            logits=reference_model(batch["rejected"]),
            labels=batch["rejected"],
            selection_mask=batch["rejected_mask"]
        )
    loss, chosen_rewards, rejected_rewards = compute_dpo_loss(
        model_chosen_logprobs=policy_chosen_log_probas,
        model_rejected_logprobs=policy_rejected_log_probas,
        reference_chosen_logprobs=ref_chosen_log_probas,
        reference_rejected_logprobs=ref_rejected_log_probas,
        beta=beta
    )
    return loss, chosen_rewards, rejected_rewards      
```





# 数据合成的方法

## Magpie 数据合成方法

论文地址:[Magpie: Alignment Data Synthesis from Scratch by Prompting Aligned LLMs with Nothing](https://arxiv.org/abs/2406.08464)

<img src="https://img.leftover.cn/img-md/202508281504836.png" alt="Snipaste_2025-08-28_15-04-21" style="zoom: 50%;" />

我们深入研究一下 LLM 的生成的原理，LLM 通常都是经过自回归的训练来预测下一个词，通常 LLM 的输入包括 3 个部分：预查询模板，查询，后查询模板，如下所示：`<|start_header_id|>user<|end_header_id|>`是预查询模板，`请用要点解释Transformer中的自注意力。`是查询内容，

`<|eot_id|><|start_header_id|>assistant<|end_header_id|>`是后查询模板

系统提示词是可选的，`我们也可以通过系统提示词来指导模型生成领域内的数据`

```python
<|begin_of_text|><|start_header_id|>system<|end_header_id|>
You are a helpful assistant.
<|eot_id|><|start_header_id|>user<|end_header_id|>
请用要点解释Transformer中的自注意力。
<|eot_id|><|start_header_id|>assistant<|end_header_id|>
```

因为这些 LLM 已经经过了指令对齐的训练，但是不幸的是：大部分的 LLM 都只开源了权重，而没有开源指令对其的数据集。而他们指令对齐的数据集也是这种问答对的形式，

因此，我们可以通过只给出预查询模板，让模型自回归地生成用户的查询内容，然后我们再使用生成的查询让 LLM 生成对应的回复，这样我们就可以通过很低的成本来构建出 SFT 的数据集，之后只要再对构建出的数据集进行筛选就行了

> 需要注意的是：我们在生成用户回答的时候可以将温度设置的高一些，top_p 设置的高一些，这样可以让模型的回答更加地丰富，以便让我们生成更加多样的数据

```python
import urllib.request
import json
from tqdm import tqdm

def query_model(prompt, model="llama3.1", url="http://localhost:11434/api/chat", role="user"):
    # Create the data payload as a dictionary
    data = {
        "model": model,
        "seed": 123,        # for deterministic responses
        "temperature": 1.,   # for deterministic responses
        "top_p": 1,         
        "messages": [
            {"role": role, "content": prompt}
        ]
    }

    # Convert the dictionary to a JSON formatted string and encode it to bytes
    payload = json.dumps(data).encode("utf-8")

    # Create a request object, setting the method to POST and adding necessary headers
    request = urllib.request.Request(url, data=payload, method="POST")
    request.add_header("Content-Type", "application/json")

    # Send the request and capture the response
    response_data = ""
    with urllib.request.urlopen(request) as response:
        # Read and decode the response
        while True:
            line = response.readline().decode("utf-8")
            if not line:
                break
            response_json = json.loads(line)
            response_data += response_json["message"]["content"]

    return response_data
 
def extract_instruction(text):
    for content in text.split("\n"):
        if content:
            return content.strip()


dataset_size = 5
dataset = []
# 预查询模板
query = "<|begin_of_text|><|start_header_id|>user<|end_header_id|>\n\n"

for i in tqdm(range(dataset_size)):
		# 生成用户查询
    result = query_model(query, role="assistant")
    instruction = extract_instruction(result)
    # 根据生成的查询生成回答
    response = query_model(instruction, role="user")
    # 构建一个问答对
    entry = {
        "instruction": instruction,
        "output": response
    }
    dataset.append(entry)
```



# 数据清洗的方法（提升数据集质量）

## Reflection-Tuning

论文地址: [Reflection-Tuning: Data Recycling Improves LLM Instruction-Tuning](https://arxiv.org/abs/2310.11716)

该方法使用一个强大的 LLM 进行反思，从而生成更好的数据

1. #### Reflection on Instruction

   **对于没有 input 的数据样本，即 input=""，** 先让 LLM 反思这个 Instruction 为什么不好，再让它基于它的反思，提出一个更好的 Instruction，最后根据提出的更好的 Instruction 生成一个更好的 Response

   最后我们使用正则表达式从模型的回答中提取出生成的 Instruction 和 Response

   ```python
   def instr_prompt_no_input(ins, outp):
   
       sys_prompt = "You are a helpful, precise but picky assistant for checking the quality of a given instruction."
       prompt_template = "[Instruction]\n{ins}\n\n[The Start of Answer]\n{outp}\n\n[The End of Answer]\n\n[System]\n{criteria}\n\n"
       criteria = "We would like you to answer several questions related to the quality of a given instruction. \n" + \
                   "1. Why this instruction is not good? First analyse the instruction based on Complexity of the Topic, Level of Detail Required, Knowledge Required, Ambiguity of the Instruction and Logical Reasoning or Problem-Solving Involved. \n" + \
                   "Then analyse why this answer is not good for the given instruction? Analyse based on the Helpfulness, Relevance, Accuracy and Level of Details. \n" + \
                   "Finally analyse why this bad instruction lead to a bad answer. " +\
                   "2. Based on the reason you provided, generate a new and complete instruction which is complex and difficult to answer directly. " + \
                   "Make sure the new instruction is relevent but independent to the original instruction, which can be answered without knowing the original instruction, put the new instruction in the format of [New Instruction] your instruction [End]" +\
                   "3. Answer the newly generated instruction as detailed as possible, in the format of [New Answer] your answer [End] \n"
       prompt = prompt_template.format(
           ins=ins, outp=outp, criteria=criteria
       )
       return sys_prompt, prompt
   ```



2. #### Reflection on Response

在第一步得到了一个更好的 Instruction 和 Response，但是此时的 Response 并非是最优的，因此，使用 LLM 对 基于第一步得到的 Response 进行反思并生成一个更好的 response

```python
# input 为空的情况下对应的prompt
def res_gen_prompt_no_input(ins, outp):

    sys_prompt = "You are a helpful, precise but picky assistant for checking the quality of the answer to a given instruction."
    prompt_template = "[Instruction]\n{ins}\n\n[The Start of Answer]\n{outp}\n\n[The End of Answer]\n\n[System]\n{criteria}\n\n"
    criteria = "We would like you to answer several questions related to the quality of the answer to the given instruction. \n" + \
                "1. Why this answer is not good for the given instruction? Analyse based on the Helpfulness, Relevance, Accuracy and Level of Details. \n" + \
                "2. Based on the reason you provided, generate a better answer, new and complete, as detailed as possible, in the format of [Better Answer] your answer [End] \n" 
    prompt = prompt_template.format(
        ins=ins, outp=outp, criteria=criteria
    )
    return sys_prompt, prompt

# input不为空的情况下对应的prompt
def res_gen_prompt_input(ins, inp, outp):

    sys_prompt = "You are a helpful and precise assistant for checking the quality of the answer to a given instruction and its input."
    prompt_template = "[Instruction]\n{ins}\n\n[The Start of Input]\n{inp}\n\n[The End of Input]\n\n[The Start of Answer]\n{outp}\n\n[The End of Answer]\n\n[System]\n{criteria}\n\n"
    criteria = "We would like you to answer several questions related to the quality of the answer to the given instruction and corresponding input. \n" + \
                "1. Why this answer is not good for the given instruction and corresponding input? Analyse based on the Helpfulness, Relevance, Accuracy and Level of Details. \n" + \
                "2. Based on the reason you provided, generate a better answer, new and complete, as detailed as possible, in the format of [Better Answer] your answer [End] \n" 
    prompt = prompt_template.format(
        ins=ins, inp=inp, outp=outp, criteria=criteria
    )
    return sys_prompt, prompt
```



```python
def reflect_responses(json_data, client):
    new_json_data = [] 
    
    for entry in tqdm(json_data):
        # 对于没有input的样本，我们impove instruction,让LLM生成一个更好的instruction和对应的answer
        if not entry["input"]:
            system_prompt, prompt = res_gen_prompt_no_input(ins=entry["instruction"], outp=entry["output"])
            output = run_qwen(prompt=prompt, client=client, system_prompt=system_prompt)
            new_response = extract_response(output)

            if not len(new_response):
                new_response = entry["output"]
                      
            new_entry = {"instruction": entry["instruction"], "input": "", "output": new_response[0]}
            new_json_data.append(new_entry)

        else:
            # 对于有input的样本，我们impove response,让LLM生成一个更好的response
            system_prompt, prompt = res_gen_prompt_input(ins=entry["instruction"], inp=entry["input"], outp=entry["output"])
            output = run_qwen(prompt=prompt, client=client, system_prompt=system_prompt)
            new_response = extract_response(output)

            if not len(new_response):
                new_response = entry["output"]

            new_entry = {"instruction": entry["instruction"], "input": entry["input"], "output": new_response[0]}
            new_json_data.append(new_entry)

    return new_json_data
```

```python
# 使用正则表达式提取better response
def extract_response(text):
    if text.count('[Better Answer]') >= 2:
        pattern = r'\[(Better Answer)\](.*?)(\[End\]|\[Better Answer\]|$)'
        segments = re.findall(pattern, text, re.DOTALL)
    else:
        # pattern = r'\[(Better Answer)\](.*?)\[End\]'
        pattern = r'\[(Better Answer)\](.*?)(\[End\]|End|$)'
        segments = re.findall(pattern, text, re.DOTALL)
    return [segment[1].strip() for segment in segments]
response = extract_response(output)[0]
print(response)
```

