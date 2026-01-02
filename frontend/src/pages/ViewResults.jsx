import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  TestTubeDiagonal,
  MessageSquareText,
  MousePointerClick,
  Stethoscope,
  ArrowLeft,
  Download,
} from "lucide-react";
import SideBar from "../components/SideBar";
import { userAPI } from "../services/api";

// Mock data for diagnosis results
const mockDiagnosisData = {
  patientId: "P-2025-001",
  patientName: "John Doe",
  testDate: "2025-12-30",
  results: [
    {
      id: 1,
      disease: "Leukemia",
      probability: 78,
      severity: "High",
      status: "Positive",
    },
    {
      id: 2,
      disease: "Beta Thalassemia",
      probability: 45,
      severity: "Medium",
      status: "Pending",
    },
    {
      id: 3,
      disease: "Sickle Cell Anemia",
      probability: 15,
      severity: "Low",
      status: "Negative",
    },
    {
      id: 4,
      disease: "Iron Deficiency Anemia (IDA)",
      probability: 32,
      severity: "Low",
      status: "Pending",
    },
  ],
  doctorComments:
    "Patient shows elevated WBC count. Recommend immediate hematology consultation.",
};

export default function ViewResultsPage() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const userData = await userAPI.getCurrentUser();
        // Map role values to display names
        const roleMap = {
          doctor: "Doctor",
          lab_tech: "Lab Technician",
          researcher: "Researcher",
          admin: "Admin",
        };
        setUserRole(roleMap[userData.role] || userData.role);
      } catch (err) {
        console.error("Failed to fetch user role:", err);
        setUserRole("Lab Technician"); // Default fallback
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SideBar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
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
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* <button
                onClick={() => navigate("/dashboard")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button> */}
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Diagnosis Results
                </h1>
                <p className="text-sm text-gray-500">
                  Patient: {mockDiagnosisData.patientName} (
                  {mockDiagnosisData.patientId})
                </p>
              </div>
            </div>
            {userRole === "Lab Technician" && (
              <button
                onClick={() => alert("Generate report initiated")}
                className="flex items-center space-x-2 px-4 py-2 bg-[#0a0e3f] text-white rounded-lg hover:opacity-90 transition-colors cursor-pointer"
              >
                <Download className="w-5 h-5" />
                <span>Generate Report</span>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-8 bg-gray-50 min-h-screen">
          {/* Test Date Info */}
          <div className="mb-8 bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              {/* <Calendar className="text-gray-900 w-5 h-5" /> */}
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">
                  Test Date
                </p>
                <p className="text-base font-semibold text-gray-900">
                  {new Date(mockDiagnosisData.testDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Diagnosis Results */}
          <div className="mb-8">
            <ResultsDisplay results={mockDiagnosisData.results} />
          </div>

          {/* Role-based Actions Section */}
          <div>
            {userRole === "Lab Technician" ? (
              <LabTechSidebar data={mockDiagnosisData} navigate={navigate} />
            ) : userRole === "Doctor" ? (
              <DoctorSidebar data={mockDiagnosisData} navigate={navigate} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// Lab Technician Sidebar Component
function LabTechSidebar({ data, navigate }) {
  const [isDone, setIsDone] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex gap-8">
        {/* Doctor's Comments */}
        <div className="flex-[2.5] bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Stethoscope className="text-gray-900 w-5 h-5" />
            Doctor's Comments
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 min-h-24">
            <p className="text-gray-700 text-sm leading-relaxed">
              {data.doctorComments}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex-1 bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex flex-col">
          <h3 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide">
            Actions
          </h3>
          <div className="flex flex-col gap-3 flex-1">
            <button
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition duration-300 cursor-pointer ${
                isDone
                  ? "bg-green-900 text-white hover:opacity-90"
                  : "bg-green-700 text-white hover:opacity-90"
              }`}
              onClick={() => setIsDone(true)}
            >
              {isDone ? "✓ Marked Done" : "Mark as Done"}
            </button>
            <button
              className="flex-1 py-3 px-4 bg-yellow-500 text-white rounded-lg font-semibold hover:opacity-90 transition duration-300 cursor-pointer"
              onClick={() => alert("Re-Diagnosis initiated")}
            >
              Re-Diagnose
            </button>
          </div>
        </div>
      </div>

      {isDone && (
        <div className="p-4 bg-green-50 border border-green-300 rounded-lg">
          <p className="text-green-800 text-sm font-semibold">
            ✓ Results marked as complete
          </p>
        </div>
      )}
    </div>
  );
}

// Doctor Sidebar Component
function DoctorSidebar({ data, navigate }) {
  const [comments, setComments] = useState("");
  const [selectedAction, setSelectedAction] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selectedAction) {
      setSubmitted(true);
      console.log({
        action: selectedAction,
        comments: comments,
        timestamp: new Date(),
      });
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } else {
      alert("Please select a decision");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex gap-8">
        {/* Comments Section */}
        <div className="flex-[2] bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquareText className="text-gray-900 w-5 h-5" />
            Add Your Comments
          </h3>
          <textarea
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#0a0e3f] focus:ring-1 focus:ring-[#0a0e3f] resize-none transition"
            placeholder="Add your medical assessment and observations..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            disabled={submitted}
          />
        </div>

        {/* Action Selection and Submit */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide">
              Decision
            </h3>
            <div className="space-y-3">
              <label
                className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                  selectedAction === "accept"
                    ? "border-[#0a0e3f] bg-blue-50"
                    : "border-gray-300 bg-white hover:border-gray-400"
                }`}
              >
                <input
                  type="radio"
                  name="action"
                  value="accept"
                  checked={selectedAction === "accept"}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  disabled={submitted}
                  className="cursor-pointer"
                />
                <div>
                  <span className="font-semibold text-gray-900 block text-sm">
                    Accept Results
                  </span>
                  <p className="text-xs text-gray-600">Confirm diagnosis</p>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                  selectedAction === "rediagnose"
                    ? "border-[#0a0e3f] bg-blue-50"
                    : "border-gray-300 bg-white hover:border-gray-400"
                }`}
              >
                <input
                  type="radio"
                  name="action"
                  value="rediagnose"
                  checked={selectedAction === "rediagnose"}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  disabled={submitted}
                  className="cursor-pointer"
                />
                <div>
                  <span className="font-semibold text-gray-900 block text-sm">
                    Re-Diagnosis
                  </span>
                  <p className="text-xs text-gray-600">Request new analysis</p>
                </div>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            className="w-full py-3 px-4 bg-[#0a0e3f] text-white rounded-lg font-semibold hover:opacity-90 transition duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSubmit}
            disabled={submitted}
          >
            {submitted ? "Submitted ✓" : "Submit Feedback"}
          </button>
        </div>
      </div>

      {submitted && (
        <div className="p-4 bg-green-50 border border-green-300 rounded-lg">
          <p className="text-green-800 text-sm font-semibold">
            ✓ Feedback submitted successfully
          </p>
        </div>
      )}
    </div>
  );
}

// Shared Results Display Component
function ResultsDisplay({ results }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <TestTubeDiagonal className="text-gray-900 w-5 h-5" />
        Diagnosis Results
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {results.map((result) => (
          <div
            key={result.id}
            className="p-6 bg-gray-50 rounded-lg border-l-4 transition hover:shadow-md hover:bg-gray-50"
            style={{
              borderLeftColor:
                result.probability > 70
                  ? "#dc2626"
                  : result.probability > 40
                  ? "#f59e0b"
                  : "#22c55e",
            }}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-bold text-gray-900 text-lg mb-1">
                  {result.disease}
                </h4>
                <p className="text-sm text-gray-600">
                  Severity:{" "}
                  <span
                    className={`font-semibold ${
                      result.severity === "High"
                        ? "text-red-600"
                        : result.severity === "Medium"
                        ? "text-yellow-600"
                        : "text-green-600"
                    }`}
                  >
                    {result.severity}
                  </span>
                </p>
              </div>
              <span
                className={`px-4 py-2 rounded-full text-sm font-bold text-white ${
                  result.probability > 70
                    ? "bg-red-500"
                    : result.probability > 40
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
              >
                {result.probability}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all ${
                  result.probability > 70
                    ? "bg-red-500"
                    : result.probability > 40
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${result.probability}%` }}
              />
            </div>

            {/* Status Badge */}
            {/* <div className="mt-4 flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                Status:
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  result.status === "Positive"
                    ? "bg-red-100 text-red-800"
                    : result.status === "Pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {result.status}
              </span>
            </div> */}
          </div>
        ))}
      </div>
    </div>
  );
}
