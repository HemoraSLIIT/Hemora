import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Bell,
  Calendar,
  Settings,
  Users,
  ChevronRight,
  Stethoscope,
} from "lucide-react";
import { authAPI, patientAPI, userAPI } from "../services/api";
import HemNewLogo from "/assets/hemnewlogo3.svg";
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

const DoctorDashboard = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [recentDiagnoses, setRecentDiagnoses] = useState([]);
  const navigate = useNavigate();

  const [dashboardStats] = useState({
    totalPatients: 156,
    diseases: [
      { name: "Acute Lymphoblastic Leukemia", count: 23, color: "bg-red-500" },
      { name: "Beta Thalassemia", count: 45, color: "bg-blue-500" },
      { name: "Iron Deficiency Anemia", count: 67, color: "bg-yellow-500" },
      { name: "Sickle Cell Disease", count: 21, color: "bg-purple-500" },
      { name: "Healthy", count: 10, color: "bg-green-500" },
    ],
  });

  useEffect(() => {
    if (!authAPI.isAuthenticated()) {
      navigate("/login");
      return;
    }

    let active = true;

    const loadDashboard = async () => {
      try {
        const currentUser = await userAPI.getCurrentUser();
        if (!active) return;
        setUser(currentUser);

        const patients = await patientAPI.getPatients();
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

        if (!active) return;

        setRecentDiagnoses(
          diagnosisEntries
            .filter((entry) => entry.status === "fulfilled" && entry.value)
            .map((entry) => entry.value)
            .sort(
              (a, b) =>
                new Date(b.diagnosedAt).getTime() - new Date(a.diagnosedAt).getTime()
            )
            .slice(0, 3)
        );
        setError("");
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        if (!active) return;
        setError("Failed to fetch user data.");

        if (err.response?.status === 401) {
          authAPI.logout();
          navigate("/login");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, [navigate]);

  const handleLogout = () => {
    authAPI.logout();
    navigate("/login");
  };

  const handleViewPatients = () => {
    navigate("/patients");
  };

  const handleOpenDiagnosis = (patientId) => {
    navigate(`/view-results?patientId=${patientId}`);
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

  return (
    <div className="flex h-screen bg-gray-50">
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
          <Home className="text-white w-6 h-6 cursor-pointer hover:scale-110" />
          <Bell className="text-white w-6 h-6 cursor-pointer hover:scale-110" />
          <Users
            className="text-white w-6 h-6 cursor-pointer hover:scale-110"
            onClick={handleViewPatients}
          />
          <Calendar className="text-white w-6 h-6 cursor-pointer hover:scale-110" />
          <Settings className="text-white w-6 h-6 cursor-pointer hover:scale-110" />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div></div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img
                src={`https://ui-avatars.com/api/?name=${user?.first_name}+${user?.last_name}&background=0a0e3f&color=fff`}
                alt="Profile"
                className="w-10 h-10 rounded-full cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="p-8">
          {user && (
            <div className="mb-6 bg-gradient-to-r from-blue-900 to-[#0a0e3f] rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    Welcome back, {user.first_name}!
                  </h2>
                  <p className="text-blue-100 mt-1">
                    {user.role} â€¢ {user.email}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-6 pt-2 pb-3 bg-white font-bold text-[#0a0e3f] rounded-lg transition duration-300 cursor-pointer hover:scale-105"
                >
                  Logout
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 items-start gap-6 mb-8">
            <div className="col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Disease Distribution
              </h3>
              <div className="space-y-4">
                {dashboardStats.diseases.map((disease, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-700 font-medium">
                        {disease.name}
                      </span>
                      <span className="text-gray-600 font-semibold">
                        {disease.count} patients
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`${disease.color} h-3 rounded-full transition-all duration-500`}
                        style={{
                          width: `${
                            (disease.count / dashboardStats.totalPatients) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="min-h-[380px] h-full bg-white rounded-xl p-6 shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">
                  Action Summary
                </h3>
                <button
                  type="button"
                  onClick={handleViewPatients}
                  className="text-sm font-semibold text-[#A6A6A6] hover:text-[#0a0e3f] cursor-pointer"
                >
                  See all
                </button>
              </div>

              {recentDiagnoses.length === 0 ? (
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
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {entry.patientName}
                          </p>
                          <div className="mt-1.5 flex items-center gap-2 text-sm text-gray-600">
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

          <div className="grid grid-cols-2 gap-6"></div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
