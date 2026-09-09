import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaUsers, FaSearch, FaArrowLeft } from "react-icons/fa";

export default function ManageOfficers() {
  const navigate = useNavigate();
  const [officers, setOfficers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

  useEffect(() => {
    // 1. ตรวจสอบสิทธิ์การเข้าถึง (ต้องเป็น ID 32032 เท่านั้น)
    const savedOfficer = localStorage.getItem("officer");
    if (!savedOfficer) {
      navigate("/login");
      return;
    }

    const parsedOfficer = JSON.parse(savedOfficer);
    setCurrentUser(parsedOfficer);

    // 🟢 ตรวจสอบรหัส ถ้าไม่ใช่ 32032 เด้งกลับหน้าหลัก
    if (parsedOfficer.id !== "32032") {
      alert("คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (เฉพาะ Admin ID: 32032)");
      navigate("/sale");
      return;
    }

    // 2. ถ้าเป็น 32032 ให้โหลดข้อมูลพนักงานทั้งหมดมาแสดง
    fetchOfficers();
  }, [navigate]);

  const fetchOfficers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}/api/officer/`);
      setOfficers(res.data);
    } catch (error) {
      console.error("Error fetching officers:", error);
    } finally {
      setLoading(false);
    }
  };

  // กรองข้อมูลพนักงานตามคำค้นหา
  const filteredOfficers = officers.filter(emp => {
    const term = searchQuery.toLowerCase();
    return (
      emp.id.toLowerCase().includes(term) ||
      emp.name.toLowerCase().includes(term) ||
      emp.surname.toLowerCase().includes(term) ||
      emp.branch_name.toLowerCase().includes(term)
    );
  });

  if (!currentUser || currentUser.id !== "32032") return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/sale")}
              className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors"
            >
              <FaArrowLeft />
            </button>
            <div>
              <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                <FaUsers className="text-emerald-500" />
                ระบบจัดการพนักงาน
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Admin: {currentUser.name} {currentUser.surname}
              </p>
            </div>
          </div>

          <div className="relative w-full md:w-96">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหารหัส, ชื่อ, นามสกุล, สาขา..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm">
                  <th className="p-4 font-bold whitespace-nowrap">รหัสพนักงาน</th>
                  <th className="p-4 font-bold whitespace-nowrap">ชื่อ-นามสกุล</th>
                  <th className="p-4 font-bold whitespace-nowrap">ตำแหน่ง</th>
                  <th className="p-4 font-bold whitespace-nowrap">แผนก</th>
                  <th className="p-4 font-bold whitespace-nowrap">รหัสสาขา</th>
                  <th className="p-4 font-bold whitespace-nowrap">สาขา</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500">
                      กำลังโหลดข้อมูล...
                    </td>
                  </tr>
                ) : filteredOfficers.length > 0 ? (
                  filteredOfficers.map((emp) => (
                    <tr key={emp.id} className="border-b border-gray-50 hover:bg-emerald-50/50 transition-colors">
                      <td className="p-4 font-mono text-gray-700">{emp.id}</td>
                      <td className="p-4 font-medium text-gray-900">
                        {emp.title}{emp.name} {emp.surname}
                      </td>
                      <td className="p-4 text-gray-600">{emp.position || "-"}</td>
                      <td className="p-4 text-gray-600">{emp.department_name || "-"}</td>
                      <td className="p-4 text-center">
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">
                          {emp.branch_id || "-"}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600 text-xs">{emp.branch_name || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500">
                      ไม่พบข้อมูลพนักงานที่ค้นหา
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 bg-gray-50 border-t border-gray-100 text-sm text-gray-500 text-right">
            พบข้อมูลทั้งหมด {filteredOfficers.length} รายการ
          </div>
        </div>

      </div>
    </div>
  );
}