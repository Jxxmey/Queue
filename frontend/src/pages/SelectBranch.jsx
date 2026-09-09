import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaStore, FaCheckCircle } from "react-icons/fa";

export default function SelectBranch() {
  const navigate = useNavigate();
  const [officer, setOfficer] = useState(null);

  // รายการสาขาทั้งหมดในบริษัท (คุณสามารถเพิ่มหรือแก้ไขตรงนี้ได้)
  const branchList = [
    { id: "182", name: "ID182 : Studio 7-Central-World" },
    { id: "335", name: "ID335 : Studio 7-Central-Pinklao" },
    { id: "400", name: "ID400 : Studio 7-Mega-Bangna" },
    { id: "501", name: "ID501 : Studio 7-Siam-Paragon" }
  ];

  useEffect(() => {
    // ดึงข้อมูลพนักงานจาก LocalStorage
    const savedOfficer = localStorage.getItem("officer");
    if (savedOfficer) {
      const parsedOfficer = JSON.parse(savedOfficer);
      setOfficer(parsedOfficer);
      
      // ถ้าไม่ใช่รหัสสาขา 55 ให้เด้งกลับไปหน้าหลัก (กันคนอื่นแอบเข้า)
      if (parsedOfficer.branch_id !== "55") {
        navigate("/sale");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const handleSelectBranch = (branch) => {
    if (!officer) return;

    // อัปเดตข้อมูลสาขาใหม่ของพนักงาน
    const updatedOfficer = {
      ...officer,
      branch_id: branch.id,
      branch_name: branch.name,
      original_branch: "55" // เก็บประวัติไว้ว่ามาจากสาขา 55 เผื่อใช้งาน
    };

    // บันทึกทับลงใน LocalStorage
    localStorage.setItem("officer", JSON.stringify(updatedOfficer));
    
    // พาไปหน้าออกคิว
    navigate("/sale");
  };

  if (!officer) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-green-50 to-emerald-100 flex items-center justify-center p-4 font-sans">
      <div className="max-w-2xl w-full bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl overflow-hidden border border-white">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl"></div>
          <FaStore className="text-5xl text-emerald-400 mx-auto mb-4 drop-shadow-md" />
          <h1 className="text-3xl font-black text-white tracking-widest">เลือกสาขาปฏิบัติงาน</h1>
          <p className="text-emerald-100 mt-2 font-medium">ยินดีต้อนรับ {officer.name} (สังกัดส่วนกลาง / รหัส 55)</p>
          <p className="text-gray-300 text-sm mt-1">กรุณาเลือกสาขาที่คุณต้องการออกคิวในวันนี้</p>
        </div>

        {/* รายการสาขา */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2">
            {branchList.map((branch) => (
              <button
                key={branch.id}
                onClick={() => handleSelectBranch(branch)}
                className="flex items-center p-5 bg-gray-50 border-2 border-gray-100 hover:border-emerald-500 rounded-2xl transition-all hover:bg-emerald-50 hover:shadow-md group text-left active:scale-95"
              >
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 group-hover:bg-emerald-500 transition-colors shrink-0">
                  <FaCheckCircle className="text-gray-300 group-hover:text-white text-xl transition-colors" />
                </div>
                <div className="ml-4">
                  <h3 className="font-black text-gray-800 text-lg group-hover:text-emerald-700 transition-colors">
                    สาขา {branch.id}
                  </h3>
                  <p className="text-xs font-bold text-gray-400 truncate max-w-[150px] sm:max-w-[200px]">
                    {branch.name}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t border-gray-100 text-center">
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