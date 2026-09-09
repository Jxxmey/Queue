from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime
from database import get_collection
from models.schemas import QueueCreate, QueueResponse, QueueCall, QueueStatusUpdate
from bson import ObjectId
from bson.errors import InvalidId


router = APIRouter(prefix="/api/queue", tags=["Queue"])
queue_collection = get_collection("queues")

# ฟังก์ชันตัวช่วยสำหรับ Gen เลขคิว
async def generate_queue_number():
    count = await queue_collection.count_documents({"status": {"$ne": "cancelled"}})
    return f"A{count + 1:03d}"

@router.post("/issue", response_model=QueueResponse)
async def issue_queue(queue_data: QueueCreate):
    queue_num = await generate_queue_number()
    
    waiting_count = await queue_collection.count_documents({"status": "waiting"})
    
    # 📌 เพิ่มฟิลด์ "printed": False เข้าไป เพื่อให้ Print Agent ดึงไปพิมพ์ได้
    new_queue = {
        "queue_number": queue_num,
        "customer_phone": queue_data.customer_phone,
        "officer_id": queue_data.officer_id,
        "service_type": queue_data.service_type, 
        "booking_number": queue_data.booking_number,
        "status": "waiting",
        "counter_number": None,
        "created_at": datetime.utcnow(),
        "called_at": None,
        "printed": False # 🟢 สำคัญมาก: ตัวนี้ทำให้ Print Agent รู้ว่าคิวนี้ยังไม่ได้ปริ้น
    }
    
    result = await queue_collection.insert_one(new_queue)
    new_queue["id"] = str(result.inserted_id)
    new_queue["waiting_ahead"] = waiting_count
    
    return new_queue

@router.get("/active")
async def get_active_queues():
    try:
        cursor = queue_collection.find({"status": "waiting"}).sort("created_at", 1)
        queues = await cursor.to_list(length=100)
        
        for q in queues:
            q["id"] = str(q["_id"])
            q.pop("_id", None)
            
        return queues
    except Exception as e:
        print(f"Active queue fetch error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("/{queue_id}/call")
async def call_queue(queue_id: str, call_data: QueueCall):
    try:
        valid_id = ObjectId(queue_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="รูปแบบ Queue ID ไม่ถูกต้อง")

    result = await queue_collection.find_one_and_update(
        {"_id": valid_id},
        {"$set": {
            "status": "calling", 
            "counter_number": call_data.counter_number,
            "called_at": datetime.utcnow()
        }},
        return_document=True
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="ไม่พบคิวที่ต้องการเรียก")
        
    result["id"] = str(result["_id"])
    result.pop("_id", None) 
    
    return result

@router.get("/recent")
async def get_recent_called_queues():
    try:
        cursor = queue_collection.find(
            {"status": {"$in": ["calling", "completed"]}}
        ).sort("called_at", -1)
        
        queues = await cursor.to_list(length=5)
        
        for q in queues:
            q["id"] = str(q["_id"]) 
            q.pop("_id", None)       
            
        return queues
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ดึงข้อมูลคิวล่าสุดผิดพลาด: {str(e)}")

@router.patch("/{queue_id}/status")
async def update_queue_status(queue_id: str, status_data: QueueStatusUpdate):
    try:
        valid_id = ObjectId(queue_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="รูปแบบ Queue ID ไม่ถูกต้อง")

    result = await queue_collection.find_one_and_update(
        {"_id": valid_id},
        {"$set": {"status": status_data.status}},
        return_document=True
    )

    if not result:
        raise HTTPException(status_code=404, detail="ไม่พบคิวที่ต้องการอัปเดต")

    result["id"] = str(result["_id"])
    result.pop("_id", None)
    return result

# ==========================================
# API สำหรับ Print Agent แบบ Remote/Polling
# ==========================================

# 1. ดึงข้อมูลคิวล่าสุดที่ยังไม่ได้สั่งพิมพ์
@router.get("/unprinted")
async def get_unprinted_queues():
    try:
        # ค้นหาคิวที่สถานะ waiting และ printed ไม่ใช่ True
        cursor = queue_collection.find(
            {"status": "waiting", "printed": {"$ne": True}}
        ).sort("created_at", 1) 
        
        queues = await cursor.to_list(length=10)
        
        for q in queues:
            q["id"] = str(q["_id"])
            q.pop("_id", None)
            
        return queues
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 2. อัปเดตสถานะว่าคิวนี้ปริ้นสำเร็จแล้ว
@router.patch("/{queue_id}/printed")
async def mark_queue_as_printed(queue_id: str):
    try:
        valid_id = ObjectId(queue_id)
        result = await queue_collection.find_one_and_update(
            {"_id": valid_id},
            {"$set": {"printed": True}},
            return_document=True
        )
        if not result:
            raise HTTPException(status_code=404, detail="ไม่พบคิว")
        return {"status": "success", "message": "Marked as printed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))