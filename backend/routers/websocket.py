from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict

router = APIRouter(tags=["WebSocket"])

class ConnectionManager:
    def __init__(self):
        # แยกห้อง (Rooms) สำหรับหน้าจอแสดงผล และ เครื่องปริ้น
        self.active_connections: Dict[str, List[WebSocket]] = {
            "display": [],
            "printer": []
        }

    async def connect(self, websocket: WebSocket, client_type: str):
        await websocket.accept()
        if client_type in self.active_connections:
            self.active_connections[client_type].append(websocket)

    def disconnect(self, websocket: WebSocket, client_type: str):
        if client_type in self.active_connections:
            self.active_connections[client_type].remove(websocket)

    async def broadcast(self, message: dict, client_type: str):
        for connection in self.active_connections.get(client_type, []):
            await connection.send_json(message)

manager = ConnectionManager()

@router.websocket("/ws/{client_type}")
async def websocket_endpoint(websocket: WebSocket, client_type: str):
    # client_type = "display" หรือ "printer"
    await manager.connect(websocket, client_type)
    try:
        while True:
            # รอรับข้อมูล ping/pong ป้องกัน connection หลุด
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, client_type)