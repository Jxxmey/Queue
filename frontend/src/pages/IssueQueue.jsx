import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaPrint, FaTicketAlt, FaPhone, FaStore, FaBoxOpen, FaHistory, FaRedo } from "react-icons/fa";
import Navbar from "../components/Navbar";

export default function IssueQueue() {
  const [phone, setPhone] = useState("");
  const [serviceType, setServiceType] = useState("walkin");
  const [paymentType, setPaymentType] = useState("fullpay");
  const [bookingDigits, setBookingDigits] = useState("");
  
  const [officer, setOfficer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastQueue, setLastQueue] = useState(null);
  const [recentIssued, setRecentIssued] = useState([]); // 🟢 เก็บประวัติคิวที่ออกไปแล้ว
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

  // ตรวจสอบสถานะการเข้าสู่ระบบและดึงประวัติคิว
  useEffect(() => {
    const savedOfficer = localStorage.getItem("officer");
    if (savedOfficer) {
      setOfficer(JSON.parse(savedOfficer));
      fetchRecentIssued();
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // ฟังก์ชันดึงประวัติคิวที่ออกโดยพนักงานคนนี้ (หรือคิวล่าสุด)
  const fetchRecentIssued = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/queue/active`);
      // เอาคิวล่าสุดขึ้นมาแสดงสัก 5 คิว
      setRecentIssued(res.data.slice(-5).reverse());
    } catch (err) {
      console.error("Error fetching recent queues:", err);
    }
  };

  // ฟังก์ชันจัดการเมื่อกด "พิมพ์บัตรคิว"
  const handleIssueQueue = async (e) => {
    e.preventDefault(); 
    setError("");
    setSuccessMsg("");

    if (!phone) {
      setError("กรุณากรอกเบอร์โทรศัพท์ลูกค้า");
      return;
    }

    let finalBookingNumber = null;
    if (serviceType === "preorder") {
      if (bookingDigits.length !== 7) {
        setError("กรุณากรอกเลขที่จองให้ครบ 7 หลัก");
        return;
      }
      const prefix = paymentType === "fullpay" ? "F18/PRESTU2609" : "P18/PRESTU2609";
      finalBookingNumber = `${prefix}${bookingDigits}`;
    }

    setLoading(true);
    
    try {
      const payload = {
        customer_phone: phone,
        officer_id: officer.id,
        service_type: serviceType,
        booking_number: finalBookingNumber
      };

      const response = await axios.post(`${apiUrl}/api/queue/issue`, payload);
      setLastQueue(response.data);
      setSuccessMsg(`ออกบัตรคิว ${response.data.queue_number} สำเร็จ! กำลังสั่งพิมพ์...`);
      
      // ล้างข้อมูลฟอร์มหลังจากออกคิวสำเร็จ
      setPhone(""); 
      setBookingDigits("");
      
      // รีเฟรชประวัติ
      fetchRecentIssued();
      
    } catch (err) {
      console.error("Issue Queue Error:", err);
      setError("เกิดข้อผิดพลาด ไม่สามารถออกบัตรคิวได้");
    } finally {
      setLoading(false);
    }
  };

  // 🟢 ฟังก์ชันสั่งพิมพ์ซ้ำ (Reprint)
  const handleReprint = async (queueId, queueNum) => {
    try {
      await axios.patch(`${apiUrl}/api/queue/${queueId}/reprint`);
      setSuccessMsg(`ส่งคำสั่งพิมพ์ซ้ำคิว ${queueNum} ไปยังเครื่องพิมพ์แล้ว!`);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error("Reprint Error:", err);
      setError("ไม่สามารถสั่งพิมพ์ซ้ำได้");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-green-50 to-emerald-100 overflow-x-hidden font-sans">
      <Navbar />

      <main className="flex-1 overflow-y-auto p-4 pb-28 md:pb-10 flex flex-col items-center justify-center">
        
        <div className="max-w-md w-full bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl overflow-hidden border border-white my-auto">
          
          {/* ส่วนหัว */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-6 flex flex-col items-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <h1 className="text-2xl font-black text-white tracking-wide relative z-10">ออกบัตรคิวใหม่</h1>
            <p className="text-green-50 font-medium mt-1 text-sm relative z-10">กรอกข้อมูลลูกค้าเพื่อรับบริการ</p>
          </div>

          <form onSubmit={handleIssueQueue} className="p-8 pb-6 text-left space-y-6">
            
            {/* แสดง Error */}
            {error && (
              <div className="bg-red-50/90 text-red-500 p-3 rounded-xl text-sm text-center font-bold border border-red-100">
                {error}
              </div>
            )}

            {/* แสดง Success Message */}
            {successMsg && (
              <div className="bg-emerald-50/90 text-emerald-600 p-3 rounded-xl text-sm text-center font-bold border border-emerald-100 animate-pulse">
                {successMsg}
              </div>
            )}

            {/* ช่องกรอกเบอร์โทร */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider flex items-center gap-2">
                <FaPhone className="text-emerald-500 text-sm"/> เบอร์โทรศัพท์ลูกค้า
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-xl font-bold tracking-widest text-gray-700 shadow-inner"
                placeholder="08X-XXX-XXXX"
              />
            </div>

            {/* เลือกประเภท */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">
                ประเภทการใช้บริการ
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div 
                  onClick={() => setServiceType("walkin")}
                  className={`cursor-pointer rounded-2xl p-5 flex flex-col items-center justify-center gap-3 border-2 transition-all active:scale-95 ${
                    serviceType === "walkin" ? "bg-gradient-to-br from-green-500 to-emerald-500 border-transparent text-white shadow-lg shadow-green-500/30" : "bg-white border-gray-100 text-gray-400 hover:border-emerald-200 hover:text-emerald-500"
                  }`}
                >
                  <FaStore className="text-3xl" />
                  <span className="font-bold text-sm tracking-wide">ซื้อหน้าร้าน</span>
                </div>
                <div 
                  onClick={() => setServiceType("preorder")}
                  className={`cursor-pointer rounded-2xl p-5 flex flex-col items-center justify-center gap-3 border-2 transition-all active:scale-95 ${
                    serviceType === "preorder" ? "bg-gradient-to-br from-green-500 to-emerald-500 border-transparent text-white shadow-lg shadow-green-500/30" : "bg-white border-gray-100 text-gray-400 hover:border-emerald-200 hover:text-emerald-500"
                  }`}
                >
                  <FaBoxOpen className="text-3xl" />
                  <span className="font-bold text-sm tracking-wide">จองสินค้า</span>
                </div>
              </div>
            </div>

            {/* ฟอร์มสำหรับการจอง */}
            {serviceType === "preorder" && (
              <div className="animate-fade-in-up space-y-5 bg-emerald-50/50 p-5 rounded-3xl border border-emerald-100">
                <div>
                  <label className="block text-xs font-bold text-emerald-800 mb-2 uppercase tracking-wider">
                    รูปแบบการชำระเงิน
                  </label>
                  <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setPaymentType("fullpay")}
                      className={`flex-1 py-3 px-2 rounded-xl text-sm font-black transition-all ${
                        paymentType === "fullpay" ? "bg-emerald-500 text-white shadow-md" : "bg-transparent text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      เต็มจำนวน (F18)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentType("partial")}
                      className={`flex-1 py-3 px-2 rounded-xl text-sm font-black transition-all ${
                        paymentType === "partial" ? "bg-emerald-500 text-white shadow-md" : "bg-transparent text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      มัดจำ (P18)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-800 mb-2 uppercase tracking-wider">
                    เลขที่การจอง 7 หลัก
                  </label>
                  <div className="flex bg-white border border-gray-200 rounded-2xl overflow-hidden focus-within:ring-4 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all shadow-inner">
                    <div className="bg-gray-50 text-gray-400 px-2 sm:px-3 py-4 font-black text-xs sm:text-sm flex items-center border-r border-gray-100 select-none tracking-tighter">
                      {paymentType === "fullpay" ? "F18/PRESTU2609" : "P18/PRESTU2609"}
                    </div>
                    <input
                      type="text"
                      maxLength="7"
                      required={serviceType === "preorder"}
                      value={bookingDigits}
                      onChange={(e) => {
                        const onlyNums = e.target.value.replace(/[^0-9]/g, "");
                        setBookingDigits(onlyNums);
                      }}
                      className="w-full px-2 py-4 bg-transparent outline-none text-lg font-black tracking-widest text-gray-700"
                      placeholder="XXXXXXX"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ปุ่มพิมพ์บัตรคิว */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-3 py-5 rounded-2xl transition-all shadow-xl mt-6 border-none
                ${loading ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none" : "bg-gradient-to-br from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-black text-xl active:scale-95 shadow-green-500/30"}`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-7 w-7 border-b-4 border-white"></div>
              ) : (
                <>
                  <FaPrint className="text-2xl" />
                  <span>พิมพ์บัตรคิว</span>
                </>
              )}
            </button>
          </form>

          {/* ป๊อปอัปแจ้งผลคิวล่าสุดและปุ่มพิมพ์ซ้ำ */}
          {lastQueue && !loading && (
            <div className="bg-gradient-to-br from-green-100 to-emerald-50 p-6 border-t border-white m-5 rounded-3xl shadow-inner text-center relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-400/20 rounded-full blur-xl"></div>
              <p className="text-emerald-800 font-bold mb-2 uppercase tracking-wider text-xs">ออกคิวสำเร็จล่าสุด</p>
              <div className="flex items-center justify-center gap-3 text-emerald-600 mb-2 relative z-10">
                <FaTicketAlt className="text-3xl" />
                <span className="text-6xl font-black drop-shadow-sm">{lastQueue.queue_number}</span>
              </div>
              <p className="text-sm font-bold text-gray-500 relative z-10">
                {lastQueue.service_type === 'walkin' ? '🛒 ซื้อหน้าร้าน' : '📦 รับสินค้าจอง'} {lastQueue.customer_phone && `(${lastQueue.customer_phone})`}
              </p>
              
              <button
                onClick={() => handleReprint(lastQueue.id, lastQueue.queue_number)}
                className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 mx-auto active:scale-95 relative z-10"
              >
                <FaRedo className="text-xs" /> พิมพ์บัตรคิวนี้ซ้ำ
              </button>
            </div>
          )}

          {/* 🟢 ส่วนแสดงประวัติคิวที่ออกไปแล้ว (Recent Issued List) */}
          <div className="p-6 bg-gray-50 border-t border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FaHistory /> ประวัติคิวที่ออกล่าสุด (พิมพ์ซ้ำได้)
            </h3>
            
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {recentIssued.map((q) => (
                <div key={q.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-lg font-black text-gray-800">{q.queue_number}</span>
                    <span className="text-xs text-gray-400 ml-2">({q.service_type === 'walkin' ? 'ซื้อหน้าร้าน' : 'รับจอง'})</span>
                  </div>
                  <button
                    onClick={() => handleReprint(q.id, q.queue_number)}
                    className="bg-gray-100 hover:bg-emerald-50 text-emerald-600 p-2 rounded-lg text-xs font-bold transition-all border border-gray-200 hover:border-emerald-300 flex items-center gap-1 active:scale-95"
                    title="พิมพ์ซ้ำ"
                  >
                    <FaPrint /> พิมพ์ซ้ำ
                  </button>
                </div>
              ))}
              {recentIssued.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-2">ยังไม่มีประวัติการออกคิวในขณะนี้</p>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}