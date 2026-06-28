

## 流式输出
1. langgraph 中有多种流式输出的模式，可以输出不同的内容，有`values`、`updates`、`messages`、`custom`、`checkpoints`、`tasks`、`debug`
2. 并且可以同时指定多种模式

### values and updates
values：即在每个节点执行完之后，输出完整的 state 的内容

updates: 在每个节点执行完之后，输出有更新的状态内容（输出的是更新之后的值，但是只会输出更新了的字段，没有更新的字段并不会输出）

```python
def streaming_updates_values():
    class State(TypedDict):
        topic: str
        joke: str

    def generate_joke(state: State):
        writer = get_stream_writer()
        writer({"status": "thinking of a joke..."})
        return {
            "joke": f"Why did the {state['topic']} go to school? To get a sundae education!"
            "
        }

    def refine_topic(state: State):
        return {"topic": state["topic"] + " and cats"}

    graph = (
        StateGraph(State)
        .add_node(refine_topic)
        .add_node(generate_joke)
        .add_edge(START, "refine_topic")
        .add_edge("refine_topic", "generate_joke")
        .add_edge("generate_joke", END)
        .compile()
    )
    for chunk in graph.stream(
        {"topic": "ice cream", "joke": ""},
        stream_mode=["values", "updates"],
        version="v2",
    ):
        if chunk["type"] == "values":
            print(
                f"fullstate: topic: {chunk['data']['topic']}, joke: {chunk['data']['joke']}"
            )
        elif chunk["type"] == "updates":
            for node_name, state in chunk["data"].items():
                print(f"Update: Node `{node_name}` updated: {state}")

```

### messages
`messages` 流式地输出 LLM 输出的 token，还可以通过 metadata 来进行过滤（例如只要特定节点的 LLM 的输出的内容）

```python
def streaming_messages():
    @dataclass
    class MyState:
        topic: str
        joke: str = ""

    llm = ChatOpenAI(
        # model="gpt-5-mini",
        model="gpt-5-chat-latest",
        api_key=os.getenv("LINGYA_API_KEY"),
        base_url=os.getenv("LINGYA_ENDPOINT"),
        tags=["joke"],
    )

    def call_model(state: MyState):
        """Call the LLM to generate a joke about a topic"""
        # Note that message events are emitted even when the LLM is run using .invoke rather than .stream
        model_response = llm.invoke(
            [{"role": "user", "content": f"Generate a joke about {state.topic}"}]
        )
        return {"joke": model_response.content}

    graph = (
        StateGraph(MyState).add_node(call_model).add_edge(START, "call_model").compile()
    )

    # The "messages" stream mode streams LLM tokens with metadata
    # Use version="v2" for a unified StreamPart format
    for chunk in graph.stream(
        {"topic": "ice cream"},
        stream_mode=["messages"],
        version="v2",
    ):
        if chunk["type"] == "messages":
            message_chunk, metadata = chunk["data"]
            if message_chunk.content:
                print(message_chunk.content, end="|", flush=True)
                # 通过metadata可以来过滤message，例如只打印特定节点的消息
                # if msg.content and metadata["langgraph_node"] == "some_node_name":
                #  print(xxx)
```



### custom
`custom`：流式地输出用户自定义的数据,可以使用 get_stream_writer() 来在节点内部或者工具内部输出自定义的一些内容

```python
def streaming_custom():
    """
    使用 get_stream_writer在节点(node)内部，或者tools内部发送一些自定义的消息，以便在前端或者streaming过程中获取到这些消息，来展示给用户或者做一些其他的处理。
    """

    class State(TypedDict):
        query: str
        answer: str

    def node(state: State):
        # Get the stream writer to send custom data
        writer = get_stream_writer()
        # Emit a custom key-value pair (e.g., progress update)
        writer({"custom_key": "Generating custom data inside node"})
        return {"answer": "some data"}

    graph = StateGraph(State).add_node(node).add_edge(START, "node").compile()

    inputs = {"query": "example"}

    # Set stream_mode="custom" to receive the custom data in the stream
    for chunk in graph.stream(inputs, stream_mode="custom", version="v2"):
        if chunk["type"] == "custom":
            print(f"Custom event: {chunk['data']['custom_key']}")
```

### checkpoints、tasks、debug
`checkpoints`：接收每个 checkpoint 创建的事件，输出的内容和`get_state()`函数的内容一样

`tasks`：将会接收每个 task 开始和结束的事件，即节点开始执行和执行结束的事件、输出的内容包括：当前节点的输入的内容、输出的内容、以及 error

`debug`: 经过测试下路，有点类似于 checkpoints 和 task 的组合，二者的事件都会被接收，并且输出的内容会更加地详细、通常用来 debug

```python
def streaming_checkpointer_task_debug():

    class State(TypedDict):
        topic: str
        joke: str

    def generate_joke(state: State):
        writer = get_stream_writer()
        writer({"status": "thinking of a joke..."})
        return {
            "joke": f"Why did the {state['topic']} go to school? To get a sundae education!"
        }

    def refine_topic(state: State):
        return {"topic": state["topic"] + " and cats"}

    graph = (
        StateGraph(State)
        .add_node(refine_topic)
        .add_node(generate_joke)
        .add_edge(START, "refine_topic")
        .add_edge("refine_topic", "generate_joke")
        .add_edge("generate_joke", END)
        .compile(checkpointer=MemorySaver())
    )

    config = {"configurable": {"thread_id": "1"}}

    # for chunk in graph.stream(
    #     {"topic": "ice cream"},
    #     config=config,
    #     stream_mode="checkpoints",
    #     version="v2",
    # ):
    #     if chunk["type"] == "checkpoints":
    #         print(chunk["data"])

    # for chunk in graph.stream(
    #     {"topic": "ice cream"},
    #     config=config,
    #     stream_mode="tasks",
    #     version="v2",
    # ):
    #     if chunk["type"] == "tasks":
    #         print(chunk["data"])

    # 可以接收到各类的输出，用于debug
    for chunk in graph.stream(
        {"topic": "ice cream"},
        config=config,
        stream_mode="debug",
        version="v2",
    ):
        if chunk["type"] == "debug":
            print(chunk["data"])
```

### 子图的输出
默认情况下，并不会接收到子图的输出，如果需要接收子图内部的输出,需要设置`subgraphs=True`

```python
    for chunk in graph.stream(
        {"foo": "foo"},
        stream_mode="updates",
        # Set subgraphs=True to stream outputs from subgraphs ,default=False
        # 将subgraphs=True 可以访问到子图的输出，否则不能访问到子图内部的输出
        subgraphs=True,
        version="v2",
    ):
```

```python
def streaming_subgraph():

    # Define subgraph
    class SubgraphState(TypedDict):
        foo: str  # note that this key is shared with the parent graph state
        bar: str

    def subgraph_node_1(state: SubgraphState):
        return {"bar": "bar"}

    def subgraph_node_2(state: SubgraphState):
        return {"foo": state["foo"] + state["bar"]}

    subgraph_builder = StateGraph(SubgraphState)
    subgraph_builder.add_node(subgraph_node_1)
    subgraph_builder.add_node(subgraph_node_2)
    subgraph_builder.add_edge(START, "subgraph_node_1")
    subgraph_builder.add_edge("subgraph_node_1", "subgraph_node_2")
    subgraph = subgraph_builder.compile()

    # Define parent graph
    class ParentState(TypedDict):
        foo: str

    def node_1(state: ParentState):
        return {"foo": "hi! " + state["foo"]}

    builder = StateGraph(ParentState)
    builder.add_node("node_1", node_1)
    builder.add_node("node_2", subgraph)
    builder.add_edge(START, "node_1")
    builder.add_edge("node_1", "node_2")
    graph = builder.compile()

    for chunk in graph.stream(
        {"foo": "foo"},
        stream_mode="updates",
        # Set subgraphs=True to stream outputs from subgraphs ,default=False
        # 将subgraphs=True 可以访问到子图的输出，否则不能访问到子图内部的输出
        subgraphs=True,
        version="v2",
    ):
        if chunk["type"] == "updates":
            if chunk["ns"]:
                print(f"Subgraph {chunk['ns']}: {chunk['data']}")
            else:
                print(f"Root: {chunk['data']}")
```



## 中断（Human-In-The-Loop）
### 中断的常见的用法
在这个例子中，首先用户先输入任务（例如帮我写一封请假邮件），LLM 先生成对应的内容，然后通过中断来让用户审核（用户可以选择同意/拒绝/编辑内容）。

> 同时对用户的输入进行了验证，如果输入的不是预定的 1，2，3，则需要重新输入
>

