import React, { useState } from "react";
import { FileText, TestTubeDiagonal, MessageSquareText, MousePointerClick, Stethoscope } from "lucide-react";

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

export default function ViewResults({
  isOpen,
  onClose,
  userRole = "Lab Technician",
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-[#000000b4] flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-300">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="text-gray-900 w-6 h-6" />
              <h2 className="text-2xl font-semibold text-gray-900">
                View Results
              </h2>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Patient: {mockDiagnosisData.patientName} (
              {mockDiagnosisData.patientId})
            </p>
          </div>
          <button
            className="bg-none border-none text-2xl cursor-pointer text-gray-600 hover:text-gray-900"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Test Date */}
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Test Date:</span>{" "}
            {new Date(mockDiagnosisData.testDate).toLocaleDateString()}
          </p>
        </div>

        {/* Role-based content */}
        {userRole === "Lab Technician" ? (
          <LabTechResults data={mockDiagnosisData} onClose={onClose} />
        ) : userRole === "Doctor" ? (
          <DoctorResults data={mockDiagnosisData} onClose={onClose} />
        ) : null}
      </div>
    </div>
  );
}

// Lab Technician Results Component
function LabTechResults({ data, onClose }) {
  const [isDone, setIsDone] = useState(false);

  return (
    <div className="space-y-6">
      {/* Diagnosis Results */}
      <ResultsDisplay results={data.results} />

      {/* Doctor Comments Section */}
      <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Stethoscope className="text-gray-900 w-5 h-5" />
          Doctor's Comments
        </h3>
        <div className="bg-white p-4 rounded border border-gray-300 min-h-20">
          <p className="text-gray-700 text-sm">{data.doctorComments}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4 border-t border-gray-300">
        <button
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition duration-300 cursor-pointer ${
            isDone
              ? "bg-green-900 text-white  hover:opacity-90 "
              : "bg-green-700 text-white  hover:opacity-90 "
          }`}
          onClick={() => setIsDone(true)}
        >
           Done
        </button>
        <button
          className="flex-1 py-3 px-4 bg-yellow-500 text-white rounded-lg font-semibold hover:opacity-90 transition duration-300 cursor-pointer"
          onClick={() => alert("Re-Diagnosis initiated")}
        >
           Re-Diagnose
        </button>
        <button
          className="flex-1 py-3 px-4 bg-gray-500 text-white rounded-lg font-semibold hover:opacity-90  transition duration-300 cursor-pointer"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      {isDone && (
        <div className="p-4 bg-green-50 border border-green-300 rounded-lg animate-pulse">
          <p className="text-green-800 text-sm font-semibold">
            ✓ Results marked as complete
          </p>
        </div>
      )}
    </div>
  );
}

// Doctor Results Component
function DoctorResults({ data, onClose }) {
  const [comments, setComments] = useState("");
  const [selectedAction, setSelectedAction] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selectedAction && comments.trim()) {
      setSubmitted(true);
      console.log({
        action: selectedAction,
        comments: comments,
        timestamp: new Date(),
      });
      setTimeout(() => {
        onClose();
      }, 2000);
    } else {
      alert("Please select an action and add comments");
    }
  };

  return (
    <div className="space-y-6">
      {/* Diagnosis Results */}
      <ResultsDisplay results={data.results} />

      {/* Doctor Comments Section */}
      <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <MessageSquareText className="text-gray-900 w-5 h-5" />
          Add Your Comments
        </h3>
        <textarea
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#0a0e3f] focus:ring-1 focus:ring-[#0a0e3f] resize-none transition"
          rows="5"
          placeholder="Add your medical assessment and observations..."
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          disabled={submitted}
        />
      </div>

      {/* Action Selection */}
      <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MousePointerClick className="text-gray-900 w-5 h-5" />
          Select Action
        </h3>
        <div className="grid grid-cols-2 gap-4">
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
              <span className="font-semibold text-gray-900 block">
                 Accept Results
              </span>
              <p className="text-xs text-gray-600">Confirm diagnosis</p>
            </div>
          </label>

          <label
            className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${
              selectedAction === "rediagnose"
                ? "border-[#0a0e3f] bg-blue-50"
                : "border-gray-300 bg-white hover:opacity-90 "
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
              <span className="font-semibold text-gray-900 block">
                 Re-Diagnosis
              </span>
              <p className="text-xs text-gray-600">Request new analysis</p>
            </div>
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex gap-4 pt-4 border-t border-gray-300">
        <button
          className="flex-1 py-3 px-4 bg-[#0a0e3f] text-white rounded-lg font-semibold hover:opacity-90 transition duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSubmit}
          disabled={submitted}
        >
           Submit Feedback
        </button>
        <button
          className="flex-1 py-3 px-4 bg-gray-500 text-white rounded-lg font-semibold hover:opacity-90  transition duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onClose}
          disabled={submitted}
        >
          Close
        </button>
      </div>

      {submitted && (
        <div className="p-4 bg-green-50 border border-green-300 rounded-lg animate-pulse">
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
        <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <TestTubeDiagonal className="text-gray-900 w-5 h-5" />
        Diagnosis Results
      </h3>
      <div className="space-y-3">
        {results.map((result) => (
          <div
            key={result.id}
            className="p-4 bg-white rounded-lg border-l-4 transition hover:shadow-md"
            style={{
              borderLeftColor:
                result.probability > 70
                  ? "#dc2626"
                  : result.probability > 40
                  ? "#f59e0b"
                  : "#22c55e",
            }}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold text-gray-900">
                  {result.disease}
                </h4>
                <p className="text-xs text-gray-600">
                  Severity:{" "}
                  <span className="font-semibold">{result.severity}</span>
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
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
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
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
          </div>
        ))}
      </div>
    </div>
  );
}