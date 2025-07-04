import asyncio

from agent import QueueCallbackHandler, agent_executor, CustomAgentExecutor
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from memory import ContextualMemoryEngine
import uuid
from pydantic import BaseModel

# initializing our application
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Global memory engine for session management
memory_engine = ContextualMemoryEngine()

# Pydantic model for /invoke
class InvokeRequest(BaseModel):
    content: str
    session_id: str

# streaming function
async def token_generator(content: str, streamer: QueueCallbackHandler, session_id: str):
    task = asyncio.create_task(agent_executor.invoke(
        input=content,
        streamer=streamer,
        verbose=True,  # set to True to see verbose output in console
        session_id=session_id
    ))
    async for token in streamer:
        try:
            if token == "<<STEP_END>>":
                yield "</step>"
            elif hasattr(token, 'message') and (tool_calls := token.message.additional_kwargs.get("tool_calls")):
                if tool_name := tool_calls[0]["function"]["name"]:
                    yield f"<step><step_name>{tool_name}</step_name>"
                if tool_args := tool_calls[0]["function"].get("arguments"):
                    yield tool_args
        except Exception as e:
            print(f"Error streaming token: {e}")
            continue
    await task

# POST /invoke with JSON body
@app.post("/invoke")
async def invoke(request: InvokeRequest):
    if not request.session_id:
        raise HTTPException(status_code=400, detail="session_id is required")
    queue: asyncio.Queue = asyncio.Queue()
    streamer = QueueCallbackHandler(queue)
    return StreamingResponse(
        token_generator(request.content, streamer, request.session_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )

# GET /history/{session_id} - retrieve chat history
@app.get("/history/{session_id}")
async def get_history(session_id: str):
    try:
        history = memory_engine.get_full_history(session_id)
        return JSONResponse(content=history)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve history: {e}")

# POST /sessions - create new session
@app.post("/sessions")
async def create_session():
    session_id = str(uuid.uuid4())
    # Optionally, initialize session in memory engine
    return {"session_id": session_id}

# DELETE /sessions/{session_id} - delete session
@app.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    try:
        memory_engine.clear_history(session_id)
        return {"detail": f"Session {session_id} deleted."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete session: {e}")
