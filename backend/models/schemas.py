from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class QueueCreate(BaseModel):
    customer_phone: str
    officer_id: str 
    service_type: str # 'walkin' (ซื้อหน้าร้าน) หรือ 'preorder' (จองสินค้า)
    booking_number: Optional[str] = None # เลขที่จอง (ถ้ามี)

class QueueCall(BaseModel):
    counter_number: str

class QueueResponse(BaseModel):
    id: str
    queue_number: str
    customer_phone: str
    officer_id: str
    service_type: str # ส่งกลับมาด้วย
    booking_number: Optional[str] = None # ส่งกลับมาด้วย
    status: str
    counter_number: Optional[str] = None
    created_at: datetime
    called_at: Optional[datetime] = None
    waiting_ahead: int = 0

class QueueStatusUpdate(BaseModel):
    status: str