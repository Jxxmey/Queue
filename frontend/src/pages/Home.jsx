import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaUsers, FaClock, FaCheckCircle, FaSearch } from "react-icons/fa";

export default function Home() {
  const { queueNumber } = useParams(); 
  const navigate = useNavigate();
  
  const [activeQueues, setActiveQueues] = useState([]);
  const [myQueue, setMyQueue] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const fetchQueueData = async () => {
    try {
      const activeRes = await axios.get(`${apiUrl}/api/queue/active`);
      const queues = activeRes.data;
      setActiveQueues(queues);

      if (queueNumber) {
        const found = queues.find(q => q.queue_number.toUpperCase() === queueNumber.toUpperCase());
        if (found) {
          setMyQueue(found);
        } else {
          setMyQueue({ status: "called_or_not_found" }); 
        }
      } else {
        setMyQueue(null);
      }
      
      setError("");
    } catch (err) {
      console.error("Error fetching queues:", err);
      setError("ไม่สามารถดึงข้อมูลคิวได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueData();
    const interval = setInterval(fetchQueueData, 5000); 
    return () => clearInterval(interval);
  }, [queueNumber]);

  const getQueuesAhead = () => {
    if (!myQueue || myQueue.status === "called_or_not_found") return 0;
    const myIndex = activeQueues.findIndex(q => q.queue_number === myQueue.queue_number);
    return myIndex >= 0 ? myIndex : 0;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/${searchInput.trim().toUpperCase()}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-green-50 to-emerald-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-600"></div>
      </div>
    );
  }

  return (
    /* 🟢 พื้นหลังไล่สี (Background Gradient) */
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-emerald-100 flex flex-col font-sans">
      
      {/* 🟢 Header ไล่สี (Header Gradient) */}
      <header className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-500 text-white p-4 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-center gap-3">
          <img src="/assets/logo.png" alt="Studio 7 Logo" className="h-10 w-auto object-contain bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-sm" />
        </div>
      </header>

      <main className="flex-1 max-w-md w-full mx-auto p-4 space-y-6 mt-4 pb-10">
        
        {error && (
          <div className="bg-red-50/90 backdrop-blur-sm text-red-500 p-4 rounded-2xl text-center font-bold shadow-sm border border-red-100">
            {error}
          </div>
        )}

        {/* ส่วนค้นหาคิว */}
        {!queueNumber && (
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white p-7">
            <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-700 to-emerald-500 mb-2">ติดตามสถานะคิว</h2>
            <p className="text-sm text-gray-500 mb-5 font-medium">กรุณากรอกหมายเลขคิวของคุณ เช่น A001</p>
            <form onSubmit={handleSearch} className="flex gap-3">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="หมายเลขคิว"
                className="flex-1 px-5 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none uppercase font-black text-lg tracking-widest shadow-inner text-gray-700"
              />
              <button 
                type="submit"
                className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg hover:shadow-green-500/30 active:scale-95 flex items-center justify-center"
              >
                <FaSearch className="text-xl" />
              </button>
            </form>
          </div>
        )}

        {/* แสดงสถานะคิวของลูกค้า */}
        {queueNumber && myQueue && (
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white overflow-hidden transform transition-all">
            <div className="bg-gradient-to-r from-green-100 to-emerald-50 p-5 border-b border-green-100 flex items-center justify-between">
              <h2 className="text-green-800 font-extrabold tracking-wider text-lg">คิวของคุณ: <span className="text-green-600">{queueNumber.toUpperCase()}</span></h2>
              <button 
                onClick={() => { navigate("/"); setSearchInput(""); }} 
                className="text-xs bg-white text-green-700 px-4 py-2 rounded-full border border-green-200 hover:bg-green-50 hover:shadow-md font-bold transition-all shadow-sm"
              >
                เช็คคิวอื่น
              </button>
            </div>
            
            <div className="p-8 text-center relative overflow-hidden">
              {/* ตกแต่งแสงเบลอๆ ด้านหลัง */}
              <div className="absolute top-[-50px] left-[-50px] w-32 h-32 bg-green-400/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-[-50px] right-[-50px] w-32 h-32 bg-emerald-400/10 rounded-full blur-3xl"></div>

              {myQueue.status === "called_or_not_found" ? (
                <div className="space-y-4 animate-fade-in-up relative z-10">
                  <div className="w-24 h-24 bg-gradient-to-tr from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/30 mb-6">
                    <FaCheckCircle className="text-5xl text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600">ถึงคิวของคุณแล้ว!</h3>
                    <p className="text-gray-500 mt-3 text-sm font-medium leading-relaxed bg-gray-50 py-2 px-4 rounded-xl inline-block border border-gray-100">โปรดติดต่อพนักงานที่เคาน์เตอร์<br/>(หรือหมายเลขคิวนี้สิ้นสุดการรอแล้ว)</p>
                  </div>
                </div>
              ) : (
                <div className="animate-fade-in-up relative z-10">
                  {/* 🟢 ตัวอักษรไล่สี (Text Gradient) */}
                  <div className="text-[5.5rem] font-black text-transparent bg-clip-text bg-gradient-to-br from-green-600 via-emerald-500 to-teal-400 mb-8 drop-shadow-sm tracking-tighter leading-none py-2">
                    {myQueue.queue_number}
                  </div>
                  
                  <div className="flex justify-center gap-6 bg-white/60 backdrop-blur-md rounded-3xl p-6 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <div className="text-center w-1/2">
                      <p className="text-xs text-gray-500 flex items-center gap-1.5 justify-center mb-2 font-bold uppercase tracking-wider">
                        <FaUsers className="text-emerald-500 text-lg" /> คิวก่อนหน้า
                      </p>
                      <p className="text-4xl font-black text-gray-800">
                        {getQueuesAhead()} <span className="text-sm font-bold text-gray-400">คิว</span>
                      </p>
                    </div>
                    
                    <div className="w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent"></div>
                    
                    <div className="text-center w-1/2">
                      <p className="text-xs text-gray-500 flex items-center gap-1.5 justify-center mb-2 font-bold uppercase tracking-wider">
                        <FaClock className="text-emerald-500 text-lg" /> รอประมาณ
                      </p>
                      <p className="text-4xl font-black text-gray-800">
                        {getQueuesAhead() * 3} <span className="text-sm font-bold text-gray-400">นาที</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* รายการคิวที่กำลังรอทั้งหมด */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white p-7">
          <h2 className="text-lg font-extrabold text-gray-800 mb-5 flex items-center gap-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
            คิวที่กำลังรอเรียก ({activeQueues.length})
          </h2>
          
          {activeQueues.length === 0 ? (
            <div className="text-center py-10 text-gray-400 font-bold bg-gray-50/50 rounded-2xl border border-gray-100 border-dashed">
              ไม่มีคิวรอในขณะนี้
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {activeQueues.slice(0, 9).map((q) => (
                <div 
                  key={q.id}
                  className={`py-3.5 text-center rounded-2xl font-black text-lg transition-all duration-300
                    ${queueNumber && myQueue?.queue_number === q.queue_number 
                      /* 🟢 ปุ่มคิวที่ถูกไฮไลต์ (Gradient Highlight) */
                      ? "bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30 transform scale-105 border-none ring-2 ring-white ring-offset-2 ring-offset-green-50" 
                      : "bg-white text-gray-600 border border-gray-200 shadow-sm hover:shadow-md hover:border-emerald-300"
                    }`}
                >
                  {q.queue_number}
                </div>
              ))}
              {activeQueues.length > 9 && (
                <div className="py-3.5 text-center rounded-2xl font-black text-emerald-600 bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-inner">
                  +{activeQueues.length - 9}
                </div>
              )}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}