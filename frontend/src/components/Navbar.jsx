import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaDesktop, FaPrint, FaTv, FaUserCircle, FaSignOutAlt, FaCog, FaStore } from "react-icons/fa";

export default function Navbar() {
  const [officer, setOfficer] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const savedOfficer = localStorage.getItem("officer");
    if (savedOfficer) {
      setOfficer(JSON.parse(savedOfficer));
    }
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("officer");
    navigate("/login");
  };

  if (!officer) return null;

  // 🟢 ตรวจสอบสิทธิ์ตำแหน่ง (อ้างอิงจากคอลัมน์ Position)
  const allowedRoles = ["cashier", "Branch Sales Manager", "Assistant Branch Sales Manager"];
  const officerRole = officer.position || officer.Position || "";
  
  const canAccessAdmin = allowedRoles.some(role => 
    officerRole.toLowerCase().includes(role.toLowerCase())
  );

  // 🟢 อ้างอิงสาขาจากข้อมูลหลังบ้านโดยตรง (ใช้ key ตัวเล็กตามที่ Python ส่งมา)
  const branchId = officer.branch_id || officer["Branch (ID)"] || "Main";
  const branchName = officer.branch_name || officer["Branch Name"] || branchId;

  // 🟢 อ้างอิงชื่อพนักงาน (ใช้ key ตัวเล็ก)
  const officerFirstName = officer.name || officer.Name || "พนักงาน";
  const officerLastName = officer.surname || officer.Surname || "";

  const navLinks = [
    { path: "/sale", name: "ออกคิว", icon: <FaPrint className="text-xl mb-1" /> },
    { path: "/cashier", name: "เรียกคิว", icon: <FaDesktop className="text-xl mb-1" /> },
    // 🟢 ส่ง Branch ID และ Branch Name ไปให้หน้า TV Display
    { path: `/tv?branch_id=${branchId}&branch_name=${encodeURIComponent(branchName)}`, name: "หน้าจอทีวี", icon: <FaTv className="text-xl mb-1" />, target: "_blank" },
    ...(canAccessAdmin ? [{ path: "/admin", name: "จัดการคิว", icon: <FaCog className="text-xl mb-1" /> }] : [])
  ];

  return (
    <>
      {/* Top App Bar */}
      <nav className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-500 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            <div className="flex items-center gap-3">
              <img src="/assets/logo.png" alt="Studio 7 Logo" className="h-9 w-auto object-contain bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm" />
              <span className="font-extrabold text-xl tracking-wider hidden sm:block">Queue System</span>
              
              {/* 🟢 แสดงชื่อสาขาบน Navbar */}
              <div className="hidden sm:block border-l border-green-400 h-6 mx-2"></div>
              <div className="hidden sm:flex items-center gap-1.5 bg-green-800/30 px-3 py-1 rounded-full text-sm font-bold border border-green-500/50 shadow-inner">
                <FaStore className="text-emerald-200" />
                <span className="text-green-50 truncate max-w-[150px]" title={branchName}>{branchName}</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  target={link.target || "_self"}
                  className={`flex items-center gap-2 transition-all px-4 py-2 rounded-xl ${
                    location.pathname === link.path.split('?')[0] 
                      ? "bg-white/20 text-white font-bold backdrop-blur-md shadow-inner" 
                      : "text-green-100 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2 mt-[-4px]">{link.icon} {link.name}</span>
                </Link>
              ))}
            </div>

            <div className="flex items-center relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full transition-all border border-white/20 backdrop-blur-md"
              >
                <FaUserCircle className="text-xl sm:text-2xl" />
                <span className="text-sm font-bold hidden sm:block">{officerFirstName}</span>
              </button>

              {showDropdown && (
                <div className="absolute right-0 top-14 mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white overflow-hidden text-gray-800 animate-fade-in-up z-50">
                  <div className="px-5 py-4 bg-gradient-to-br from-gray-50 to-gray-100 border-b border-gray-100">
                    <p className="text-sm font-extrabold text-gray-800">{officerFirstName} {officerLastName}</p>
                    <p className="text-xs text-gray-500 mt-1 font-medium">ตำแหน่ง: <span className="text-green-600">{officerRole || "พนักงาน"}</span></p>
                    {/* 🟢 แสดงชื่อสาขาใน Dropdown เผื่อดูบนมือถือ */}
                    <p className="text-xs text-emerald-600 mt-2 font-bold flex items-center gap-1">
                      <FaStore /> {branchName}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-5 py-4 text-sm text-red-500 hover:bg-red-50 transition-colors font-bold text-left active:bg-red-100"
                  >
                    <FaSignOutAlt className="text-lg" /> ออกจากระบบ
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Bottom Navigation Bar (Mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-40 pb-safe">
        <div className="flex justify-around items-center h-16 px-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              target={link.target || "_self"}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${
                location.pathname === link.path.split('?')[0]
                  ? "text-emerald-600 font-bold scale-105" 
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {link.icon}
              <span className="text-[10px]">{link.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}