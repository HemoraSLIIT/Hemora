import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Bell, Calendar, Settings, Users, X, Moon, Sun, Trash2 } from "lucide-react";
import HemNewLogo from "/assets/hemnewlogo3.svg";
import Calender from "./Calender.jsx";
import { notificationAPI } from "../services/api";

function formatNotificationTime(value) {
  if (!value) return "";

  const timestamp = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return timestamp.toLocaleDateString();
}

export default function SideBar() {
  const navigate = useNavigate();
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userRole, setUserRole] = useState(
    localStorage.getItem("user_role") || "Lab Technician"
  );
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  const loadNotifications = useCallback(async () => {
    try {
      const data = await notificationAPI.getNotifications();
      setNotifications(Array.isArray(data?.results) ? data.results : []);
      setUnreadCount(Number(data?.unreadCount || 0));
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  }, []);

  useEffect(() => {
    const handleStorage = () => {
      setUserRole(localStorage.getItem("user_role") || "Lab Technician");
      setTheme(localStorage.getItem("theme") || "light");
    };

    const handleNotificationRefresh = () => {
      void loadNotifications();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("notifications:refresh", handleNotificationRefresh);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("notifications:refresh", handleNotificationRefresh);
    };
  }, [loadNotifications]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadNotifications();
    }, 5000);

    void loadNotifications();

    return () => window.clearInterval(intervalId);
  }, [loadNotifications]);

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

  const handleNotificationsClick = async () => {
    if (!showNotifications) {
      await loadNotifications();
    }
    setShowNotifications((current) => !current);
  };

  const handleNotificationSelect = async (notification) => {
    try {
      if (!notification.isRead) {
        await notificationAPI.markAsRead(notification.id);
      }
      await loadNotifications();
    } catch (error) {
      console.error("Failed to update notification:", error);
    }

    setShowNotifications(false);

    if (notification.patientId) {
      navigate(`/view-results?patientId=${notification.patientId}`);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      await loadNotifications();
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };

  const handleDeleteNotification = async (event, notificationId) => {
    event.stopPropagation();

    try {
      await notificationAPI.deleteNotification(notificationId);
      await loadNotifications();
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const handleDeleteAllNotifications = async () => {
    try {
      await notificationAPI.deleteAllNotifications();
      await loadNotifications();
    } catch (error) {
      console.error("Failed to delete all notifications:", error);
    }
  };

  return (
    <>
      <div className="relative w-22 h-full">
        <div className="absolute inset-x-0 top-0 h-22 bg-white" />
        <div className="absolute inset-x-0 top-22 bottom-0 bg-gray-50" />
        <div className="relative w-22 bg-[#0a0e3f] flex flex-col items-center py-6 space-y-0 rounded-tr-4xl rounded-br-4xl h-full">
          <div>
            <img
              src={HemNewLogo}
              alt="Logo"
              width={60}
              height={60}
            />
          </div>
          <div className="flex flex-col items-center justify-center flex-1 space-y-8">
            <Home
              onClick={handleViewPatients}
              className="text-white w-6 h-6 cursor-pointer hover:scale-110"
            />
            <button
              type="button"
              onClick={handleNotificationsClick}
              className="relative text-white cursor-pointer hover:scale-110 transition-transform"
              aria-label="Open notifications"
            >
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
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

      {showNotifications && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => setShowNotifications(false)}
        >
          <div
            className={`absolute left-28 top-20 w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl border overflow-hidden ${
              theme === "dark"
                ? "bg-[#1f2329] border-[#3d434c]"
                : "bg-white border-gray-200"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`flex items-center justify-between px-5 py-4 border-b ${
                theme === "dark" ? "border-[#3d434c]" : "border-gray-200"
              }`}
            >
              <div>
                <h3 className={`text-base font-bold ${theme === "dark" ? "text-gray-100" : "text-gray-900"}`}>Notifications</h3>
                <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                  {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={unreadCount === 0}
                  className={`text-xs font-semibold cursor-pointer disabled:cursor-not-allowed ${
                    theme === "dark"
                      ? "text-gray-100 disabled:text-gray-500"
                      : "text-[#0a0e3f] disabled:text-gray-400"
                  }`}
                >
                  Mark all read
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAllNotifications}
                  disabled={notifications.length === 0}
                  className={`text-xs font-semibold cursor-pointer disabled:cursor-not-allowed ${
                    theme === "dark"
                      ? "text-red-300 disabled:text-gray-500"
                      : "text-red-600 disabled:text-gray-400"
                  }`}
                >
                  Clear all
                </button>
              </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleNotificationSelect(notification)}
                    className={`w-full text-left px-5 py-4 border-b transition-colors cursor-pointer ${
                      theme === "dark"
                        ? `border-[#323842] ${notification.isRead ? "bg-[#1f2329] hover:bg-[#2a3038]" : "bg-[#263242] hover:bg-[#314055]"}`
                        : `border-gray-100 ${notification.isRead ? "bg-white hover:bg-gray-50" : "bg-blue-50/70 hover:bg-gray-50"}`
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold ${theme === "dark" ? "text-gray-100" : "text-gray-900"}`}>
                          {notification.title}
                        </p>
                        <p className={`text-sm mt-1 leading-relaxed ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                          {notification.message}
                        </p>
                        <p className={`text-xs mt-2 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>
                          {formatNotificationTime(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <span className="mt-1 w-2.5 h-2.5 rounded-full bg-blue-600 flex-shrink-0" />
                      )}
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={(event) => handleDeleteNotification(event, notification.id)}
                        className={`inline-flex items-center gap-1 text-xs font-semibold cursor-pointer ${
                          theme === "dark" ? "text-red-300 hover:text-red-200" : "text-red-600 hover:text-red-700"
                        }`}
                        aria-label="Delete notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-5 py-10 text-center">
                  <p className={`text-sm font-semibold ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>No notifications yet</p>
                  <p className={`text-xs mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                    Diagnosis and feedback updates will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
