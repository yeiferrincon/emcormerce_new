from typing import Dict, Set
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        # user_id -> set of WebSocket connections
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        # Set de admin user_ids
        self.admin_connections: Set[int] = set()

    async def connect(self, user_id: int, websocket: WebSocket, is_admin: bool = False):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        if is_admin:
            self.admin_connections.add(user_id)

    def disconnect(self, user_id: int, websocket: WebSocket):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                self.admin_connections.discard(user_id)

    async def send_personal_message(self, user_id: int, message: dict):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    self.disconnect(user_id, connection)

    async def broadcast_to_user(self, user_id: int, message: dict):
        await self.send_personal_message(user_id, message)

    async def broadcast_to_admins(self, message: dict):
        for admin_id in self.admin_connections:
            await self.send_personal_message(admin_id, message)


manager = ConnectionManager()
