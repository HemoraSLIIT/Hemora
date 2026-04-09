"""
Rule-based CBC parameter analysis for blood disease suspicion.

Analyzes CBC values against normal ranges and checks for patterns
indicative of 4 target diseases:
  - ALL (Acute Lymphoblastic Leukemia)
  - Beta Thalassemia Minor
  - Iron Deficiency Anemia (IDA)
  - Sickle Cell Anemia
"""

# Normal reference ranges for CBC parameters
NORMAL_RANGES = {
    "wbc": {"min": 4.5, "max": 11.0, "unit": "10³/µL"},
    "rbc": {"min": 4.0, "max": 5.5, "unit": "10⁶/µL"},
    "hemoglobin": {"min": 12.0, "max": 17.5, "unit": "g/dL"},
    "hematocrit": {"min": 36.0, "max": 50.0, "unit": "%"},
    "mcv": {"min": 80.0, "max": 100.0, "unit": "fL"},
    "mch": {"min": 27.0, "max": 33.0, "unit": "pg"},
    "mchc": {"min": 32.0, "max": 36.0, "unit": "g/dL"},
    "rdw": {"min": 11.5, "max": 14.5, "unit": "%"},
    "platelet_count": {"min": 150.0, "max": 400.0, "unit": "10³/µL"},
    "neutrophils": {"min": 40.0, "max": 70.0, "unit": "%"},
    "lymphocytes": {"min": 20.0, "max": 40.0, "unit": "%"},
    "monocytes": {"min": 2.0, "max": 8.0, "unit": "%"},
    "eosinophils": {"min": 1.0, "max": 4.0, "unit": "%"},
    "basophils": {"min": 0.0, "max": 1.0, "unit": "%"},
}

# Disease suspicion patterns: each criterion has a condition and weight
DISEASE_PATTERNS = {
    "Acute Lymphoblastic Leukemia (ALL)": {
        "description": "A cancer of the blood and bone marrow that affects white blood cells.",
        "criteria": [
            {"param": "wbc", "condition": "high", "threshold": 15.0, "weight": 3, "detail": "Elevated WBC count"},
            {"param": "wbc", "condition": "very_high", "threshold": 30.0, "weight": 5, "detail": "Very high WBC (leukocytosis)"},
            {"param": "lymphocytes", "condition": "high", "threshold": 50.0, "weight": 4, "detail": "Elevated lymphocytes"},
            {"param": "neutrophils", "condition": "low", "threshold": 35.0, "weight": 2, "detail": "Low neutrophils (neutropenia)"},
            {"param": "hemoglobin", "condition": "low", "threshold": 10.0, "weight": 3, "detail": "Low hemoglobin (anemia)"},
            {"param": "platelet_count", "condition": "low", "threshold": 100.0, "weight": 3, "detail": "Low platelets (thrombocytopenia)"},
            {"param": "rbc", "condition": "low", "threshold": 3.5, "weight": 2, "detail": "Low RBC count"},
        ],
    },
    "Beta Thalassemia Minor": {
        "description": "An inherited blood disorder causing reduced hemoglobin production.",
        "criteria": [
            {"param": "mcv", "condition": "low", "threshold": 75.0, "weight": 4, "detail": "Low MCV (microcytosis)"},
            {"param": "mch", "condition": "low", "threshold": 25.0, "weight": 3, "detail": "Low MCH"},
            {"param": "rbc", "condition": "high", "threshold": 5.5, "weight": 3, "detail": "Elevated RBC count"},
            {"param": "hemoglobin", "condition": "low", "threshold": 11.0, "weight": 2, "detail": "Mildly low hemoglobin"},
            {"param": "rdw", "condition": "normal_or_low", "threshold": 15.0, "weight": 2, "detail": "Normal/low RDW (distinguishes from IDA)"},
            {"param": "mchc", "condition": "low", "threshold": 31.0, "weight": 2, "detail": "Low MCHC"},
        ],
    },
    "Iron Deficiency Anemia (IDA)": {
        "description": "Anemia caused by insufficient iron for hemoglobin production.",
        "criteria": [
            {"param": "hemoglobin", "condition": "low", "threshold": 11.0, "weight": 4, "detail": "Low hemoglobin"},
            {"param": "mcv", "condition": "low", "threshold": 78.0, "weight": 4, "detail": "Low MCV (microcytosis)"},
            {"param": "mch", "condition": "low", "threshold": 26.0, "weight": 3, "detail": "Low MCH (hypochromia)"},
            {"param": "mchc", "condition": "low", "threshold": 31.0, "weight": 3, "detail": "Low MCHC"},
            {"param": "rdw", "condition": "high", "threshold": 15.0, "weight": 4, "detail": "Elevated RDW (anisocytosis)"},
            {"param": "hematocrit", "condition": "low", "threshold": 34.0, "weight": 2, "detail": "Low hematocrit"},
            {"param": "platelet_count", "condition": "high", "threshold": 400.0, "weight": 2, "detail": "Elevated platelets (reactive)"},
            {"param": "rbc", "condition": "low", "threshold": 3.8, "weight": 2, "detail": "Low RBC count"},
        ],
    },
    "Sickle Cell Anemia": {
        "description": "An inherited disorder causing abnormal sickle-shaped red blood cells.",
        "criteria": [
            {"param": "hemoglobin", "condition": "low", "threshold": 9.0, "weight": 4, "detail": "Low hemoglobin (chronic anemia)"},
            {"param": "hematocrit", "condition": "low", "threshold": 30.0, "weight": 3, "detail": "Low hematocrit"},
            {"param": "rbc", "condition": "low", "threshold": 3.5, "weight": 3, "detail": "Low RBC count"},
            {"param": "rdw", "condition": "high", "threshold": 16.0, "weight": 3, "detail": "Elevated RDW"},
            {"param": "mchc", "condition": "high", "threshold": 36.0, "weight": 3, "detail": "Elevated MCHC"},
            {"param": "wbc", "condition": "high", "threshold": 12.0, "weight": 2, "detail": "Mildly elevated WBC"},
            {"param": "platelet_count", "condition": "high", "threshold": 400.0, "weight": 2, "detail": "Elevated platelets"},
        ],
    },
}


