import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FaBullhorn, FaCheckCircle, FaVolumeUp } from "react-icons/fa";

export default function Display() {
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

  // 🟢 ฟังก์ชันเล่นเสียงที่ยิงผ่าน Proxy API ของตัวเอง (แก้ปัญหา CORS ได้ 100%)
  const playProxyTTS = (text, lang) => {
    return new Promise((resolve, reject) => {
      // ใช้ URL Backend ของเราเอง
      const audioUrl = `${apiUrl}/api/tts?text=${encodeURIComponent(text)}&lang=${lang}`;
      const audio = new Audio(audioUrl);
      
      audio.onended = () => resolve();
      audio.onerror = (e) => reject(e);
      
      audio.play().catch(e => reject(e));
    });
  };

  // 🟢 จัดการคิวเสียง 2 ภาษา
  useEffect(() => {
    if (queueToSpeak && audioEnabled) {
      console.log(`เตรียมพูดหมายเลข: ${queueToSpeak.queue_number} (ผ่าน Proxy API)`);
      
      const spellQueue = queueToSpeak.queue_number.split('').join(' '); 
      const textTh = `ขอเชิญหมายเลข ${spellQueue} ที่เคาน์เตอร์ ${queueToSpeak.counter_number} ค่ะ`;
      const textEn = `Number ${spellQueue}, please proceed to counter ${queueToSpeak.counter_number}`;
      
      playProxyTTS(textTh, 'th')
        .then(() => playProxyTTS(textEn, 'en'))
        .catch(err => console.error("เกิดข้อผิดพลาดในการเล่นเสียง", err));
    }
  }, [queueToSpeak, audioEnabled]);

  const currentCalling = recentQueues.length > 0 ? recentQueues[0] : null;
  const previousCalling = recentQueues.slice(1, 5);
  const announcementText = "📢 ยินดีต้อนรับสู่ Studio 7 ... โปรดเตรียมหมายเลขคิวของท่านให้พร้อม หากถึงคิวของท่านแล้ว กรุณาติดต่อพนักงานที่เคาน์เตอร์ ... ขอขอบคุณที่ใช้บริการครับ 🙏";

  if (!audioEnabled) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-green-700 to-emerald-900 flex flex-col items-center justify-center text-white p-5">
        <div className="bg-white/10 backdrop-blur-md p-12 rounded-3xl border border-white/20 shadow-2xl flex flex-col items-center max-w-lg w-full">
          <FaVolumeUp className="text-7xl text-emerald-300 drop-shadow-lg mb-6 animate-pulse" />
          <h1 className="text-4xl font-black tracking-wide drop-shadow-md mb-4 text-center">เริ่มระบบคิว (Proxy TTS)</h1>
          <p className="text-emerald-200 text-center text-lg mb-8">
            กดปุ่มด้านล่างเพื่อเริ่มระบบหน้าจอ (ต้องการการคลิกเพื่อรับสิทธิ์เปิดเสียง)
          </p>

          <div className="w-full flex flex-col gap-4">
            <button 
              onClick={() => {
                playProxyTTS("ทดสอบระบบเสียง สวัสดีค่ะ", 'th')
                  .catch(e => alert("การเชื่อมต่อเสียงมีปัญหา กรุณาตรวจสอบ Backend"));
              }}
              className="w-full bg-white/20 hover:bg-white/30 text-white font-bold py-3 rounded-xl transition-all border border-white/30"
            >
              🔊 ทดสอบเสียงพูด
            </button>

            <button 
              onClick={() => {
                setAudioEnabled(true);
                playProxyTTS("ระบบพร้อมใช้งานค่ะ", 'th').catch(() => {});
              }}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-400 hover:from-green-400 hover:to-emerald-300 text-green-900 text-2xl font-black py-5 rounded-xl transition-all shadow-lg active:scale-95"
            >
              ▶️ เปิดหน้าจอคิว
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gradient-to-br from-gray-100 via-green-50 to-emerald-100 font-sans select-none">
      
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

      <header className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-500 shadow-md flex items-center justify-between px-8 py-3 z-20 shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-sm">
            <img src="/assets/logo.png" alt="Studio 7" className="h-10 object-contain" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-wider drop-shadow-sm">Queue System</h1>
        </div>
        <div className="text-white text-3xl font-black drop-shadow-sm tracking-wider bg-black/20 px-5 py-1.5 rounded-xl backdrop-blur-sm border border-white/10">
          {time.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </header>

      <main className="flex-1 flex p-5 gap-5 overflow-hidden relative z-10 min-h-0">
        
        <div className="w-2/3 flex flex-col gap-5 min-h-0">
          <div className="bg-white/85 backdrop-blur-xl rounded-3xl shadow-xl flex-1 flex flex-col overflow-hidden border border-white relative min-h-0">
            <div className="absolute top-0 left-0 w-48 h-48 bg-green-400/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="bg-gradient-to-r from-green-600 to-emerald-500 text-white text-center py-3 shadow-sm shrink-0 relative z-10">
              <h2 className="text-3xl font-black flex items-center justify-center gap-3 tracking-wide">
                <FaBullhorn className="animate-pulse" /> กำลังเรียก (Now Calling)
              </h2>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 min-h-0">
              {currentCalling ? (
                <div key={currentCalling.called_at} className="animate-fade-in-up text-center flex flex-col items-center justify-center">
                  <div className="text-[9rem] font-black text-transparent bg-clip-text bg-gradient-to-br from-green-600 via-emerald-500 to-teal-400 leading-none drop-shadow-md tracking-tight mb-2">
                    {currentCalling.queue_number}
                  </div>
                  
                  <div className="bg-gray-50/90 backdrop-blur-md px-8 py-4 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="text-4xl font-extrabold text-gray-700 flex items-center gap-4">
                      เชิญที่เคาน์เตอร์ 
                      <span className="text-white bg-gradient-to-br from-red-500 to-rose-600 px-6 py-1 rounded-xl shadow-md border-2 border-red-200">
                        {currentCalling.counter_number || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center opacity-40">
                  <FaCheckCircle className="text-2xl text-gray-350 mb-4" />
                  <div className="text-5xl font-black text-gray-400 tracking-wider">
                    ว่างให้บริการ
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/85 backdrop-blur-md rounded-2xl shadow-lg p-4 h-[22%] border border-white flex flex-col shrink-0">
            <h3 className="text-lg font-black text-gray-500 mb-2 uppercase tracking-wider pl-1">คิวที่เรียกไปแล้ว (Recently Called)</h3>
            <div className="flex gap-3 h-full min-h-0">
              {previousCalling.map((q, index) => (
                <div key={index} className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 flex flex-col items-center justify-center shadow-xs">
                  <div className="text-3xl font-black text-gray-700">{q.queue_number}</div>
                  <div className="text-sm text-emerald-600 font-bold mt-1 bg-emerald-50 px-3 py-0.5 rounded-full border border-emerald-100">ช่อง {q.counter_number || "-"}</div>
                </div>
              ))}
              {previousCalling.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-lg font-bold bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                  ยังไม่มีประวัติการเรียกคิว
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-1/3 bg-white/85 backdrop-blur-xl rounded-3xl shadow-xl border border-white flex flex-col overflow-hidden relative min-h-0">
          <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white text-center py-3 shadow-sm shrink-0 relative z-10">
            <h2 className="text-2xl font-black tracking-wide flex items-center justify-center gap-2">
              คิวที่รอ (Waiting)
              <div className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </div>
            </h2>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-gray-50/30">
            {waitingQueues.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {waitingQueues.slice(0, 10).map((q, index) => (
                  <div 
                    key={index} 
                    className="bg-white border-2 border-emerald-100 hover:border-emerald-300 text-emerald-700 rounded-xl py-3 text-center text-3xl font-black shadow-xs transition-all"
                  >
                    {q.queue_number}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 opacity-60">
                <div className="text-2xl font-black tracking-wider">ไม่มีคิวรอ</div>
              </div>
            )}
            
            {waitingQueues.length > 10 && (
              <div className="text-center text-lg font-black text-emerald-600 mt-auto pt-2 border-t border-dashed border-gray-200 bg-emerald-50 py-2 rounded-lg shrink-0">
                และอีก {waitingQueues.length - 10} คิว...
              </div>
            )}
          </div>
        </div>

      </main>

      <footer className="h-12 bg-gradient-to-r from-emerald-700 via-green-600 to-emerald-700 text-white flex items-center overflow-hidden border-t-2 border-emerald-400 shadow-md shrink-0 relative z-30">
        <div className="bg-emerald-900 h-full px-5 flex items-center justify-center font-black text-base z-10 shadow-md border-r-2 border-emerald-500">
          ประกาศ
        </div>
        <div className="flex-1 overflow-hidden relative h-full flex items-center">
          <div className="animate-marquee text-xl font-bold tracking-wide drop-shadow-sm">
            {announcementText}
          </div>
        </div>
      </footer>

    </div>
  );
}