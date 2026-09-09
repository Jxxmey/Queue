from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import httpx
from urllib.parse import quote

router = APIRouter(prefix="/api/tts", tags=["TTS"])

@router.get("/")
async def get_tts(text: str, lang: str = "th"):
    """
    ดึงไฟล์เสียง MP3 จาก Google Translate TTS
    เพื่อแก้ปัญหา CORS เมื่อเรียกใช้ผ่าน Browser โดยตรง
    """
    encoded_text = quote(text)
    # URL ของ Google Translate TTS
    google_url = f"https://translate.google.com/translate_tts?ie=UTF-8&tl={lang}&client=tw-ob&q={encoded_text}"
    
    async def fetch_audio():
        async with httpx.AsyncClient() as client:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
            # ดึงข้อมูลแบบสตรีมและส่งต่อให้ Frontend ทันที
            async with client.stream("GET", google_url, headers=headers) as response:
                async for chunk in response.aiter_bytes():
                    yield chunk

    # ส่งกลับไปเป็นไฟล์ audio/mpeg (MP3)
    return StreamingResponse(fetch_audio(), media_type="audio/mpeg")