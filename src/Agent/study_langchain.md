## message & template
### message 和 template 的区别
在 langchain 中，有 message 以及 template，这里来对比一下二者的区别

`message` 通常用来表示对话的内容，比如

```python
messages = [
    SystemMessage(content="You are a helpful translator."),
    HumanMessage(content="Translate 'Hello, world!' to French"),
]

```

而 template 通常会被用来构建可以复用的模板，例如:

> 这里我们需要构建一个翻译的助手，可能我们会将文本翻译为不同的语言，因此我们可以构建一个类似于下面的一个模板，
>

```python
    template = ChatPromptTemplate.from_messages(
        [
            ("system", "You are a helpful translator."),
            ("human", "Translate '{text}' to {language}"),
        ]
    )
```

我们在使用的时候只需要传入需要翻译的文本以及目标语言即可，即可实现这个提示词的复用

```python
    template_chain = template | llm
    template_response = template_chain.invoke(
        {"text": "hello world", "language": "French"}
    )
    print("Response:", template_response.content)
```



### ChatPromptTemplate VS PromptTemplate
`ChatPromptTemplate` 通常用于多轮对话，而`PromptTemplate` 则用于单个的 prompt

```python
def simple_template():
    chat_template = ChatPromptTemplate.from_messages([
        ("system", "You are a helpful {role}."),
        ("human", "{question}"),
    ])

    chat_chain = chat_template | llm
    result1 = chat_chain.invoke({"role": "math tutor", "question": "What is 2+2?"})
    print("ChatPromptTemplate:", result1.content)

    simple_template = PromptTemplate.from_template(
        "Answer this {topic} question briefly: {question}"
    )
    simple_chain = simple_template | llm
    result2 = simple_chain.invoke(
        {"topic": "science", "question": "Why is the sky blue?"}
    )
    print("PromptTemplate:", result2.content)
```

### 构造 few-shot messages
所谓的 few-shot，即我们可以给 AI 一些示例，让他进行参考，以便更好地完成任务。因此我们只需要基于已有的示例，将问题作为 human message，将期望的结果作为 AI message 即可

```python
def create_few_shot_conversation(
    role: str, examples: List[dict], new_question: str
) -> List[BaseMessage]:
    messages: List[BaseMessage] = [SystemMessage(content=f"you are a {role}")]
    for example in examples:
        messages.append(HumanMessage(content=example["question"]))
        messages.append(AIMessage(content=example["answer"]))

    messages.append(HumanMessage(content=new_question))
    return messages


emoji_messages = create_few_shot_conversation(
    "emoji translator",
    [
        {"question": "happy", "answer": "😊"},
        {"question": "sad", "answer": "😢"},
        {"question": "excited", "answer": "🎉"},
    ],
    "surprised",
)
for msg in emoji_messages:
    msg.pretty_print()
    
print(f"few messages length :{len(emoji_messages)}")
response = llm.invoke(emoji_messages)
print(f"AI response:{response.content}") #surprised 😮
```

### 使用 FewShotChatMessagePromptTemplate
```python
def few_shot_chat_prompt_template():
    # examples
    examples = [
        {"input": "happy", "output": "😊"},
        {"input": "sad", "output": "😢"},
        {"input": "excited", "output": "🎉"},
    ]

    example_template = ChatPromptTemplate.from_messages(
        [("human", "{input}"), ("ai", "{output}")]
    )
    few_shot_template = FewShotChatMessagePromptTemplate(
        examples=examples, example_prompt=example_template
    )
    final_tempalte = ChatPromptTemplate.from_messages(
        [
            ("system", "You are an emoji translator. Convert words to emojis."),
            few_shot_template,
            ("human", "{input}"),
        ]
    )
    chain = final_tempalte | llm
    # Test with new inputs
    for word in ["angry", "love", "confused"]:
        result = chain.invoke({"input": word})
        print(f"{word} → {result.content}")
```