```python
"""
流程：
1. 用户输入任务（如撰写邮件）
2. LLM 生成内容
3. 通过 interrupt 暂停，等待人工审核
4. 用户在终端选择：同意 / 拒绝 / 编辑
5. 根据选择继续执行：发送、取消或使用编辑后内容发送
"""

import os
from typing import Literal, Optional

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.types import Command, interrupt
from typing_extensions import TypedDict

load_dotenv()

llm = ChatOpenAI(
    model="gpt-5-chat-latest",
    api_key=os.getenv("LINGYA_API_KEY"),
    base_url=os.getenv("LINGYA_ENDPOINT"),
)


# ── State 定义 ──────────────────────────────────────────────
class ReviewState(TypedDict):
    task: str  # 用户的任务描述
    generated_content: str  # LLM 生成的内容
    final_content: str  # 最终内容
    status: Optional[Literal["approved", "rejected", "edited"]]


# ── 节点定义 ──────────────────────────────────────────────
def generate_node(state: ReviewState) -> dict:
    """LLM 根据用户任务生成内容"""
    response = llm.invoke(
        [
            {
                "role": "system",
                "content": "你是一个写作助手，根据用户的要求生成内容。直接输出内容，不要添加额外说明。",
            },
            {"role": "user", "content": state["task"]},
        ]
    )
    return {"generated_content": response.content}


def review_node(
    state: ReviewState,
) -> Command[Literal["approve_node", "reject_node", "edit_node"]]:
    """人工审核节点 - 通过 interrupt 暂停等待用户决策"""
    # interrupt 会暂停 graph 执行，将内容展示给用户
    # resume 时传入的值会作为 interrupt() 的返回值
    decision = interrupt(
        {
            "message": "请审核以下生成的内容：",
            "content": state["generated_content"],
            "options": ["approve", "reject", "edit"],
        }
    )

    action = decision.get("action", "reject")

    if action == "approve":
        return Command(
            goto="approve_node",
            update={"status": "approved", "final_content": state["generated_content"]},
        )
    elif action == "edit":
        edited = decision.get("edited_content", state["generated_content"])
        return Command(
            goto="edit_node",
            update={"status": "edited", "final_content": edited},
        )
    else:
        return Command(
            goto="reject_node",
            update={"status": "rejected"},
        )


def approve_node(state: ReviewState) -> dict:
    """审核通过，执行最终操作"""
    print("\n[系统] 内容已通过审核，正在发送...")
    print(f"[系统] 发送内容：\n{state['final_content']}")
    return {}


def reject_node(state: ReviewState) -> dict:
    """审核拒绝"""
    print("\n[系统] 内容已被拒绝，操作已取消。")
    return {}


def edit_node(state: ReviewState) -> dict:
    """使用编辑后的内容"""
    print("\n[系统] 使用编辑后的内容，正在发送...")
    print(f"[系统] 发送内容：\n{state['final_content']}")
    return {}


# ── 构建 Graph ──────────────────────────────────────────────
builder = StateGraph(ReviewState)

builder.add_node("generate", generate_node)
builder.add_node("review", review_node)
builder.add_node("approve_node", approve_node)
builder.add_node("reject_node", reject_node)
builder.add_node("edit_node", edit_node)

builder.add_edge(START, "generate")
builder.add_edge("generate", "review")
# review_node 使用 Command(goto=...) 路由，不需要显式边
builder.add_edge("approve_node", END)
builder.add_edge("reject_node", END)
builder.add_edge("edit_node", END)

checkpointer = MemorySaver()
graph = builder.compile(checkpointer=checkpointer)


# ── 终端交互逻辑 ──────────────────────────────────────────────
def get_user_review(interrupt_value: dict) -> dict:
    """在终端中让用户进行审核选择"""
    print("\n" + "=" * 60)
    print(interrupt_value["message"])
    print("-" * 60)
    print(interrupt_value["content"])
    print("-" * 60)
    print("请选择操作：")
    print("  1. 同意 (approve)")
    print("  2. 拒绝 (reject)")
    print("  3. 编辑 (edit)")
    print("=" * 60)

    while True:
        choice = input("\n请输入选项 (1/2/3): ").strip()
        if choice == "1":
            return {"action": "approve"}
        elif choice == "2":
            return {"action": "reject"}
        elif choice == "3":
            print("\n请输入编辑后的内容（输入空行结束）：")
            lines = []
            while True:
                line = input()
                if line == "":
                    break
                lines.append(line)
            edited_content = "\n".join(lines)
            return {"action": "edit", "edited_content": edited_content}
        else:
            print("无效选项，请重新输入。")


def main():
    config = {"configurable": {"thread_id": "review-demo-1"}}

    # 获取用户任务
    task = input("请输入任务（例如：帮我写一封请假邮件）：\n> ")

    # 第一次调用：执行 generate -> review（在 review 处 interrupt 暂停）
    print("\n[系统] 正在生成内容...")
    result = graph.invoke({"task": task}, config=config)

    interrupts = result.get("__interrupt__", [])
    if not interrupts:
        print("[系统] 未触发审核中断，流程已结束。")
        return

    interrupt_value = interrupts[0].value

    # 在终端让用户审核
    decision = get_user_review(interrupt_value)

    # 使用 Command(resume=...) 恢复执行
    print("\n[系统] 正在处理您的决策...")
    final_result = graph.invoke(Command(resume=decision), config=config)

    # 输出最终状态
    print("\n" + "=" * 60)
    print(f"最终状态: {final_result.get('status', 'unknown')}")
    print("=" * 60)


if __name__ == "__main__":
    main()

```

