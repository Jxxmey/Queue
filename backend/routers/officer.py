import csv
import os
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter(prefix="/api/officer", tags=["Officer"])

# 📌 1. กำหนดที่อยู่ของไฟล์ CSV
# คำนวณหาตำแหน่งโฟลเดอร์หลักของโปรเจกต์ (ถอยหลังกลับไป 1 ชั้นจากโฟลเดอร์ routers)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# ชี้เป้าไปที่ไฟล์ 'officer.csv' ที่อยู่หน้า root ของ backend
CSV_FILE_PATH = os.path.join(BASE_DIR, 'officer.csv')

# 2. กำหนด Schema สำหรับตอบกลับ (ดึงมาเฉพาะฟิลด์ที่ใช้งานบ่อย)
class OfficerResponse(BaseModel):
    id: str
    title: str
    name: str
    surname: str
    department_name: str
    position: str
    branch_name: str
    counter: str

# 3. ฟังก์ชันอ่านข้อมูลจากไฟล์ CSV
def load_officers_from_csv():
    officers = []
    try:
        # ใช้ encoding='cp874' เพื่อรองรับภาษาไทยจาก Excel บน Windows
        with open(CSV_FILE_PATH, mode='r', encoding='cp874') as file:
            reader = csv.DictReader(file)
            for row in reader:
                # ป้องกัน Error กรณีมีค่าว่าง
                officers.append({
                    "id": str(row.get("ID", "")).strip(),
                    "title": str(row.get("Title", "")).strip(),
                    "name": str(row.get("Name", "")).strip(),
                    "surname": str(row.get("Surname", "")).strip(),
                    "department_name": str(row.get("Department Name", "")).strip(),
                    "position": str(row.get("Position", "")).strip(),
                    "branch_name": str(row.get("Branch Name", "")).strip(),
                    "counter": str(row.get("Counter", "")).strip()
                })
        print(f"✅ โหลดข้อมูลพนักงานสำเร็จจำนวน: {len(officers)} คน")
    except FileNotFoundError:
        print(f"❌ Error: ไม่พบไฟล์ CSV ที่ตำแหน่ง {CSV_FILE_PATH}")
    except Exception as e:
        print(f"❌ Error reading CSV: {e}")
    
    return officers

# โหลดข้อมูลไว้ล่วงหน้าเพื่อความรวดเร็วเมื่อเรียก API
OFFICERS_DB = load_officers_from_csv()

# 4. API สำหรับดึงข้อมูลพนักงานทั้งหมด (รองรับการค้นหา)
@router.get("/", response_model=List[OfficerResponse])
async def get_officers(
    search_name: Optional[str] = None, 
    counter: Optional[str] = None
):
    result = OFFICERS_DB
    
    # ถ้ามีการค้นหาด้วยชื่อ
    if search_name:
        result = [
            emp for emp in result 
            if search_name.lower() in emp["name"].lower() or search_name.lower() in emp["surname"].lower()
        ]
        
    # ถ้าต้องการกรองตามเคาน์เตอร์ (ประยุกต์ใช้กับระบบแคชเชียร์)
    if counter:
        result = [emp for emp in result if emp["counter"] == counter]
        
    return result

# 5. API สำหรับค้นหาพนักงานด้วย ID
@router.get("/{officer_id}", response_model=OfficerResponse)
async def get_officer_by_id(officer_id: str):
    for emp in OFFICERS_DB:
        if emp["id"] == officer_id:
            return emp
            
    raise HTTPException(status_code=404, detail="ไม่พบข้อมูลพนักงานรหัสนี้")