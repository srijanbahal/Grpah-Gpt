import asyncio
import aiohttp
import os

from langchain.callbacks.base import AsyncCallbackHandler
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, ToolMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import ConfigurableField
from langchain_core.tools import tool
# from gemini_sdk import GeminiChat
from pydantic import BaseModel, SecretStr
from dotenv import load_dotenv
load_dotenv()

from memory import ContextualMemoryEngine
from datetime import datetime


# Constants and Configuration
# GEMINI_API_KEY = SecretStr(os.environ["GEMINI_API_KEY"])
# google_api_key=GEMINI_API_KEY.get_secret_value()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SERPAPI_API_KEY = os.getenv("SERPAPI_API_KEY")
if SERPAPI_API_KEY is None:
    raise RuntimeError("SERPAPI_API_KEY environment variable is not set. Please set it in your .env file or environment.")

# LLM and Prompt Setup
from langchain_google_genai import ChatGoogleGenerativeAI

llm = ChatGoogleGenerativeAI(
    model="models/gemini-1.5-flash", 
    temperature=0.0,
    streaming=True,
    google_api_key=GEMINI_API_KEY
)

prompt = ChatPromptTemplate.from_messages([
    ("system", (
        "You're a helpful assistant. When answering a user's question "
        "you should first use one of the tools provided. After using a "
        "tool the tool output will be provided back to you. When you have "
        "all the information you need, you MUST use the final_answer tool "
        "to provide a final answer to the user. Use tools to answer the "
        "user's CURRENT question, not previous questions."
    )),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}"),
    MessagesPlaceholder(variable_name="agent_scratchpad"),
])

# we use the article object for parsing serpapi results later
class Article(BaseModel):
    title: str
    source: str
    link: str
    snippet: str

    @classmethod
    def from_serpapi_result(cls, result: dict) -> "Article":
        return cls(
            title=result.get("title", ""),
            source=result.get("source", ""),
            link=result.get("link", ""),
            snippet=result.get("snippet", ""),
        )

# Tools definition
# note: we define all tools as async to simplify later code, but only the serpapi
# tool is actually async
@tool
async def add(x: float, y: float) -> float:
    """Add 'x' and 'y'."""
    return x + y

@tool
async def multiply(x: float, y: float) -> float:
    """Multiply 'x' and 'y'."""
    return x * y

@tool
async def exponentiate(x: float, y: float) -> float:
    """Raise 'x' to the power of 'y'."""
    return x ** y

@tool
async def subtract(x: float, y: float) -> float:
    """Subtract 'x' from 'y'."""
    return y - x

@tool
async def serpapi(query: str) -> list[Article]:
    """Use this tool to search the web."""
    params = {
        "api_key": SERPAPI_API_KEY.get_secret_value(),
        "engine": "google",
        "q": query,
    }
    async with aiohttp.ClientSession() as session:
        async with session.get(
            "https://serpapi.com/search",
            params=params
        ) as response:
            results = await response.json()
    return [Article.from_serpapi_result(result) for result in results["organic_results"]]

@tool
async def final_answer(answer: str, tools_used: list[str]) -> dict[str, str | list[str]]:
    """Use this tool to provide a final answer to the user."""
    return {"answer": answer, "tools_used": tools_used}

tools = [add, subtract, multiply, exponentiate, final_answer, serpapi]
# note when we have sync tools we use tool.func, when async we use tool.coroutine
name2tool = {tool.name: tool.coroutine for tool in tools}

