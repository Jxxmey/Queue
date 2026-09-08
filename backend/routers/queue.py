from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from database import get_collection
from models.schemas import QueueCreate, QueueResponse, QueueCall
from bson import ObjectId

router = APIRouter(prefix="/api/queue", tags=["Queue"])
queue_collection = get_collection("queues")

# ฟังก์ชันตัวช่วยสำหรับ Gen เลขคิว
async def generate_queue_number():
    # ในใช้งานจริงควรเช็คคิวของวันปัจจุบัน
    count = await queue_collection.count_documents({"status": {"$ne": "cancelled"}})
    return f"A{count + 1:03d}"

@router.post("/issue", response_model=QueueResponse)
async def issue_queue(queue_data: QueueCreate):
    queue_num = await generate_queue_number()
    
    waiting_count = await queue_collection.count_documents({"status": "waiting"})
    
    # 📌 เพิ่ม service_type และ booking_number
    new_queue = {
        "queue_number": queue_num,
        "customer_phone": queue_data.customer_phone,
        "officer_id": queue_data.officer_id,
        "service_type": queue_data.service_type, 
        "booking_number": queue_data.booking_number,
        "status": "waiting",
        "counter_number": None,
        "created_at": datetime.utcnow(),
        "called_at": None
    }
    
    result = await queue_collection.insert_one(new_queue)
    new_queue["id"] = str(result.inserted_id)
    new_queue["waiting_ahead"] = waiting_count
    
    # await manager.broadcast_to_printer(new_queue)
    
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
        print(f"Active queue fetch error: {str(e)}") # Check Render logs for this print
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("/{queue_id}/call")
async def call_queue(queue_id: str, call_data: QueueCall):
    try:
        # ตรวจสอบก่อนว่า queue_id ที่ส่งมา เป็นรูปแบบ ObjectId ที่ถูกต้องหรือไม่
        valid_id = ObjectId(queue_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="รูปแบบ Queue ID ไม่ถูกต้อง")

    # อัปเดตสถานะคิว
    result = await queue_collection.find_one_and_update(
        {"_id": valid_id}, # ใช้ valid_id ที่เป็น ObjectId แล้ว
        {"$set": {
            "status": "calling", 
            "counter_number": call_data.counter_number,
            "called_at": datetime.utcnow()
        }},
        return_document=True
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="ไม่พบคิวที่ต้องการเรียก")
        
    # แปลงผลลัพธ์เพื่อส่งกลับไปให้ Frontend
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
        
        # 📌 จุดที่ต้องแก้: แปลง ObjectId ให้เป็น String เหมือนกัน
        for q in queues:
            q["id"] = str(q["_id"]) 
            q.pop("_id", None)       
            
        return queues
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ดึงข้อมูลคิวล่าสุดผิดพลาด: {str(e)}")