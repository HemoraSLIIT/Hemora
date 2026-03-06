import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  TestTubeDiagonal,
  MessageSquareText,
  Stethoscope,
  Download,
} from "lucide-react";
import SideBar from "../components/SideBar";
import toast from "react-hot-toast";
import { patientAPI, userAPI } from "../services/api";

// Keep diagnosis blocks mocked until result integration is completed.
const mockDiagnosisResults = [
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
];

const roleMap = {
  doctor: "Doctor",
  lab_tech: "Lab Technician",
  researcher: "Researcher",
  admin: "Admin",
};

export default function ViewResultsPage() {
  const [searchParams] = useSearchParams();
  const [userRole, setUserRole] = useState(null);
  const [patient, setPatient] = useState(null);
  const [feedbackEntries, setFeedbackEntries] = useState([]);
  const [pageError, setPageError] = useState("");
  const [loading, setLoading] = useState(true);

  const patientId = searchParams.get("patientId");

  const patientDisplayName = useMemo(() => {
    if (!patient) {
      return "-";
    }

    const fullName = `${patient.firstName || ""} ${patient.lastName || ""}`.trim();
    return fullName || "Unknown";
  }, [patient]);

  useEffect(() => {
    const loadPageData = async () => {
      if (!patientId) {
        setPageError("Missing patient id in URL.");
        setLoading(false);
        return;
      }

      try {
        const [userData, patientData, feedbackData] = await Promise.all([
          userAPI.getCurrentUser(),
          patientAPI.getPatientById(patientId),
          patientAPI.getPatientFeedback(patientId),
        ]);

        setUserRole(roleMap[userData.role] || userData.role);
        setPatient(patientData);
        setFeedbackEntries(Array.isArray(feedbackData) ? feedbackData : []);
        setPageError("");
      } catch (err) {
        console.error("Failed to load View Results page data:", err);
        setPageError("Failed to load patient details.");
        toast.error("Failed to load patient details");
      } finally {
        setLoading(false);
      }
    };

    loadPageData();
  }, [patientId]);

  const refreshPatientStatus = async () => {
    if (!patientId) {
      return;
    }

    try {
      const patientData = await patientAPI.getPatientById(patientId);
      setPatient(patientData);
    } catch (err) {
      console.error("Failed to refresh patient:", err);
    }
  };

  const handleDoctorFeedbackSubmit = async ({ comment, decision }) => {
    if (!patientId) {
      throw new Error("Patient id missing");
    }

    const payload = {
      results: mockDiagnosisResults,
      comment,
      decision,
    };

    const feedback = await patientAPI.createPatientFeedback(patientId, payload);
    setFeedbackEntries((prev) => [feedback, ...prev]);
    await refreshPatientStatus();
    return feedback;
  };

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

  if (pageError) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SideBar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-red-500">{pageError}</p>
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
                  Patient: {patientDisplayName} (P-{patient?.id || "-"})
                </p>
                <p className="text-sm text-gray-500">
                  Current Status: {patient?.status || "-"}
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
                  {patient?.createdAt
                    ? new Date(patient.createdAt).toLocaleDateString()
                    : "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Diagnosis Results */}
          <div className="mb-8">
            <ResultsDisplay results={mockDiagnosisResults} />
          </div>

          {/* Role-based Actions Section */}
          <div>
            {userRole === "Lab Technician" ? (
              <LabTechSidebar feedbackEntries={feedbackEntries} />
            ) : userRole === "Doctor" ? (
              <DoctorSidebar
                onSubmitFeedback={handleDoctorFeedbackSubmit}
                feedbackEntries={feedbackEntries}
                patientStatus={patient?.status}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// Lab Technician Sidebar Component
function LabTechSidebar({ feedbackEntries }) {
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
          {feedbackEntries.length > 0 ? (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {feedbackEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      {entry.decision || "Decision not set"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {entry.createdAt
                        ? new Date(entry.createdAt).toLocaleString()
                        : ""}
                    </p>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {entry.comment || "No comment provided"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 min-h-24">
              <p className="text-gray-700 text-sm leading-relaxed">
                No doctor comments submitted for this patient yet.
              </p>
            </div>
          )}
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
function DoctorSidebar({ onSubmitFeedback, feedbackEntries, patientStatus }) {
  const [comments, setComments] = useState("");
  const [selectedAction, setSelectedAction] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isDiagnosed = patientStatus === "Diagnosed";

  const handleSubmit = async () => {
    if (isDiagnosed) {
      toast.error("Patient is already diagnosed. No more comments can be added.");
      return;
    }

    if (!selectedAction) {
      toast.error("Please select a decision");
      return;
    }

    try {
      setSubmitting(true);
      await onSubmitFeedback({
        comment: comments,
        decision: selectedAction,
      });

      toast.success("Feedback submitted successfully");
      setComments("");
      setSelectedAction(null);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
      }, 1000);
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      toast.error(err?.response?.data?.detail || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex gap-8">
        {/* Comments Section */}
        <div className="flex-[2.5] bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquareText className="text-gray-900 w-5 h-5" />
            Add Your Comments
          </h3>
          <textarea
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#0a0e3f] focus:ring-1 focus:ring-[#0a0e3f] resize-none transition"
            placeholder="Add your medical assessment and observations..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            disabled={submitted || submitting || isDiagnosed}
          />
        </div>

        {/* Action Selection and Submit */}
        <div className="flex-1 bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex flex-col">
          <h3 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide">
            Decision
          </h3>
          <div className="space-y-3 flex-1">
            <label
              className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                selectedAction === "Accept Results"
                  ? "border-[#0a0e3f] bg-blue-50"
                  : "border-gray-300 bg-white hover:border-gray-400"
              }`}
            >
              <input
                type="radio"
                name="action"
                value="Accept Results"
                checked={selectedAction === "Accept Results"}
                onChange={(e) => setSelectedAction(e.target.value)}
                disabled={submitted || submitting || isDiagnosed}
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
                selectedAction === "Re-Diagnosis"
                  ? "border-[#0a0e3f] bg-blue-50"
                  : "border-gray-300 bg-white hover:border-gray-400"
              }`}
            >
              <input
                type="radio"
                name="action"
                value="Re-Diagnosis"
                checked={selectedAction === "Re-Diagnosis"}
                onChange={(e) => setSelectedAction(e.target.value)}
                disabled={submitted || submitting || isDiagnosed}
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

          {/* Submit Button */}
          <button
            className="w-full py-3 px-4 bg-[#0a0e3f] text-white rounded-lg font-semibold hover:opacity-90 transition duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            onClick={handleSubmit}
            disabled={submitted || submitting || isDiagnosed}
          >
            {isDiagnosed
              ? "Comments Locked"
              : submitted
              ? "Submitted ✓"
              : submitting
              ? "Submitting..."
              : "Submit Feedback"}
          </button>
        </div>
      </div>

      {isDiagnosed && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg">
          <p className="text-amber-800 text-sm font-semibold">
            Patient is diagnosed. New comments are disabled.
          </p>
        </div>
      )}

      {submitted && (
        <div className="p-4 bg-green-50 border border-green-300 rounded-lg">
          <p className="text-green-800 text-sm font-semibold">
            ✓ Feedback submitted successfully
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide">
          Comment History
        </h3>
        {feedbackEntries.length > 0 ? (
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {feedbackEntries.map((entry) => (
              <div key={entry.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    {entry.decision || "Decision not set"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ""}
                  </p>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {entry.comment || "No comment provided"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No comments submitted yet.</p>
        )}
      </div>
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