# Streaming Handler
class QueueCallbackHandler(AsyncCallbackHandler):
    def __init__(self, queue: asyncio.Queue):
        self.queue = queue
        self.final_answer_seen = False

    async def __aiter__(self):
        while True:
            if self.queue.empty():
                await asyncio.sleep(0.1)
                continue
            token_or_done = await self.queue.get()
            if token_or_done == "<<DONE>>":
                return
            if token_or_done:
                yield token_or_done
    
    async def on_llm_new_token(self, *args, **kwargs) -> None:
        chunk = kwargs.get("chunk")
        if chunk and chunk.message.additional_kwargs.get("tool_calls"):
            if chunk.message.additional_kwargs["tool_calls"][0]["function"]["name"] == "final_answer":
                self.final_answer_seen = True
        self.queue.put_nowait(kwargs.get("chunk"))
    
    async def on_llm_end(self, *args, **kwargs) -> None:
        if self.final_answer_seen:
            self.queue.put_nowait("<<DONE>>")
        else:
            self.queue.put_nowait("<<STEP_END>>")

async def execute_tool(tool_call: AIMessage) -> ToolMessage:
    tool_name = tool_call.tool_calls[0]["name"]
    tool_args = tool_call.tool_calls[0]["args"]
    tool_out = await name2tool[tool_name](**tool_args)
    return ToolMessage(
        content=f"{tool_out}",
        tool_call_id=tool_call.tool_calls[0]["id"]
    )

# Agent Executor
class CustomAgentExecutor:
    def __init__(self, max_iterations: int = 3, window_size: int = 10, db_path: str = "chat_history.json", session_id: str = "default_session"):
        self.memory = ContextualMemoryEngine(window_size=window_size, db_path=db_path)
        self.session_id = session_id
        self.max_iterations = max_iterations
        self.agent = (
            {
                "input": lambda x: x["input"],
                "chat_history": lambda x: self.memory.get_recent_context(),
                "agent_scratchpad": lambda x: x.get("agent_scratchpad", [])
            }
            | prompt
            | llm.bind_tools(tools, tool_choice="any")
        )

    async def invoke(self, input: str, streamer: QueueCallbackHandler, verbose: bool = False, session_id: str = None) -> dict:
        session_id = session_id or self.session_id
        count = 0
        final_answer: str | None = None
        agent_scratchpad: list[AIMessage | ToolMessage] = []
        timestamp = datetime.utcnow().isoformat()
        # streaming function
        async def stream(query: str) -> list[AIMessage]:
            response = self.agent.with_config(
                callbacks=[streamer]
            )
            outputs = []
            async for token in response.astream({
                "input": query,
                "chat_history": self.memory.get_recent_context(),
                "agent_scratchpad": agent_scratchpad
            }):
                tool_calls = token.additional_kwargs.get("tool_calls")
                if tool_calls:
                    if tool_calls[0]["id"]:
                        outputs.append(token)
                    else:
                        outputs[-1] += token
                else:
                    pass
            return [
                AIMessage(
                    content=x.content,
                    tool_calls=x.tool_calls,
                    tool_call_id=x.tool_calls[0]["id"]
                ) for x in outputs
            ]

        while count < self.max_iterations:
            tool_calls = await stream(query=input)
            tool_obs = await asyncio.gather(
                *[execute_tool(tool_call) for tool_call in tool_calls]
            )
            id2tool_obs = {tool_call.tool_call_id: tool_obs for tool_call, tool_obs in zip(tool_calls, tool_obs)}
            for tool_call in tool_calls:
                agent_scratchpad.extend([
                    tool_call,
                    id2tool_obs[tool_call.tool_call_id]
                ])
            count += 1
            found_final_answer = False
            for tool_call in tool_calls:
                if tool_call.tool_calls[0]["name"] == "final_answer":
                    final_answer_call = tool_call.tool_calls[0]
                    final_answer = final_answer_call["args"]["answer"]
                    found_final_answer = True
                    break
            if found_final_answer:
                break
        # Add user and AI messages to memory (sliding window + persistent)
        self.memory.add_message(session_id, {
            "role": "user",
            "content": input,
            "timestamp": timestamp
        })
        self.memory.add_message(session_id, {
            "role": "ai",
            "content": final_answer if final_answer else "No answer found",
            "timestamp": datetime.utcnow().isoformat()
        })
        return final_answer_call if final_answer else {"answer": "No answer found", "tools_used": []}

# Initialize agent executor
agent_executor = CustomAgentExecutor()  