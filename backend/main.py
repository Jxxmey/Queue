from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import queue, websocket, officer, auth, tts

app = FastAPI(title="Queue System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(queue.router)
app.include_router(websocket.router)
app.include_router(officer.router)
app.include_router(tts.router)

@app.get("/")
def read_root():
    return {"message": "Queue System Backend is running!"}
# คำสั่งรัน: python -m uvicorn main:app --reload