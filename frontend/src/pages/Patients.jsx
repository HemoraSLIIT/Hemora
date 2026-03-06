import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI, userAPI } from "../services/api";
import { Toaster } from "react-hot-toast";
import SideBar from "../components/SideBar";
import LabTechPatientsView from "../components/LabTechPatientsView";
import DocPatientsView from "../components/DocPatientsView";

export default function Patients() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    if (!authAPI.isAuthenticated()) {
      navigate("/login");
      return;
    }

    // Fetch current user data
    const fetchUserData = async () => {
      try {
        const userData = await userAPI.getCurrentUser();
        setUser(userData);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch user data:", err);
        const cachedRole = localStorage.getItem("user_role") || "Lab Technician";
        setUser({ role: cachedRole });
        setError("Unable to verify user profile now. Loaded fallback view.");
        setLoading(false);

        // If unauthorized, redirect to login
        if (err.response?.status === 401) {
          authAPI.logout();
          navigate("/login");
        }
      }
    };

    fetchUserData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 text-lg font-semibold mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.warn(error);
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Sidebar */}
      <SideBar />

      {/* Main Content */}
      {error && (
        <div className="fixed top-3 right-3 z-50 rounded-md bg-yellow-100 px-3 py-2 text-xs text-yellow-800 border border-yellow-300">
          {error}
        </div>
      )}

      {/* For Doctors */}
      {user?.role === "Doctor" ? <DocPatientsView /> : <LabTechPatientsView />}
    </div>
  );
}
