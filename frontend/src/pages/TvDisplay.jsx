import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FaBullhorn, FaPlayCircle } from "react-icons/fa";

export default function TvDisplay() {
  const [waitingQueues, setWaitingQueues] = useState([]);
  const [recentQueues, setRecentQueues] = useState([]);
  const [time, setTime] = useState(new Date());
  
  const [audioEnabled, setAudioEnabled] = useState(false);
  const lastCalledId = useRef(null);
  const [queueToSpeak, setQueueToSpeak] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

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
        const topQueue = calledList[0];
        const uniqueCallKey = `${topQueue.id}-${topQueue.called_at}`;
        
        if (lastCalledId.current && lastCalledId.current !== uniqueCallKey) {
          setQueueToSpeak({
            queue_number: topQueue.queue_number,
            counter_number: topQueue.counter_number,
            key: uniqueCallKey
          });
        }
        lastCalledId.current = uniqueCallKey;
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

  const playProxyTTS = (text, lang) => {
    return new Promise((resolve, reject) => {
      const audioUrl = `${apiUrl}/api/tts?text=${encodeURIComponent(text)}&lang=${lang}`;
      const audio = new Audio(audioUrl);
      
      audio.onended = () => resolve();
      audio.onerror = (e) => reject(e);
      
      audio.play().catch(e => reject(e));
    });
  };

  useEffect(() => {
    if (queueToSpeak && audioEnabled) {
      const spellQueue = queueToSpeak.queue_number.split('').join(' '); 
      const textTh = `ขอเชิญหมายเลข ${spellQueue} ที่เคาน์เตอร์ ${queueToSpeak.counter_number} ค่ะ`;
      const textEn = `Number ${spellQueue}, please proceed to counter ${queueToSpeak.counter_number}`;
      
      playProxyTTS(textTh, 'th')
        .then(() => playProxyTTS(textEn, 'en'))
        .catch(err => console.error("เกิดข้อผิดพลาดในการเล่นเสียง", err));
    }
  }, [queueToSpeak, audioEnabled]);

  const currentCalling = recentQueues.length > 0 ? recentQueues[0] : null;
  const previousCalling = recentQueues.slice(1, 4);
  const announcementText = "📢 ยินดีต้อนรับสู่ Studio 7 ... โปรดเตรียมหมายเลขคิวของท่านให้พร้อม หากถึงคิวของท่านแล้ว กรุณาติดต่อพนักงานที่เคาน์เตอร์ ... ขอขอบคุณที่ใช้บริการครับ 🙏";

  if (!audioEnabled) {
    return (
      <div 
        className="h-screen w-screen bg-gradient-to-br from-white via-gray-100 to-emerald-50 flex flex-col items-center justify-center cursor-pointer"
        onClick={() => {
          setAudioEnabled(true);
          playProxyTTS("ระบบพร้อมใช้งานค่ะ", 'th').catch(() => {});
        }}
      >
        <div className="flex flex-col items-center justify-center hover:scale-110 transition-transform duration-300">
          <FaPlayCircle className="text-[12vh] text-emerald-500 mb-8 animate-pulse drop-shadow-xl" />
          <h1 className="text-[5vh] font-black tracking-widest text-emerald-700 drop-shadow-sm">TAP TO START TV DISPLAY</h1>
          <p className="text-[3vh] text-gray-500 mt-4 font-bold">คลิกด้วยรีโมท หรือแตะหน้าจอ 1 ครั้งเพื่อเปิดระบบเสียง</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-50 font-sans select-none text-gray-800 box-border">
      
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
          ::-webkit-scrollbar { display: none; }
        `}
      </style>

      {/* Header (10% ของความสูงจอ) */}
      <header className="h-[10vh] bg-white border-b-4 border-emerald-500 flex items-center justify-between px-8 shrink-0 shadow-md relative z-20 box-border">
        <div className="flex items-center gap-6 h-full py-3">
          <img src="/assets/logo.png" alt="Studio 7" className="h-full object-contain px-2" />
          <h1 className="text-[3.5vh] font-black tracking-widest text-gray-800">QUEUE SYSTEM</h1>
        </div>
        <div className="text-[4vh] font-black tracking-widest text-emerald-700 bg-emerald-50 px-6 py-1 rounded-xl border border-emerald-100 shadow-inner flex items-center">
          {time.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </header>

      {/* Main Layout (ใช้ flex-1 min-h-0 เพื่อบังคับไม่ให้ล้น) */}
      <main className="flex-1 flex min-h-0 p-4 gap-4 bg-gradient-to-br from-gray-50 via-emerald-50/30 to-green-100 relative overflow-hidden box-border">
        
        {/* Background Effects */}
        <div className="absolute top-[-10vh] left-[-10vw] w-[40vw] h-[40vw] bg-emerald-400/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10vh] right-[-10vw] w-[40vw] h-[40vw] bg-green-400/10 rounded-full blur-[100px] pointer-events-none"></div>

        {/* 🟢 ฝั่งซ้าย (65%) */}
        <div className="w-[65%] flex flex-col min-h-0 relative z-10">
          <div className="flex-1 bg-white/90 backdrop-blur-xl rounded-[2.5rem] border border-white flex flex-col overflow-hidden shadow-2xl relative min-h-0">
            
            <div className="h-[12vh] bg-gradient-to-r from-green-600 to-emerald-500 flex items-center justify-center relative shadow-md shrink-0">
              <h2 className="text-[4.5vh] font-black flex items-center gap-4 tracking-widest text-white drop-shadow-md">
                <FaBullhorn className="animate-pulse" /> กำลังเรียก (NOW CALLING)
              </h2>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center p-4 relative min-h-0">
              {currentCalling ? (
                <div key={currentCalling.called_at} className="animate-fade-in-up flex flex-col items-center justify-center w-full">
                  {/* เปลี่ยนเป็น 14vw เพื่อไม่ให้ล้นความกว้างของฝั่งซ้าย */}
                  <div className="text-[14vw] font-black text-transparent bg-clip-text bg-gradient-to-br from-green-700 via-emerald-600 to-teal-500 leading-none drop-shadow-xl tracking-tighter mb-6 py-2">
                    {currentCalling.queue_number}
                  </div>
                  
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 px-10 py-4 rounded-full border-2 border-emerald-200 shadow-[0_10px_30px_rgba(16,185,129,0.15)] flex items-center gap-6">
                    {/* ใช้ vh แทน vw ป้องกันการดันกล่องแนวนอน */}
                    <span className="text-[4vh] font-black text-gray-700">เชิญที่เคาน์เตอร์</span>
                    <span className="text-white text-[4.5vh] font-black bg-gradient-to-br from-red-500 to-rose-600 px-8 py-1 rounded-full shadow-lg border-4 border-red-100/50">
                      {currentCalling.counter_number || "-"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center opacity-30">
                  <div className="text-[8vh] font-black text-gray-400 tracking-widest">
                    ว่างให้บริการ
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 🟢 ฝั่งขวา (35%) */}
        <div className="w-[35%] flex flex-col gap-4 min-h-0 relative z-10">
          
          {/* คิวรอ (Waiting) */}
          <div className="flex-[3] bg-white/80 backdrop-blur-md rounded-[2rem] border border-white flex flex-col overflow-hidden shadow-xl min-h-0">
            <div className="h-[8vh] bg-gradient-to-r from-gray-800 to-gray-700 flex items-center justify-center border-b-2 border-emerald-500 shrink-0">
              <h2 className="text-[3vh] font-black text-white tracking-widest flex items-center gap-3">
                คิวที่รอ (WAITING)
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                </span>
              </h2>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50/50">
              {waitingQueues.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {waitingQueues.slice(0, 8).map((q, index) => (
                    <div 
                      key={index} 
                      className="bg-white border-2 border-emerald-100 text-emerald-700 rounded-xl py-3 text-center text-[3.5vh] font-black shadow-sm"
                    >
                      {q.queue_number}
                    </div>
                  ))}
                  {waitingQueues.length > 8 && (
                    <div className="col-span-2 text-center text-[2.5vh] font-black text-emerald-600 bg-emerald-50 py-2 rounded-xl mt-1 border border-emerald-100/50">
                      และอีก {waitingQueues.length - 8} คิว...
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-[3vh] font-black text-gray-400 opacity-70">
                  ไม่มีคิวรอ
                </div>
              )}
            </div>
          </div>

          {/* คิวที่เรียกไปแล้ว (Recent) */}
          <div className="flex-[1.5] bg-white/90 backdrop-blur-md rounded-[2rem] border border-white flex flex-col overflow-hidden shadow-xl p-4 min-h-0 shrink-0">
            <h3 className="text-[2.2vh] font-black text-gray-500 mb-2 uppercase tracking-wider text-center shrink-0">เรียกไปแล้ว (RECENT)</h3>
            <div className="flex gap-3 h-full min-h-0">
              {previousCalling.map((q, index) => (
                <div key={index} className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 flex flex-col items-center justify-center shadow-sm min-h-0 py-2">
                  <div className="text-[3.5vh] font-black text-gray-700 leading-none">{q.queue_number}</div>
                  <div className="text-[1.8vh] text-emerald-600 font-bold mt-2 bg-emerald-50 px-3 py-0.5 rounded-full border border-emerald-100">ช่อง {q.counter_number || "-"}</div>
                </div>
              ))}
              {previousCalling.length === 0 && (
                <div className="w-full flex items-center justify-center text-gray-400 text-[2vh] font-bold bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  ยังไม่มีประวัติการเรียก
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Footer (8% ของความสูงจอ) */}
      <footer className="h-[8vh] bg-white flex items-center overflow-hidden border-t-4 border-emerald-500 shrink-0 shadow-md relative z-20 box-border">
        <div className="bg-emerald-700 h-full px-8 flex items-center justify-center font-black text-[3vh] z-10 shadow-lg text-white">
          ประกาศ
        </div>
        <div className="flex-1 overflow-hidden relative h-full flex items-center bg-emerald-50">
          <div className="animate-marquee text-[3.5vh] font-bold tracking-wide text-emerald-800 drop-shadow-sm whitespace-nowrap">
            {announcementText}
          </div>
        </div>
      </footer>

    </div>
  );
}