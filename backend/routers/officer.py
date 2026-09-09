import json
import os
import urllib.request
from fastapi import APIRouter, HTTPException, Request
from typing import List, Optional
from pydantic import BaseModel
from database import get_collection

router = APIRouter(prefix="/api/officer", tags=["Officer"])
officer_collection = get_collection("officers")

class OfficerResponse(BaseModel):
    id: str
    title: str
    name: str
    surname: str
    department_name: str
    position: str
    branch_id: str
    branch_name: str
    counter: str

def load_officers_from_sheet():
    officers = []
    # 🟢 ดึง URL มาจากไฟล์ .env โดยตรง
    google_sheet_url = os.getenv("GOOGLE_SHEET_API_URL")
    
    if not google_sheet_url:
        print("⚠️ Warning: ไม่พบตัวแปร GOOGLE_SHEET_API_URL ในไฟล์ .env")
        return officers
        
    try:
        print("🔄 กำลังดึงข้อมูลพนักงานจาก Google Sheets (JSON)...")
        req = urllib.request.Request(google_sheet_url)
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            officers = data
        print(f"✅ โหลดข้อมูลพนักงานสำเร็จจำนวน: {len(officers)} คน")
    except Exception as e:
        print(f"❌ Error fetching from Google Sheets: {e}")
        
    return officers

OFFICERS_DB = load_officers_from_sheet()

@router.get("/", response_model=List[OfficerResponse])
async def get_officers(
    search_name: Optional[str] = None, 
    counter: Optional[str] = None
):
    result = OFFICERS_DB
    
    if search_name:
        result = [
            emp for emp in result 
            if search_name.lower() in emp["name"].lower() or search_name.lower() in emp["surname"].lower()
        ]
        
    if counter:
        result = [emp for emp in result if emp.get("counter") == counter]
        
    return result

@router.get("/{officer_id}", response_model=OfficerResponse)
async def get_officer_by_id(officer_id: str):
    for emp in OFFICERS_DB:
        if emp["id"] == officer_id:
            return emp
            
    raise HTTPException(status_code=404, detail="ไม่พบข้อมูลพนักงานรหัสนี้")

@router.post("/sync")
async def sync_officers():
    global OFFICERS_DB
    new_data = load_officers_from_sheet()
    if new_data:
        OFFICERS_DB = new_data
        
        await officer_collection.delete_many({})
        await officer_collection.insert_many(new_data)
        
        return {"status": "success", "message": f"ซิงค์ข้อมูลล่าสุดสำเร็จ จำนวน {len(OFFICERS_DB)} คน"}
    else:
        raise HTTPException(status_code=500, detail="ไม่สามารถดึงข้อมูลจาก Google Sheet ได้")

@router.post("/sync-from-sheet")
async def sync_officers_from_sheet(request: Request):
    global OFFICERS_DB
    try:
        data = await request.json()
        officers_list = data.get("officers", [])
        
        if not officers_list:
            return {"status": "error", "message": "ไม่พบข้อมูลพนักงาน"}

        OFFICERS_DB = officers_list
        await officer_collection.delete_many({})
        await officer_collection.insert_many(officers_list)
        
        return {"status": "success", "message": f"ซิงค์ข้อมูลพนักงานสำเร็จ {len(officers_list)} คน"}
    except Exception as e:
        return {"status": "error", "message": str(e)}