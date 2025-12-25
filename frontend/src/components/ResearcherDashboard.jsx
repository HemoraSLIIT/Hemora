import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Bell,
  Users,
  Calendar,
  Settings,
  User,
  ChevronDown,
} from "lucide-react";
import { authAPI, userAPI } from "../services/api";
import HemNewLogo from "/assets/hemnewlogo3.svg";

const ResearcherDashboard = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedDisease, setSelectedDisease] = useState("IDA");
  const navigate = useNavigate();

  // Disease options for confusion matrix dropdown
  const diseaseOptions = [
    { value: "IDA", label: "IDA" },
    { value: "Thalassemia", label: "Thalassemia" },
    { value: "Leukemia", label: "Leukemia" },
    { value: "Sickle Cell", label: "Sickle Cell Anemia" },
  ];

  // Confusion matrix data for each disease
  const confusionMatrixData = {
    IDA: { tp: 92, fp: 8, fn: 11, tn: 89 },
    Thalassemia: { tp: 85, fp: 12, fn: 9, tn: 94 },
    Leukemia: { tp: 78, fp: 15, fn: 13, tn: 94 },
    "Sickle Cell": { tp: 88, fp: 10, fn: 7, tn: 95 },
  };

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

  const handleLogout = () => {
    authAPI.logout();
    navigate("/login");
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  const handleGenerateReport = () => {
    // Handle report generation
    alert("Generating comprehensive research report...");
  };

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

  const currentMatrix = confusionMatrixData[selectedDisease];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
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
            className="text-white w-6 h-6 cursor-pointer hover:scale-110"
            onClick={() => handleNavigate("/dashboard")}
          />
          <Bell className="text-white w-6 h-6 cursor-pointer hover:scale-110" />
          <Users
            className="text-white w-6 h-6 cursor-pointer hover:scale-110"
            onClick={() => handleNavigate("/patients")}
          />
          <Calendar className="text-white w-6 h-6 cursor-pointer hover:scale-110" />
          <Settings className="text-white w-6 h-6 cursor-pointer hover:scale-110" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Researcher</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 bg-[#0a0e3f] rounded-full flex items-center justify-center text-white font-bold text-lg">
                ND
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-8">
          {/* Top Row - F1 Score and Precision vs Recall */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* F1 Score Comparison */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                F1 Score Comparison
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Evaluation based on balanced precision and recall
              </p>
              <div className="flex items-center justify-center">
                <img
                  src="/assets/f1.png"
                  alt="F1 Score Comparison"
                  className="w-full h-auto max-h-55 object-contain"
                />
              </div>
            </div>

            {/* Precision vs Recall */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                Precision vs Recall Across Disease
              </h3>
              <div className="flex items-center justify-center mt-8">
                <img
                  src="/assets/precision.png"
                  alt="Precision vs Recall"
                  className="w-full h-auto max-h-55 object-contain"
                />
              </div>
            </div>
          </div>

          {/* Bottom Row - Confusion Matrix and ROC Curve */}
          <div className="grid grid-cols-2 gap-6">
            {/* Confusion Matrix */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">
                  Confusion Matrix - {selectedDisease}
                </h3>
                <div className="relative">
                  <select
                    value={selectedDisease}
                    onChange={(e) => setSelectedDisease(e.target.value)}
                    className="appearance-none bg-[#0a0e3f] text-white px-4 py-2 pr-10 rounded-lg cursor-pointer font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {diseaseOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white w-4 h-4 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center justify-center mt-8">
                <img
                  src="/assets/confusionmatrix.png"
                  alt="Confusion Matrix"
                  className="w-full h-auto max-h-55 object-contain"
                />
              </div>
            </div>

            {/* ROC Curve */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                ROC Curve - Comparison of Blood Disorder
              </h3>
              <div className="flex items-center justify-center mt-8">
                <img
                  src="/assets/roc.png"
                  alt="ROC Curve"
                  className="w-full h-auto max-h-55 object-contain"

                />
              </div>
            </div>
          </div>

          {/* Generate Report Button */}
          <div className="flex justify-end mt-8">
            <button
              onClick={handleGenerateReport}
              className="px-8 py-3 bg-[#0a0e3f] text-white rounded-lg font-semibold hover:opacity-90 transition duration-300 shadow-lg"
            >
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResearcherDashboard;