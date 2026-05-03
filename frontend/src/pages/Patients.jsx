import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authAPI } from "../services/api";
import { Toaster } from "react-hot-toast";
import SideBar from "../components/SideBar";
import LabTechPatientsView from "../components/LabTechPatientsView";
import DocPatientsView from "../components/DocPatientsView";

export default function Patients() {
  const [searchParams] = useSearchParams();
  const [userRole, setUserRole] = useState(
    localStorage.getItem("user_role") || "Lab Technician"
  );
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const initialStatusFilter = searchParams.get("status") || "All";

  useEffect(() => {
    if (!authAPI.isAuthenticated()) {
      navigate("/login");
      return;
    }

    setUserRole(localStorage.getItem("user_role") || "Lab Technician");
    setLoading(false);
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

  return (
    <div className="flex h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Sidebar */}
      <SideBar />

      {/* Main Content */}
      {/* For Doctors */}
      {userRole === "Doctor" ? (
        <DocPatientsView />
      ) : (
        <LabTechPatientsView initialStatusFilter={initialStatusFilter} />
      )}
    </div>
  );
}