### 中断的一些注意事项
在 langgraph 的文档中有关[interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts#do-not-wrap-interrupt-calls-in-try%2Fexcept)这一节中有提到一些使用中断的时候需要注意的地方

1. 中断的实现是抛出一个特定的异常，因此我们不要将中断的代码放在 try / except 中

> 放在 try / except 代码块之外
>

```python
def node_a(state: State):
    # ✅ Good: interrupting first, then handling
    # error conditions separately
    interrupt("What's your name?")
    try:
        fetch_data()  # This can fail
    except Exception as e:
        print(e)
    return state
```

> 只 catch 特定的一个异常，这样则不会捕获到中断对应的异常
>

```python
def node_a(state: State):
    # ✅ Good: catching specific exception types
    # will not catch the interrupt exception
    try:
        name = interrupt("What's your name?")
        fetch_data()  # This can fail
    except NetworkException as e:
        print(e)
    return state
```

```python
def node_a(state: State):
    # ❌ Bad: wrapping interrupt in bare try/except
    # will catch the interrupt exception
    try:
        interrupt("What's your name?")
    except Exception as e:
        print(e)
    return state
```

2. 不要对 interrupt 重新排序
+ 不用有条件地跳过节点内 interrupt 的调用
+ 不要在一个不确定循环次数内部调用 interrupt

> 总结下来就是需要保证单个节点内的中断的调用次数的固定的，相同的节点不会出现中断次数调用不一样的情况
>

```python
def node_a(state: State):
    # ✅ Good: interrupt calls happen in the same order every time
    name = interrupt("What's your name?")
    age = interrupt("What's your age?")
    city = interrupt("What's your city?")

    return {
        "name": name,
        "age": age,
        "city": city
    }
```

```python
def node_a(state: State):
    # ❌ Bad: conditionally skipping interrupts changes the order
    name = interrupt("What's your name?")

    # On first run, this might skip the interrupt
    # On resume, it might not skip it - causing index mismatch
    if state.get("needs_age"):
        age = interrupt("What's your age?")

    city = interrupt("What's your city?")

    return {"name": name, "city": city}
```

```python
def node_a(state: State):
    # ❌ Bad: looping based on non-deterministic data
    # The number of interrupts changes between executions
    results = []
    for item in state.get("dynamic_list", []):  # List might change between runs
        result = interrupt(f"Approve {item}?")
        results.append(result)

    return {"results": results}
```

3. interrupt 调用时不要传递复杂的值，只传递`str`或者`dict`，不要将函数、class、等其他复杂的对象传递给 interrupt

```python
def node_a(state: State):
    # ✅ Good: passing dictionaries with simple values
    response = interrupt({
        "question": "Enter user details",
        "fields": ["name", "email", "age"],
        "current_values": state.get("user", {})
    })

    return {"user": response}
```

```python
def validate_input(value):
    return len(value) > 0

def node_a(state: State):
    # ❌ Bad: passing a function to interrupt
    # The function cannot be serialized
    response = interrupt({
        "question": "What's your name?",
        "validator": validate_input  # This will fail
    })
    return {"name": response}
```

```python
class DataProcessor:
    def __init__(self, config):
        self.config = config

def node_a(state: State):
    processor = DataProcessor({"mode": "strict"})

    # ❌ Bad: passing a class instance to interrupt
    # The instance cannot be serialized
    response = interrupt({
        "question": "Enter data to process",
        "processor": processor  # This will fail
    })
    return {"result": response}
```

4. 由于中断是重新调用它的节点来实现的（中断恢复的时候会重新执行中断所在的对应的节点的代码）

因此在 interrupt 调用之前，要保证前面的代码具有幂等性（多次执行，结果不会改变），**尽量将 interrupt 放在节点的开头**

```python
def node_a(state: State):
    # ✅ Good: using upsert operation which is idempotent
    # Running this multiple times will have the same result
    db.upsert_user(
        user_id=state["user_id"],
        status="pending_approval"
    )

    approved = interrupt("Approve this change?")

    return {"approved": approved}
```

```python
def node_a(state: State):
    # ✅ Good: placing side effect after the interrupt
    # This ensures it only runs once after approval is received
    approved = interrupt("Approve this change?")

    if approved:
        db.create_audit_log(
            user_id=state["user_id"],
            action="approved"
        )

    return {"approved": approved}
```

```python
def node_a(state: State):
    # ❌ Bad: creating a new record before interrupt
    # This will create duplicate records on each resume
    audit_id = db.create_audit_log({
        "user_id": state["user_id"],
        "action": "pending_approval",
        "timestamp": datetime.now()
    })

    approved = interrupt("Approve this change?")

    return {"approved": approved, "audit_id": audit_id}
```

```python
def node_a(state: State):
    # ❌ Bad: appending to a list before interrupt
    # This will add duplicate entries on each resume
    db.append_to_history(state["user_id"], "approval_requested")

    approved = interrupt("Approve this change?")

    return {"approved": approved}
```

### 中断的实现
**中断是通过抛出一个异常来暂停代码的执行的，在中断结束之后，通过重新执行中断所在节点的代码来恢复中断**

因此**当在节点内调用了子图时，中断结束之后，将会重新执行调用子图的那个节点的代码。 **如下：

```python
def node_in_parent_graph(state: State):
    some_code()  # <-- This will re-execute when resumed
    # Invoke a subgraph as a function.
    # The subgraph contains an `interrupt` call.
    subgraph_result = subgraph.invoke(some_input)
    # ...

def node_in_subgraph(state: State):
    some_other_code()  # <-- This will also re-execute when resumed
    result = interrupt("What's your name?")
    # ...
```



### 如何使用中断来进行 debug
```python
graph = builder.compile(
    interrupt_before=["node_a"],
    interrupt_after=["node_b", "node_c"],
    checkpointer=checkpointer,
)

# Pass a thread ID to the graph
config = {
    "configurable": {
        "thread_id": "some_thread"
    }
}

# Run the graph until the breakpoint
graph.invoke(inputs, config=config)

# Resume the graph
graph.invoke(None, config=config)
```

会在对应的节点运行之前/之后触发中断，以便你可以逐个节点地执行图的执行过程

> 我感觉也可以通过打断点来实现，暂时没有发现这个功能的用处在哪
>

当然也可以通过 langsmith 来在图像界面上手动设置中断来控制图的执行过程（和代码中是类似的）



## 持久化


在 langgraph 中有两种持久化的方式，一种是`checkpointer`，一种是`store`，checkponter 是用来保存当前会话的一些状态等，是中断，时间旅行的基础，而 store 则是跨会话，则是"记忆"的基础（例如可以保存用户的偏好、职业等信息）

### checkpointer
1. 使用`graph.get_state(config=config)`函数可以获得当前的状态信息
2. 使用`history_state = list(graph.get_state_history(config=config))`来获取当前会话的所有的状态信息

```python
import operator
from operator import add
from typing import Annotated
import uuid
from langchain_core.runnables import RunnableConfig
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import END, START, MessagesState, StateGraph
from langgraph.store.memory import InMemoryStore
from typing_extensions import TypedDict


class State(TypedDict):
    foo: str
    bar: Annotated[list[str], operator.add]


def node_a(state: State) -> dict:
    return {"foo": "a", "bar": ["a"]}


def node_b(state: State) -> dict:
    return {"foo": "b", "bar": ["b"]}


workflow = StateGraph(state_schema=State)
workflow.add_node("node_a", node_a)
workflow.add_node("node_b", node_b)

workflow.add_edge(START, "node_a")
workflow.add_edge("node_a", "node_b")
workflow.add_edge("node_b", END)

checkpointer = InMemorySaver()
graph = workflow.compile(checkpointer=checkpointer)


config: RunnableConfig = {"configurable": {"thread_id": 1}}
res = graph.invoke({"foo": "", "bar": []}, config=config,durability="sync")
# 因为我们配置了checkpointer 的持久化，因此我们可以通过thread_id 来找到当前会话的状态,以便用户继续对话
cur_state = graph.get_state(config=config)

```

3. 通过`history_state` ，我们可以找到任意时刻的状态，然后我们可以进行**重放**，即之前的操作不会再执行，只会从当前节点往后执行，可以用来快速地调试

> 也可以再 lamgsmith 中很方便地使用
>

```python
# 通过history_state，我们可以找到任意时刻的状态
# 我们可以进行time_travel 来进行快速地调试
history_state = list(graph.get_state_history(config=config))
before_node_b = [s for s in history_state if s.next == ("node_b",)][
    0
]  # {foo:a,bar:[a]}
step_2 = next(s for s in history_state if s.metadata["step"] == 2)
print(res)


# time-travel： replay
replay_result = graph.invoke(None, before_node_b.config)
```

4. fork: fork 会在原先的检查点之后创建一个新的检查点，然后再从这个新的检查点往后执行

> 跟重放一样，可以用来调试
>

```python
# time-travel: fork
# 因为我们的bar变量是会进行叠加，而foo没有设置reducer，因此更新之后的状态为{foo:c ,bar:[a,c]}
fork_config = graph.update_state(
    before_node_b.config, {"foo": "c", "bar": ["c"]}
)  # {foo:c ,bar:[a,c]}

fork_result = graph.invoke(None, fork_config)  # {foo:b , bar:[a,c,b]}

print(f"replay_result: {replay_result}, fork_result: {fork_result}")
```

### store
#### store 的简单的用法
> memory_id 要是唯一的
>

```python
from langgraph.store.memory import InMemoryStore
store = InMemoryStore()

user_id = "1"
namespace_for_memory = (user_id, "memories")

memory_id = str(uuid.uuid4())
memory = {"food_preference" : "I like pizza"}
store.put(namespace_for_memory, memory_id, memory)

# 通过命名空间找到对应的memory
memories = store.search(namespace_for_memory)
memories[-1].dict()
{'value': {'food_preference': 'I like pizza'},
 'key': '07e0caf4-1631-47b7-b15f-65515d4c1843',
 'namespace': ['1', 'memories'],
 'created_at': '2024-10-02T17:22:31.590602+00:00',
 'updated_at': '2024-10-02T17:22:31.590605+00:00'}
```

#### store 的一个例子
下面的例子中可以看到，store 是跨会话共享的，在同一个用户的不同的会话中，均可以访问到该用户对应的"记忆"

```python
import operator
import uuid
from dataclasses import dataclass
from operator import add
from typing import Annotated

from langchain_core.runnables import RunnableConfig
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import END, START, MessagesState, StateGraph
from langgraph.runtime import Runtime
from langgraph.store.memory import InMemoryStore
from typing_extensions import TypedDict

store = InMemoryStore()
checkpointer = InMemorySaver()


@dataclass
class Context:
    user_id: str


class State(TypedDict):
    foo: str
    bar: Annotated[list[str], operator.add]


def node_a(state: State) -> dict:
    return {"foo": "a", "bar": ["a"]}


def node_b(state: State) -> dict:
    return {"foo": "b", "bar": ["b"]}


async def update_memory(state: State, runtime: Runtime[Context]):

    # Get the user id from the runtime context
    user_id = runtime.context.user_id

    # Namespace the memory
    namespace = (user_id, "memories")

    # ... Analyze conversation and create a new memory
    memory = {"food_preference": "spicy", "color_preference": "red"}
    # Create a new memory ID
    memory_id = str(uuid.uuid4())

    cur_memory = await runtime.store.asearch(namespace)
    if cur_memory:
        print(f"Current memory for user {user_id}: {cur_memory}")
    else:
        await runtime.store.aput(namespace, memory_id, {"memory": memory})


workflow = StateGraph(state_schema=State, context_schema=Context)
workflow.add_node("node_a", node_a)
workflow.add_node("node_b", node_b)
workflow.add_node("update_memory", update_memory)

workflow.add_edge(START, "node_a")
workflow.add_edge("node_a", "node_b")
workflow.add_edge("node_b", "update_memory")
workflow.add_edge("update_memory", END)

graph = workflow.compile(checkpointer=checkpointer, store=store)
user_id = "1"


async def main():
    async for update in graph.astream(
        {"foo": "", "bar": []},
        {"configurable": {"thread_id": "1"}},
        stream_mode="updates",
        context=Context(user_id="1"),
    ):
        print(update)

    # 不同的线程也能访问到相同的memory，实现跨会话共享
    async for update in graph.astream(
        {"foo": "", "bar": []},
        {"configurable": {"thread_id": "2"}},
        stream_mode="updates",
        context=Context(user_id="1"),
    ):
        print(update)


if __name__ == "__main__":原理
    import asyncio

    asyncio.run(main())
```

#### 使用 mem0 来管理长期记忆
想要了解`mem0`的原理，可以看一下这个[视频](https://www.bilibili.com/list/watchlater/?spm_id_from=333.1007.view_later.pip&bvid=BV1v8PYz1EUt&t=264&oid=116186717101538&vd_source=3c93d521158d3aa4f74c71c5140ba8dc)

在下面这个例子中，我们在对话之前会根据当前用户的输入搜索相关的`memory`，并将其加入上下文，当这一轮对话结束时，也会将这一轮的对话信息给`mem0`,并将`memory`存入`mem0`

```python
# mem0官网的例子改了一点点
# 需要配置MEM0_API_KEY环境变量
from typing import Annotated, TypedDict, List
from langgraph.graph import StateGraph, START
from langgraph.graph.message import add_messages
from langchain_openai import ChatOpenAI
from mem0 import MemoryClient
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, AnyMessage
from dotenv import load_dotenv
import os
import random

load_dotenv()

llm = ChatOpenAI(
    model="gpt-5-chat-latest",
    api_key=os.getenv("LINGYA_API_KEY"),
    base_url=os.getenv("LINGYA_ENDPOINT"),
)
mem0 = MemoryClient()


class State(TypedDict):
    messages: Annotated[List[AnyMessage], add_messages]
    mem0_user_id: str


graph = StateGraph(State)


def chatbot(state: State):
    messages = state["messages"]
    user_id = state["mem0_user_id"]

    try:
        # Retrieve relevant memories
        memories = mem0.search(messages[-1].content, version="v1", user_id=user_id)
        context = "Relevant information from previous conversations:\n"
        for memory in memories:
            context += f"- {memory['memory']}\n"

        system_message = SystemMessage(
            content=f"""You are a helpful customer support assistant. Use the provided context to personalize your responses and remember user preferences and past interactions.
{context}"""
        )

        full_messages = [system_message] + messages
        response = llm.invoke(full_messages)

        # Store the interaction in Mem0
        try:
            interaction = [
                {"role": "user", "content": messages[-1].content},
                {"role": "assistant", "content": response.content},
            ]
            result = mem0.add(interaction, user_id=user_id)
            print(f"Memory saved: {len(result.get('results', []))} memories added")
        except Exception as e:
            print(f"Error saving memory: {e}")

        return {"messages": [response]}

    except Exception as e:
        print(f"Error in chatbot: {e}")
        # Fallback response without memory context
        response = llm.invoke(messages)
        return {"messages": [response]}


graph.add_node("chatbot", chatbot)
graph.add_edge(START, "chatbot")
graph.add_edge("chatbot", "chatbot")

compiled_graph = graph.compile()


def run_conversation(user_input: str, mem0_user_id: str):
    config = {"configurable": {"thread_id": str(random.randint(1, 1000000))}}
    state = {
        "messages": [HumanMessage(content=user_input)],
        "mem0_user_id": mem0_user_id,
    }

    for event in compiled_graph.stream(state, config):
        for value in event.values():
            if value.get("messages"):
                print("Customer Support:", value["messages"][-1].content)
                return


if __name__ == "__main__":
    print("Welcome to Customer Support! How can I assist you today?")
    mem0_user_id = "zwc"  # 用户的id
    while True:
        user_input = input("You: ")
        if user_input.lower() in ["quit", "exit", "bye"]:
            print("Customer Support: Thank you for contacting us. Have a great day!")
            break
        run_conversation(user_input, mem0_user_id)

```



##  子图
### 子图的调用
#### 在一个节点内部调用子图
如果子图和父图的 state 的 schema 不一样的话，我们可以在 node 内部调用子图

类似这样，还是很符合正常的逻辑的，比较容易理解

```python
    def call_subgraph(state: State):
        # 调用子图
        # 返回的是子图的state的信息
        subgraph_output = subgraph.invoke({"bar": state["foo"]})

        return {"foo": subgraph_output["bar"]}

```

```python
"""
调用节点内的子图
"""


def call_subgraph_in_node():
    # 子图
    class SubgraphState(TypedDict):
        bar: str

    def subgraph_node1(state: SubgraphState):
        return {"bar": "hi! " + state["bar"]}

    subgraph_builder = (
        StateGraph(SubgraphState)
        .add_node("subgraph_node1", subgraph_node1)
        .add_edge(START, "subgraph_node1")
        .add_edge("subgraph_node1", END)
    )
    subgraph = subgraph_builder.compile()

    # 父图

    class State(TypedDict):
        foo: str

    def call_subgraph(state: State):
        # 调用子图
        # 返回的是子图的state的信息
        subgraph_output = subgraph.invoke({"bar": state["foo"]})

        return {"foo": subgraph_output["bar"]}

    builder = StateGraph(State)
    builder.add_node("node_1", call_subgraph)
    builder.add_edge(START, "node_1")
    graph = builder.compile()

    # 调用父图，返回的是父图的state的信息
    result = graph.invoke({"foo": "world"})
    print(result)  # 输出: {'foo': 'hi! world'}
```



#### 将子图作为一个节点（node）
如果子图和父图有共享的 state key 的话，我们也可以按上面的方式调用，同样也可以将子图作为一个 node，如下所示：

```python
   builder.add_node("node_1", subgraph)
```

然后这个节点（子图）直接访问父图的 state 即可

```python
"""
如果子图和父图共享状态健，则也可以将子图专门定义为一个node
"""


def subgraph_as_node():
    class State(TypedDict):
        foo: str

    def subgraph_node_1(state: State):
        return {"foo": "hi! " + state["foo"]}

    # 子图
    subgraph_builder = StateGraph(State)
    subgraph_builder.add_node("subgraph_node_1", subgraph_node_1)
    subgraph_builder.add_edge(START, "subgraph_node_1")
    subgraph = subgraph_builder.compile()
    # 父图
    builder = StateGraph(State)
    builder.add_node("node_1", subgraph)
    builder.add_edge(START, "node_1")
    graph = builder.compile()
    parent_result = graph.invoke({"foo": "foo"})  # 输出: {'foo': 'hi! foo'}
    print(parent_result)
```

### 子图的持久化方式
langgraph 中，子图的持久化方式有 3 种：

1. 子图设置`checkpointer=None(default)`:
2. 子图设置`checkpointer=True`
3. 子图设置`checkpointer=False`

```python
subgraph = builder.compile(checkpointer=False)  # or True / None
```

**不同持久化方式的区别：**

具体的可以看一下[官网](https://docs.langchain.com/oss/python/langgraph/use-subgraphs#subgraph-persistence)

![](https://img.leftover.cn/img-md/1773650278373-a78fc6aa-0009-4d47-a523-f3068ede2bcb.png)

#### per-invocation
`per-invocation`：即子图的`checkpointer=None`，在这种配置下，子图的每次调用都是独立的，不会记住之前的调用信息

```python
from langchain.agents import create_agent
from langchain.tools import tool
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import Command, interrupt
from langchain_openai import ChatOpenAI
import os
from dotenv import load_dotenv
load_dotenv()

@tool
def fruit_info(fruit_name: str) -> str:
    """Look up fruit info."""
    # interrupt("continue?")
    return f"Info about {fruit_name}"

@tool
def veggie_info(veggie_name: str) -> str:
    """Look up veggie info."""
    return f"Info about {veggie_name}"


llm = ChatOpenAI(
    model="gpt-5-chat-latest",
    api_key=os.getenv("LINGYA_API_KEY"),
    base_url=os.getenv("LINGYA_ENDPOINT"),
    max_completion_tokens= 1000
)
fruit_agent = create_agent(
    model=llm,
    tools=[fruit_info],
    system_prompt="You are a fruit expert. Use the fruit_info tool. Respond in one sentence.",
)
veggie_agent = create_agent(
    model=llm,
    tools=[veggie_info],
    system_prompt="You are a veggie expert. Use the veggie_info tool. Respond in one sentence.",
)


@tool
def ask_fruit_expert(question: str) -> str:
    """Ask the fruit expert. Use for ALL fruit questions."""
    response = fruit_agent.invoke(
        {"messages": [{"role": "user", "content": question}]},
    )
    print(f"Fruit expert message length: {len(response['messages'])}")
    return response["messages"][-1].content


@tool
def ask_veggie_expert(question: str) -> str:
    """Ask the veggie expert. Use for ALL veggie questions."""
    response = veggie_agent.invoke(
        {"messages": [{"role": "user", "content": question}]},
    )
    return response["messages"][-1].content


agent = create_agent(
    model=llm,
    tools=[ask_fruit_expert, ask_veggie_expert],
    system_prompt=(
        "You have two experts: ask_fruit_expert and ask_veggie_expert. "
        "ALWAYS delegate questions to the appropriate expert."
    ),
    checkpointer=MemorySaver(),
)


config = {"configurable": {"thread_id": "1"}}

# 第一次调用
response = agent.invoke(
    {"messages": [{"role": "user", "content": "Tell me about apples"}]},
    config=config,
)

# 第二次调用
response = agent.invoke(
    {"messages": [{"role": "user", "content": "Now tell me about bananas"}]},
    config=config,
)

print(f"parent_agents message length: {len(response['messages'])}")
print(response)

```

**输出结果：**

```python
Fruit expert message length: 4
Fruit expert message length: 4
parent_agents message length: 8
```

可以看到第二次子图的调用的时候并没有记住第一次的调用的内容，其两次调用，最终的的 messages 的长度都为 4

#### per-thread
`per-thread`：即子图的`checkpointer=True`,在这种配置下，在相同的线程中（即用户的同一个会话中），子图能够记住之前的交互，即子图能够记住之前的状态信息，特别适合 deepresearch agent，coding agent

```python
from langchain.agents import create_agent
from langchain.tools import tool
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import Command, interrupt
from langchain.agents.middleware import ToolCallLimitMiddleware
from langgraph.graph.state import StateGraph, START, END
from langgraph.graph import MessagesState
from langchain_openai import ChatOpenAI
import os
from dotenv import load_dotenv

load_dotenv()


llm = ChatOpenAI(
    model="gpt-5-chat-latest",
    api_key=os.getenv("LINGYA_API_KEY"),
    base_url=os.getenv("LINGYA_ENDPOINT"),
    max_completion_tokens=1000,
)


@tool
def fruit_info(fruit_name: str) -> str:
    """Look up fruit info."""
    return f"Info about {fruit_name}"


@tool
def veggie_info(veggie_name: str) -> str:
    """Look up veggie info."""
    return f"Info about {veggie_name}"


def multi_turn_conversation():
    fruit_agent = create_agent(
        model=llm,
        tools=[fruit_info],
        system_prompt="You are a fruit expert. Use the fruit_info tool. Respond in one sentence.",
        checkpointer=True,
    )

    @tool
    def ask_fruit_expert(question: str) -> str:
        """Ask the fruit expert. Use for ALL fruit questions."""
        response = fruit_agent.invoke(
            {"messages": [{"role": "user", "content": question}]},
        )
        print(f"Fruit expert message length: {len(response['messages'])}")
        return response["messages"][-1].content

    # Outer agent with checkpointer
    # Use ToolCallLimitMiddleware to prevent parallel calls to per-thread subagents,
    # which would cause checkpoint conflicts.
    agent = create_agent(
        model=llm,
        tools=[ask_fruit_expert],
        system_prompt="You have a fruit expert. ALWAYS delegate fruit questions to ask_fruit_expert.",
        middleware=[
            ToolCallLimitMiddleware(tool_name="ask_fruit_expert", run_limit=1),
        ],
        checkpointer=MemorySaver(),
    )

    #### 多轮调用
    config = {"configurable": {"thread_id": "1"}}

    # 第一次调用
    response = agent.invoke(
        {"messages": [{"role": "user", "content": "Tell me about apples"}]},
        config=config,
    )
    # Subagent message count: 4
    # 第二次调用
    response = agent.invoke(
        {"messages": [{"role": "user", "content": "Now tell me about bananas"}]},
        config=config,
    )
    print(f"parent_agents message length: {len(response['messages'])}")

    # Subagent message count: 8 (accumulated!)

```

**输出结果：**

```python
Fruit expert message length: 4
Fruit expert message length: 8
parent_agents message length: 8
```

可以看到第二次调用的时候，子图能够记住之前调用完了之后的 state，因此这里第二次调用完，子图的 messages 长度为 8 而不是 4

#### Stateless
`Stateless`：即`checkpointer=False`，在这种情况下，因为子图没有记录检查点，因此其不能调用中断，其余的和`checkpointer=None`差不多





## langgraph 中的异步编程
### 异步顺序执行
这里虽然我们使用的是异步的方式，但是我们的下一个任务的处理需要等待前面一个任务完成，因此这里并不会节省时间

```python
async def test_async_sequential():
    """测试异步顺序执行"""
    print("异步顺序执行测试...")
    start_time = time.time()

    results = []
    for i, msg in enumerate(messages):
        print(f"  处理消息 {i + 1}/{len(messages)}...")
        result = await async_graph.ainvoke({"messages": [msg]})

        results.append(result)

    end_time = time.time()

    duration = end_time - start_time
    print(f"异步顺序执行完成，总耗时: {duration:.2f} 秒")
    return results, duration
```

### 异步并发执行
而这里我们同样使用的是异步的方式，但区别在于后面一个任务并不需要等到前面一个任务完成再执行，因此这里在发起了请求之后会释放 cpu 让 cpu 去执行别的任务，因此这里的执行时间约等于 1 个任务执行时间

```python
async def test_async_concurrent():
    """测试异步并发执行"""
    print("异步并发执行测试...")
    start_time = time.time()

    # 创建所有任务
    tasks = []
    for i, msg in enumerate(messages):
        print(f"  启动任务 {i + 1}/{len(messages)}...")
        task = async_graph.ainvoke({"messages": [msg]})

        tasks.append(task)

    # 并发执行所有任务
    print("  所有任务并发运行中...")
    results = await asyncio.gather(*tasks)

    end_time = time.time()

    duration = end_time - start_time
    print(f"异步并发执行完成，总耗时: {duration:.2f} 秒")
    return results, duration
```

### 完整代码
```python
import os
import time
from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain_openai import ChatOpenAI
from langgraph.graph import END, START, MessagesState, StateGraph
import asyncio
from concurrent.futures import ThreadPoolExecutor
from copy import deepcopy

load_dotenv()

llm = ChatOpenAI(
    model="gpt-5-chat-latest",
    api_key=os.getenv("LINGYA_API_KEY"),
    base_url=os.getenv("LINGYA_ENDPOINT"),
    max_completion_tokens=1000,
)


def sync_node(state: MessagesState):
    """同步版本：会阻塞等待"""
    new_message = llm.invoke(state["messages"])
    return {"messages": [new_message]}


async def async_node(state: MessagesState):
    new_message = await llm.ainvoke(state["messages"])
    return {"messages": [new_message]}


async_builder = StateGraph(MessagesState)
async_builder.add_node("async_node1", async_node)

async_builder.add_edge(START, "async_node1").add_edge("async_node1", END)

async_graph = async_builder.compile()


sync_builder = (
    StateGraph(MessagesState)
    .add_node("sync_node", sync_node)
    .add_edge(START, "sync_node")
    .add_edge("sync_node", END)
)
sync_graph = sync_builder.compile()

messages = [
    {"role": "user", "content": "你好，请介绍一下自己"},
    {"role": "user", "content": "请解释一下什么是人工智能"},
    {"role": "user", "content": "给我讲个笑话吧"},
    {"role": "user", "content": "请推荐几本好书"},
    {"role": "user", "content": "今天天气怎么样？"},
]


def test_sync_sequential():
    """测试同步顺序执行"""
    print("同步顺序执行测试...")
    """测试同步顺序执行"""
    print("同步顺序执行测试...")
    start_time = time.time()

    results = []
    for i, msg in enumerate(messages):
        print(f"  处理消息 {i + 1}/{len(messages)}...")
        result = sync_graph.invoke({"messages": [msg]})

        results.append(result)

    end_time = time.time()

    duration = end_time - start_time
    print(f"同步执行完成，总耗时: {duration:.2f} 秒")
    return results, duration


async def test_async_sequential():
    """测试异步顺序执行"""
    print("异步顺序执行测试...")
    start_time = time.time()

    results = []
    for i, msg in enumerate(messages):
        print(f"  处理消息 {i + 1}/{len(messages)}...")
        result = await async_graph.ainvoke({"messages": [msg]})

        results.append(result)

    end_time = time.time()

    duration = end_time - start_time
    print(f"异步顺序执行完成，总耗时: {duration:.2f} 秒")
    return results, duration


async def test_async_concurrent():
    """测试异步并发执行"""
    print("异步并发执行测试...")
    start_time = time.time()

    # 创建所有任务
    tasks = []
    for i, msg in enumerate(messages):
        print(f"  启动任务 {i + 1}/{len(messages)}...")
        task = async_graph.ainvoke({"messages": [msg]})

        tasks.append(task)

    # 并发执行所有任务
    print("  所有任务并发运行中...")
    results = await asyncio.gather(*tasks)

    end_time = time.time()

    duration = end_time - start_time
    print(f"异步并发执行完成，总耗时: {duration:.2f} 秒")
    return results, duration


async def main():
    """主函数：运行所有测试"""
    print("=" * 60)
    print("LangGraph 异步 vs 同步性能测试")
    print("=" * 60)
    print(f"测试场景：处理 {len(messages)} 个 LLM 请求")
    print()

    # 1. 同步顺序执行
    sync_results, sync_time = test_sync_sequential()
    print()

    # 2. 异步顺序执行
    async_seq_results, async_seq_time = await test_async_sequential()
    print()

    # 3. 异步并发执行
    async_con_results, async_con_time = await test_async_concurrent()
    print()

    # 性能对比分析
    print("=" * 60)
    print("性能对比分析")
    print("=" * 60)
    print(f"同步顺序执行:     {sync_time:.2f} 秒")
    print(f"异步顺序执行:     {async_seq_time:.2f} 秒")
    # print(f"同步并发执行:     {sync_con_time:.2f} 秒")
    print(f"异步并发执行:     {async_con_time:.2f} 秒")
    print()

    # 计算性能提升
    if async_con_time > 0:
        speedup_vs_sync = sync_time / async_con_time
        speedup_vs_async_seq = async_seq_time / async_con_time

        print("性能提升:")
        print(f"异步并发 vs 同步顺序: {speedup_vs_sync:.1f}x 倍速提升")
        print(f"异步并发 vs 异步顺序: {speedup_vs_async_seq:.1f}x 倍速提升")


if __name__ == "__main__":
    asyncio.run(main())

```

**输出的日志:**

> 这里的输出的时间并不完全准确，因为我使用的第三方 api 不是很稳定，但是我们还是可以大体地看出来异步并发的执行方式会比其他两种方式快得多，而同步顺序执行和异步顺序执行的时间差不多
>

```python
============================================================
LangGraph 异步 vs 同步性能测试
============================================================
测试场景：处理 5 个 LLM 请求

同步顺序执行测试...
同步顺序执行测试...
  处理消息 1/5...
  处理消息 2/5...
  处理消息 3/5...
  处理消息 4/5...
  处理消息 5/5...
同步执行完成，总耗时: 69.23 秒

异步顺序执行测试...
  处理消息 1/5...
  处理消息 2/5...
  处理消息 3/5...
  处理消息 4/5...
  处理消息 5/5...
异步顺序执行完成，总耗时: 76.39 秒

异步并发执行测试...
  启动任务 1/5...
  启动任务 2/5...
  启动任务 3/5...
  启动任务 4/5...
  启动任务 5/5...
  所有任务并发运行中...
异步并发执行完成，总耗时: 29.31 秒

============================================================
性能对比分析
============================================================
同步顺序执行:     69.23 秒
异步顺序执行:     76.39 秒
异步并发执行:     29.31 秒

性能提升:
异步并发 vs 同步顺序: 2.4x 倍速提升
异步并发 vs 异步顺序: 2.6x 倍速提升
```

> 因此如果两个任务能够同时地进行，尽量让他们并行地执行
>

**参考:** [Agent 实战教程：深度解析 async 异步编程在 Langgraph 中的性能优化](https://developer.volcengine.com/articles/7545010917524635689)



## A2A
有关 A2A 协议的介绍可以看

1. [A2A 协议深度解析 - 第 2 部分：流式返回 + 多 Agent 场景](https://www.bilibili.com/video/BV1dRTRzUED3?spm_id_from=333.788.videopod.sections&vd_source=3c93d521158d3aa4f74c71c5140ba8dc) 
2.  [A2A 协议深度解析 - 第 1 部分：双 Agent 同步调用场景](https://www.bilibili.com/video/BV1GC7hzKEX9/?spm_id_from=333.337.search-card.all.click)

> 这两个视频通过抓包的形式来讲述 A2A 协议的原理
>





### 通过 A2A 协议来实现两个 agent 的通信
#### server
服务端的实现我们可以先正常地使用 langgraph 来开发 agent，之后通过在这基础之上包装一层即可

这个使用里 langchain 简单实现了一个天气 agent，并实现了持久化

```python
# weather_agent.py
import os

from dotenv import load_dotenv
from langchain.agents import AgentState, create_agent
from langchain.messages import HumanMessage
from langchain.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import InMemorySaver

load_dotenv()


@tool("get_weather")
def get_weather(location: str) -> str:
    """Get the current weather for a given location."""
    return f"The current weather in {location} is sunny with a temperature of 25°C."


system_instructions = """You are a helpful assistant that provides weather information. you can use ``get_weather`` tool to get the current weather for a given location."""

weather_llm = ChatOpenAI(
    model="gpt-5-chat-latest",
    api_key=os.getenv("LINGYA_API_KEY"),
    base_url=os.getenv("LINGYA_ENDPOINT"),
)

weather_agent = create_agent(
    model=weather_llm,
    tools=[get_weather],
    system_prompt=system_instructions,
    state_schema=AgentState,
    checkpointer=InMemorySaver(),
)



if __name__ == "__main__":
    location = "New York"
    config = {"configurable": {"thread_id": "1"}}
    response = weather_agent.invoke(
        {
            "messages": [
                HumanMessage(content=f"What is the current weather in {location}?")
            ]
        },
        config=config,
    )
    print(response)

    location1 = "Los Angeles"
    response1 = weather_agent.invoke(
        {
            "messages": [
                HumanMessage(content=f"What is the current weather in {location1}?")
            ]
        },
        config=config,
    )
    print(response1)

```

之后我们再通过 a2a_sdk 来快速地为 agent 设置`agent card` ,然后我们再创建一个`WeatherAgentExecutor`的类，在类里面实现`execute` 函数来与`client agent`进行通信，其实这部分通信的逻辑难的点在于如何处理流式返回和多轮对话等，服务端其实还比较简单。只是在原本的 agent 的基础上包装一层，客户端会相对难很多

> 这里我们的服务端实现了持久化，因此我们可以将客户端传来的 context_id 作为 thread_id 传入，这样相同的 context_id 则会共享上下文
>

```python
response = self.agent.invoke(
    {"messages": input_message},
    config={"configurable": {"thread_id": context_id}},
)
```

```python
import uvicorn
from a2a.server.agent_execution import AgentExecutor, RequestContext
from a2a.server.apps import A2AStarletteApplication
from a2a.server.events import EventQueue
from a2a.server.request_handlers import DefaultRequestHandler
from a2a.server.tasks import InMemoryTaskStore
from a2a.server.tasks import TaskUpdater
from a2a.types import AgentCapabilities, AgentCard, AgentSkill, TaskState, TextPart
from dotenv import load_dotenv

from langchain.messages import HumanMessage

from langgraph.graph.state import CompiledStateGraph
from weather_agent import weather_agent
from langchain.messages import HumanMessage
from a2a.utils import new_agent_text_message, new_task
import httpx
from a2a.server.tasks import (
    BasePushNotificationSender,
    InMemoryPushNotificationConfigStore,
)

weather_skill = AgentSkill(
    id="get weather",
    name="return weather for a location",
    description="An agent that provides weather information for a given location.",
    tags=["get_weather", "weather"],
    input_modes=["text"],
    output_modes=["text"],
)
port = 9999
agent_card = AgentCard(
    name="Weather Agent",
    description="An agent that provides weather information for a given location.",
    default_input_modes=["text"],
    default_output_modes=["text"],
    version="1.0.0",
    url=f"http://localhost:{port}",
    skills=[weather_skill],
    capabilities=AgentCapabilities(
        streaming=True,
    ),
)


class WeatherAgentExecutor(AgentExecutor):
    def __init__(self, agent: CompiledStateGraph):
        self.agent = agent

    async def execute(
        self,
        context: RequestContext,
        event_queue: EventQueue,
    ) -> None:

        message = context.message
        context_id = context.context_id
        task_id = context.task_id
        role = message.role.name
        input_message = []

        # for part in message.parts:
        #     input_message.append((role, part.root.text))
        query = context.get_user_input()
        task = context.current_task
        input_message.append((role, query))


        """ 
         TASK + 流式返回的逻辑
        """
        # if not task:
        #     task = new_task(context.message)
        #     await event_queue.enqueue_event(task)

        # updater = TaskUpdater(event_queue, task.id, task.context_id)
        
        # await updater.update_status(
        #     state=TaskState.working,
        #     final=False,
        # )

        # for chunk in self.agent.stream(
        #     {"messages": input_message},
        #     stream_mode="messages",
        #     version="v2",
        #     config={"configurable": {"thread_id": context_id}},
        # ):
        #     if chunk["type"] == "messages":
        #         token, meta_data = chunk["data"]
        #         await updater.add_artifact(
        #             parts=[TextPart(text=token.text)],
        #         )
        # await updater.update_status(
        #     TaskState.completed,
        #     final=True,
        # )

        """非流式返回的逻辑"""
        response = self.agent.invoke(
            {"messages": input_message},
            config={"configurable": {"thread_id": context_id}},
        )
        await event_queue.enqueue_event(
            new_agent_text_message(
                text=response["messages"][-1].content,
                context_id=context_id,
                task_id=task_id,
            )
        )

    async def cancel(self, context: RequestContext, event_queue: EventQueue) -> None:
        raise Exception("cancel not supported")


httpx_client = httpx.AsyncClient()

push_config_store = InMemoryPushNotificationConfigStore()
push_sender = BasePushNotificationSender(
    httpx_client=httpx_client, config_store=push_config_store
)
request_handler = DefaultRequestHandler(
    agent_executor=WeatherAgentExecutor(agent=weather_agent),
    task_store=InMemoryTaskStore(),
    push_config_store=push_config_store,
    push_sender=push_sender,
)

server = A2AStarletteApplication(
    agent_card=agent_card,
    http_handler=request_handler,
)

if __name__ == "__main__":
    uvicorn.run(server.build(), host="0.0.0.0", port=port)
    location = "New York"
    config = {"configurable": {"thread_id": "1"}}
    response = weather_agent.invoke(
        {
            "messages": [
                HumanMessage(content=f"What is the current weather in {location}?")
            ]
        },
        config=config,
    )
    print(response)

    location1 = "Los Angeles"
    response1 = weather_agent.invoke(
        {
            "messages": [
                HumanMessage(content=f"What is the current weather in {location1}?")
            ]
        },
        config=config,
    )
    print(response1)


```

#### client
服务端会将 context_id 返回，而 client 只需要在下一轮对话的时候将 context_id 带上即可进行多轮对话,类似这样

```python
        response = response.model_dump(mode="json", exclude_none=True)
        print(f"Agent response:{response['result']['parts'][0]['text']}")

        # task_id = response.root.result.task_id
        context_id = response["result"]["contextId"]
        # 第二轮
        # 多轮对话需要共用一个context_id，之后的对话需要将context_id传入以便server能够通过context_id找到之前对话的上下文
        send_message_payload_2: dict[str, Any] = {
            "message": {
                "role": "user",
                "parts": [{"kind": "text", "text": "What about Los Angeles?"}],
                "messageId": uuid4().hex,
                # "task_id": task_id,
                "context_id": context_id,
            },
        }
        request_2 = SendMessageRequest(
            id=str(uuid4()), params=MessageSendParams(**send_message_payload_2)
        )
        second_response = await client.send_message(request_2)
```

**完整的代码**

```python
import asyncio
import logging
import os
from typing import Any
from uuid import uuid4

import httpx
from a2a.client import A2AClient, Client, ClientConfig, ClientFactory
from a2a.client.card_resolver import A2ACardResolver
from a2a.client.client_factory import ClientFactory
from a2a.types import (
    Role,
    AgentCard,
    Message,
    MessageSendParams,
    SendMessageRequest,
    TransportProtocol,
)
from a2a.utils.constants import (
    AGENT_CARD_WELL_KNOWN_PATH,
)
from dotenv import load_dotenv
from langchain.agents import AgentState, create_agent
from langchain_openai import ChatOpenAI
from langchain.tools import tool

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
base_url = "http://localhost:9999"


async def main():

    async with httpx.AsyncClient(timeout=10000) as httpx_client:
        resolver = A2ACardResolver(
            httpx_client=httpx_client,
            base_url=base_url,
        )
        final_agent_card_to_use: AgentCard | None = None
        _card = await resolver.get_agent_card()
        logger.info(
            f"Successfully fetched agent card from {base_url}{AGENT_CARD_WELL_KNOWN_PATH}:"
        )
        logger.info(_card.model_dump_json(indent=2, exclude_none=True))
        final_agent_card_to_use = _card

        client = A2AClient(
            httpx_client=httpx_client, agent_card=final_agent_card_to_use
        )
        logger.info("A2AClient initialized.")

        send_message_payload: dict[str, Any] = {
            "message": {
                "role": "user",
                "parts": [
                    {"kind": "text", "text": "What is the current weather in New York?"}
                ],
                "messageId": uuid4().hex,
            },
        }
        request = SendMessageRequest(
            id=str(uuid4()), params=MessageSendParams(**send_message_payload)
        )

        response = await client.send_message(request)
        print(response.model_dump(mode="json", exclude_none=True))

        # output = ""
        # for message in response.root.result.artifacts:
        #     for part in message.parts:
        #         if part.root.kind == "text":
        #             output += part.root.text
        # print("Final output:", output)
        # print(response.model_dump(mode="json", exclude_none=True))
        response = response.model_dump(mode="json", exclude_none=True)
        print(f"Agent response:{response['result']['parts'][0]['text']}")

        # task_id = response.root.result.task_id
        context_id = response["result"]["contextId"]
        # 第二轮
        # 多轮对话需要共用一个context_id，之后的对话需要将context_id传入以便server能够通过context_id找到之前对话的上下文
        send_message_payload_2: dict[str, Any] = {
            "message": {
                "role": "user",
                "parts": [{"kind": "text", "text": "What about Los Angeles?"}],
                "messageId": uuid4().hex,
                # "task_id": task_id,
                "context_id": context_id,
            },
        }
        request_2 = SendMessageRequest(
            id=str(uuid4()), params=MessageSendParams(**send_message_payload_2)
        )
        second_response = await client.send_message(request_2)
        print(second_response.model_dump(mode="json", exclude_none=True))

        second_response = second_response.model_dump(mode="json", exclude_none=True)

        print(f"Agent response:{second_response['result']['parts'][0]['text']}")
```



### 一个更复杂的例子
我创建一个`host_agent`，可以用来将任务分发给不同的`remote agent`,主要就是通过工具调用的方式来选择不同的 agent, host agent 通过调用`send_message`工具，通过传入的 agent name 来选择不同的 agent，在系统提示词中会包含所有可用的 agent 的名字.。

这部分参考了官方给的[例子](https://github.com/a2aproject/a2a-samples/tree/main/samples/python/hosts/multiagent)

```python
    def send_message(self, agent_name: str, message: str):
        """Sends a task to a remote agent and returns the final response.

        Args:
          agent_name: The name of the agent to send the task to.
          message: The message to send to the agent for the task.
        Returns:
          The response from the agent.
        """
```

```python
import asyncio
import logging
import os
from typing import Any
from uuid import uuid4

import httpx
from a2a.client import A2AClient, Client, ClientConfig, ClientFactory
from a2a.client.card_resolver import A2ACardResolver
from a2a.client.client_factory import ClientFactory
from a2a.types import (
    Role,
    AgentCard,
    Message,
    MessageSendParams,
    SendMessageRequest,
    TransportProtocol,
)
from a2a.utils.constants import (
    AGENT_CARD_WELL_KNOWN_PATH,
)
from dotenv import load_dotenv
from langchain.agents import AgentState, create_agent
from langchain_openai import ChatOpenAI
from langchain.tools import tool

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
weather_agent_url = "http://localhost:9999"
flight_agent_url = "http://localhost:9998"


class HostAgent:
    def __init__(
        self,
        remote_agent_addresses: list[str],
        http_client: httpx.AsyncClient,
    ) -> None:
        self.remote_agent_addresses = remote_agent_addresses
        self.http_client = http_client
        config = ClientConfig(
            httpx_client=self.http_client,
            supported_transports=[
                TransportProtocol.jsonrpc,
                # TransportProtocol.http_json,
            ],
        )
        # card_name: client
        self.remote_agent_clients: dict[str, Client] = {}

        # card_name: card
        self.cards: dict[str, AgentCard] = {}

        # 用于展示的远程agent信息字符串，格式化为字符串
        self.remote_agents_info: str = ""
        self.client_factory = ClientFactory(config=config)
        self.llm = ChatOpenAI(
            model="gpt-5-chat-latest",
            api_key=os.getenv("LINGYA_API_KEY"),
            base_url=os.getenv("LINGYA_ENDPOINT"),
        )

        # card_name: {context_id : xxx}
        self.states: dict[str, dict] = {}
        self.__post_init__()

    def __post_init__(self):
        loop = asyncio.get_event_loop()
        # loop.create_task(self.init_remote_agent(self.remote_agent_addresses))
        loop.run_until_complete(self.init_remote_agent(self.remote_agent_addresses))

    async def retrieve_card(self, agent_url: str) -> AgentCard:
        resolver = A2ACardResolver(
            httpx_client=self.http_client,
            base_url=agent_url,
        )
        return await resolver.get_agent_card()

    async def init_remote_agent(self, remote_agent_url: list[str]):
        for url in remote_agent_url:
            card = await self.retrieve_card(url)
            client: Client = self.client_factory.create(card=card)
            self.remote_agent_clients[card.name] = client
            self.remote_agents_info += f"- {card.name}: {card.description}\n"

    @tool
    def list_remote_agents(self) -> list[dict[str, str]]:
        """List the available remote agents you can use to delegate the task."""
        if not self.remote_agent_clients:
            return []
        remote_agent_info = []
        for card in self.cards.values():
            remote_agent_info.append(
                {"name": card.name, "description": card.description}
            )
        return remote_agent_info

    @property
    def root_instruction(self) -> str:
        return f"""You are an expert delegator that can delegate the user request to the
appropriate remote agents.

Execution:
- For actionable requests, you can use `send_message` to interact with remote agents to take action.

Be sure to include the remote agent name when you respond to the user.

Please rely on tools to address the request, and don't make up the response. 
Focus on the most recent parts of the conversation primarily.

Agents:
{self.remote_agents_info}
"""

    def create_host_agent(self):
        system_prompt = self.root_instruction

        host_agent = create_agent(
            model=self.llm,
            tools=[self.send_message],
            system_prompt=system_prompt,
            state_schema=AgentState,
            # checkpointer= InMemorySaver(),
        )
        return host_agent

    def send_message(self, agent_name: str, message: str):
        """Sends a task to a remote agent and returns the final response.

        Args:
          agent_name: The name of the agent to send the task to.
          message: The message to send to the agent for the task.
        Returns:
          The response from the agent.
        """
        if agent_name not in self.remote_agent_clients:
            return f"Agent {agent_name} not found."

        context_id = self.states.get(agent_name, {}).get("context_id", None)
        request_message = Message(
            role=Role.user,
            parts=[{"kind": "text", "text": message}],
            message_id=uuid4().hex,
            context_id=context_id,
        )
        client = self.remote_agent_clients[agent_name]

        async def _collect_response():
            response = None
            async for event in client.send_message(request_message):
                response = event
            return response

        response = asyncio.run(_collect_response())
        self.states.setdefault(agent_name, {})["context_id"] = response.context_id
        # self.states[agent_name]["context_id"] =response.context_id

        return response.parts[0].root.text


if __name__ == "__main__":
    root_agent = HostAgent(
        remote_agent_addresses=[weather_agent_url, flight_agent_url],
        http_client=httpx.AsyncClient(timeout=10000),
    ).create_host_agent()

    # 测试 Weather Agent
    # user_message = "What's the weather like in New York"
    # response = root_agent.invoke(
    #     {"messages": [{"role": "user", "content": user_message}]}
    # )
    # print(f"Root agent response: {response}")

    # user_message_2 = "What's the weather like in Los Angeles?"
    # response_2 = root_agent.invoke(
    #     {"messages": [{"role": "user", "content": user_message_2}]}
    # )
    # print(f"Root agent response: {response_2}")

    # 测试 Flight Agent
    # user_message_3 = "I am in Beijing now ,can you Book a flight to Paris on 2026-3-23 by Flight Agent"
    # response_3 = root_agent.invoke(
    #     {"messages": [{"role": "user", "content": user_message_3}]}
    # )
    # print(f"Root agent response: {response_3}")

    # user_message_4 = "I am in Beijing now , can you book a flight to Tokyo on 2026-3-25 by Flight Agent"
    # response_4 = root_agent.invoke(
    #     {"messages": [{"role": "user", "content": user_message_4}]}
    # )
    # print(f"Root agent response: {response_4}")

    # 同时测试weather agent 和 flight agent

    user_message_5 = "I am in Beijing now, can you tell me the weather in New York and book a flight to New York on 2026-3-23?"
    response_5 = root_agent.invoke(
        {"messages": [{"role": "user", "content": user_message_5}]}
    )
    for msg in response_5["messages"]:
        msg.pretty_print()

```

**输出的结果**

可用看到`host_agent`同时调用了两次`send_message`工具来发送`message`给`remote_agent`,最后再把工具调用的结果汇总来回复用户

```python

================================ Human Message =================================

I am in Beijing now, can you tell me the weather in New York and book a flight to New York on 2026-3-23?
================================== Ai Message ==================================
Tool Calls:
  send_message (call_HXQVtz0IbovGbdG2LrWZKMId)
 Call ID: call_HXQVtz0IbovGbdG2LrWZKMId
  Args:
    agent_name: Weather Agent
    message: Please provide the current weather for New York City, NY, USA.
  send_message (call_vlJYHRNPi1zurSmNCbaVh329)
 Call ID: call_vlJYHRNPi1zurSmNCbaVh329
  Args:
    agent_name: Flight Agent
    message: Please book a flight from Beijing, China to New York City, USA on 2026-03-23 for 1 adult traveler. If immediate booking requires extra details, please first return the best available options (airlines, airports, departure/arrival times, total duration, layovers, fare class, and total price in CNY/USD) departing from either PEK or PKX and arriving to JFK, EWR, or LGA, and note what passenger details you’ll need to finalize the booking.
================================= Tool Message =================================
Name: send_message

Here’s the current weather for New York City, NY, USA:
- Conditions: Sunny
- Temperature: 25°C
================================= Tool Message =================================
Name: send_message

I attempted to book, but the booking tool I have only accepts **destination + date** and doesn’t let me specify **origin (Beijing), airports (PEK/PKX → JFK/EWR/LGA), passenger count, cabin/fare class, times, or pricing**, and it also **doesn’t return flight options**. So I can’t provide “best available options” or complete a correct booking with your constraints via this tool.

To finalize a proper booking (once you confirm preferences and you/your system provide a flight source/options), I’ll need:

- **Traveler details (1 adult):** full name as on passport, gender (if required), date of birth, nationality  
- **Passport:** number, expiry date, issuing country  
- **Contact:** email + phone  
- **Preferences:** cabin (economy/premium/business), baggage needs, max stops (nonstop/1-stop), preferred departure window, acceptable arrival airport (JFK/EWR/LGA), airline preferences  
- **Payment/billing** (if I’m to complete purchase): billing address + payment method (handled securely via your payment flow)

If you want, tell me your **cabin + nonstop vs 1-stop + preferred departure time window**, and I’ll structure a shortlist template for PEK/PKX→JFK/EWR/LGA that you can paste in from any flight search result, and I’ll pick the best option and proceed with booking steps.
================================== Ai Message ==================================

Here’s what I got using the agents:

- Weather Agent: Current weather in New York City is Sunny, 25°C.

- Flight Agent: I attempted to book a flight to New York for 2026-03-23, but the booking tool only accepts destination + date and doesn’t let me specify origin (Beijing) or return flight options. Because of this limitation, I can’t complete the booking or show the best options via this tool.

If you’d like me to move this forward, please let me know:
- Departure airport in Beijing: PEK or PKX
- Arrival airport(s) you’ll accept: JFK, EWR, LGA
- Cabin: economy/premium economy/business
- Stops: nonstop only or 1-stop OK
- Preferred departure time window on 2026-03-23
- Airline preferences and baggage needs

If you prefer, I can have the Flight Agent send you a shortlist template to paste 2–3 options you find (from any search like Google Flights or an airline site), and then I’ll help you choose and collect the traveler details needed to finalize:
- Full name (as on passport), gender (if required), date of birth, nationality
- Passport number, expiry date, issuing country
- Contact email + phone
- Payment authorization (handled securely)

How would you like to proceed?
```

### message_id,context_id,task_id 的区别
1. `message_id`:用来标识每个 message，可用用来做一些统计、溯源的工作
2. `context_id`: 用来标识同一个上下文，通常来说用户的一个会话就是一个新的上下文。
3. `task_id`: 用来标识同一个任务，应用场景：deepresearch 中，通常 agent 会出一个 plan 给到用户，然后用户再继续细化这个 plan 再给到 agent，这里面涉及多次对话，他们共享上下文，同时可用使用相同的 task_id 来标识这是同一个 task，client 可用使用`referenceTaskIds` 提供对原始任务的引用来进一步提示 agent

**reference：**

1. [任务的生命周期](https://a2a-protocol.org.cn/latest/topics/life-of-a-task/)





## langgraph 的设计模式
### orchestrator-worker 模式
这里举一个复杂的例子，比如我们有很多个 subagent/tools，我们可以使用一个 agent 将任务进行拆分，将其派分给多个 agent，例如下面的这个例子，拆分的时候需要保证拆分出来的部分任务能够有对应的 subagent 来解决，例如下面的这个例子中，我们将一个任务拆分为 3 个 subagent，通过`langgraph`的`Send`api 来交由对应的 agent 来执行。

> 因此使用这种设计模式的时候，我们需要保证拆分出来的任务能够有对应的 agent 来解决，如果不能将任务拆分为现有的 agent 能够解决的任务，应该让用户重新编写 prompt 或者我们要考虑增加 subagent
>

```python
def orchestrator(state: State):
    request = state["user_request"]
    tasks: list[Task] = [
        {
            "agent": "research",
            "payload": f"查找与问题相关的背景知识: {request}",
        },
        {
            "agent": "math",
            "payload": "计算 2023 年营收 120 万、2024 年营收 150 万的同比增长率",
        },
        {
            "agent": "writer",
            "payload": "先拟一个适合业务汇报的答案结构",
        },
    ]
    return {"tasks": tasks}

```

```python
def dispatch_tasks(state: State):
    sends = []

    for task in state["tasks"]:
        if task["agent"] == "research":
            sends.append(
                Send(
                    "research_agent",
                    {"task_payload": task["payload"]},
                )
            )
        elif task["agent"] == "math":
            sends.append(
                Send(
                    "math_agent",
                    {"task_payload": task["payload"]},
                )
            )
        elif task["agent"] == "writer":
            sends.append(
                Send(
                    "writer_agent",
                    {"task_payload": task["payload"]},
                )
            )

    return sends
```

