import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Bell, Calendar, Settings, Users, X } from "lucide-react";
import HemNewLogo from "/assets/hemnewlogo3.svg";
import Calender from "./Calender.jsx";
import { userAPI } from "../services/api";

export default function SideBar() {
  const navigate = useNavigate();
  const [showCalendar, setShowCalendar] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await userAPI.getCurrentUser();
        setUser(userData);
      } catch (err) {
        console.error("Failed to fetch user data:", err);
      }
    };

    fetchUserData();
  }, []);

  const handleViewPatients = () => {
    navigate("/dashboard");
  };

  const handleUsersClick = () => {
    if (!user) return;

    if (user.role === "Admin") {
      navigate("/users");
    } else if (user.role === "Doctor" || user.role === "Lab Technician") {
      navigate("/patients");
    }
  };

  const handleCalendarClick = () => {
    setShowCalendar(true);
  };

  const closeCalendar = () => {
    setShowCalendar(false);
  };

  return (
    <>
      <div className="w-22 bg-[#0a0e3f] flex flex-col items-center py-6 space-y-0 rounded-tr-4xl rounded-br-4xl h-full">
        <div className="">
          <img
            src={HemNewLogo}
            alt="Logo"
            width={60}
            height={60}
            className=""
          />
        </div>
        <div className="flex flex-col items-center justify-center flex-1 space-y-8">
          <Home
            onClick={handleViewPatients}
            className="text-white w-6 h-6 cursor-pointer hover:scale-110"
          />
          <Bell className="text-white w-6 h-6 cursor-pointer hover:scale-110" />
          <Users
            onClick={handleUsersClick}
            className="text-white w-6 h-6 cursor-pointer hover:scale-110"
          />
          <Calendar
            onClick={handleCalendarClick}
            className="text-white w-6 h-6 cursor-pointer hover:scale-110"
          />
          <Settings className="text-white w-6 h-6 cursor-pointer hover:scale-110" />
        </div>
      </div>

      {showCalendar && (
        <div
          className="fixed inset-0 bg-[#000000b4] flex justify-center items-center z-50"
          onClick={closeCalendar}
        >
          <div
            className="bg-white rounded-lg shadow-2xl p-10 relative w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeCalendar}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition cursor-pointer"
            >
              <X size={24} />
            </button>
            <Calender onClose={closeCalendar} />
          </div>
        </div>
      )}
    </>
  );
}
