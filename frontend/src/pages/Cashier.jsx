import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaBullhorn, FaDesktop, FaListUl, FaPlay, FaCheckCircle, FaRedo, FaHistory } from "react-icons/fa";
import Navbar from "../components/Navbar";

export default function Cashier() {
  const [queues, setQueues] = useState([]);
  const [recentQueues, setRecentQueues] = useState([]); // เก็บประวัติคิวทั้งหมด
  const [selectedCounter, setSelectedCounter] = useState("1"); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

  useEffect(() => {
    const savedOfficer = localStorage.getItem("officer");
    if (!savedOfficer) {
      navigate("/login");
    } else {
      const parsedOfficer = JSON.parse(savedOfficer);
      if (parsedOfficer.counter && ["1", "2", "3"].includes(parsedOfficer.counter)) {
        setSelectedCounter(parsedOfficer.counter);
      }
    }
  }, [navigate]);

  const fetchData = async () => {
    try {
      // ดึงทั้งคิวที่รอ และคิวที่ถูกเรียกไปแล้วพร้อมกัน
      const [activeRes, recentRes] = await Promise.all([
        axios.get(`${apiUrl}/api/queue/active`),
        axios.get(`${apiUrl}/api/queue/recent`)
      ]);
      setQueues(activeRes.data);
      setRecentQueues(recentRes.data);
    } catch (err) {
      console.error("Error fetching queues:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const callQueue = async (queueId) => {
    if (!selectedCounter) {
      setError("กรุณาเลือกหมายเลขเคาน์เตอร์ก่อนเรียกคิว");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const payload = { counter_number: selectedCounter };
      await axios.post(`${apiUrl}/api/queue/${queueId}/call`, payload);
      fetchData(); // ดึงข้อมูลใหม่ทันทีหลังเรียกคิว
    } catch (err) {
      console.error("Error calling queue:", err);
      setError("ไม่สามารถเรียกคิวได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  const callNextQueue = () => {
    if (queues.length === 0) {
      setError("ไม่มีคิวรอในขณะนี้");
      return;
    }
    callQueue(queues[0].id);
  };

  // 🟢 ค้นหาคิวล่าสุดที่ "เคาน์เตอร์นี้" เป็นคนเรียก (แก้ปัญหาคิวหายไปจากหน้าจอเวลาช่องอื่นกดเรียก)
  const myCurrentQueue = recentQueues.find(q => String(q.counter_number) === String(selectedCounter));

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 via-green-50 to-emerald-100 overflow-hidden font-sans">
      <Navbar />

      <main className="flex-1 overflow-y-auto pb-24 md:pb-6 p-4 md:p-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
          
          {/* ซ้าย: แผงควบคุมและคิวของฉัน */}
          <div className="md:col-span-1 space-y-6 flex flex-col h-full">
            
            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-lg border border-white p-6">
              <h2 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2 uppercase tracking-wider">
                <FaDesktop className="text-emerald-500" /> เคาน์เตอร์ประจำจุด
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {["1", "2", "3"].map((num) => (
                  <button
                    key={num}
                    onClick={() => setSelectedCounter(num)}
                    className={`py-3 rounded-2xl font-black text-xl transition-all border-2
                      ${selectedCounter === num 
                        ? "bg-gradient-to-br from-green-500 to-emerald-500 text-white border-transparent shadow-lg shadow-green-500/30 transform scale-105" 
                        : "bg-white text-gray-400 border-gray-100 hover:border-emerald-200 hover:text-emerald-500"
                      }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-lg border border-white p-6 flex flex-col items-center flex-shrink-0">
              {error && (
                <div className="w-full bg-red-50/80 backdrop-blur-sm text-red-500 p-3 rounded-xl mb-4 text-sm font-bold text-center border border-red-100">
                  {error}
                </div>
              )}
              
              <button
                onClick={callNextQueue}
                disabled={loading || queues.length === 0}
                className={`w-full py-8 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all active:scale-95 border-none
                  ${queues.length === 0 || loading
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-inner"
                    : "bg-gradient-to-br from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white shadow-xl shadow-green-500/40"
                  }`}
              >
                <FaBullhorn className={`text-5xl ${queues.length > 0 && !loading ? 'animate-pulse' : ''}`} />
                <span className="text-3xl font-black tracking-wide">เรียกคิวถัดไป</span>
                <span className="text-sm font-medium bg-black/10 px-3 py-1 rounded-full backdrop-blur-sm">
                  รออยู่ {queues.length} คิว
                </span>
              </button>
            </div>

            {/* 🟢 แสดงหน้าจอว่า "ช่องตัวเองเรียกเลขอะไร" */}
            <div className="flex-1 bg-gradient-to-br from-green-100 to-emerald-50 rounded-3xl shadow-lg border border-white p-6 text-center flex flex-col justify-center relative overflow-hidden min-h-[200px]">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl"></div>
              
              <h3 className="text-emerald-800 font-extrabold tracking-wide text-sm relative z-10 bg-white/50 py-1.5 px-4 rounded-full inline-block mx-auto mb-4 border border-white">
                ช่องบริการ {selectedCounter} (กำลังให้บริการ)
              </h3>

              {myCurrentQueue ? (
                <div className="animate-fade-in-up">
                  <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-green-700 to-emerald-500 my-2 relative z-10 drop-shadow-sm">
                    {myCurrentQueue.queue_number}
                  </div>
                  <p className="text-sm font-bold text-emerald-600/80 relative z-10 mb-5">
                    {myCurrentQueue.service_type === 'walkin' ? '🛒 ซื้อหน้าร้าน' : '📦 รับสินค้าจอง'}
                  </p>

                  <button
                    onClick={() => callQueue(myCurrentQueue.id)}
                    disabled={loading}
                    className="mx-auto bg-white hover:bg-emerald-500 text-emerald-600 hover:text-white border border-emerald-200 hover:border-transparent px-5 py-2.5 rounded-full text-sm font-bold shadow-sm transition-all flex items-center gap-2 relative z-10 active:scale-95 disabled:opacity-50"
                  >
                    <FaRedo /> เรียกคิวซ้ำ
                  </button>
                </div>
              ) : (
                <div className="opacity-40 flex flex-col items-center">
                  <FaCheckCircle className="text-4xl mb-3" />
                  <p className="font-bold">ยังไม่ได้เรียกคิว</p>
                </div>
              )}
            </div>
          </div>

          {/* ขวา: รายการคิวที่รอ และ ประวัติล่าสุด */}
          <div className="md:col-span-2 flex flex-col gap-6 h-full overflow-hidden">
            
            {/* คิวที่กำลังรอเรียก (ด้านบน) */}
            <div className="flex-1 bg-white/80 backdrop-blur-md rounded-3xl shadow-lg border border-white flex flex-col overflow-hidden min-h-0">
              <div className="bg-white/50 backdrop-blur-md p-5 border-b border-gray-100 flex items-center justify-between z-10 shrink-0">
                <h2 className="text-base font-extrabold text-gray-800 flex items-center gap-2">
                  <FaListUl className="text-emerald-500" /> คิวที่กำลังรอเรียก ({queues.length})
                </h2>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5 space-y-3 scrollbar-hide">
                {queues.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                    <FaCheckCircle className="text-6xl mb-4 text-emerald-200" />
                    <p className="text-xl font-bold">ว่างแล้ว พักผ่อนได้เลย!</p>
                  </div>
                ) : (
                  queues.map((q, index) => (
                    <div key={q.id} className="group flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-4 hover:border-emerald-300 transition-all shadow-sm hover:shadow-md">
                      <div className="flex items-center gap-4">
                        <div className={`font-black text-2xl h-14 w-20 flex items-center justify-center rounded-xl shadow-inner
                          ${index === 0 ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white' : 'bg-gray-50 text-gray-700'}`}>
                          {q.queue_number}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 flex items-center gap-2">
                            {q.service_type === 'walkin' ? '🛒 ซื้อหน้าร้าน' : '📦 รับสินค้าจอง'}
                            {index === 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider font-bold animate-pulse">ถัดไป</span>}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => callQueue(q.id)}
                        disabled={loading}
                        className="flex items-center gap-2 text-sm font-bold bg-gray-50 hover:bg-emerald-500 hover:text-white text-emerald-600 px-4 py-3 rounded-xl transition-all shadow-sm active:scale-95 border border-emerald-100 hover:border-transparent disabled:opacity-50"
                      >
                        <FaPlay /> <span className="hidden sm:inline">เรียกคิว</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 🟢 ตาราง 4 ช่องด้านล่าง (ประวัติการเรียกภาพรวม) */}
            <div className="h-1/3 min-h-[160px] bg-white/80 backdrop-blur-md rounded-3xl shadow-lg border border-white p-5 flex flex-col shrink-0">
              <h2 className="text-sm font-extrabold text-gray-500 mb-3 flex items-center gap-2 uppercase tracking-wider">
                <FaHistory className="text-emerald-500" /> ประวัติการเรียก 4 คิวล่าสุด (ทุกเคาน์เตอร์)
              </h2>
              
              <div className="flex gap-4 h-full">
                {recentQueues.slice(0, 4).map((q, index) => (
                  <div key={index} className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 flex flex-col items-center justify-center shadow-sm">
                    <div className="text-3xl font-black text-gray-700">{q.queue_number}</div>
                    <div className="text-xs text-emerald-600 font-bold mt-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                      ช่อง {q.counter_number || "-"}
                    </div>
                  </div>
                ))}
                
                {/* กรณีที่ยังไม่มีประวัติคิวเลยให้ช่องแสดงว่างๆ */}
                {Array.from({ length: Math.max(0, 4 - recentQueues.length) }).map((_, i) => (
                  <div key={`empty-${i}`} className="flex-1 rounded-2xl border-2 border-dashed border-gray-100 flex items-center justify-center bg-gray-50/30 opacity-50">
                    <span className="text-gray-300 font-bold">-</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}