"""
Contextual Memory Engine for chat applications.
Features:
- Sliding Window Memory
- Persistent Local Chat History
- Context-Aware Interactions
- Configurable, modular, and efficient
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from tinydb import TinyDB, Query
import os
import threading
import json

# --- Sliding Window Memory ---
class SlidingWindowMemory:
    """
    Maintains a configurable window of recent conversation turns.
    Automatically trims older messages when window size is exceeded.
    """
    def __init__(self, window_size: int = 10):
        self.window_size = window_size
        self.messages: List[Dict[str, Any]] = []
        self.lock = threading.Lock()

    def add_message(self, message: Dict[str, Any]):
        with self.lock:
            self.messages.append(message)
            if len(self.messages) > self.window_size:
                self.messages = self.messages[-self.window_size:]

    def get_messages(self) -> List[Dict[str, Any]]:
        with self.lock:
            return list(self.messages)

    def set_window_size(self, size: int):
        with self.lock:
            self.window_size = size
            if len(self.messages) > size:
                self.messages = self.messages[-size:]

# --- Persistent Local Chat History ---
class PersistentChatHistory:
    """
    Stores conversation history locally (file system or DB).
    Supports metadata (timestamps, session IDs, etc.) and persistence across restarts.
    """
    def __init__(self, db_path: str = "chat_history.json"):
        self.db = TinyDB(db_path)
        self.lock = threading.Lock()

    def save_message(self, session_id: str, message: Dict[str, Any]):
        with self.lock:
            self.db.insert({
                "session_id": session_id,
                "timestamp": message.get("timestamp", datetime.utcnow().isoformat()),
                "role": message.get("role"),
                "content": message.get("content"),
                "metadata": message.get("metadata", {})
            })

    def get_history(self, session_id: str) -> List[Dict[str, Any]]:
        with self.lock:
            return self.db.search(Query().session_id == session_id)

    def export_history(self, session_id: Optional[str] = None) -> str:
        with self.lock:
            if session_id:
                history = self.get_history(session_id)
            else:
                history = self.db.all()
            return json.dumps(history, indent=2)

    def import_history(self, data: str):
        with self.lock:
            try:
                messages = json.loads(data)
                for msg in messages:
                    self.db.insert(msg)
            except Exception as e:
                raise ValueError(f"Failed to import history: {e}")

    def search_messages(self, session_id: str, query: str) -> List[Dict[str, Any]]:
        with self.lock:
            return [msg for msg in self.get_history(session_id) if query.lower() in msg.get("content", "").lower()]

    def clear_history(self, session_id: Optional[str] = None):
        with self.lock:
            if session_id:
                self.db.remove(Query().session_id == session_id)
            else:
                self.db.truncate()

# --- Contextual Memory Engine ---
class ContextualMemoryEngine:
    """
    Combines sliding window and persistent memory for context-aware chat.
    Provides interfaces for adding, retrieving, and searching messages.
    """
    def __init__(self, window_size: int = 10, db_path: str = "chat_history.json"):
        self.window = SlidingWindowMemory(window_size)
        self.history = PersistentChatHistory(db_path)

    def add_message(self, session_id: str, message: Dict[str, Any]):
        self.window.add_message(message)
        self.history.save_message(session_id, message)

    def get_recent_context(self) -> List[Dict[str, Any]]:
        return self.window.get_messages()

    def get_full_history(self, session_id: str) -> List[Dict[str, Any]]:
        return self.history.get_history(session_id)

    def search_history(self, session_id: str, query: str) -> List[Dict[str, Any]]:
        return self.history.search_messages(session_id, query)

    def export_history(self, session_id: Optional[str] = None) -> str:
        return self.history.export_history(session_id)

    def import_history(self, data: str):
        self.history.import_history(data)

    def clear_history(self, session_id: Optional[str] = None):
        self.history.clear_history(session_id)

    def set_window_size(self, size: int):
        self.window.set_window_size(size)

# Optional: Memory compression for long-term storage efficiency can be added as a method here. 