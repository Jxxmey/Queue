import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaBullhorn, FaDesktop, FaListUl, FaPlay, FaCheckCircle } from "react-icons/fa";
import Navbar from "../components/Navbar";

export default function Cashier() {
  const [queues, setQueues] = useState([]);
  const [selectedCounter, setSelectedCounter] = useState("1"); 
  const [loading, setLoading] = useState(false);
  const [callingQueue, setCallingQueue] = useState(null);
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

  const fetchWaitingQueues = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/queue/active`);
      setQueues(response.data);
    } catch (err) {
      console.error("Error fetching queues:", err);
    }
  };

  useEffect(() => {
    fetchWaitingQueues();
    const interval = setInterval(fetchWaitingQueues, 3000);
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
      const response = await axios.post(`${apiUrl}/api/queue/${queueId}/call`, payload);
      
      setCallingQueue(response.data);
      fetchWaitingQueues(); 
      
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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* คอลัมน์ซ้าย */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaDesktop className="text-green-600" /> เคาน์เตอร์ของคุณ
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {["1", "2", "3"].map((num) => (
                <button
                  key={num}
                  onClick={() => setSelectedCounter(num)}
                  className={`py-3 rounded-xl font-bold text-lg transition-all border-2
                    ${selectedCounter === num 
                      ? "bg-green-600 text-white border-green-600 shadow-md transform scale-105" 
                      : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                    }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col items-center text-center">
            {error && (
              <div className="w-full bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm font-bold">
                {error}
              </div>
            )}
            
            <button
              onClick={callNextQueue}
              disabled={loading || queues.length === 0}
              className={`w-full py-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all shadow-lg active:scale-95
                ${queues.length === 0 || loading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
                  : "bg-green-600 hover:bg-green-700 text-white"
                }`}
            >
              <FaBullhorn className="text-5xl" />
              <span className="text-2xl font-bold">เรียกคิวถัดไป</span>
              <span className="text-sm font-normal opacity-80">
                (มีคิวรอ {queues.length} คิว)
              </span>
            </button>
          </div>

          {callingQueue && (
            <div className="bg-green-50 rounded-2xl shadow-sm border border-green-200 p-6 text-center animate-fade-in-up">
              <FaCheckCircle className="text-4xl text-green-500 mx-auto mb-2" />
              <h3 className="text-green-800 font-bold mb-1">คิวที่กำลังให้บริการ</h3>
              <div className="text-5xl font-black text-green-700 my-3">
                {callingQueue.queue_number}
              </div>
              <p className="text-sm text-gray-600">
                ประเภท: {callingQueue.service_type === 'walkin' ? 'ซื้อหน้าร้าน' : 'รับสินค้าจอง'}
              </p>
              {callingQueue.booking_number && (
                <p className="text-xs font-bold bg-green-200 text-green-800 py-1 px-2 rounded-lg mt-2 inline-block">
                  {callingQueue.booking_number}
                </p>
              )}
            </div>
          )}
        </div>

        {/* คอลัมน์ขวา */}
        <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden h-[calc(100vh-120px)]">
          <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <FaListUl className="text-green-600" /> รายการคิวที่รอเรียก ({queues.length})
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {queues.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <FaCheckCircle className="text-6xl mb-4 text-gray-200" />
                <p className="text-xl font-bold">ไม่มีคิวรอในขณะนี้</p>
              </div>
            ) : (
              queues.map((q, index) => (
                <div key={q.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4 hover:border-green-300 transition-colors shadow-sm">
                  
                  <div className="flex items-center gap-4">
                    <div className="bg-green-100 text-green-800 font-black text-2xl h-14 w-20 flex items-center justify-center rounded-lg">
                      {q.queue_number}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 flex items-center gap-2">
                        {q.service_type === 'walkin' ? '🛒 ซื้อหน้าร้าน' : '📦 รับสินค้าจอง'}
                        {index === 0 && <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">คิวถัดไป</span>}
                      </p>
                      {q.booking_number && (
                        <p className="text-xs text-gray-500 mt-1 font-mono">
                          Ref: {q.booking_number}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => callQueue(q.id)}
                    disabled={loading}
                    className="flex items-center gap-2 text-sm font-bold bg-gray-100 hover:bg-green-600 hover:text-white text-gray-600 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <FaPlay /> เรียกคิว
                  </button>
                  
                </div>
              ))
            )}
          </div>
        </div>

      </main>
    </div>
  );
}