def _check_criterion(value, criterion):
    """Check if a parameter value matches a disease criterion."""
    condition = criterion["condition"]
    threshold = criterion["threshold"]

    if condition == "high":
        return value > threshold
    elif condition == "very_high":
        return value > threshold
    elif condition == "low":
        return value < threshold
    elif condition == "normal_or_low":
        return value <= threshold
    return False


def analyze_cbc_parameters(params):
    """
    Analyze CBC parameters for disease suspicion.

    Args:
        params: dict of parameter_name -> float value

    Returns:
        dict with:
          - parameterReport: list of parameter assessments (value vs normal range)
          - diseaseAnalysis: list of disease suspicion results
          - overallStatus: "normal" | "suspicious"
    """
    # Build parameter report
    parameter_report = []
    for param_name, ref in NORMAL_RANGES.items():
        value = params.get(param_name)
        if value is None:
            continue

        if value < ref["min"]:
            status = "Low"
        elif value > ref["max"]:
            status = "High"
        else:
            status = "Normal"

        parameter_report.append({
            "parameter": param_name,
            "value": value,
            "unit": ref["unit"],
            "normalRange": f"{ref['min']} - {ref['max']}",
            "min": ref["min"],
            "max": ref["max"],
            "status": status,
        })

    # Analyze each disease
    disease_analysis = []
    any_suspicious = False

    for disease_name, pattern in DISEASE_PATTERNS.items():
        matched_criteria = []
        total_weight = 0
        matched_weight = 0

        for criterion in pattern["criteria"]:
            param_value = params.get(criterion["param"])
            total_weight += criterion["weight"]

            if param_value is not None and _check_criterion(param_value, criterion):
                matched_criteria.append({
                    "parameter": criterion["param"],
                    "detail": criterion["detail"],
                    "value": param_value,
                    "weight": criterion["weight"],
                })
                matched_weight += criterion["weight"]

        # Calculate suspicion score as percentage of matched weight
        suspicion_score = round((matched_weight / total_weight) * 100) if total_weight > 0 else 0

        if suspicion_score >= 60:
            risk_level = "High"
        elif suspicion_score >= 35:
            risk_level = "Moderate"
        elif suspicion_score > 0:
            risk_level = "Low"
        else:
            risk_level = "None"

        if suspicion_score > 0:
            any_suspicious = True

        disease_analysis.append({
            "disease": disease_name,
            "description": pattern["description"],
            "suspicionScore": suspicion_score,
            "riskLevel": risk_level,
            "matchedCriteria": matched_criteria,
            "totalCriteria": len(pattern["criteria"]),
            "matchedCount": len(matched_criteria),
        })

    # Sort by suspicion score descending
    disease_analysis.sort(key=lambda d: d["suspicionScore"], reverse=True)

    return {
        "parameterReport": parameter_report,
        "diseaseAnalysis": disease_analysis,
        "overallStatus": "suspicious" if any_suspicious else "normal",
    }
