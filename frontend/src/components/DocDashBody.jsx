import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Stethoscope } from "lucide-react";
import DiseaseDistributionCard from "./DiseaseDistributionCard";
import { patientAPI, userAPI } from "../services/api";
import { getTopDiseaseLabel, normalizeDiseaseName } from "../utils/diagnosisSummary";

function getFeedbackDiseaseLabel(feedback) {
  const results = Array.isArray(feedback?.results) ? feedback.results : [];
  if (!results.length) {
    return "Diagnosis completed";
  }

  const topDisease = [...results].sort((a, b) => {
    const scoreA = a?.hybridScore ?? a?.suspicionScore ?? 0;
    const scoreB = b?.hybridScore ?? b?.suspicionScore ?? 0;
    return scoreB - scoreA;
  })[0];

  const name = normalizeDiseaseName(topDisease?.disease || "");
  return name || "Diagnosis completed";
}

function formatDiagnosisDate(value) {
  if (!value) return "";

  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DocDashBody() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [recentDiagnoses, setRecentDiagnoses] = useState([]);

  useEffect(() => {
    let active = true;

    const loadRecentDiagnoses = async () => {
      try {
        setLoading(true);

        const [currentUser, patients] = await Promise.all([
          userAPI.getCurrentUser(),
          patientAPI.getPatients(),
        ]);

        const diagnosedPatients = patients.filter(
          (patient) => patient.status === "Diagnosed"
        );

        const diagnosisEntries = await Promise.allSettled(
          diagnosedPatients.map(async (patient) => {
            const [feedbackEntries, diagnosis] = await Promise.all([
              patientAPI.getPatientFeedback(patient.id),
              patientAPI.getDiagnosisResult(patient.id).catch(() => null),
            ]);

            const acceptedFeedback = feedbackEntries.find(
              (entry) =>
                entry.createdBy === currentUser.id &&
                entry.decision === "Accept Results"
            );

            if (!acceptedFeedback) {
              return null;
            }

            const patientName =
              `${patient.firstName || ""} ${patient.lastName || ""}`.trim() ||
              "Unknown patient";

            return {
              id: patient.id,
              patientName,
              diagnosedAt: acceptedFeedback.createdAt,
              diagnosisLabel: diagnosis
                ? getTopDiseaseLabel(
                    diagnosis,
                    patient.status,
                    patient.suspectedDisease || patient.disease || ""
                  )
                : getFeedbackDiseaseLabel(acceptedFeedback),
            };
          })
        );

        const recentItems = diagnosisEntries
          .filter((entry) => entry.status === "fulfilled" && entry.value)
          .map((entry) => entry.value)
          .sort(
            (a, b) => new Date(b.diagnosedAt).getTime() - new Date(a.diagnosedAt).getTime()
          )
          .slice(0, 3);

        if (!active) return;
        setRecentDiagnoses(recentItems);
      } catch (error) {
        console.error("Failed to load recent diagnoses:", error);
        if (!active) return;
        setRecentDiagnoses([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadRecentDiagnoses();

    return () => {
      active = false;
    };
  }, []);

  const handleViewPatients = () => {
    navigate("/patients");
  };

  const handleOpenDiagnosis = (patientId) => {
    navigate(`/view-results?patientId=${patientId}`);
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-6 mb-8">
        <DiseaseDistributionCard includedStatuses={["Diagnosed"]} />

        <div className="min-h-[380px] h-full bg-white rounded-xl p-6 shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">Action Summary</h3>
            <button
              type="button"
              onClick={handleViewPatients}
              className="text-sm font-semibold text-[#A6A6A6] hover:text-[#0a0e3f] cursor-pointer"
            >
              See all
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Loading diagnoses...</p>
          ) : recentDiagnoses.length === 0 ? (
            <p className="text-sm text-gray-500">
              No diagnoses confirmed by you yet.
            </p>
          ) : (
            <div className="space-y-3">
              {recentDiagnoses.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => handleOpenDiagnosis(entry.id)}
                  className="w-full rounded-xl border border-gray-100 bg-[#EEEFF1] px-4 py-3 text-left hover:bg-[#e6e8ec] transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {entry.patientName}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-600">
                        <Stethoscope className="h-3.5 w-3.5 text-[#0a0e3f]" />
                        <span className="truncate">{entry.diagnosisLabel}</span>
                      </div>
                      <p className="mt-1.5 text-xs text-gray-500">
                        Diagnosed on {formatDiagnosisDate(entry.diagnosedAt)}
                      </p>
                    </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
