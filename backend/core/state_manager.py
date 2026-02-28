"""
state_manager.py — Conversation state and session memory.
In-memory store with TTL cleanup. Upgrade path: swap _sessions dict for Redis/SQLite.
"""

from __future__ import annotations

import logging
import threading
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Optional

from backend.config import settings

logger = logging.getLogger(__name__)


@dataclass
class SessionState:
    session_id: str
    active_plug: str
    messages: list[dict] = field(default_factory=list)
    user_context: dict = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_active: datetime = field(default_factory=datetime.utcnow)

    def touch(self):
        self.last_active = datetime.utcnow()

    def is_expired(self, ttl_seconds: int) -> bool:
        return datetime.utcnow() - self.last_active > timedelta(seconds=ttl_seconds)

    def recent_messages(self, n: int = 10) -> list[dict]:
        """Return the last N messages for prompt injection."""
        return self.messages[-n:]

    def conversation_summary(self) -> str:
        """Lightweight text summary for handoff context."""
        lines = []
        for msg in self.messages[-6:]:
            role = msg["role"].upper()
            content = msg["content"][:200]
            lines.append(f"{role}: {content}")
        return "\n".join(lines)


class StateManager:
    """
    Thread-safe in-memory session store.
    One StateManager instance lives on the FastAPI app for the entire process.
    """

    def __init__(self):
        self._sessions: dict[str, SessionState] = {}
        self._lock = threading.Lock()
        self._ttl = settings.session_ttl_seconds
        logger.info("StateManager initialised")

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def get_or_create(self, session_id: str, plug_name: str) -> SessionState:
        with self._lock:
            if session_id not in self._sessions:
                self._sessions[session_id] = SessionState(
                    session_id=session_id,
                    active_plug=plug_name,
                )
                logger.info(f"New session created: {session_id} plug={plug_name}")
            session = self._sessions[session_id]
            session.touch()
            return session

    def get(self, session_id: str) -> Optional[SessionState]:
        with self._lock:
            return self._sessions.get(session_id)

    def add_message(self, session_id: str, role: str, content: str):
        with self._lock:
            session = self._sessions.get(session_id)
            if session:
                session.messages.append({
                    "role": role,
                    "content": content,
                    "timestamp": datetime.utcnow().isoformat(),
                })
                session.touch()

    def switch_plug(self, session_id: str, new_plug: str) -> SessionState:
        with self._lock:
            session = self._sessions.get(session_id)
            if not session:
                raise KeyError(f"Session {session_id} not found")
            old = session.active_plug
            session.active_plug = new_plug
            session.touch()
            # Inject a system marker into history so agents know a handoff occurred
            session.messages.append({
                "role": "system",
                "content": f"[PLUG SWITCH: {old} → {new_plug}]",
                "timestamp": datetime.utcnow().isoformat(),
            })
            logger.info(f"Session {session_id}: plug switched {old} → {new_plug}")
            return session

    def update_user_context(self, session_id: str, key: str, value):
        with self._lock:
            session = self._sessions.get(session_id)
            if session:
                session.user_context[key] = value
                session.touch()

    def session_count(self) -> int:
        with self._lock:
            return len(self._sessions)

    def expire_old_sessions(self):
        """Called periodically or at shutdown to free memory."""
        with self._lock:
            expired = [
                sid for sid, s in self._sessions.items()
                if s.is_expired(self._ttl)
            ]
            for sid in expired:
                del self._sessions[sid]
                logger.info(f"Session expired and removed: {sid}")

    def shutdown(self):
        self.expire_old_sessions()
        logger.info("StateManager shut down cleanly")
