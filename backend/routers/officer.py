import csv
import os
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter(prefix="/api/officer", tags=["Officer"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_FILE_PATH = os.path.join(BASE_DIR, 'officer.csv')

# 🟢 1. เพิ่มฟิลด์ branch_id เข้าไปใน Schema สำหรับตอบกลับ
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

def load_officers_from_csv():
    officers = []
    encodings = ['utf-8-sig', 'utf-8', 'cp874', 'tis-620']
    file_loaded = False
    
    for enc in encodings:
        try:
            with open(CSV_FILE_PATH, mode='r', encoding=enc) as file:
                reader = csv.DictReader(file)
                for row in reader:
                    # 🟢 ล้างคอมมาออกจาก ID เช่น "28,682" -> "28682"
                    raw_id = str(row.get("ID", "")).strip()
                    clean_id = raw_id.replace(",", "")

                    if clean_id:  # ตรวจสอบว่าไม่ใช้แถวว่าง
                        officers.append({
                            "id": clean_id,
                            "title": str(row.get("Title", "")).strip(),
                            "name": str(row.get("Name", "")).strip(),
                            "surname": str(row.get("Surname", "")).strip(),
                            "department_name": str(row.get("Department Name", "")).strip(),
                            "position": str(row.get("Position", "")).strip(),
                            "branch_id": str(row.get("Branch (ID)", "")).strip(),
                            "branch_name": str(row.get("Branch Name", "")).strip(),
                            "counter": str(row.get("Counter", "")).strip()
                        })
            
            print(f"✅ โหลดข้อมูลพนักงานสำเร็จจำนวน: {len(officers)} คน (ใช้ Encoding: {enc})")
            file_loaded = True
            break  # 🟢 ถ้าอ่านไฟล์สำเร็จ ให้หลุดออกจากลูปเช็ค Encoding เลย

        except UnicodeDecodeError:
            continue  # 🟢 ถ้าอ่านแล้วติดขัดภาษาแปลกๆ ให้ลอง Encoding ตัวถัดไป
        except Exception as e:
            print(f"❌ Error reading CSV with {enc}: {e}")
            break

    if not file_loaded:
        print(f"❌ Error: ไม่สามารถอ่านไฟล์ {CSV_FILE_PATH} ได้ กรุณาตรวจสอบไฟล์")
    
    return officers

OFFICERS_DB = load_officers_from_csv()

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
        result = [emp for emp in result if emp["counter"] == counter]
        
    return result

@router.get("/{officer_id}", response_model=OfficerResponse)
async def get_officer_by_id(officer_id: str):
    for emp in OFFICERS_DB:
        if emp["id"] == officer_id:
            return emp
            
    raise HTTPException(status_code=404, detail="ไม่พบข้อมูลพนักงานรหัสนี้")