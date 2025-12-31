import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI, userAPI } from "../services/api";
import SideBar from "../components/SideBar";
import Header from "../components/Header";
import UserWelcomeSection from "../components/UserWelcomeSection";
import LabTechDashBody from "../components/LabTechDashBody";
import DocDashBody from "../components/DocDashBody";
import ResearcherDashBody from "../components/ResearcherDashBody";
import AdminDashBody from "../components/AdminDashBody";

export default function Dashboard() {
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
        setError("Failed to fetch user data.");
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
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <p className="text-red-500 text-lg font-semibold">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <SideBar />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <Header />

        {/* Dashboard Content */}
        <div className="p-8">
          {/* User Welcome Section */}
          <UserWelcomeSection />

          {/* Disease Distribution & Quick Actions - Role Based */}
          {user?.role === "Lab Technician" && <LabTechDashBody />}
          {user?.role === "Doctor" && <DocDashBody />}
          {user?.role === "Researcher" && <ResearcherDashBody />}
          {user?.role === "Admin" && <AdminDashBody />}
        </div>
      </div>
    </div>
  );
}
