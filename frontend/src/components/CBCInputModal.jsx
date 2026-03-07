import { useState, useEffect, useRef } from "react";
import { X, FlaskConical, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { patientAPI } from "../services/api";

const CBC_FIELDS = [
  { key: "wbc", label: "WBC (White Blood Cells)", unit: "10³/µL", range: "4.5 - 11.0" },
  { key: "rbc", label: "RBC (Red Blood Cells)", unit: "10⁶/µL", range: "4.0 - 5.5" },
  { key: "hemoglobin", label: "Hemoglobin", unit: "g/dL", range: "12.0 - 17.5" },
  { key: "hematocrit", label: "Hematocrit", unit: "%", range: "36.0 - 50.0" },
  { key: "mcv", label: "MCV", unit: "fL", range: "80.0 - 100.0" },
  { key: "mch", label: "MCH", unit: "pg", range: "27.0 - 33.0" },
  { key: "mchc", label: "MCHC", unit: "g/dL", range: "32.0 - 36.0" },
  { key: "rdw", label: "RDW", unit: "%", range: "11.5 - 14.5" },
  { key: "platelet_count", label: "Platelet Count", unit: "10³/µL", range: "150 - 400" },
  { key: "neutrophils", label: "Neutrophils", unit: "%", range: "40.0 - 70.0" },
  { key: "lymphocytes", label: "Lymphocytes", unit: "%", range: "20.0 - 40.0" },
  { key: "monocytes", label: "Monocytes", unit: "%", range: "2.0 - 8.0" },
  { key: "eosinophils", label: "Eosinophils", unit: "%", range: "1.0 - 4.0" },
  { key: "basophils", label: "Basophils", unit: "%", range: "0.0 - 1.0" },
];

export default function CBCInputModal({ isOpen, onClose, onSubmit, patientId }) {
  const [values, setValues] = useState({});
  const [extracting, setExtracting] = useState(false);
  const [extractionDone, setExtractionDone] = useState(false);
  const [extractionError, setExtractionError] = useState("");
  const [extractionSource, setExtractionSource] = useState("");
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (isOpen && patientId && !hasAttempted.current) {
      hasAttempted.current = true;
      setExtracting(true);
      setExtractionError("");

      patientAPI
        .extractCBC(patientId)
        .then((data) => {
          setValues(data.parameters || {});
          setExtractionSource(data.source || "unknown");
          setExtractionDone(true);
        })
        .catch((err) => {
          console.error("CBC extraction failed:", err);
          setExtractionError(
            err?.response?.data?.detail || "Failed to extract CBC parameters from report."
          );
        })
        .finally(() => {
          setExtracting(false);
        });
    }
  }, [isOpen, patientId]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setValues({});
      setExtractionDone(false);
      setExtracting(false);
      setExtractionError("");
      setExtractionSource("");
      hasAttempted.current = false;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (key, val) => {
    if (val === "") {
      setValues((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } else {
      const num = parseFloat(val);
      setValues((prev) => ({ ...prev, [key]: isNaN(num) ? val : num }));
    }
  };

  const handleSubmit = () => {
    const params = {};
    for (const field of CBC_FIELDS) {
      const val = values[field.key];
      if (val !== undefined && val !== "" && val !== null) {
        const num = typeof val === "number" ? val : parseFloat(val);
        if (!isNaN(num)) {
          params[field.key] = num;
        }
      }
    }

    if (Object.keys(params).length === 0) return;
    onSubmit(params);
  };

  const filledCount = CBC_FIELDS.filter(
    (f) => values[f.key] !== undefined && values[f.key] !== "" && values[f.key] !== null
  ).length;

  return (
    <div
      className="fixed inset-0 bg-[#000000b4] flex items-center justify-center z-[1000]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <FlaskConical className="text-[#0a0e3f] w-6 h-6" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                CBC Report Extraction
              </h2>
              <p className="text-sm text-gray-500">
                Patient ID: {patientId} — Parameters extracted from uploaded CBC report
              </p>
            </div>
          </div>
          <button
            className="p-1 text-gray-400 hover:text-gray-700 transition-colors rounded hover:scale-110 cursor-pointer"
            onClick={onClose}
          >
            <X size={24} />
          </button>
        </div>

        {/* Extraction Status */}
        {extracting && (
          <div className="flex items-center gap-3 mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <p className="text-sm text-blue-800 font-medium">
              Extracting CBC parameters from uploaded report...
            </p>
          </div>
        )}

        {extractionError && (
          <div className="flex items-center gap-3 mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm text-red-800 font-medium">{extractionError}</p>
              <p className="text-xs text-red-600 mt-1">
                You can manually enter the CBC values below and proceed.
              </p>
            </div>
          </div>
        )}

        {extractionDone && !extracting && !extractionError && (
          <div className="flex items-center gap-3 mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm text-green-800 font-medium">
                {filledCount} parameters extracted from {extractionSource} report. Review and click Run Diagnosis.
              </p>
              {filledCount < CBC_FIELDS.length && (
                <p className="text-xs text-green-600 mt-1">
                  Some parameters could not be extracted. You may edit or add missing values manually.
                </p>
              )}
            </div>
          </div>
        )}

        {/* CBC Fields Grid */}
        <div className={`grid grid-cols-2 gap-4 mb-6 ${extracting ? "opacity-50 pointer-events-none" : ""}`}>
          {CBC_FIELDS.map((field) => {
            const val = values[field.key];
            const hasValue = val !== undefined && val !== "" && val !== null;
            return (
              <div
                key={field.key}
                className={`rounded-lg p-3 border ${
                  hasValue ? "bg-white border-green-200" : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-600">
                    {field.label}
                  </label>
                  <span className="text-[10px] text-gray-400">
                    Normal: {field.range}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={hasValue ? val : ""}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder="—"
                    className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-[#0a0e3f] focus:ring-1 focus:ring-[#0a0e3f] ${
                      hasValue
                        ? "border-green-300 bg-green-50 font-semibold"
                        : "border-gray-300 bg-white"
                    }`}
                  />
                  <span className="text-xs text-gray-500 min-w-[50px]">
                    {field.unit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            {filledCount} of {CBC_FIELDS.length} parameters available
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={filledCount === 0 || extracting}
              className="px-6 py-2 bg-[#0a0e3f] text-white rounded-lg font-medium hover:opacity-90 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Run Diagnosis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
