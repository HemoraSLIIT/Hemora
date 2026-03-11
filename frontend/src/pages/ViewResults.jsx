import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  TestTubeDiagonal,
  MessageSquareText,
  Stethoscope,
  Download,
  Activity,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Microscope,
} from "lucide-react";
import SideBar from "../components/SideBar";
import ReDiagnoseUploadModal from "../components/ReDiagnoseUploadModal";
import CBCInputModal from "../components/CBCInputModal";
import toast from "react-hot-toast";
import { patientAPI, userAPI } from "../services/api";

const LAB_TECH_CLEARED_PATIENTS_KEY = "labTechClearedPatients";

function getClearedPatientIds() {
  return JSON.parse(localStorage.getItem(LAB_TECH_CLEARED_PATIENTS_KEY) || "[]");
}

function saveClearedPatientIds(patientIds) {
  localStorage.setItem(
    LAB_TECH_CLEARED_PATIENTS_KEY,
    JSON.stringify(patientIds)
  );
}

function removeClearedPatientId(patientId) {
  const nextPatientIds = getClearedPatientIds().filter(
    (id) => Number(id) !== Number(patientId)
  );
  saveClearedPatientIds(nextPatientIds);
}

const roleMap = {
  doctor: "Doctor",
  lab_tech: "Lab Technician",
  researcher: "Researcher",
  admin: "Admin",
};

