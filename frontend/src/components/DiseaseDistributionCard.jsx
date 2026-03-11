import { useEffect, useMemo, useState } from "react";
import { patientAPI } from "../services/api";

const DISEASE_CONFIG = [
  { name: "Acute Lymphoblastic Leukemia", color: "bg-red-500" },
  { name: "Beta Thalassemia", color: "bg-blue-500" },
  { name: "Iron Deficiency Anemia", color: "bg-yellow-500" },
  { name: "Sickle Cell Disease", color: "bg-purple-500" },
  { name: "Healthy", color: "bg-green-500" },
];

function normalizeDiseaseName(name = "") {
  const normalized = name.trim().toLowerCase();

  if (normalized.includes("acute lymphoblastic leukemia")) {
    return "Acute Lymphoblastic Leukemia";
  }

  if (normalized.includes("thalassemia")) {
    return "Beta Thalassemia";
  }

  if (normalized.includes("iron deficiency anemia")) {
    return "Iron Deficiency Anemia";
  }

  if (normalized.includes("sickle cell")) {
    return "Sickle Cell Disease";
  }

  return name;
}

function getTopDiseaseBucket(diagnosis, patientStatus) {
  const cbcAnalysis = diagnosis?.cbcAnalysis || {};
  const hybridAnalysis = diagnosis?.hybridAnalysis || [];
  const diseaseAnalysis =
    hybridAnalysis.length > 0 ? hybridAnalysis : cbcAnalysis.diseaseAnalysis || [];

  if (cbcAnalysis.overallStatus === "normal" || !diseaseAnalysis.length) {
    return patientStatus === "Diagnosed" ? "Healthy" : null;
  }

  const topDisease = [...diseaseAnalysis].sort((a, b) => {
    const scoreA = a.hybridScore ?? a.suspicionScore ?? 0;
    const scoreB = b.hybridScore ?? b.suspicionScore ?? 0;
    return scoreB - scoreA;
  })[0];

  const topScore = topDisease?.hybridScore ?? topDisease?.suspicionScore ?? 0;
  if (topScore <= 0) {
    return patientStatus === "Diagnosed" ? "Healthy" : null;
  }

  return normalizeDiseaseName(topDisease.disease);
}

export default function DiseaseDistributionCard({
  includedStatuses = ["Diagnosed"],
}) {
  const includedStatusesKey = useMemo(
    () => includedStatuses.join("|"),
    [includedStatuses]
  );
  const [loading, setLoading] = useState(true);
  const [diseases, setDiseases] = useState(
    DISEASE_CONFIG.map((disease) => ({ ...disease, count: 0 }))
  );
  const [totalIncludedPatients, setTotalIncludedPatients] = useState(0);

  useEffect(() => {
    let active = true;

    const loadDistribution = async () => {
      try {
        setLoading(true);
        const patients = await patientAPI.getPatients();
        const relevantPatients = patients.filter((patient) =>
          includedStatuses.includes(patient.status)
        );

        const diagnosisResponses = await Promise.allSettled(
          relevantPatients.map(async (patient) => ({
            patientId: patient.id,
            diagnosis: await patientAPI.getDiagnosisResult(patient.id),
          }))
        );

        const counts = DISEASE_CONFIG.reduce((acc, disease) => {
          acc[disease.name] = 0;
          return acc;
        }, {});

        let includedCount = 0;

        diagnosisResponses.forEach((result) => {
          if (result.status !== "fulfilled") return;

          const patient = relevantPatients.find(
            (item) => item.id === result.value.patientId
          );
          const bucket = getTopDiseaseBucket(
            result.value.diagnosis,
            patient?.status
          );
          if (!bucket) return;

          if (!(bucket in counts)) {
            counts.Healthy += 1;
          } else {
            counts[bucket] += 1;
          }
          includedCount += 1;
        });

        if (!active) return;

        setDiseases(
          DISEASE_CONFIG.map((disease) => ({
            ...disease,
            count: counts[disease.name] || 0,
          }))
        );
        setTotalIncludedPatients(includedCount);
      } catch (error) {
        console.error("Failed to load disease distribution:", error);
        if (!active) return;
        setDiseases(DISEASE_CONFIG.map((disease) => ({ ...disease, count: 0 })));
        setTotalIncludedPatients(0);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadDistribution();

    return () => {
      active = false;
    };
  }, [includedStatusesKey]);

  return (
    <div className="col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        Disease Distribution
      </h3>

      {loading ? (
        <p className="text-sm text-gray-500">Loading distribution...</p>
      ) : totalIncludedPatients === 0 ? (
        <p className="text-sm text-gray-500">No diagnosis results available yet.</p>
      ) : (
        <div className="space-y-4">
          {diseases.map((disease) => (
            <div key={disease.name}>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700 font-medium">{disease.name}</span>
                <span className="text-gray-600 font-semibold">
                  {disease.count} patients
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`${disease.color} h-3 rounded-full transition-all duration-500`}
                  style={{
                    width: `${(disease.count / totalIncludedPatients) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
