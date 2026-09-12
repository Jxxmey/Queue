import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaBullhorn, FaDesktop, FaPlay, FaCheckCircle, FaRedo, FaHistory, FaStore, FaBoxOpen } from "react-icons/fa";
import Navbar from "../components/Navbar";

export default function Cashier() {
  const [queues, setQueues] = useState([]);
  const [recentQueues, setRecentQueues] = useState([]); 
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
      fetchData(); 
    } catch (err) {
      console.error("Error calling queue:", err);
      setError("ไม่สามารถเรียกคิวได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  // 🟢 แยกลิสต์คิว A (Walk-in) และ B (Pre-order)
  const walkinQueues = queues.filter(q => q.service_type === 'walkin');
  const preorderQueues = queues.filter(q => q.service_type === 'preorder');

  const myCurrentQueue = recentQueues.find(q => String(q.counter_number) === String(selectedCounter));

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 overflow-hidden font-sans">
      <Navbar />

      <main className="flex-1 overflow-y-auto pb-24 md:pb-6 p-4 md:p-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          
          {/* ซ้าย: แผงควบคุมและคิวของฉัน (กินพื้นที่ 4 ส่วน) */}
          <div className="lg:col-span-4 space-y-6 flex flex-col h-full">
            
            {/* เลือกเคาน์เตอร์ */}
            <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-lg border border-white p-6">
              <h2 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2 uppercase tracking-wider">
                <FaDesktop className="text-blue-500" /> เคาน์เตอร์ประจำจุด
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {["1", "2", "3"].map((num) => (
                  <button
                    key={num}
                    onClick={() => setSelectedCounter(num)}
                    className={`py-3 rounded-2xl font-black text-xl transition-all border-2
                      ${selectedCounter === num 
                        ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-transparent shadow-lg shadow-blue-500/30 transform scale-105" 
                        : "bg-white text-gray-400 border-gray-100 hover:border-blue-200 hover:text-blue-500"
                      }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* 🟢 ปุ่มกดเรียกคิว (แยก A และ B) */}
            <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-lg border border-white p-6 flex flex-col items-center">
              {error && (
                <div className="w-full bg-red-50 text-red-500 p-3 rounded-xl mb-4 text-sm font-bold text-center border border-red-100">
                  {error}
                </div>
              )}
              
              <h2 className="text-sm font-bold text-gray-500 mb-3 w-full text-left uppercase tracking-wider">
                เรียกคิวถัดไป
              </h2>
              
              <div className="grid grid-cols-2 gap-3 w-full">
                {/* ปุ่มเรียกคิว A */}
                <button
                  onClick={() => callQueue(walkinQueues[0]?.id)}
                  disabled={loading || walkinQueues.length === 0}
                  className={`py-6 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 border-none
                    ${walkinQueues.length === 0 || loading
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-inner"
                      : "bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-green-500/30"
                    }`}
                >
                  <FaBullhorn className="text-2xl" />
                  <span className="text-lg font-black tracking-wide">เรียกคิว A</span>
                  <span className="text-xs font-bold bg-black/10 px-2 py-1 rounded-full">รอ {walkinQueues.length} คิว</span>
                </button>

                {/* ปุ่มเรียกคิว B */}
                <button
                  onClick={() => callQueue(preorderQueues[0]?.id)}
                  disabled={loading || preorderQueues.length === 0}
                  className={`py-6 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 border-none
                    ${preorderQueues.length === 0 || loading
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-inner"
                      : "bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg shadow-orange-500/30"
                    }`}
                >
                  <FaBullhorn className="text-2xl" />
                  <span className="text-lg font-black tracking-wide">เรียกคิว B</span>
                  <span className="text-xs font-bold bg-black/10 px-2 py-1 rounded-full">รอ {preorderQueues.length} คิว</span>
                </button>
              </div>
            </div>

            {/* แสดงสถานะช่องบริการ */}
            <div className="flex-1 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl shadow-lg border border-white p-6 text-center flex flex-col justify-center relative overflow-hidden min-h-[200px]">
              <h3 className="text-blue-800 font-extrabold tracking-wide text-sm relative z-10 bg-white/50 py-1.5 px-4 rounded-full inline-block mx-auto mb-4">
                ช่องบริการ {selectedCounter} (กำลังให้บริการ)
              </h3>

              {myCurrentQueue ? (
                <div className="animate-fade-in-up">
                  <div className={`text-6xl font-black text-transparent bg-clip-text drop-shadow-sm my-2
                    ${myCurrentQueue.service_type === 'walkin' ? 'bg-gradient-to-br from-green-600 to-emerald-400' : 'bg-gradient-to-br from-orange-600 to-red-400'}`}>
                    {myCurrentQueue.queue_number}
                  </div>
                  <p className="text-sm font-bold text-gray-600 relative z-10 mb-5">
                    {myCurrentQueue.service_type === 'walkin' ? '🛒 ซื้อหน้าร้าน (A)' : '📦 รับสินค้าจอง (B)'}
                  </p>
                  <button
                    onClick={() => callQueue(myCurrentQueue.id)}
                    disabled={loading}
                    className="mx-auto bg-white hover:bg-blue-500 text-blue-600 hover:text-white border border-blue-200 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
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

          {/* ขวา: รายการคิวที่รอ และ ประวัติล่าสุด (กินพื้นที่ 8 ส่วน) */}
          <div className="lg:col-span-8 flex flex-col gap-6 h-full overflow-hidden">
            
            {/* 🟢 แบ่งคอลัมน์คิว A และ B */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
              
              {/* คอลัมน์ A (Walk-in) */}
              <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-lg border border-emerald-100 flex flex-col overflow-hidden">
                <div className="bg-emerald-500 p-4 flex items-center justify-between text-white shrink-0">
                  <h2 className="text-base font-extrabold flex items-center gap-2">
                    <FaStore /> คิว A (ซื้อหน้าร้าน)
                  </h2>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">รอ {walkinQueues.length} คิว</span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                  {walkinQueues.length === 0 ? (
                    <p className="text-center text-gray-400 font-bold mt-10">ไม่มีคิว A รอเรียก</p>
                  ) : (
                    walkinQueues.map((q, index) => (
                      <div key={q.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-3 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className={`font-black text-xl h-12 w-16 flex items-center justify-center rounded-xl 
                            ${index === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-50 text-gray-700'}`}>
                            {q.queue_number}
                          </div>
                          {index === 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-md uppercase font-bold animate-pulse">คิวถัดไป</span>}
                        </div>
                        <button
                          onClick={() => callQueue(q.id)}
                          disabled={loading}
                          className="text-xs font-bold bg-emerald-50 hover:bg-emerald-500 hover:text-white text-emerald-600 px-3 py-2 rounded-lg transition-all border border-emerald-100"
                        >
                          <FaPlay />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* คอลัมน์ B (Pre-order) */}
              <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-lg border border-orange-100 flex flex-col overflow-hidden">
                <div className="bg-orange-500 p-4 flex items-center justify-between text-white shrink-0">
                  <h2 className="text-base font-extrabold flex items-center gap-2">
                    <FaBoxOpen /> คิว B (จองสินค้า)
                  </h2>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">รอ {preorderQueues.length} คิว</span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                  {preorderQueues.length === 0 ? (
                    <p className="text-center text-gray-400 font-bold mt-10">ไม่มีคิว B รอเรียก</p>
                  ) : (
                    preorderQueues.map((q, index) => (
                      <div key={q.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-3 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className={`font-black text-xl h-12 w-16 flex items-center justify-center rounded-xl 
                            ${index === 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-700'}`}>
                            {q.queue_number}
                          </div>
                          {index === 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-md uppercase font-bold animate-pulse">คิวถัดไป</span>}
                        </div>
                        <button
                          onClick={() => callQueue(q.id)}
                          disabled={loading}
                          className="text-xs font-bold bg-orange-50 hover:bg-orange-500 hover:text-white text-orange-600 px-3 py-2 rounded-lg transition-all border border-orange-100"
                        >
                          <FaPlay />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* ประวัติการเรียก 4 คิวล่าสุด */}
            <div className="h-1/4 min-h-[140px] bg-white/90 backdrop-blur-md rounded-3xl shadow-lg border border-white p-5 flex flex-col shrink-0">
              <h2 className="text-sm font-extrabold text-gray-500 mb-3 flex items-center gap-2 uppercase tracking-wider">
                <FaHistory className="text-blue-500" /> ประวัติการเรียก 4 คิวล่าสุด (ทุกเคาน์เตอร์)
              </h2>
              
              <div className="flex gap-4 h-full">
                {recentQueues.slice(0, 4).map((q, index) => (
                  <div key={index} className={`flex-1 rounded-2xl border-2 flex flex-col items-center justify-center shadow-sm
                    ${q.service_type === 'walkin' ? 'bg-emerald-50 border-emerald-100' : 'bg-orange-50 border-orange-100'}`}>
                    <div className={`text-2xl font-black ${q.service_type === 'walkin' ? 'text-emerald-700' : 'text-orange-700'}`}>
                      {q.queue_number}
                    </div>
                    <div className="text-xs text-gray-600 font-bold mt-1 bg-white px-3 py-1 rounded-full shadow-sm">
                      ช่อง {q.counter_number || "-"}
                    </div>
                  </div>
                ))}
                
                {Array.from({ length: Math.max(0, 4 - recentQueues.length) }).map((_, i) => (
                  <div key={`empty-${i}`} className="flex-1 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50/50">
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