export default function ViewResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);
  const [patient, setPatient] = useState(null);
  const [diagnosis, setDiagnosis] = useState(null);
  const [feedbackEntries, setFeedbackEntries] = useState([]);
  const [pageError, setPageError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isReDiagnoseModalOpen, setIsReDiagnoseModalOpen] = useState(false);
  const [isCbcModalOpen, setIsCbcModalOpen] = useState(false);

  const patientId = searchParams.get("patientId");

  const patientDisplayName = useMemo(() => {
    if (!patient) return "-";
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

        // Fetch diagnosis result
        try {
          const diagnosisData = await patientAPI.getDiagnosisResult(patientId);
          setDiagnosis(diagnosisData);
        } catch {
          setDiagnosis(null);
        }

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
    if (!patientId) return;
    try {
      const patientData = await patientAPI.getPatientById(patientId);
      setPatient(patientData);
    } catch (err) {
      console.error("Failed to refresh patient:", err);
    }
  };

  const handleDoctorFeedbackSubmit = async ({ comment, decision }) => {
    if (!patientId) throw new Error("Patient id missing");

    const payload = {
      results: diagnosis?.cbcAnalysis?.diseaseAnalysis || [],
      comment,
      decision,
    };

    const feedback = await patientAPI.createPatientFeedback(patientId, payload);
    await patientAPI.updatePatientStatus(patientId, "Diagnosed");

    setFeedbackEntries((prev) => [feedback, ...prev]);
    await refreshPatientStatus();
    return feedback;
  };

  const handleLabTechReDiagnoseSubmit = async (formData) => {
    if (!patientId) throw new Error("Patient id missing");

    await patientAPI.updatePatient(patientId, formData);
    await patientAPI.updatePatientStatus(patientId, "In Progress");
    removeClearedPatientId(patientId);
    setDiagnosis(null);
    await refreshPatientStatus();
    setIsReDiagnoseModalOpen(false);
    setIsCbcModalOpen(true);
    toast.success("New files uploaded. Run diagnosis with the updated data.");
  };

  const handleCBCSubmit = async (cbcParams) => {
    if (!patientId) return;

    setIsCbcModalOpen(false);

    try {
      await patientAPI.diagnosePatient(patientId, cbcParams);
      const diagnosisData = await patientAPI.getDiagnosisResult(patientId);
      setDiagnosis(diagnosisData);
      await refreshPatientStatus();
      toast.success("Diagnosis completed with the updated data");
    } catch (err) {
      console.error("Diagnosis failed:", err);
      toast.error(err?.response?.data?.detail || "Diagnosis failed");
    }
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

  const cbcAnalysis = diagnosis?.cbcAnalysis || {};
  const parameterReport = cbcAnalysis.parameterReport || [];
  const overallStatus = cbcAnalysis.overallStatus || "normal";
  const analysisMethod = diagnosis?.analysisMethod || "cbc_only";
  const hybridAnalysis = diagnosis?.hybridAnalysis || [];
  const diseaseAnalysis = hybridAnalysis.length > 0 ? hybridAnalysis : (cbcAnalysis.diseaseAnalysis || []);
  const annotatedImages = diagnosis?.annotatedImages || [];
  const isInProgress = patient?.status === "In Progress";

  const MEDIA_BASE = `http://${window.location.hostname || "localhost"}:8000`;

  return (
    <div className="flex h-screen bg-gray-50">
      <SideBar />

      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
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
            {userRole === "Lab Technician" && (
              <button
                onClick={() => toast("Report generation coming soon")}
                className="flex items-center space-x-2 px-4 py-2 bg-[#0a0e3f] text-white rounded-lg hover:opacity-90 transition-colors cursor-pointer"
              >
                <Download className="w-5 h-5" />
                <span>Generate Report</span>
              </button>
            )}
          </div>
        </div>

        <div className="px-8 py-8 bg-gray-50 min-h-screen">
          {/* Test Date */}
          <div className="mb-8 bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
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

          {!diagnosis ? (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No diagnosis results available yet.</p>
              <p className="text-gray-400 text-sm mt-1">Run diagnosis from the patients page to see results here.</p>
            </div>
          ) : (
            <>
              {/* Analysis Method Badge + Overall Status Banner */}
              {/* <div className="flex items-center gap-3 mb-6">
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                  analysisMethod === "hybrid"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-gray-100 text-gray-700"
                }`}>
                  {analysisMethod === "hybrid" ? "Hybrid Analysis (CBC + Image)" : "CBC Only Analysis"}
                </span>
                {analysisMethod === "hybrid" && (
                  <span className="text-xs text-gray-500">
                    CBC 40% + Image 60% weighting
                  </span>
                )}
              </div> */}

              <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
                overallStatus === "suspicious"
                  ? "bg-amber-50 border-amber-200"
                  : "bg-green-50 border-green-200"
              }`}>
                {overallStatus === "suspicious" ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                )}
                <p className={`text-sm font-semibold ${
                  overallStatus === "suspicious" ? "text-amber-800" : "text-green-800"
                }`}>
                  {overallStatus === "suspicious"
                    ? "Suspicious parameters detected — review disease analysis below"
                    : "All CBC parameters within normal ranges — no disease suspicion detected"}
                </p>
              </div>

              {/* CBC Parameters Table */}
              <CBCParametersDisplay parameters={parameterReport} />

              {/* Disease Analysis */}
              <DiseaseAnalysisDisplay diseases={diseaseAnalysis} analysisMethod={analysisMethod} />

              {/* Annotated Images */}
              {annotatedImages.length > 0 && (
                <AnnotatedImagesDisplay images={annotatedImages} mediaBase={MEDIA_BASE} />
              )}
            </>
          )}

          {/* Role-based Actions */}
          {(userRole === "Lab Technician" || !isInProgress || userRole === "Doctor") && (
            <div className="mt-8">
              {userRole === "Lab Technician" ? (
                <LabTechSidebar
                  feedbackEntries={feedbackEntries}
                  patientId={patientId}
                  navigate={navigate}
                  onRequestRediagnose={() => setIsReDiagnoseModalOpen(true)}
                />
              ) : userRole === "Doctor" ? (
                <DoctorSidebar
                  onSubmitFeedback={handleDoctorFeedbackSubmit}
                  feedbackEntries={feedbackEntries}
                  navigate={navigate}
                  patientId={patientId}
                  patientStatus={patient?.status}
                />
              ) : null}
            </div>
          )}
        </div>
      </div>

      <ReDiagnoseUploadModal
        isOpen={isReDiagnoseModalOpen}
        onClose={() => setIsReDiagnoseModalOpen(false)}
        onSubmit={handleLabTechReDiagnoseSubmit}
        patientId={patientId}
      />

      <CBCInputModal
        isOpen={isCbcModalOpen}
        onClose={() => setIsCbcModalOpen(false)}
        onSubmit={handleCBCSubmit}
        patientId={patientId}
      />
    </div>
  );
}

function CBCParametersDisplay({ parameters }) {
  if (!parameters.length) return null;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <TestTubeDiagonal className="text-gray-900 w-5 h-5" />
        CBC Parameter Report
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Parameter</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Value</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Unit</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Normal Range</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {parameters.map((p) => {
              const statusColor =
                p.status === "High"
                  ? "bg-red-100 text-red-800"
                  : p.status === "Low"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-green-100 text-green-800";

              return (
                <tr key={p.parameter} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 capitalize">
                    {p.parameter.replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">{p.value}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.unit}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.normalRange}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DiseaseAnalysisDisplay({ diseases, analysisMethod }) {
  if (!diseases.length) return null;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Activity className="text-gray-900 w-5 h-5" />
        Disease Suspicion Analysis
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {diseases.map((d) => (
          <DiseaseCard key={d.disease} disease={d} isHybrid={analysisMethod === "hybrid"} />
        ))}
      </div>
    </div>
  );
}

function DiseaseCard({ disease, isHybrid }) {
  const [expanded, setExpanded] = useState(false);
  const score = disease.hybridScore ?? disease.suspicionScore ?? 0;

  const borderColor =
    score >= 60 ? "#dc2626" : score >= 35 ? "#f59e0b" : score > 0 ? "#3b82f6" : "#22c55e";
  const badgeColor =
    score >= 60
      ? "bg-red-500"
      : score >= 35
      ? "bg-yellow-500"
      : score > 0
      ? "bg-blue-500"
      : "bg-green-500";
  const riskColor =
    disease.riskLevel === "High"
      ? "text-red-600"
      : disease.riskLevel === "Moderate"
      ? "text-yellow-600"
      : disease.riskLevel === "Low"
      ? "text-blue-600"
      : "text-green-600";

  const cbcScore = disease.cbcScore ?? disease.suspicionScore ?? null;
  const imageScore = disease.imageScore ?? null;
  const detectedCells = disease.detectedCells || [];
  const methodLabel = disease.analysisMethod === "hybrid" ? "Hybrid" : "CBC Only";

  return (
    <div
      className="p-5 bg-gray-50 rounded-lg border-l-4 transition hover:shadow-md"
      style={{ borderLeftColor: borderColor }}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-bold text-gray-900 text-base mb-1">{disease.disease}</h4>
          <p className="text-xs text-gray-500">{disease.description}</p>
          <p className="text-sm text-gray-600 mt-1">
            Risk Level:{" "}
            <span className={`font-semibold ${riskColor}`}>{disease.riskLevel}</span>
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <span className={`px-3 py-1.5 rounded-full text-sm font-bold text-white ${badgeColor}`}>
            {score}%
          </span>
          {isHybrid && (
            <p className={`text-[10px] mt-1 ${
              disease.analysisMethod === "hybrid" ? "text-purple-600" : "text-gray-400"
            }`}>
              {methodLabel}
            </p>
          )}
        </div>
      </div>

      {/* Sub-scores for hybrid mode */}
      {isHybrid && cbcScore !== null && (
        <div className="flex gap-3 mb-3">
          <div className="flex-1 bg-white rounded p-2 border border-gray-200">
            <p className="text-[10px] text-gray-500 uppercase font-semibold">CBC Score</p>
            <p className="text-sm font-bold text-gray-800">{cbcScore}%</p>
          </div>
          <div className={`flex-1 rounded p-2 border ${
            imageScore !== null ? "bg-white border-purple-200" : "bg-gray-50 border-gray-200"
          }`}>
            <p className="text-[10px] text-gray-500 uppercase font-semibold">Image Score</p>
            <p className="text-sm font-bold text-gray-800">
              {imageScore !== null ? `${imageScore}%` : "N/A"}
            </p>
          </div>
        </div>
      )}

      <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden mb-3">
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${score}%`, backgroundColor: borderColor }}
        />
      </div>

      <p className="text-xs text-gray-500 mb-2">
        {disease.matchedCount} of {disease.totalCriteria} criteria matched
      </p>

      {/* Detected cells summary */}
      {detectedCells.length > 0 && detectedCells.some((c) => c.count > 0) && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {detectedCells.filter((c) => c.count > 0).map((c, i) => (
            <span key={i} className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-medium rounded-full border border-purple-200">
              {c.class.replace(/_/g, " ")}: {c.count}
            </span>
          ))}
        </div>
      )}

      {disease.matchedCriteria && disease.matchedCriteria.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-gray-600 font-medium hover:text-gray-900 cursor-pointer"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? "Hide" : "Show"} suspicious parameters
          </button>
          {expanded && (
            <div className="mt-2 space-y-1">
              {disease.matchedCriteria.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-white rounded p-2 border border-gray-200">
                  <span className="text-gray-700">{c.detail}</span>
                  <span className="font-semibold text-gray-900">
                    {c.parameter.replace(/_/g, " ")}: {c.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AnnotatedImagesDisplay({ images, mediaBase }) {
  const [lightboxImg, setLightboxImg] = useState(null);
  const [activeIndices, setActiveIndices] = useState({});

  const groupedImages = useMemo(() => {
    const getDiseaseKey = (name = "") =>
      String(name).replace(/\s*-\s*Smear\s+\d+/i, "").trim();

    const getSmearNumber = (name = "") => {
      const match = String(name).match(/Smear\s+(\d+)/i);
      return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
    };

    const groups = [...images]
      .sort((a, b) => String(a.diseaseName).localeCompare(String(b.diseaseName)))
      .reduce((acc, image) => {
        const key = getDiseaseKey(image.diseaseName);
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(image);
        return acc;
      }, {});

    return Object.entries(groups).map(([diseaseName, diseaseImages]) => ({
      diseaseName,
      images: diseaseImages.sort(
        (a, b) => getSmearNumber(a.diseaseName) - getSmearNumber(b.diseaseName)
      ),
    }));
  }, [images]);

  useEffect(() => {
    setActiveIndices((current) => {
      const next = { ...current };

      groupedImages.forEach((group) => {
        const currentIndex = next[group.diseaseName] ?? 0;
        if (currentIndex > group.images.length - 1) {
          next[group.diseaseName] = 0;
        }
      });

      return next;
    });
  }, [groupedImages]);

  if (!groupedImages.length) return null;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Microscope className="text-gray-900 w-5 h-5" />
        Annotated Blood Smear Images
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {groupedImages.map((group) => {
          const activeIndex = activeIndices[group.diseaseName] ?? 0;
          const activeImage = group.images[activeIndex];
          const activeImageUrl = activeImage.image?.startsWith("http")
            ? activeImage.image
            : `${mediaBase}${activeImage.image}`;

          const handleIndexChange = (nextIndex) => {
            setActiveIndices((current) => ({
              ...current,
              [group.diseaseName]: nextIndex,
            }));
          };

          return (
            <div
              key={group.diseaseName}
              className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
            >
              <div
                className="cursor-pointer"
                onClick={() => setLightboxImg(activeImageUrl)}
              >
                <img
                  src={activeImageUrl}
                  alt={`Annotated - ${activeImage.diseaseName}`}
                  className="w-full h-64 object-contain bg-gray-50"
                />
              </div>
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {group.diseaseName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activeImage.diseaseName}
                    </p>
                  </div>
                  <span className="text-xs text-purple-600 font-semibold">
                    {activeImage.detectionsCount} cells detected
                  </span>
                </div>

                {group.images.length > 1 && (
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        handleIndexChange(
                          activeIndex === 0 ? group.images.length - 1 : activeIndex - 1
                        )
                      }
                      className="h-8 w-8 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                      aria-label={`Show previous ${group.diseaseName} image`}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="text-xs text-gray-500 text-center">
                      Smear {activeIndex + 1} of {group.images.length}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleIndexChange(
                          activeIndex === group.images.length - 1 ? 0 : activeIndex + 1
                        )
                      }
                      className="h-8 w-8 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                      aria-label={`Show next ${group.diseaseName} image`}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {lightboxImg && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[1100]"
          onClick={() => setLightboxImg(null)}
        >
          <img
            src={lightboxImg}
            alt="Annotated enlarged"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
}

function LabTechSidebar({
  feedbackEntries,
  patientId,
  navigate,
  onRequestRediagnose,
}) {
  const [isSubmittingDone, setIsSubmittingDone] = useState(false);
  const hasAcceptedResults = feedbackEntries.some(
    (entry) => entry.decision === "Accept Results"
  );

  const handleMarkAsDone = async () => {
    if (!patientId || isSubmittingDone) return;

    try {
      setIsSubmittingDone(true);
      const nextClearedPatients = Array.from(
        new Set([...getClearedPatientIds(), Number(patientId)])
      );
      saveClearedPatientIds(nextClearedPatients);
      toast.success("Patient marked as cleared");
      navigate("/patients");
    } catch (err) {
      console.error("Failed to save cleared state:", err);
      toast.error("Failed to mark patient as cleared");
    } finally {
      setIsSubmittingDone(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex gap-8">
        <div className="flex-[2.5] bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Stethoscope className="text-gray-900 w-5 h-5" />
            Doctor's Comments
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

        <div className="flex-1 bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex flex-col">
          <h3 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide">
            Actions
          </h3>
          <div className="flex flex-col gap-3 flex-1">
            <button
              className="flex-1 py-3 px-4 rounded-lg font-semibold transition duration-300 bg-green-700 text-white hover:opacity-90 cursor-pointer"
              onClick={handleMarkAsDone}
              disabled={isSubmittingDone}
            >
              {isSubmittingDone ? "Saving..." : "Mark as Done"}
            </button>
            <button
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition duration-300 ${
                hasAcceptedResults
                  ? "bg-yellow-500 text-white opacity-60 cursor-not-allowed"
                  : "bg-yellow-500 text-white hover:opacity-90 cursor-pointer"
              }`}
              onClick={onRequestRediagnose}
              disabled={hasAcceptedResults}
            >
              Re-Diagnose
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

function DoctorSidebar({
  onSubmitFeedback,
  feedbackEntries,
  navigate,
  patientId,
  patientStatus,
}) {
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
      removeClearedPatientId(patientId);
      navigate("/patients");
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
        <div className="flex-[2.5] bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquareText className="text-gray-900 w-5 h-5" />
            Add Your Comments
          </h3>
          <textarea
            className={`flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm resize-none transition ${
              isDiagnosed
                ? "cursor-not-allowed bg-gray-100 text-gray-500"
                : "focus:outline-none focus:border-[#0a0e3f] focus:ring-1 focus:ring-[#0a0e3f]"
            }`}
            placeholder="Add your medical assessment and observations..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            disabled={submitted || submitting || isDiagnosed}
          />
        </div>

        <div className="flex-1 bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex flex-col">
          <h3 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide">
            Decision
          </h3>
          <div className="space-y-3 flex-1">
            <label
              className={`flex items-center gap-3 p-4 border-2 rounded-lg transition ${
                selectedAction === "Accept Results"
                  ? "border-[#0a0e3f] bg-blue-50"
                  : "border-gray-300 bg-white"
              } ${
                isDiagnosed
                  ? "cursor-not-allowed opacity-60"
                  : "cursor-pointer hover:border-gray-400"
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
                <span className="font-semibold text-gray-900 block text-sm">Accept Results</span>
                <p className="text-xs text-gray-600">Confirm diagnosis</p>
              </div>
            </label>

            <label
              className={`flex items-center gap-3 p-4 border-2 rounded-lg transition ${
                selectedAction === "Re-Diagnosis"
                  ? "border-[#0a0e3f] bg-blue-50"
                  : "border-gray-300 bg-white"
              } ${
                isDiagnosed
                  ? "cursor-not-allowed opacity-60"
                  : "cursor-pointer hover:border-gray-400"
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
                <span className="font-semibold text-gray-900 block text-sm">Re-Diagnosis</span>
                <p className="text-xs text-gray-600">Request new analysis</p>
              </div>
            </label>
          </div>

          <button
            className="w-full py-3 px-4 bg-[#0a0e3f] text-white rounded-lg font-semibold hover:opacity-90 transition duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            onClick={handleSubmit}
            disabled={submitted || submitting || isDiagnosed}
          >
            {isDiagnosed
              ? "Comments Locked"
              : submitted
              ? "Submitted"
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
            Feedback submitted successfully
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
