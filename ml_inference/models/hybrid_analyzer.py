"""Hybrid analysis layer - combines CBC rule-based scores with ML image analysis.

Weights:
  - CBC analysis: 40%
  - Image analysis: 60%

If no image model is available for a disease, falls back to CBC-only (100%).
"""

from typing import Dict, List, Any
from .detection_result import DetectionResult

CBC_WEIGHT = 0.4
IMAGE_WEIGHT = 0.6


def compute_hybrid_analysis(
	cbc_analysis: Dict[str, Any],
	image_results: Dict[str, DetectionResult],
) -> List[Dict[str, Any]]:
	"""Combine CBC and image analysis scores into a unified result.

	Args:
		cbc_analysis: Result dict from cbc_analyzer.analyze_cbc_parameters()
		image_results: Dict from ModelRegistry.run_all()
					   {disease_name: DetectionResult}

	Returns:
		List of hybrid disease analysis dicts (sorted by score descending)
	"""
	hybrid = []

	for disease_entry in cbc_analysis.get("diseaseAnalysis", []):
		disease_name = disease_entry["disease"]
		cbc_score = disease_entry.get("suspicionScore", 0) / 100.0

		image_result = image_results.get(disease_name)

		if image_result:
			image_score = image_result.probability
			final_score = (cbc_score * CBC_WEIGHT) + (image_score * IMAGE_WEIGHT)
			analysis_method = "hybrid"
		else:
			final_score = cbc_score
			analysis_method = "cbc_only"

		final_pct = round(final_score * 100)

		if final_pct >= 60:
			risk_level = "High"
		elif final_pct >= 35:
			risk_level = "Moderate"
		elif final_pct > 0:
			risk_level = "Low"
		else:
			risk_level = "None"

		entry = {
			"disease": disease_name,
			"description": disease_entry.get("description", ""),
			"hybridScore": final_pct,
			"riskLevel": risk_level,
			"analysisMethod": analysis_method,
			"cbcScore": round(cbc_score * 100),
			"imageScore": round(image_result.probability * 100) if image_result else None,
			"matchedCriteria": disease_entry.get("matchedCriteria", []),
			"matchedCount": disease_entry.get("matchedCount", 0),
			"totalCriteria": disease_entry.get("totalCriteria", 0),
			"detectedCells": image_result.detected_cells if image_result else [],
			"totalDetections": image_result.raw_detections if image_result else 0,
		}
		hybrid.append(entry)

	hybrid.sort(key=lambda d: d["hybridScore"], reverse=True)
	return hybrid
