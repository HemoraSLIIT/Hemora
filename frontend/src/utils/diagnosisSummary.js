export function normalizeDiseaseName(name = "") {
  const normalized = String(name).trim().toLowerCase();

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
  return String(name || "").trim();
}

function toSuspectedLabel(name) {
  switch (name) {
    case "Acute Lymphoblastic Leukemia":
      return "ALL suspected";
    case "Iron Deficiency Anemia":
      return "IDA suspected";
    case "Beta Thalassemia":
      return "Beta Thal Suspected";
    case "Sickle Cell Disease":
      return "SCD Suspected";
    default:
      return `${name} suspected`;
  }
}

export function getTopDiseaseLabel(diagnosis, patientStatus, fallbackDisease = "") {
  const cbcAnalysis = diagnosis?.cbcAnalysis || {};
  const hybridAnalysis = diagnosis?.hybridAnalysis || [];
  const diseaseAnalysis =
    hybridAnalysis.length > 0 ? hybridAnalysis : cbcAnalysis.diseaseAnalysis || [];

  if (cbcAnalysis.overallStatus === "normal" || !diseaseAnalysis.length) {
    return patientStatus === "Diagnosed" ? "Healthy" : fallbackDisease || "Not specified";
  }

  const topDisease = [...diseaseAnalysis].sort((a, b) => {
    const scoreA = a.hybridScore ?? a.suspicionScore ?? 0;
    const scoreB = b.hybridScore ?? b.suspicionScore ?? 0;
    return scoreB - scoreA;
  })[0];

  const normalizedName = normalizeDiseaseName(topDisease?.disease || fallbackDisease);
  const topScore = topDisease?.hybridScore ?? topDisease?.suspicionScore ?? 0;

  if (!normalizedName) {
    return "Not specified";
  }

  if (normalizedName === "Healthy" || topScore <= 0) {
    return patientStatus === "Diagnosed" ? "Healthy" : fallbackDisease || "Not specified";
  }

  return toSuspectedLabel(normalizedName);
}
