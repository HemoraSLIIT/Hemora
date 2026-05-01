import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Download,
  ExternalLink,
  FileText,
  Search,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import SideBar from "../components/SideBar";
import { authAPI, patientAPI } from "../services/api";
import { generateDiagnosisReportPdfBlob } from "../utils/diagnosisReportPdfExport";

function downloadBlob(blob, filename) {
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(objectUrl);
}

function openBlobInNewTab(blob) {
  const objectUrl = window.URL.createObjectURL(blob);
  window.open(objectUrl, "_blank", "noopener,noreferrer");
  window.setTimeout(() => {
    window.URL.revokeObjectURL(objectUrl);
  }, 60000);
}

function buildSafeFileName(name, patientId) {
  const base =
    String(name || "")
      .replace(/[^a-z0-9]+/gi, "_")
      .replace(/^_+|_+$/g, "") || `patient_${patientId}`;
  return `${base}_diagnosis_report.pdf`;
}

export default function DiagnosisReports() {
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authAPI.isAuthenticated()) {
      navigate("/login");
      return;
    }

    const loadReports = async () => {
      try {
        setLoading(true);
        const patients = await patientAPI.getPatients();

        const diagnosisEntries = await Promise.allSettled(
          (Array.isArray(patients) ? patients : []).map(async (patient) => {
            const [diagnosis, feedbackEntries] = await Promise.all([
              patientAPI.getDiagnosisResult(patient.id),
              patientAPI.getPatientFeedback(patient.id).catch(() => []),
            ]);

            const patientName =
              `${patient.firstName || ""} ${patient.lastName || ""}`.trim() ||
              `Patient #${patient.id}`;

            const cbcAnalysis = diagnosis?.cbcAnalysis || {};
            const hybridAnalysis = diagnosis?.hybridAnalysis || [];
            const diseaseAnalysis =
              hybridAnalysis.length > 0
                ? hybridAnalysis
                : cbcAnalysis.diseaseAnalysis || [];

            return {
              id: patient.id,
              patient,
              patientId: patient.id,
              patientName,
              diagnosis,
              feedbackEntries: Array.isArray(feedbackEntries)
                ? feedbackEntries
                : [],
              createdAt:
                diagnosis?.updatedAt || diagnosis?.createdAt || patient.createdAt,
              overallStatus: cbcAnalysis.overallStatus || "normal",
              analysisMethod: diagnosis?.analysisMethod || "cbc_only",
              parameterReport: cbcAnalysis.parameterReport || [],
              diseaseAnalysis,
              annotatedImages: diagnosis?.annotatedImages || [],
            };
          })
        );

        const successfulReports = diagnosisEntries
          .filter((entry) => entry.status === "fulfilled")
          .map((entry) => entry.value)
          .sort(
            (a, b) =>
              new Date(b.createdAt || 0).getTime() -
              new Date(a.createdAt || 0).getTime()
          );

        setReports(successfulReports);
        setError("");
      } catch (err) {
        console.error("Failed to load diagnosis reports:", err);
        setError("Failed to load diagnosis reports.");
      } finally {
        setLoading(false);
      }
    };

    void loadReports();
  }, [navigate]);

  const filteredReports = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return reports;
    }

    return reports.filter((report) => {
      return (
        report.patientName.toLowerCase().includes(query) ||
        String(report.patientId).includes(query) ||
        String(report.analysisMethod).toLowerCase().includes(query) ||
        String(report.overallStatus).toLowerCase().includes(query)
      );
    });
  }, [reports, searchTerm]);

  const generateReportBlob = async (report) => {
    return generateDiagnosisReportPdfBlob("Diagnosis Results", {
      patient: report.patient,
      parameterReport: report.parameterReport,
      overallStatus: report.overallStatus,
      analysisMethod: report.analysisMethod,
      diseaseAnalysis: report.diseaseAnalysis,
      annotatedImages: report.annotatedImages,
      feedbackEntries: report.feedbackEntries,
    });
  };

  const handleViewPdf = async (report) => {
    if (busyId) return;

    try {
      setBusyId(report.id);
      const blob = await generateReportBlob(report);
      openBlobInNewTab(blob);
    } catch (err) {
      console.error("Failed to open diagnosis PDF:", err);
      toast.error("Failed to open PDF");
    } finally {
      setBusyId(null);
    }
  };

  const handleDownloadPdf = async (report) => {
    if (busyId) return;

    try {
      setBusyId(report.id);
      const blob = await generateReportBlob(report);
      downloadBlob(blob, buildSafeFileName(report.patientName, report.patientId));
      toast.success("Report downloaded successfully");
    } catch (err) {
      console.error("Failed to download diagnosis PDF:", err);
      toast.error("Failed to download PDF");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Toaster position="top-right" />
      <SideBar />

      <div className="flex-1 overflow-auto">
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Diagnosis Reports
              </h1>
              <p className="text-sm text-gray-500">
                All patients with available diagnosis results
              </p>
            </div>
            <div className="text-sm text-gray-500">
              Total Reports: {filteredReports.length}
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by patient, ID, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a0e3f] focus:border-transparent"
              />
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-10 text-center text-gray-500">
              Loading diagnosis reports...
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-10 text-center text-red-600">
              {error}
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-10 text-center">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-semibold">
                No diagnosis reports available yet
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Run diagnosis for a patient to make reports available here.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Patient
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Report
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Updated
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((report) => {
                      const isBusy = busyId === report.id;

                      return (
                        <tr
                          key={report.id}
                          className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900">
                              {report.patientName}
                            </div>
                            <div className="text-sm text-gray-500">
                              Patient ID: {report.patientId}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-gray-800">
                              <FileText className="w-4 h-4 text-[#0a0e3f]" />
                              <span>Diagnosis Report</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Status: {report.overallStatus}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {report.createdAt
                              ? new Date(report.createdAt).toLocaleString()
                              : "-"}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleViewPdf(report)}
                                disabled={isBusy}
                                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                              >
                                <ExternalLink className="w-4 h-4" />
                                <span>{isBusy ? "Working..." : "View PDF"}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadPdf(report)}
                                disabled={isBusy}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0a0e3f] text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50"
                              >
                                <Download className="w-4 h-4" />
                                <span>{isBusy ? "Working..." : "Download"}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(`/view-results?patientId=${report.patientId}`)
                                }
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                              >
                                <Activity className="w-4 h-4" />
                                <span>Open Result</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
