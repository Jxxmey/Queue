import { Link } from "react-router-dom";
import { FaExclamationTriangle, FaHome } from "react-icons/fa";

export default function Error404() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-green-50 to-emerald-100 font-sans p-4 overflow-hidden">
      
      <div className="max-w-md w-full bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl overflow-hidden border border-white text-center p-8 relative">
        
        {/* 🟢 ตกแต่งแสงเบลอๆ พื้นหลัง (Decorative Blurs) */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-green-400/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col items-center">
          
          {/* ไอคอนแจ้งเตือน */}
          <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-inner border border-white">
            <FaExclamationTriangle className="text-5xl text-emerald-500 drop-shadow-sm" />
          </div>
          
          {/* ข้อความ 404 */}
          <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-green-600 via-emerald-500 to-teal-400 mb-2 drop-shadow-sm tracking-tighter">
            404
          </h1>
          <h2 className="text-2xl font-extrabold text-gray-800 mb-3 tracking-wide">
            ไม่พบหน้าเว็บนี้
          </h2>
          <p className="text-gray-500 font-medium mb-8 text-sm leading-relaxed px-4">
            ขออภัย ลิงก์ที่คุณพยายามเข้าถึงไม่มีอยู่จริง อาจมีการพิมพ์ URL ผิด หรือหน้านี้ถูกย้ายไปแล้ว
          </p>

          {/* ปุ่มกลับหน้าหลัก */}
          <Link 
            to="/"
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl transition-all shadow-xl bg-gradient-to-br from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-black text-lg active:scale-95 shadow-green-500/30 border-none outline-none"
          >
            <FaHome className="text-2xl" />
            <span>กลับสู่หน้าหลัก</span>
          </Link>

        </div>
      </div>

    </div>
  );
}