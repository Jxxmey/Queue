import os
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from jose import JWTError, jwt
from dotenv import load_dotenv

from routers.officer import OFFICERS_DB

# โหลดค่าจากไฟล์ .env
load_dotenv()

router = APIRouter(prefix="/api/auth", tags=["Auth"])

# ==========================================
# ดึงค่าความปลอดภัยจาก .env (ถ้าไม่มีจะใช้ค่า Default แต่แนะนำให้มีเสมอ)
# ==========================================
SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 12

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    officer: dict

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/login", response_model=TokenResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    input_id = form_data.username.replace(",", "").strip()
    input_password = form_data.password.replace(",", "").strip()
    
    # พิมพ์ค่าที่รับมาจากหน้าเว็บ
    print(f"--- 1. หน้าเว็บส่งมา: ID = '{input_id}', Password = '{input_password}' ---")
    
    current_officer = None
    for emp in OFFICERS_DB:
        db_id = emp["id"].replace(",", "").strip()
        if db_id == input_id:
            current_officer = emp
            # พิมพ์ค่าที่เจอในฐานข้อมูล
            print(f"--- 2. เจอใน DB: ID = '{db_id}', Name = '{emp['name']}' ---")
            break
            
    if not current_officer:
        print("--- 3. Error: ไม่พบรหัสพนักงานนี้ ---")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ไม่พบรหัสพนักงานนี้ในระบบ",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if input_password != input_id:
        print("--- 3. Error: รหัสผ่านไม่ตรงกับ ID ---")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="รหัสผ่านไม่ถูกต้อง (กรุณาใช้รหัสพนักงานเป็นรหัสผ่าน)",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    print("--- 4. Login Success! ---")
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": current_officer["id"], "role": current_officer["position"]},
        expires_delta=access_token_expires
    )
    
    officer_data = dict(current_officer)
    if "branch_id" not in officer_data and "Branch (ID)" in officer_data:
        officer_data["branch_id"] = str(officer_data["Branch (ID)"]).replace(",", "").strip()
    if "branch_name" not in officer_data and "Branch Name" in officer_data:
        officer_data["branch_name"] = str(officer_data["Branch Name"]).strip()

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "officer": officer_data
    }