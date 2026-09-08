import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FaBullhorn, FaCheckCircle } from "react-icons/fa";

export default function Display() {
  const [waitingQueues, setWaitingQueues] = useState([]);
  const [recentQueues, setRecentQueues] = useState([]);
  const [time, setTime] = useState(new Date());
  
  // ใช้ useRef เพื่อเก็บรหัสคิวล่าสุดที่ถูกเรียก จะได้เล่นเสียงเตือนถูกจังหวะ
  const lastCalledId = useRef(null);
  
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

  // ฟังก์ชันอัปเดตนาฬิกา
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchQueues = async () => {
    try {
      const activeRes = await axios.get(`${apiUrl}/api/queue/active`);
      setWaitingQueues(activeRes.data);

      const recentRes = await axios.get(`${apiUrl}/api/queue/recent`);
      const calledList = recentRes.data;
      setRecentQueues(calledList);

      if (calledList.length > 0) {
        const currentTopQueue = calledList[0].id;
        if (lastCalledId.current && lastCalledId.current !== currentTopQueue) {
          playNotificationSound();
        }
        lastCalledId.current = currentTopQueue;
      }
    } catch (err) {
      console.error("Error fetching display queues:", err);
    }
  };

  useEffect(() => {
    fetchQueues();
    const interval = setInterval(fetchQueues, 3000);
    return () => clearInterval(interval);
  }, []);

  const playNotificationSound = () => {
    try {
      // const audio = new Audio("/assets/bell.mp3");
      // audio.play();
      console.log("🔊 เล่นเสียงเตือนคิวใหม่!");
    } catch (e) {
      console.error("Audio play failed:", e);
    }
  };

  const currentCalling = recentQueues.length > 0 ? recentQueues[0] : null;
  const previousCalling = recentQueues.slice(1, 5);

  // ข้อความสำหรับแถบตัววิ่งด้านล่าง (แก้ข้อความตรงนี้ได้เลยครับ)
  const announcementText = "📢 ยินดีต้อนรับสู่ Studio 7 ... โปรดเตรียมหมายเลขคิวของท่านให้พร้อม หากถึงคิวของท่านแล้ว กรุณาติดต่อพนักงานที่เคาน์เตอร์ ... ขอขอบคุณที่ใช้บริการครับ 🙏";

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gradient-to-br from-gray-100 via-green-50 to-emerald-100 font-sans">
      
      {/* 🟢 CSS สำหรับตัววิ่ง (ฝังไว้ในนี้เลยเพื่อความง่าย ไม่ต้องแก้ config) */}
      <style>
        {`
          @keyframes marquee {
            0% { transform: translateX(100vw); }
            100% { transform: translateX(-100%); }
          }
          .animate-marquee {
            display: inline-block;
            white-space: nowrap;
            animation: marquee 25s linear infinite;
          }
        `}
      </style>

      {/* 🟢 Header ไล่สี */}
      <header className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-500 shadow-xl flex items-center justify-between px-10 py-4 z-20">
        <div className="flex items-center gap-5">
          <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm">
            <img src="/assets/logo.png" alt="Studio 7" className="h-14 object-contain" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-widest drop-shadow-md">Queue System</h1>
        </div>
        <div className="text-white text-4xl font-black drop-shadow-md tracking-wider bg-black/20 px-6 py-2 rounded-2xl backdrop-blur-sm border border-white/10">
          {time.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </header>

      {/* 🟢 พื้นที่แสดงผลหลัก */}
      <main className="flex-1 flex p-8 gap-8 h-full overflow-hidden relative z-10">
        
        {/* ด้านซ้าย: คิวที่กำลังเรียก + ประวัติ */}
        <div className="w-2/3 flex flex-col gap-8">
          
          {/* กล่อง: กำลังเรียกคิว (ใหญ่สุด) */}
          <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl flex-1 flex flex-col overflow-hidden border border-white relative">
            {/* แสงเงาตกแต่งด้านหลัง */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-green-400/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="bg-gradient-to-r from-green-600 to-emerald-500 text-white text-center py-6 shadow-md relative z-10">
              <h2 className="text-5xl font-black flex items-center justify-center gap-4 tracking-wide">
                <FaBullhorn className="animate-pulse" /> กำลังเรียก (Now Calling)
              </h2>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center p-10 relative z-10">
              {currentCalling ? (
                <div className="animate-fade-in-up text-center">
                  {/* ตัวเลขคิวไล่สี */}
                  <div className="text-[14rem] font-black text-transparent bg-clip-text bg-gradient-to-br from-green-600 via-emerald-500 to-teal-400 leading-none drop-shadow-lg tracking-tighter mb-4 py-4">
                    {currentCalling.queue_number}
                  </div>
                  
                  <div className="mt-4 bg-gray-50/80 backdrop-blur-md px-10 py-6 rounded-3xl border border-gray-200 shadow-inner inline-block">
                    <div className="text-6xl font-extrabold text-gray-700 flex items-center gap-6">
                      เชิญที่เคาน์เตอร์ 
                      <span className="text-white bg-gradient-to-br from-red-500 to-rose-600 px-8 py-2 rounded-2xl shadow-lg border-4 border-red-200">
                        {currentCalling.counter_number || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center opacity-40">
                  <FaCheckCircle className="text-[8rem] text-gray-300 mb-6" />
                  <div className="text-7xl font-black text-gray-400 tracking-wider">
                    ว่างให้บริการ
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* กล่อง: ประวัติคิวที่เรียกไปแล้ว */}
          <div className="bg-white/80 backdrop-blur-md rounded-[2rem] shadow-xl p-6 h-[25%] border border-white flex flex-col">
            <h3 className="text-2xl font-black text-gray-500 mb-4 uppercase tracking-widest pl-2">คิวที่เรียกไปแล้ว (Recently Called)</h3>
            <div className="flex gap-4 h-full">
              {previousCalling.map((q, index) => (
                <div key={index} className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 flex flex-col items-center justify-center shadow-sm">
                  <div className="text-5xl font-black text-gray-700">{q.queue_number}</div>
                  <div className="text-xl text-emerald-600 font-bold mt-2 bg-emerald-50 px-4 py-1 rounded-full border border-emerald-100">ช่อง {q.counter_number || "-"}</div>
                </div>
              ))}
              {previousCalling.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-2xl font-bold bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
                  ยังไม่มีประวัติการเรียกคิว
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ด้านขวา: คิวที่กำลังรอ */}
        <div className="w-1/3 bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white flex flex-col overflow-hidden relative">
          <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white text-center py-6 shadow-md relative z-10">
            <h2 className="text-4xl font-black tracking-wide flex items-center justify-center gap-3">
              คิวที่รอ (Waiting)
              <div className="flex h-4 w-4 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
              </div>
            </h2>
          </div>
          
          <div className="flex-1 p-6 overflow-hidden flex flex-col gap-4 bg-gray-50/30">
            {waitingQueues.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {waitingQueues.slice(0, 10).map((q, index) => (
                  <div 
                    key={index} 
                    className="bg-white border-2 border-emerald-100 hover:border-emerald-300 text-emerald-700 rounded-2xl py-6 text-center text-5xl font-black shadow-sm transition-all"
                  >
                    {q.queue_number}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 opacity-60">
                <div className="text-4xl font-black mt-4 tracking-wider">ไม่มีคิวรอ</div>
              </div>
            )}
            
            {waitingQueues.length > 10 && (
              <div className="text-center text-2xl font-black text-emerald-600 mt-auto pt-4 border-t-2 border-dashed border-gray-200 bg-emerald-50 py-3 rounded-xl">
                และอีก {waitingQueues.length - 10} คิว...
              </div>
            )}
          </div>
        </div>

      </main>

      {/* 🟢 Footer: แถบข้อความแจ้งเตือนวิ่ง (Marquee) */}
      <footer className="h-14 bg-gradient-to-r from-emerald-700 via-green-600 to-emerald-700 text-white flex items-center overflow-hidden border-t-4 border-emerald-400 shadow-[0_-10px_20px_rgba(0,0,0,0.1)] relative z-30">
        <div className="bg-emerald-900 h-full px-6 flex items-center justify-center font-black text-lg z-10 shadow-xl border-r-2 border-emerald-500">
          ประกาศ
        </div>
        <div className="flex-1 overflow-hidden relative h-full flex items-center">
          <div className="animate-marquee text-2xl font-bold tracking-wide drop-shadow-md">
            {announcementText}
          </div>
        </div>
      </footer>

    </div>
  );
}