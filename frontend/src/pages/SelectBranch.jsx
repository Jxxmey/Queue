import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaStore, FaCheckCircle, FaSearch } from "react-icons/fa";

export default function SelectBranch() {
  const navigate = useNavigate();
  const [officer, setOfficer] = useState(null);
  const [branchList, setBranchList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

  useEffect(() => {
    // 1. ตรวจสอบข้อมูลพนักงานที่ล็อกอิน
    const savedOfficer = localStorage.getItem("officer");
    if (savedOfficer) {
      const parsedOfficer = JSON.parse(savedOfficer);
      setOfficer(parsedOfficer);
      
      const branchId = String(parsedOfficer.branch_id || parsedOfficer["Branch (ID)"] || "").trim();
      if (branchId !== "55") {
        navigate("/sale");
      } else {
        // 2. ถ้าเป็นรหัส 55 ให้ไปดึงรายชื่อสาขาทั้งหมดจาก Backend
        fetchAllBranches();
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const fetchAllBranches = async () => {
    try {
      // ดึงข้อมูลพนักงานทั้งหมด
      const res = await axios.get(`${apiUrl}/api/officer/`);
      const allOfficers = res.data;

      // 🟢 สกัดเอาเฉพาะข้อมูลสาขา และตัดสาขาที่ซ้ำกันออก
      const uniqueBranchesMap = new Map();
      allOfficers.forEach((emp) => {
        const bId = String(emp.branch_id || "").trim();
        const bName = String(emp.branch_name || "").trim();
        
        // ข้ามพนักงานที่ไม่มีรหัสสาขา หรือรหัสสาขาเป็น 55 
        if (bId && bId !== "55" && !uniqueBranchesMap.has(bId)) {
          uniqueBranchesMap.set(bId, { id: bId, name: bName });
        }
      });

      // แปลง Map เป็น Array แล้วทำการ Sort เรียงตามรหัสสาขา
      const sortedBranches = Array.from(uniqueBranchesMap.values()).sort((a, b) => {
        // พยายามแปลงเป็นตัวเลขเพื่อการเรียงลำดับที่ถูกต้อง (เช่น 9 มาก่อน 10)
        const numA = parseInt(a.id, 10);
        const numB = parseInt(b.id, 10);
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        return a.id.localeCompare(b.id); // ถ้าไม่ใช่ตัวเลขให้เรียงตามตัวอักษร
      });

      setBranchList(sortedBranches);
    } catch (error) {
      console.error("Error fetching branches:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBranch = (branch) => {
    if (!officer) return;

    // อัปเดตข้อมูลสาขาใหม่ของพนักงานชั่วคราว
    const updatedOfficer = {
      ...officer,
      branch_id: branch.id,
      branch_name: branch.name,
      original_branch: "55" // เก็บประวัติไว้
    };

    localStorage.setItem("officer", JSON.stringify(updatedOfficer));
    navigate("/sale");
  };

  // 🟢 ฟังก์ชันสำหรับกรองสาขาตามคำค้นหา (ค้นได้ทั้งรหัสและชื่อ)
  const filteredBranches = branchList.filter((branch) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      branch.id.toLowerCase().includes(searchLower) ||
      branch.name.toLowerCase().includes(searchLower)
    );
  });

  if (!officer) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-green-50 to-emerald-100 flex items-center justify-center p-4 font-sans">
      <div className="max-w-2xl w-full bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl overflow-hidden border border-white flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-8 text-center relative overflow-hidden shrink-0">
          <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl"></div>
          <FaStore className="text-5xl text-emerald-400 mx-auto mb-4 drop-shadow-md" />
          <h1 className="text-3xl font-black text-white tracking-widest">เลือกสาขาปฏิบัติงาน</h1>
          <p className="text-emerald-100 mt-2 font-medium">ยินดีต้อนรับ {officer.name} (รหัส 55)</p>
        </div>

        {/* ช่องค้นหาสาขา */}
        <div className="p-6 pb-2 shrink-0 border-b border-gray-100">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหารหัสสาขา หรือชื่อสาขา..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all text-gray-700"
            />
          </div>
        </div>

        {/* รายการสาขา (Scrollable) */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
              <span className="ml-3 text-gray-500">กำลังโหลดรายชื่อสาขา...</span>
            </div>
          ) : filteredBranches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredBranches.map((branch) => (
                <button
                  key={branch.id}
                  onClick={() => handleSelectBranch(branch)}
                  className="flex items-center p-4 bg-white border-2 border-gray-100 hover:border-emerald-400 rounded-xl transition-all hover:bg-emerald-50 hover:shadow-md group text-left active:scale-95"
                >
                  <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 group-hover:bg-emerald-500 transition-colors shrink-0">
                    <FaCheckCircle className="text-gray-300 group-hover:text-white transition-colors" />
                  </div>
                  <div className="ml-3 overflow-hidden">
                    <h3 className="font-bold text-gray-800 text-md group-hover:text-emerald-700 transition-colors truncate">
                      สาขา {branch.id}
                    </h3>
                    <p className="text-xs text-gray-400 truncate">
                      {branch.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400">
              <p>ไม่พบสาขาที่ค้นหา "{searchQuery}"</p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t border-gray-100 text-center shrink-0">
          <button 
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("officer");
              navigate("/login");
            }}
            className="text-red-500 hover:text-red-700 font-bold text-sm underline"
          >
            ยกเลิกและออกจากระบบ
          </button>
        </div>

      </div>
    </div>
  );
}