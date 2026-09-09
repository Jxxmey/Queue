import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FaPlayCircle } from "react-icons/fa";

export default function TvDisplay() {
  const [waitingQueues, setWaitingQueues] = useState([]);
  const [recentQueues, setRecentQueues] = useState([]);
  const [time, setTime] = useState(new Date());
  
  const [audioEnabled, setAudioEnabled] = useState(false);
  const lastCalledId = useRef(null);
  const [queueToSpeak, setQueueToSpeak] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

  // อ่านค่า branch_id และ branch_name จาก URL
  const queryParams = new URLSearchParams(window.location.search);
  const branch_id = queryParams.get("branch_id") || "Main"; 
  const branch_name = queryParams.get("branch_name") || branch_id; 

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchQueues = async () => {
    try {
      const branchQuery = `?branch_id=${branch_id}`;

      const activeRes = await axios.get(`${apiUrl}/api/queue/active${branchQuery}`);
      setWaitingQueues(activeRes.data);

      const recentRes = await axios.get(`${apiUrl}/api/queue/recent${branchQuery}`);
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
  }, [branch_id]); 

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

  // 🟢 แสดงคิวที่เรียกแล้ว สูงสุด 6 คิว
  const displayedQueues = recentQueues.slice(0, 6);
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
          <p className="text-[2.5vh] text-emerald-600 mt-4 bg-emerald-100 px-6 py-2 rounded-full font-bold">
            สาขา: {branch_name}
          </p>
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
          
          /* แอนิเมชันสำหรับคิวที่กำลังเรียกให้กระพริบ */
          @keyframes blink-bg {
            0%, 100% { background-color: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.5); }
            50% { background-color: rgba(16, 185, 129, 0.3); border-color: rgba(16, 185, 129, 1); }
          }
          .animate-blink-bg {
            animation: blink-bg 1.5s infinite ease-in-out;
          }
        `}
      </style>

      {/* Header */}
      <header className="h-[10vh] bg-white border-b-4 border-emerald-500 flex items-center justify-between px-8 shrink-0 shadow-md relative z-20 box-border">
        <div className="flex items-center gap-6 h-full py-2">
          <img src="/assets/logo.png" alt="Studio 7" className="h-full object-contain px-2 py-1" />
          <div className="flex flex-col justify-center">
            <h1 className="text-[3.5vh] font-black tracking-widest text-gray-800 leading-tight">QUEUE SYSTEM</h1>
            {branch_name !== "Main" && (
              <span className="text-[1.8vh] font-bold text-emerald-600 tracking-wide">
                สาขา: {branch_name}
              </span>
            )}
          </div>
        </div>
        <div className="text-[4vh] font-black tracking-widest text-emerald-700 bg-emerald-50 px-6 py-1 rounded-xl border border-emerald-100 shadow-inner flex items-center">
          {time.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 flex min-h-0 p-4 gap-4 bg-gradient-to-br from-gray-50 via-emerald-50/30 to-green-100 relative overflow-hidden box-border">
        
        <div className="absolute top-[-10vh] left-[-10vw] w-[40vw] h-[40vw] bg-emerald-400/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10vh] right-[-10vw] w-[40vw] h-[40vw] bg-green-400/10 rounded-full blur-[100px] pointer-events-none"></div>

        {/* 🟢 ฝั่งซ้าย (65%): ตารางคิวที่กำลังเรียก */}
        <div className="w-[65%] flex flex-col min-h-0 relative z-10">
          <div className="flex-1 bg-white/90 backdrop-blur-xl rounded-[2.5rem] border border-white flex flex-col overflow-hidden shadow-2xl relative min-h-0">
            
            {/* หัวตาราง */}
            <div className="h-[12vh] bg-gradient-to-r from-gray-800 to-gray-900 flex items-center justify-between px-10 border-b-4 border-emerald-500 shadow-md shrink-0 relative z-10">
              <h2 className="text-[4vh] w-1/2 font-black tracking-widest text-white text-center border-r-2 border-gray-600">
                หมายเลขคิว<br/><span className="text-[2vh] text-emerald-400">QUEUE NO.</span>
              </h2>
              <h2 className="text-[4vh] w-1/2 font-black tracking-widest text-white text-center">
                ช่องบริการ<br/><span className="text-[2vh] text-emerald-400">COUNTER</span>
              </h2>
            </div>
            
            {/* 🟢 รายการคิว (สูงสุด 6 แถว) */}
            <div className="flex-1 flex flex-col p-4 gap-3 relative min-h-0 overflow-hidden">
              {displayedQueues.length > 0 ? (
                displayedQueues.map((q, index) => {
                  // คิวบนสุด (กำลังเรียก) จะให้กระพริบและตัวใหญ่กว่าเล็กน้อย
                  const isNowCalling = index === 0;
                  
                  return (
                    <div 
                      key={q.called_at} 
                      className={`flex items-center justify-between px-10 rounded-2xl border-4 transition-all duration-500 shadow-sm ${
                        isNowCalling 
                          ? "flex-[1.5] animate-blink-bg bg-emerald-50 border-emerald-500 shadow-emerald-200 shadow-lg" 
                          : "flex-1 bg-white border-gray-200 opacity-90"
                      }`}
                    >
                      <div className={`w-1/2 text-center font-black ${isNowCalling ? 'text-[8vh] text-emerald-700' : 'text-[6vh] text-gray-700'}`}>
                        {q.queue_number}
                      </div>
                      <div className="w-1/2 flex justify-center items-center">
                        <span className={`font-black rounded-full shadow-md flex items-center justify-center ${
                          isNowCalling 
                            ? 'text-white bg-red-600 border-4 border-red-200 text-[6vh] w-[12vh] h-[12vh]' 
                            : 'text-white bg-gray-500 border-2 border-gray-300 text-[4.5vh] w-[9vh] h-[9vh]'
                        }`}>
                          {q.counter_number || "-"}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center opacity-30">
                  <div className="text-[8vh] font-black text-gray-400 tracking-widest">
                    ว่างให้บริการ
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 🟢 ฝั่งขวา (35%): คิวที่รอ */}
        <div className="w-[35%] flex flex-col gap-4 min-h-0 relative z-10">
          
          <div className="flex-1 bg-white/80 backdrop-blur-md rounded-[2rem] border border-white flex flex-col overflow-hidden shadow-xl min-h-0">
            <div className="h-[12vh] bg-gradient-to-r from-gray-800 to-gray-700 flex items-center justify-center border-b-4 border-emerald-500 shrink-0">
              <h2 className="text-[3.5vh] font-black text-white tracking-widest flex items-center gap-3">
                คิวที่รอ (WAITING)
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                </span>
              </h2>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto bg-gray-50/50">
              {waitingQueues.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {waitingQueues.slice(0, 14).map((q, index) => (
                    <div 
                      key={index} 
                      className="bg-white border-2 border-emerald-100 text-emerald-700 rounded-2xl py-4 text-center text-[4vh] font-black shadow-sm"
                    >
                      {q.queue_number}
                    </div>
                  ))}
                  {waitingQueues.length > 14 && (
                    <div className="col-span-2 text-center text-[3vh] font-black text-emerald-600 bg-emerald-50 py-3 rounded-xl mt-2 border border-emerald-100/50">
                      และอีก {waitingQueues.length - 14} คิว...
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

        </div>
      </main>

      {/* Footer */}
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