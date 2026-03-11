import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Bell, Calendar, Settings, Users, X, Moon, Sun } from "lucide-react";
import HemNewLogo from "/assets/hemnewlogo3.svg";
import Calender from "./Calender.jsx";

export default function SideBar() {
  const navigate = useNavigate();
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [userRole, setUserRole] = useState(
    localStorage.getItem("user_role") || "Lab Technician"
  );
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    const handleStorage = () => {
      setUserRole(localStorage.getItem("user_role") || "Lab Technician");
      setTheme(localStorage.getItem("theme") || "light");
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("theme-dark", theme === "dark");
    localStorage.setItem("theme", theme);
    window.dispatchEvent(new CustomEvent("themechange", { detail: theme }));
  }, [theme]);

  const handleViewPatients = () => {
    navigate("/dashboard");
  };

  const handleUsersClick = () => {
    if (userRole === "Admin") {
      navigate("/users");
    } else if (userRole === "Doctor" || userRole === "Lab Technician") {
      navigate("/patients");
    }
  };

  const handleCalendarClick = () => {
    setShowCalendar(true);
  };

  const closeCalendar = () => {
    setShowCalendar(false);
  };

  const handleSettingsClick = () => {
    setShowSettings(true);
  };

  const closeSettings = () => {
    setShowSettings(false);
  };

  const handleThemeToggle = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  return (
    <>
      <div className="relative w-22 h-full">
        <div className="absolute inset-x-0 top-0 h-22 bg-white" />
        <div className="absolute inset-x-0 top-22 bottom-0 bg-gray-50" />
        <div className="relative w-22 bg-[#0a0e3f] flex flex-col items-center py-6 space-y-0 rounded-tr-4xl rounded-br-4xl h-full">
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
            <Settings
              onClick={handleSettingsClick}
              className="text-white w-6 h-6 cursor-pointer hover:scale-110"
            />
          </div>
        </div>
      </div>

      {showCalendar && (
        <div
          className="fixed inset-0 bg-[#000000b4] flex justify-center items-center z-50"
          onClick={closeCalendar}
        >
          <div
            className="bg-white rounded-lg shadow-lg p-10 relative w-full max-w-md"
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

      {showSettings && (
        <div
          className="fixed inset-0 bg-[#000000b4] flex justify-center items-center z-50"
          onClick={closeSettings}
        >
          <div
            className="bg-white rounded-2xl shadow-lg p-6 relative w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeSettings}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition cursor-pointer"
            >
              <X size={22} />
            </button>

            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900">Settings</h3>
              <p className="text-sm text-gray-500 mt-1">
                Customize your appearance settings.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">Theme</p>
                <p className="text-xs text-gray-500 mt-1">
                  Switch between light and dark mode.
                </p>
              </div>

              <button
                type="button"
                onClick={handleThemeToggle}
                className={`relative inline-flex h-10 w-22 items-center rounded-full transition-colors cursor-pointer ${
                  theme === "dark" ? "bg-[#0a0e3f]" : "bg-gray-300"
                }`}
                aria-label="Toggle theme"
              >
                <span
                  className={`absolute left-1 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm transition-transform ${
                    theme === "dark" ? "translate-x-12" : "translate-x-0"
                  }`}
                >
                  {theme === "dark" ? (
                    <Moon className="theme-toggle-moon h-4 w-4 text-blue-500" />
                  ) : (
                    <Sun className="h-4 w-4 text-amber-500" />
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