## 结构化输出
这部分可以看一下 langchain 的[文档](https://docs.langchain.com/oss/python/langchain/structured-output)，langchain 目前是有两种结构化输出的方式，一种是使用模型提供商原生支持的结构化输出的方式（像 openai，google， [Anthropic](https://docs.langchain.com/oss/python/integrations/providers/anthropic) 等都有原生支持结构化输出，我们只需要将 Pydantic 对象传入即可）



### ProviderStrategy 的方式
```python
def structured_output():
    class Person(BaseModel):
        """Schema for person information."""

        name: str = Field(description="The person's full name")
        age: int = Field(description="The person's age in years")
        occupation: str = Field(description="The person's job or profession")
        
    text = "John Smith is a 35-year-old software engineer from Seattle."
    agent = create_agent(llm, response_format=ProviderStrategy(Person))
    result = agent.invoke(
        {"messages": [HumanMessage(content=f"Extract person information from: {text}")]}
    )
    for msg in result["messages"]:
        msg.pretty_print()

    print(f"Name: {result['structured_response'].name}")
    print(f"Age: {result['structured_response'].age}")
    print(f"Occupation: {result['structured_response'].occupation}")
```

```plain
================================ Human Message =================================

Extract person information from: John Smith is a 35-year-old software engineer from Seattle.
================================== Ai Message ==================================

{"name":"John Smith","occupation":"software engineer","age":35}

Name: John Smith
Age: 35
Occupation: software engineer
```

> 使用模型提供商原生支持的方式，可以看到模型直接得到的结构化的输出
>



### ToolStrategy 的方式
```python
def structured_output():
    class Person(BaseModel):
        """Schema for person information."""

        name: str = Field(description="The person's full name")
        age: int = Field(description="The person's age in years")
        occupation: str = Field(description="The person's job or profession")

    text = "John Smith is a 35-year-old software engineer from Seattle."
    agent = create_agent(llm, response_format=ToolStrategy(Person))
    result = agent.invoke(
        {"messages": [HumanMessage(content=f"Extract person information from: {text}")]}
    )
    for msg in result["messages"]:
        msg.pretty_print()

    print(f"Name: {result['structured_response'].name}")
    print(f"Age: {result['structured_response'].age}")
    print(f"Occupation: {result['structured_response'].occupation}")
```

```plain
================================ Human Message =================================

Extract person information from: John Smith is a 35-year-old software engineer from Seattle.
================================== Ai Message ==================================
Tool Calls:
  Person (call_Q1tkd2sGAvEF696ea70vJrfr)
 Call ID: call_Q1tkd2sGAvEF696ea70vJrfr
  Args:
    age: 35
    name: John Smith
    occupation: software engineer
================================= Tool Message =================================
Name: Person

Returning structured response: name='John Smith' age=35 occupation='software engineer'
Name: John Smith
Age: 35
Occupation: software engineer
```

> 工具调用的方式，可以看到这里是使用工具调用的方式来解析出结构化的对象的，如果工具调用的时候出错，则会继续给到 LLM，让其继续修正。
>

> 如果模型提供商没有原生支持结构化输出，则可以使用这种方式，这种方式支持大多数的现代模型
>

## 工具调用的流程
```python
def tool_call_process():
    llm_with_tool = llm.bind_tools([get_weather])
    query = "What's the weather in Seattle?"
    response1 = llm_with_tool.invoke(query)
    print("Step 1 - Tool call:", response1.tool_calls[0])

    tool_call = response1.tool_calls[0]
    tool_result = get_weather.invoke(tool_call["args"])
    print("Step 2 - Tool result:", tool_result)

    messages = [
        HumanMessage(content=query),
        AIMessage(content="", tool_calls=response1.tool_calls),
        ToolMessage(content=tool_result, tool_call_id=tool_call["id"]),
    ]

    final_response = llm.invoke(messages)
    print("Step 3 - Final answer:", final_response.content)
```

工具调用的整体流程如上所示:

1. llm 先绑定工具，再将用户的输入给到 llm，如果需要调用工具，llm 则会返回工具调用的相关信息，如下图所示，content 字段的内容为空，tool_calls 字段中会有 llm 需要调用的所有的工具的信息

![](https://img.leftover.cn/img-md/1772977278042-cc8354d2-ba42-4bfa-b71e-6e3cabcc547b.png)

如果不需要调用工具，则直接输出对应的结果

2. 根据 llm 返回的工具调用的信息，我们调用对应的工具获取结果，结果如下

![](https://img.leftover.cn/img-md/1772977406536-f829c344-fa00-401f-9309-13814cdcbe80.png)

3. 最后我们将工具调用的信息以及之前的用户输入、模型的输出结果，全部给 llm，llm 最终返回最终的结果

```python
    messages = [
        HumanMessage(content=query),
        AIMessage(content="", tool_calls=response1.tool_calls),
        ToolMessage(content=tool_result, tool_call_id=tool_call["id"]),
    ]

    final_response = llm.invoke(messages)
    print("Step 3 - Final answer:", final_response.content)
```

![](https://img.leftover.cn/img-md/1772977533882-e4c56adf-d2f5-45af-ab56-239c1a4e0094.png)

整体的流程如下图所示：

![](https://img.leftover.cn/img-md/1772977623734-c5e58058-2a18-40b5-ab1d-d7c4697e2c99.png)





## ReAct 模式
核心的流程如下图所示：

![](https://img.leftover.cn/img-md/1772981021976-0750ea04-1661-42c4-ac2a-d9b1899356c6.png)

ReAct 模式包括以下三个关键步骤：

1. Thought（思考/推理）：模型思考回答该问题，拆解任务等，当然如果问题足够简单，LLM 也会直接回答
2. Action（行动）：根据上一步的思考，模型决定调用外部工具（tool_call）
3.  Observation  （观察）：将上一步工具调用的结果，添加到上下文中，形成新的上下文给到 LLM，然后进行下一轮的 Thought

> 这个循环（Thought -> Action -> Observation）会不断重复，直到模型认为已经收集到足够的信息，可以得出最终答案
>

### langchain 中创建一个能够字段处理 ReAct 循环的 agent
```python
from langchain.agents import create_agent
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage
from dotenv import load_dotenv
import os

load_dotenv()

# Define a calculator tool for the agent
@tool
def calculator(expression: str) -> str:
    """A calculator that can perform basic arithmetic operations.
    
    Args:
        expression: The mathematical expression to evaluate
    """
    result = eval(expression, {"__builtins__": {}}, {})
    return str(result)

def main():
    agent = create_agent(llm, [calculator])

    response = agent.invoke(
        {
            "messages": [
                HumanMessage(
                    content="Calculate 25 * 17, then tell me if it's a prime number"
                )
            ]
        }
    )
    last_message = response["messages"][-1]
    print(f"Agent: {last_message.content}")

if __name__ == "__main__":
    main()
```

1. 创建 agent,并绑定对应的工具等

```python
    agent = create_agent(
        model=os.getenv("AI_MODEL"),
        tools=[calculator],
        system_prompt="You are a helpful math assistant.",
    )
```

2. 问 LLM 对应的问题

```python
    # Use the agent with messages array
    query = "What is 125 * 8?"
    response = agent.invoke({
        "messages": [HumanMessage(content=query)]
    })

```

结果如下:

![](https://img.leftover.cn/img-md/1772978483663-6d0270ca-ae45-4d65-96a8-b2790d20349d.png)

> 可以看到 langchain 自动帮我们完成了 ReAct 的循环，自动调用了工具，得出了最终的答案
>

3. 消息的最后一条即是最终的答案

```python
last_message = response["messages"][-1]
print(f"Agent: {last_message.content}") # Agent: 25 × 17 = 425.  425 is not a prime number—it’s divisible by 5 (425 = 5 × 85).
```

### create-agent 的底层
其底层就是自动地执行了上述的 ReAct 的逻辑，即 Thought，Action（执行工具调用，如果有），Observation （将工具调用的结果添加到上下文中）

这里我们做一个简单的测试，我们将 expression 参数从 str 改为 float，再执行上面的程序，完整的代码如下所示：

```python

class CalculatorInput(BaseModel):
    expression: float = Field(description="The mathematical expression to evaluate")
    
@tool(args_schema=CalculatorInput)
def calculator(expression: float) -> str:
    """Useful for performing mathematical calculations.
    Use this when you need to compute numbers."""
    try:
        # Allow only safe mathematical operations
        allowed_names = {"abs": abs, "round": round, "min": min, "max": max}
        result = eval(expression, {"__builtins__": {}}, allowed_names)
        return f"The result is: {result}"
    except Exception as error:
        return f"Error evaluating expression: {error}"
        
def single_tool_agent():
    agent = create_agent(llm, [calculator])

    response = agent.invoke(
        {
            "messages": [
                HumanMessage(
                    content="Calculate 25 * 17, then tell me if it's a prime number"
                )
            ]
        }
    )
    last_message = response["messages"][-1]
    print(f"Agent: {last_message.content}")
```

最终的 response 的结果如下所示，可以看到，这次进行了多次的工具调用

![](https://img.leftover.cn/img-md/1772978995971-c5f97cc4-e1e4-4429-95d1-27c383253f75.png)

由于上面我将`calculator`工具的入参改为了 float 类型,所以这里 llm 进行工具调用的时候的传入的参数为 25

![](https://img.leftover.cn/img-md/1772979127862-0f0c2f16-541a-479f-a6a2-22cc2ab99d59.png)

然后执行`calculator`工具时，eval 函数则会出错，如下

![](https://img.leftover.cn/img-md/1772979239899-7acaed45-fca1-4518-bf66-ee05c706c709.png)

llm 根据这次工具调用的结果，之后进入 Thought 阶段，此时 LLM 根据上述的结果得不出最终答案，然后查询工具列表再次进行工具调用（Action），一直这样循环，**直到得出最终的答案或者达到迭代次数上限**

### 手动实现一个 ReAct 循环
```python
class CalculatorInput(BaseModel):
    expression: str = Field(description="The mathematical expression to evaluate")

@tool(args_schema=CalculatorInput)
def calculator(expression: str) -> str:
    """Useful for performing mathematical calculations.
    Use this when you need to compute numbers."""
    try:
        # Allow only safe mathematical operations
        allowed_names = {"abs": abs, "round": round, "min": min, "max": max}
        result = eval(expression, {"__builtins__": {}}, allowed_names)
        return f"The result is: {result}"
    except Exception as error:
        return f"Error evaluating expression: {error}"

@tool
def is_prime(number: int) -> str:
    """Check if a number is prime."""
    if number < 2:
        return "False"
    for i in range(2, int(number**0.5) + 1):
        if number % i == 0:
            return f"False (divisible by {i})"
    return "True"

def run_react_loop(query: str, tools: List, max_iterations: int = 5):
    tools_by_name = {t.name: t for t in tools}
    llm_with_tools = llm.bind_tools(tools)
    messages: List[BaseMessage] = [HumanMessage(content=query)]
    for _ in range(max_iterations):
        response = llm_with_tools.invoke(messages)
        messages.append(response)
        # 如果没有工具调用了，说明已经得到了最终的答案，可以结束循环
        if not response.tool_calls:
            print("No more tool calls - Final answer ready")
            return response.content

        for tool_call in response.tool_calls:
            tool_name = tool_call["name"]
            tool_args = tool_call["args"]
            print(f"Action: {tool_name}({tool_args})")
            tool_result = tools_by_name[tool_name].invoke(tool_args)
            print(f"Observation: {tool_result}")
            messages.append(
                ToolMessage(content=str(tool_result), tool_call_id=tool_call["id"])
            )

    return "Max iterations reached without final answer"
if __name__ == "__main__":
    tools = [calculator, is_prime]

    query = "Calculate 25 * 17, then tell me if the result is a prime number"
    print(f"Query: {query}")

    result = run_react_loop(query, tools)
    print(f"\n🤖 Final Answer: {result}")

```

大致流程如下：

![](https://img.leftover.cn/img-md/1772980737442-8f836e44-0c78-43e2-8786-cda5e9f128ba.png)

![](https://img.leftover.cn/img-md/1772980780818-55effac3-7ff5-4464-a551-0e8f575cd9e7.png)

1. 先调用`calculator`工具进行数学计算，将工具调用结果添加到上下文
2. 然后 LLM 发现还需要调用`is_prime`工具，接着调用`is_prime`工具判断是否为素数，将工具调用结果添加到上下文
3. 最终有了上述所有的工具调用的结果，最终得出最终的答案



## Middleware
middleware 就是类似于插件，可以用来拦截 agent 的执行过程，以便执行一些额外的操作，例如 token 的统计、调用次数的统计等



这是一个 ReAct 循环：

![](https://img.leftover.cn/img-md/1773049877406-c4907183-0acc-4e4a-be73-1078e2b8e772.png)

加入了中间件之后变成了这样：

![](https://img.leftover.cn/img-md/1773049909574-8b15a9b6-051b-4228-8a56-f444ea138fc4.png)

截至目前（langchain1.2），中间件可以自定义 6 种 hooks：

+ `<font style="color:rgb(17, 24, 39);background-color:rgba(238, 238, 239, 0.5);">before_agent</font>`<font style="color:rgb(3, 7, 16) !important;">- 在 agent 启动之前（每次调用一次），</font>**<font style="color:rgb(3, 7, 16) !important;">通常可以用来初始化一些全局的状态、全局日志等</font>**
+ `<font style="color:rgb(17, 24, 39);background-color:rgba(238, 238, 239, 0.5);">before_model</font>`<font style="color:rgb(3, 7, 16) !important;">- 在每次模型调用之前，</font>**<font style="color:rgb(3, 7, 16) !important;">可以修改模型的上下文，输出日志等</font>**
+ `<font style="color:rgb(17, 24, 39);background-color:rgba(238, 238, 239, 0.5);">after_model</font>`<font style="color:rgb(3, 7, 16) !important;">- 每次模型响应后，</font>**<font style="color:rgb(3, 7, 16) !important;">可以进行一些统计工作，输出检查</font>**
+ `<font style="color:rgb(17, 24, 39);background-color:rgba(238, 238, 239, 0.5);">after_agent</font>`<font style="color:rgb(3, 7, 16) !important;">- 在 agent 完成后（每次调用一次），</font>**<font style="color:rgb(3, 7, 16) !important;">通常可以用来做一些汇总、审计工作</font>**
+ `<font style="color:rgb(17, 24, 39);background-color:rgba(238, 238, 239, 0.5);">wrap_model_call</font>`<font style="color:rgb(3, 7, 16) !important;">- 每次模型调用前后，</font>**<font style="color:rgb(3, 7, 16) !important;">可以做一些重试、降级（fallback）、更换模型等操作</font>**
+ `<font style="color:rgb(17, 24, 39);background-color:rgba(238, 238, 239, 0.5);">wrap_tool_call</font>`<font style="color:rgb(3, 7, 16) !important;">- 每次工具调用前后，</font>**<font style="color:rgb(3, 7, 16) !important;"> 可以做一些修改 tool 的参数、tool 重试、鉴权、拦截、错误包装  </font>**



### 自定义 middleware
创建中间件的方式也有两种：

1. 基于装饰器的方式（写法可以参考官网的[例子](https://docs.langchain.com/oss/python/langchain/middleware/custom#decorator-based-middleware)）
2. 基于 class 的方式

个人比较喜欢基于 class 的方式，第一种感觉会显得代码比较臃肿，可能一个中间件需要两个 hook，则需要定义两个函数，然后再分别用装饰器进行包装，但是这两个函数的耦合度不高，而基于 class 的方式，则只需要定义一个 class，再在类中定义各种需要的 hooks 即可



例如：

日志记录的 middleware

```python
class LoggingMiddleware(AgentMiddleware):
    def before_model(
        self, state: AgentState, runtime: Runtime
    ) -> dict[str, Any] | None:
        print(f"About to call model with {len(state['messages'])} messages")
        return None

    def after_model(self, state: AgentState, runtime: Runtime) -> dict[str, Any] | None:
        print(f"Model returned: {state['messages'][-1].content}")
        return None

    def before_agent(
        self, state: AgentState[Any], runtime: Runtime[None]
    ) -> dict[str, Any] | None:
        # return super().before_agent(state, runtime)
        print(f"Agent starting with initial message: {state['messages'][0].content}")
        return None

    def after_agent(
        self, state: AgentState[Any], runtime: Runtime[None]
    ) -> dict[str, Any] | None:
        # return super().after_agent(state, runtime)
        print(f"Agent finished with final message: {state['messages'][-1].content}")
        return None
```

动态切换模型的 middleware

```python
class DynamicModelMiddleware(AgentMiddleware):
    def __init__(self, message_threshold: int = 2) -> None:
        super().__init__()
        self.message_threshold = message_threshold

    def wrap_model_call(
        self,
        request: ModelRequest[None],
        handler: Callable[[ModelRequest[None]], ModelResponse[Any]],
    ) -> ModelResponse[Any] | AIMessage | ExtendedModelResponse[Any]:
        message_count = len(request.state["messages"])
        print(f"[Middleware] Message count: {message_count}")
        if message_count > self.message_threshold:
            print("[Middleware] Switching to more capable model")
            return handler(request.override(model=large_llm))
        return handler(request)
```

middleware 的使用：只需要在`create_agent`的时候指定需要的`middleware`即可

```python
agent = create_agent(
        small_llm,
        [calculator, is_prime],
        middleware=[
            LoggingMiddleware(),
            DynamicModelMiddleware(message_threshold=2),
        ],
    )
```

> 官网也有一些预构建的 middleware，具体可以查看[官网](https://docs.langchain.com/oss/python/langchain/middleware/built-in)
>



### Middleware 执行顺序
经常项目中会有多个 middleware，所以明白 middleware 的执行顺序还是很重要的

```python
middleware1.before_agent()
middleware2.before_agent()
middleware3.before_agent()

# agent loop 开始，每次模型调用前：
middleware1.before_model()
middleware2.before_model()
middleware3.before_model()

# 模型调用被嵌套包装：
middleware1.wrap_model_call(
    middleware2.wrap_model_call(
        middleware3.wrap_model_call(
            actual_model_call
        )
    )
)

# 模型返回后：
middleware3.after_model()
middleware2.after_model()
middleware1.after_model()

# 如果模型触发工具调用：
middleware1.wrap_tool_call(
    middleware2.wrap_tool_call(
        middleware3.wrap_tool_call(
            actual_tool_call
        )
    )
)

# agent 结束后：
middleware3.after_agent()
middleware2.after_agent()
middleware1.after_agent()
```

```python
# 简单写了两个中间件进行测试：
A.before_agent
B.before_agent
A.before_model
B.before_model
A.wrap_model_call: enter
B.wrap_model_call: enter
B.wrap_model_call: exit
A.wrap_model_call: exit
B.after_model
A.after_model
A.wrap_tool_call: enter, tool=add
B.wrap_tool_call: enter, tool=add
    >>> actual tool body: add
B.wrap_tool_call: exit, tool=add
A.wrap_tool_call: exit, tool=add
A.before_model
B.before_model
A.wrap_model_call: enter
B.wrap_model_call: enter
B.wrap_model_call: exit
A.wrap_model_call: exit
B.after_model
A.after_model
B.after_agent
A.after_agent
```

## MCP
我们之前可以通过代码创建自己的工具（例如获取天气的工具等），但是如果我们想要连接到外部的服务，例如

+ <font style="color:rgb(31, 35, 40);">GitHub (create issues, search code, manage PRs)</font>
+ <font style="color:rgb(31, 35, 40);">高德地图（查询位置，查询天气）</font>

这时候如果想要集成上面的工具，我们需要编写代码处理各种 API、不同的数据格式等，而 MCP 可以帮助我们解决这样的一个难题，服务的提供方编写好对应的 mcp server，而我们只需要连接上其 mcp server 即可，例如[github mcp server](https://github.com/github/github-mcp-server) ，我们可以通过连接 GitHub mcp server 来创建 issue、创建 PR 等



### MCP VS function call
通俗地来讲，

**function call** 就是自己编写好需要使用的每个工具。

**MCP server**则可以将一系列的相关的 tools 集成到一个服务中，agent 只需要通过对应的接口连接上该 mcp 即可调用这一系列的 tools，大大缩减了我们集成外部工具的时间



### mcp 的通信方式
目前 mcp 通常有两种不同的通信方式：

1. stdio：将 mcp server 当作本机的子进程启动，通过标准输入输出进行通信

```python
{"transport": "stdio", "command": "python", "args": ["server.py"]}
```

使用 stdio 的时候，我们需要配置 mcp 的启动方式，当我们的每个客户端需要连接到 mcp 的时候，都会开启一个子进程，使用配置的命令启动对应的 mcp server，之后使用标准的输入输出进行通信。

2. Streamable HTTP：而 `Streamable HTTP` 的方式则是在类似于 client/server 的那种方式，采用 http 协议进行通信。使用`streamable_http`的时候，我们需要配置 mcp server 的地址。

```python
{"transport": "streamable_http", "url": "https://api.mycompany.com/mcp"}
```

我们首先在服务器上启动对应的 mcp server，之后 client 再通过 http 请求连接到 mcp server



**集成两种不同通信方式的 mcp server**

```python
client = MultiServerMCPClient(
    
        {
            "context7": {
                "transport": "streamable_http",
                "url": "https://mcp.context7.com/mcp",  # Remote docs server
            },
            "calculator": {
                "transport": "stdio",
                "command": "python",
                "args": [
                    str(Path(__file__).parent / "server" / "local_calculator.py")
                ],  # Local math server
            },
        }
    )
try:
    tools = await client.get_tools()
    print(f"Retrieved {len(tools)} tools from MCP servers:")
    for tool in tools:
        print(f"   • {tool.name}: {tool.description}")
except Exception as e:
    print(f"Error fetching tools: {e}")
finally:
    print("✅ MCP client connection closed")
```

### 创建自定义的 mcp server
```python
import math
from fastmcp import FastMCP


mcp = FastMCP(name="Calculator MCP Server", instructions="MCP server that performs math calculations")

@mcp.tool()
def calculate(expression: str) -> str:
    """
    Perform mathematical calculations.
    
    Args:
        expression: Math expression to evaluate, e.g., '2 + 2', 'sqrt(16)'
    
    Returns:
        The result of the calculation.
    """
    try:
        safe_namespace = {
            "abs": abs,
            "round": round,
            "min": min,
            "max": max,
            "sum": sum,
            "pow": pow,
            "sqrt": math.sqrt,
            "sin": math.sin,
            "cos": math.cos,
            "tan": math.tan,
            "log": math.log,
            "log10": math.log10,
            "exp": math.exp,
            "floor": math.floor,
            "ceil": math.ceil,
            "pi": math.pi,
            "e": math.e,
        }
        
        result = eval(expression, {"__builtins__": {}}, safe_namespace)
        return str(result)
    except Exception as e:
        raise ValueError(f"Invalid expression: {e}")

if __name__ == "__main__":
    mcp.run("streamable-http", port=8100)

```

**测试自己创建的 mcp server**

在编写完对应的 mcp server 之后，我们需要对每个 mcp server 中的每个 tool 进行测试，看一下结果是否正确

```python
async def test_custom_mcp_server():
    """
    测试一下自己的mcp
    """
    client = Client("http://localhost:8100/mcp")
    async with client:
        result = await client.call_tool("calculate", {"expression": "25*17"})
        print(f"Result from custom MCP server: {result}")
```

**使用自己创建的 mcp server**

```python
# 使用自己的mcp server
async def create_custom_mcp_server():
    client = MultiServerMCPClient(
        {
            "myCustomMCP": {
                "transport": "streamable_http",
                "url": "http://localhost:8100/mcp",  # 自己的mcp
            },
        }
    )
    tools = await client.get_tools()
    for tool in tools:
        print(f"   • {tool.name}: {tool.description}")
    agent = create_agent(llm, tools)
    complex_query = "Calculate the square root of 144 plus the sine of pi/2"
    messages = [("human", complex_query)]
    response = await agent.ainvoke({"messages": messages})
    print(f"🤖 Agent: {response['messages'][-1].content}\n")
```

### mcp 返回结构化的数据
```python
from datetime import datetime, UTC
from uuid import uuid4, UUID

from pydantic import BaseModel
from fastmcp import FastMCP

mcp = FastMCP("Weather Demo")


class Weather(BaseModel):
    city: str
    temperature: float
    condition: str
    timestamp: datetime
    station_id: UUID


@mcp.tool
def get_weather(city: str) -> Weather:
    """Get current weather for a city."""
    return Weather(
        city=city,
        temperature=31.5,
        condition="Cloudy",
        timestamp=datetime.now(UTC),
        station_id=uuid4(),
    )


if __name__ == "__main__":
    mcp.run(transport="streamable-http", port=8100)

```

上面的代码中，`get_weather`直接返回一个 Pydantic  对象

```python
async def create_custom_mcp_server():
    client = MultiServerMCPClient(
        {
            "myCustomMCP": {
                "transport": "streamable_http",
                "url": "http://localhost:8100/mcp",  # 自己的mcp
            },
        }
    )
    tools = await client.get_tools()
    for tool in tools:
        print(f"   • {tool.name}: {tool.description}")
    agent = create_agent(llm, tools)
    complex_query = "今天巴黎的天气是怎样的?"
    messages = [("human", complex_query)]
    response = await agent.ainvoke({"messages": messages})
    for message in response["messages"]:
        if isinstance(message, ToolMessage) and message.artifact:
            structured_content = message.artifact["structured_content"]
            final_content = message.text 
            print(f"📊 Structured Content from tool '{message.name}': {structured_content}")
            print(f"📄 Final message content: {final_content}\n")

    print(f"🤖 Agent: {response['messages'][-1].content}\n")
```

使用 langchain 调用的时候，会将该结构化的内容封装到 artifact 字段的`structured_content`中，我们直接使用`message.artifact["structured_content"]`可以获取到对应的结构化的内容

![](https://img.leftover.cn/img-md/1773130828456-4a514981-e186-4338-9d15-9192ed3dfdda.png)

`message.txt`则可以获取到转换为 json 字符串之后的内容

```python
{"city":"巴黎","temperature":31.5,"condition":"Cloudy","timestamp":"2026-03-10T08:06:27.361769Z","station_id":"e8a47692-883b-4578-af4d-0d2f63c1563b"}
```

### mcp 返回资源
编写 mcp server，返回 resource

```python
from datetime import datetime, UTC
from uuid import uuid4, UUID

from pydantic import BaseModel
from fastmcp import FastMCP

mcp = FastMCP("Weather Demo")

@mcp.resource("docs://readme")
def readme() -> str:
    return "# Hello\n这是一个 README"


if __name__ == "__main__":
    mcp.run(transport="streamable-http", port=8100)
```

而 langchain 会将 mcp resource 统一转化为 Blob 对象，我们只需要对这个 blob 对象进行处理即可

```python
async def mcp_advanced_use():
    """
    展示一下mcp的高级用法，
    """
    client = MultiServerMCPClient(
        {
            "myCustomMCP": {
                "transport": "streamable_http",
                "url": "http://localhost:8100/mcp",  # 自己的mcp
            },
        }
    )
    tools = await client.get_tools()
    for tool in tools:
        print(f"   • {tool.name}: {tool.description}")
    agent = create_agent(llm, tools)
    blobs = await client.get_resources("myCustomMCP", uris=["docs://readme"])
    for blob in blobs:
        print(f"URI: {blob.metadata['uri']}, MIME type: {blob.mimetype}")
        print(blob.as_string())  # # Hello\n这是一个 README

```

### mcp 返回提示词（prompt）
我的 mcp server

```python
from fastmcp import FastMCP
mcp = FastMCP("Weather Demo")

@mcp.prompt("analyze_report")
def analyze_report(data_uri: str) -> str:
    return f"请读取资源 {data_uri}，分析其营收、成本和利润，并给出两条建议。"

if __name__ == "__main__":
    mcp.run(transport="streamable-http", port=8100)

```

在 langchain 中连接上 mcp，并获取 prompt，在 langchain 中是以 messages 的形式返回的

```python
async def mcp_advanced_use():
    """
    展示一下mcp的高级用法，
    """
    client = MultiServerMCPClient(
        {
            "myCustomMCP": {
                "transport": "streamable_http",
                "url": "http://localhost:8100/mcp",  # 自己的mcp
            },
        }
    )
    tools = await client.get_tools()
    for tool in tools:
        print(f"   • {tool.name}: {tool.description}")
    agent = create_agent(llm, tools)
    
    # 获取prompt
    messages = await client.get_prompt(
        "myCustomMCP", "analyze_report", arguments={"data_uri": "docs://readme"}
    )
    for message in messages:
        print(
            f"Message type: {message.type}, content:\n{message.content}\n"
        )  # 请读取资源 docs://readme，分析其营收、成本和利润，并给出两条建议。
```

> mcp 的开发者可以预置一些常用的 prompt 以便使用者更快地上手该 mcp
>



