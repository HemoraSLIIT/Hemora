import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function ResearcherDashBody() {
  const [selectedDisease, setSelectedDisease] = useState("IDA");

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

  const handleGenerateReport = () => {
    // Handle report generation
    alert("Generating comprehensive research report...");
  };

  const currentMatrix = confusionMatrixData[selectedDisease];

  return (
    <>
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
    </>
  );
}
