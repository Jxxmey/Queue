import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaUsers, FaClock, FaCheckCircle, FaTimesCircle, FaTrashAlt, FaSync } from "react-icons/fa";
import Navbar from "../components/Navbar";

export default function AdminQueue() {
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

  useEffect(() => {
    const savedOfficer = localStorage.getItem("officer");
    if (!savedOfficer) {
      navigate("/login");
    }
  }, [navigate]);

  const fetchAllQueues = async () => {
    try {
      // ดึงข้อมูลคิวทั้งหมด (สามารถสร้าง endpoint /api/queue/all ใน backend เพิ่มได้ หรือใช้ active ร่วม)
      const res = await axios.get(`${apiUrl}/api/queue/active`);
      setQueues(res.data);
      setError("");
    } catch (err) {
      console.error("Error fetching queues:", err);
      setError("ไม่สามารถดึงข้อมูลคิวทั้งหมดได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllQueues();
    const interval = setInterval(fetchAllQueues, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (queueId, newStatus) => {
    try {
      await axios.patch(`${apiUrl}/api/queue/${queueId}/status`, { status: newStatus });
      fetchAllQueues();
    } catch (err) {
      console.error("Error updating status:", err);
      alert("ไม่สามารถเปลี่ยนสถานะคิวได้");
    }
  };

  const filteredQueues = queues.filter(q => {
    if (filter === "all") return true;
    return q.status === filter;
  });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-green-50 to-emerald-100 font-sans">
      <Navbar />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-28">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* หัวข้อและปุ่มรีเฟรช */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-lg border border-white">
            <div>
              <h1 className="text-2xl font-black text-gray-800 tracking-wide">จัดการคิวรายวัน (Admin Dashboard)</h1>
              <p className="text-sm text-gray-500 font-medium mt-1">ภาพรวมและควบคุมสถานะคิวทั้งหมดในระบบ</p>
            </div>
            <button 
              onClick={fetchAllQueues}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-2xl font-bold transition-all shadow-md shadow-emerald-500/20 active:scale-95"
            >
              <FaSync className={loading ? "animate-spin" : ""} /> รีเฟรชข้อมูล
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-2xl font-bold text-center border border-red-100">
              {error}
            </div>
          )}

          {/* สถิติภาพรวม */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-lg border border-white flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl font-black shadow-inner">
                <FaUsers />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">คิวรอทั้งหมด</p>
                <p className="text-3xl font-black text-gray-800">{queues.length} <span className="text-sm font-bold text-gray-400">คิว</span></p>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-lg border border-white flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center text-2xl font-black shadow-inner">
                <FaClock />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">กำลังรอเรียก</p>
                <p className="text-3xl font-black text-gray-800">
                  {queues.filter(q => q.status === 'waiting').length} <span className="text-sm font-bold text-gray-400">คิว</span>
                </p>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-lg border border-white flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl font-black shadow-inner">
                <FaCheckCircle />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">กำลังให้บริการ</p>
                <p className="text-3xl font-black text-gray-800">
                  {queues.filter(q => q.status === 'calling').length} <span className="text-sm font-bold text-gray-400">คิว</span>
                </p>
              </div>
            </div>
          </div>

          {/* ตารางแสดงรายการคิว */}
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-wrap gap-3 items-center justify-between">
              <h2 className="text-lg font-black text-gray-800">รายการคิวทั้งหมด</h2>
              
              {/* ปุ่มกรอง */}
              <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl">
                {['all', 'waiting', 'calling'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-extrabold uppercase transition-all ${
                      filter === s ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {s === 'all' ? 'ทั้งหมด' : s === 'waiting' ? 'กำลังรอ' : 'กำลังเรียก'}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 text-gray-400 text-xs font-extrabold uppercase tracking-wider border-b border-gray-100">
                    <th className="p-5">หมายเลขคิว</th>
                    <th className="p-5">ประเภทบริการ</th>
                    <th className="p-5">เบอร์โทรศัพท์</th>
                    <th className="p-5">เลขจอง / รายละเอียด</th>
                    <th className="p-5">สถานะ</th>
                    <th className="p-5 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700 text-sm">
                  {filteredQueues.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-gray-400 font-bold">
                        ไม่พบข้อมูลคิวในระบบ
                      </td>
                    </tr>
                  ) : (
                    filteredQueues.map((q) => (
                      <tr key={q.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-5 font-black text-lg text-emerald-600">{q.queue_number}</td>
                        <td className="p-5">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            q.service_type === 'walkin' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {q.service_type === 'walkin' ? 'ซื้อหน้าร้าน' : 'รับสินค้าจอง'}
                          </span>
                        </td>
                        <td className="p-5 tracking-widest">{q.customer_phone || "-"}</td>
                        <td className="p-5 font-mono text-xs">{q.booking_number || "-"}</td>
                        <td className="p-5">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            q.status === 'waiting' ? 'bg-amber-100 text-amber-700' :
                            q.status === 'calling' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {q.status}
                          </span>
                        </td>
                        <td className="p-5 text-center">
                          <button
                            onClick={() => handleUpdateStatus(q.id, 'cancelled')}
                            className="bg-red-50 hover:bg-red-500 text-red-500 hover:text-white p-2.5 rounded-xl transition-all shadow-xs"
                            title="ยกเลิกคิวนี้"
                          >
                            <FaTrashAlt />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}