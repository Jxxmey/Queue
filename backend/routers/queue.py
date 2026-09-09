from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from datetime import datetime
from database import get_collection
from models.schemas import QueueCreate, QueueResponse, QueueCall, QueueStatusUpdate
from bson import ObjectId
from bson.errors import InvalidId
from routers.officer import OFFICERS_DB

router = APIRouter(prefix="/api/queue", tags=["Queue"])
queue_collection = get_collection("queues")
officer_collection = get_collection("officers") 

async def generate_queue_number(branch_id: str):
    count = await queue_collection.count_documents({
        "status": {"$ne": "cancelled"},
        "branch_id": str(branch_id)
    })
    return f"A{count + 1:03d}"

@router.post("/issue", response_model=QueueResponse)
async def issue_queue(queue_data: QueueCreate):
    branch_id = "Main"
    branch_name = "Main Branch"
    
    try:
        raw_id = str(queue_data.officer_id).strip()
        search_id_clean = raw_id.replace(",", "").strip()

        print(f"🔍 กำลังค้นหารหัสพนักงานจาก OFFICERS_DB: '{search_id_clean}'")

        # 🟢 วนลูปค้นหาใน OFFICERS_DB ที่โหลดมาจากไฟล์ CSV
        officer = None
        for emp in OFFICERS_DB:
            db_emp_id = str(emp.get("id", "")).replace(",", "").strip()
            if db_emp_id == search_id_clean:
                officer = emp
                break
            
        if officer:
            branch_id = str(officer.get("branch_id") or "Main").strip()
            branch_name = str(officer.get("branch_name") or "Main Branch").strip()
            print(f"🟢 [Issue Queue] สำเร็จ! พบพนักงาน ID: {search_id_clean} -> สังกัดสาขา ID: {branch_id} ({branch_name})")
        else:
            print(f"⚠️ [Issue Queue] ไม่พบพนักงาน ID: '{search_id_clean}' ใน OFFICERS_DB! (ใช้สาขาสำรอง: Main)")
            
    except Exception as e:
        print(f"❌ [Issue Queue Error] เกิดข้อผิดพลาด: {e}")

    queue_num = await generate_queue_number(branch_id)
    
    waiting_count = await queue_collection.count_documents({
        "status": "waiting", 
        "branch_id": str(branch_id)
    })
    
    new_queue = {
        "queue_number": queue_num,
        "customer_phone": queue_data.customer_phone,
        "officer_id": queue_data.officer_id,
        "branch_id": str(branch_id),      
        "branch_name": branch_name,  
        "service_type": queue_data.service_type, 
        "booking_number": queue_data.booking_number,
        "status": "waiting",
        "counter_number": None,
        "created_at": datetime.utcnow(),
        "called_at": None,
        "printed": False 
    }
    
    result = await queue_collection.insert_one(new_queue)
    new_queue["id"] = str(result.inserted_id)
    new_queue["waiting_ahead"] = waiting_count
    
    return new_queue

@router.get("/active")
async def get_active_queues(branch_id: str = Query(None)):
    try:
        query = {"status": "waiting"}
        if branch_id and branch_id not in ["undefined", "null", ""]:
            query["branch_id"] = str(branch_id).strip()
            
        cursor = queue_collection.find(query).sort("created_at", 1)
        queues = []
        # 🟢 ใช้ async for วนลูปอ่านข้อมูลอย่างปลอดภัย
        async for q in cursor:
            q["id"] = str(q["_id"])
            q.pop("_id", None)
            queues.append(q)
            if len(queues) >= 100:  # จำกัดที่ 100 รายการ
                break
                
        return queues
    except Exception as e:
        print(f"❌ Error in /active: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recent")
async def get_recent_called_queues(branch_id: str = Query(None)):
    try:
        query = {"status": {"$in": ["calling", "completed"]}}
        if branch_id and branch_id not in ["undefined", "null", ""]:
            query["branch_id"] = str(branch_id).strip()
            
        cursor = queue_collection.find(query).sort("called_at", -1)
        queues = []
        # 🟢 ใช้ async for วนลูปอ่านข้อมูล
        async for q in cursor:
            q["id"] = str(q["_id"]) 
            q.pop("_id", None) 
            queues.append(q)
            if len(queues) >= 5:  # จำกัดที่ 5 รายการ
                break
                      
        return queues
    except Exception as e:
        print(f"❌ Error in /recent: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/unprinted")
async def get_unprinted_queues(branch_id: str = Query(None)):
    try:
        query = {"status": "waiting", "printed": {"$ne": True}}
        if branch_id and branch_id not in ["undefined", "null", ""]:
            query["branch_id"] = str(branch_id).strip()
            
        cursor = queue_collection.find(query).sort("created_at", 1) 
        queues = []
        # 🟢 ใช้ async for วนลูปอ่านข้อมูล
        async for q in cursor:
            q["id"] = str(q["_id"])
            q.pop("_id", None)
            queues.append(q)
            if len(queues) >= 10:  # จำกัดที่ 10 รายการ
                break
                
        return queues
    except Exception as e:
        print(f"❌ Error in /unprinted: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
            raise HTTPException(status_code=404, detail="Not found")
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{queue_id}/reprint")
async def reprint_queue(queue_id: str):
    try:
        valid_id = ObjectId(queue_id)
        result = await queue_collection.find_one_and_update(
            {"_id": valid_id},
            {"$set": {"printed": False}},
            return_document=True
        )
        if not result:
            raise HTTPException(status_code=404, detail="Not found")
        result["id"] = str(result["_id"])
        result.pop("_id", None)
        return {"status": "success", "queue": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{queue_id}/call")
async def call_queue(queue_id: str, call_data: QueueCall):
    try:
        valid_id = ObjectId(queue_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid Queue ID")
    result = await queue_collection.find_one_and_update(
        {"_id": valid_id},
        {"$set": {"status": "calling", "counter_number": call_data.counter_number, "called_at": datetime.utcnow()}},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Not found")
    result["id"] = str(result["_id"])
    result.pop("_id", None)
    return result

@router.patch("/{queue_id}/status")
async def update_queue_status(queue_id: str, status_data: QueueStatusUpdate):
    try:
        valid_id = ObjectId(queue_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid Queue ID")
    result = await queue_collection.find_one_and_update(
        {"_id": valid_id},
        {"$set": {"status": status_data.status}},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Not found")
    result["id"] = str(result["_id"])
    result.pop("_id", None)
    return result