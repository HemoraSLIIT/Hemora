# Hemora — ML Model Integration Plan

## Current State

**Done:**
- CBC parameter extraction from uploaded reports (pdfplumber + OCR fallback)
- Rule-based CBC analysis with weighted disease pattern scoring (4 diseases)
- Full frontend flow: Diagnose → CBC Input Modal → View Results page
- DiagnosisResult model stores 14 CBC params + analysis JSON

**Next:** Integrate blood smear image analysis models and combine with CBC analysis in a hybrid scoring layer.

---

## How It Works (Beta Thalassemia — Reference Pipeline)

This is the confirmed architecture from the Colab notebook. Other diseases will follow a similar pattern but with different YOLO classes, feature extraction logic, and classifier architectures.

```
Blood Smear Image
       │
       ▼
┌─────────────────┐
│  YOLOv8s (.pt)  │  ← Object detection on full image
│  Detects:       │
│  - hypochromic  │
│  - microcyte    │
│  - target_cell  │
└────────┬────────┘
         │ bounding boxes + class labels + confidence
         ▼
┌─────────────────────┐
│  Feature Extraction  │  ← Compute 10 numerical stats from YOLO detections
│  (cell counts,       │     (counts, ratios, density, abnormality score)
│   ratios, density)   │
└────────┬─────────────┘
         │ 10-dim feature vector
         ▼
┌─────────────────────────┐
│  Smart Hybrid Network   │  ← ResNet-inspired classifier
│  (ResNet-inspired DNN)  │     Input: 10 features (NOT images)
│  Output: probability    │     Output: float 0-1 (thalassemia probability)
└────────┬────────────────┘
         │
         ▼
   Disease Probability Score
```

**Key insight:** The classifier does NOT look at images — it classifies the *statistical pattern* of detected cells.

---

## Disease Model Registry

| Disease | YOLO Detects | Classifier | Status |
|---------|-------------|------------|--------|
| Beta Thalassemia Minor | hypochromic_cell, microcyte, target_cell | ResNet-inspired DNN (10 features → probability) | **Trained** |
| ALL (Acute Leukemia) | *(TBD — likely blast cells)* | CNN *(architecture TBD)* | Not started |
| Iron Deficiency Anemia | *(TBD — likely hypochromic, microcyte, pencil cells)* | *(TBD)* | Not started |
| Sickle Cell Anemia | *(TBD — likely sickle cells, target cells)* | *(TBD)* | Not started |

> **Action needed:** As you train each disease model in Colab, document: YOLO classes, number of extracted features, feature names, classifier architecture, and input dimensions.

---

## Final Hybrid Scoring

After both CBC analysis and image analysis are complete, combine them:

```
CBC Analysis Score (per disease)     Image Analysis Score (per disease)
        │ (40% weight)                        │ (60% weight)
        └──────────────┬──────────────────────┘
                       ▼
              Hybrid Score (0-100%)
              + Risk Level (High/Moderate/Low/None)
```

If a model isn't available for a disease, fall back to CBC-only scoring (100% weight).

---

## Step-by-Step Implementation

### Phase 1: Backend Infrastructure

**Goal:** Create the `ml_inference/` package with base classes and the Beta Thal detector.

#### Step 1.1 — Create folder structure

```
backend/
├── ml_inference/
│   ├── __init__.py
│   ├── registry.py            # ModelRegistry — lazy-loads and caches models
│   ├── base_detector.py       # ABCBaseDetector — abstract base class
│   ├── feature_extractor.py   # Base feature extraction from YOLO results
│   ├── hybrid_analyzer.py     # Combines CBC + image scores
│   └── detectors/
│       ├── __init__.py
│       ├── thalassemia.py     # ThalassemiaDetector (YOLO + ResNet hybrid)
│       ├── all_leukemia.py    # Placeholder stub
│       ├── ida.py             # Placeholder stub
│       └── sickle_cell.py     # Placeholder stub
├── models/                    # .pt weight files (git-ignored, downloaded separately)
│   └── .gitkeep
```

#### Step 1.2 — Define ABCBaseDetector

```python
# backend/ml_inference/base_detector.py

from abc import ABC, abstractmethod
from dataclasses import dataclass

@dataclass
class DetectionResult:
    """Standard output from any disease detector."""
    disease_name: str
    probability: float          # 0.0 - 1.0
    confidence: float           # model confidence
    detected_cells: list        # list of {class, count, ...}
    annotated_image: bytes      # YOLO-annotated image (PNG bytes) or None
    feature_vector: list        # extracted features fed to classifier
    raw_detections: int         # total YOLO detections count

class ABCBaseDetector(ABC):
    """Base class for all disease detectors."""

    @abstractmethod
    def load_models(self):
        """Load YOLO + classifier model files. Called once by registry."""
        pass

    @abstractmethod
    def predict(self, image_path: str) -> DetectionResult:
        """Run full pipeline: YOLO detect → extract features → classify."""
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Check if model weight files exist."""
        pass
```

#### Step 1.3 — Implement ThalassemiaDetector

This is the first real detector, based on the Colab notebook.

```python
# backend/ml_inference/detectors/thalassemia.py

import os
import torch
import numpy as np
from ultralytics import YOLO
from ..base_detector import ABCBaseDetector, DetectionResult

# The same classifier architecture from your Colab notebook
class SmartHybridNetwork(torch.nn.Module):
    def __init__(self, input_features=10):
        super().__init__()
        # Match EXACT architecture from your Colab training notebook
        # (copy the class definition from your notebook here)
        ...

    def forward(self, x):
        ...
        return probability  # sigmoid output, 0-1

class ThalassemiaDetector(ABCBaseDetector):
    YOLO_CLASSES = ["hypochromic_cell", "microcyte", "target_cell"]
    YOLO_WEIGHTS = "models/thal_yolo_best.pt"
    CLASSIFIER_WEIGHTS = "models/thal_hybrid_best.pt"

    def __init__(self, models_dir):
        self.models_dir = models_dir
        self.yolo_model = None
        self.classifier = None

    def is_available(self):
        yolo_path = os.path.join(self.models_dir, self.YOLO_WEIGHTS)
        clf_path = os.path.join(self.models_dir, self.CLASSIFIER_WEIGHTS)
        return os.path.exists(yolo_path) and os.path.exists(clf_path)

    def load_models(self):
        yolo_path = os.path.join(self.models_dir, self.YOLO_WEIGHTS)
        clf_path = os.path.join(self.models_dir, self.CLASSIFIER_WEIGHTS)

        self.yolo_model = YOLO(yolo_path)

        self.classifier = SmartHybridNetwork(input_features=10)
        state_dict = torch.load(clf_path, map_location="cpu")
        self.classifier.load_state_dict(state_dict)
        self.classifier.eval()

    def predict(self, image_path: str) -> DetectionResult:
        # 1. Run YOLO detection
        results = self.yolo_model(image_path)

        # 2. Count detected cells per class
        cell_counts = {cls: 0 for cls in self.YOLO_CLASSES}
        for det in results[0].boxes:
            cls_name = results[0].names[int(det.cls)]
            if cls_name in cell_counts:
                cell_counts[cls_name] += 1

        # 3. Extract 10 features from counts (same logic as Colab notebook)
        features = self._extract_features(cell_counts, results)

        # 4. Run classifier
        with torch.no_grad():
            feat_tensor = torch.tensor([features], dtype=torch.float32)
            probability = self.classifier(feat_tensor).item()

        # 5. Get annotated image
        annotated = results[0].plot()  # numpy array (BGR)

        return DetectionResult(
            disease_name="Beta Thalassemia Minor",
            probability=probability,
            confidence=probability,
            detected_cells=[{"class": k, "count": v} for k, v in cell_counts.items()],
            annotated_image=self._encode_image(annotated),
            feature_vector=features,
            raw_detections=sum(cell_counts.values()),
        )

    def _extract_features(self, cell_counts, results):
        """
        Extract the same 10 features used during training.
        IMPORTANT: Must match EXACTLY what the Colab notebook computes.
        Copy the feature extraction logic from your notebook here.
        """
        # TODO: Copy from Colab notebook — example structure:
        # total_cells = sum(cell_counts.values())
        # hypochromic_ratio = cell_counts["hypochromic_cell"] / max(total_cells, 1)
        # microcyte_ratio = cell_counts["microcyte"] / max(total_cells, 1)
        # ... etc (10 features total)
        pass

    def _encode_image(self, img_array):
        """Convert numpy array to PNG bytes."""
        import cv2
        _, buffer = cv2.imencode(".png", img_array)
        return buffer.tobytes()
```

#### Step 1.4 — Create ModelRegistry

```python
# backend/ml_inference/registry.py

import os
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

class ModelRegistry:
    """Lazy-loads and caches disease detector instances."""

    _detectors = {}
    _loaded = False

    @classmethod
    def _init_detectors(cls):
        if cls._loaded:
            return

        models_dir = os.path.join(settings.BASE_DIR, "ml_inference")

        from .detectors.thalassemia import ThalassemiaDetector
        # from .detectors.all_leukemia import ALLDetector
        # from .detectors.ida import IDADetector
        # from .detectors.sickle_cell import SickleCellDetector

        detector_classes = {
            "Beta Thalassemia Minor": ThalassemiaDetector,
            # "Acute Lymphoblastic Leukemia (ALL)": ALLDetector,
            # "Iron Deficiency Anemia (IDA)": IDADetector,
            # "Sickle Cell Anemia": SickleCellDetector,
        }

        for disease, DetectorClass in detector_classes.items():
            detector = DetectorClass(models_dir)
            if detector.is_available():
                try:
                    detector.load_models()
                    cls._detectors[disease] = detector
                    logger.info("Loaded model for: %s", disease)
                except Exception as e:
                    logger.warning("Failed to load model for %s: %s", disease, e)
            else:
                logger.info("Model files not found for: %s (skipping)", disease)

        cls._loaded = True

    @classmethod
    def get_detector(cls, disease_name):
        cls._init_detectors()
        return cls._detectors.get(disease_name)

    @classmethod
    def available_diseases(cls):
        cls._init_detectors()
        return list(cls._detectors.keys())

    @classmethod
    def run_all(cls, image_path):
        """Run all available detectors on an image. Returns dict of results."""
        cls._init_detectors()
        results = {}
        for disease, detector in cls._detectors.items():
            try:
                results[disease] = detector.predict(image_path)
            except Exception as e:
                logger.error("Detector failed for %s: %s", disease, e)
        return results
```

#### Step 1.5 — Create HybridAnalyzer

```python
# backend/ml_inference/hybrid_analyzer.py

CBC_WEIGHT = 0.4
IMAGE_WEIGHT = 0.6

def compute_hybrid_analysis(cbc_analysis, image_results):
    """
    Combine CBC rule-based scores with ML image analysis scores.

    Args:
        cbc_analysis: dict from cbc_analyzer.analyze_cbc_parameters()
        image_results: dict from ModelRegistry.run_all()
                       {disease_name: DetectionResult, ...}

    Returns:
        list of hybrid disease analysis dicts
    """
    hybrid = []

    for disease_entry in cbc_analysis["diseaseAnalysis"]:
        disease_name = disease_entry["disease"]
        cbc_score = disease_entry["suspicionScore"] / 100.0  # normalize to 0-1

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
            "description": disease_entry["description"],
            "hybridScore": final_pct,
            "riskLevel": risk_level,
            "analysisMethod": analysis_method,
            "cbcScore": round(cbc_score * 100),
            "imageScore": round(image_result.probability * 100) if image_result else None,
            "matchedCriteria": disease_entry["matchedCriteria"],
            "detectedCells": image_result.detected_cells if image_result else [],
            "totalDetections": image_result.raw_detections if image_result else 0,
        }
        hybrid.append(entry)

    hybrid.sort(key=lambda d: d["hybridScore"], reverse=True)
    return hybrid
```

---

### Phase 2: Database Changes

**Goal:** Extend DiagnosisResult to store image analysis and hybrid results.

#### Step 2.1 — Update DiagnosisResult model

Add these fields to `backend/analysis/models.py`:

```python
class DiagnosisResult(models.Model):
    # ... existing CBC fields stay as-is ...

    # NEW fields
    image_analysis = models.JSONField(default=dict, blank=True)    # per-disease image scores
    hybrid_analysis = models.JSONField(default=dict, blank=True)   # combined hybrid scores
    analysis_method = models.CharField(
        max_length=20,
        choices=[("cbc_only", "CBC Only"), ("hybrid", "Hybrid")],
        default="cbc_only",
    )
```

#### Step 2.2 — Create AnnotatedImage model

```python
class AnnotatedImage(models.Model):
    """Stores YOLO-annotated blood smear images with detected cell markings."""
    diagnosis = models.ForeignKey(
        DiagnosisResult,
        on_delete=models.CASCADE,
        related_name="annotated_images",
    )
    disease_name = models.CharField(max_length=100)
    image = models.ImageField(upload_to="patients/annotated/%Y/%m/%d/")
    detections_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
```

#### Step 2.3 — Run migration

```bash
python manage.py makemigrations analysis
python manage.py migrate
```

---

### Phase 3: API Integration

**Goal:** Extend the diagnose endpoint to run image analysis alongside CBC.

#### Step 3.1 — Update PatientDiagnoseAPIView

Modify the `post` method in `backend/analysis/views.py`:

```python
def post(self, request, pk):
    # ... existing CBC validation (keep as-is) ...

    # Run CBC analysis (existing)
    cbc_analysis = analyze_cbc_parameters(cbc_params)

    # Run image analysis on blood smear images (NEW)
    image_results = {}
    annotated_images_data = []
    blood_smears = patient.blood_smear_images.all()

    if blood_smears.exists():
        from ml_inference.registry import ModelRegistry
        from ml_inference.hybrid_analyzer import compute_hybrid_analysis

        # Use the first blood smear image (or best quality one)
        smear = blood_smears.first()
        image_results = ModelRegistry.run_all(smear.image.path)

        # Compute hybrid scores
        if image_results:
            hybrid = compute_hybrid_analysis(cbc_analysis, image_results)
            analysis_method = "hybrid"
        else:
            hybrid = cbc_analysis["diseaseAnalysis"]
            analysis_method = "cbc_only"
    else:
        hybrid = cbc_analysis["diseaseAnalysis"]
        analysis_method = "cbc_only"

    # Save diagnosis
    diagnosis, _ = DiagnosisResult.objects.update_or_create(
        patient=patient,
        defaults={
            **cbc_params,
            "cbc_analysis": cbc_analysis,
            "image_analysis": {
                name: {
                    "probability": r.probability,
                    "detectedCells": r.detected_cells,
                    "totalDetections": r.raw_detections,
                }
                for name, r in image_results.items()
            },
            "hybrid_analysis": hybrid,
            "analysis_method": analysis_method,
        },
    )

    # Save annotated images
    for disease_name, result in image_results.items():
        if result.annotated_image:
            from django.core.files.base import ContentFile
            AnnotatedImage.objects.create(
                diagnosis=diagnosis,
                disease_name=disease_name,
                image=ContentFile(result.annotated_image, name=f"{disease_name}_annotated.png"),
                detections_count=result.raw_detections,
            )

    return Response(DiagnosisResultSerializer(diagnosis).data)
```

#### Step 3.2 — Add model status endpoint

```python
# GET /api/ml-models/status/
class MLModelStatusAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from ml_inference.registry import ModelRegistry
        return Response({
            "availableModels": ModelRegistry.available_diseases(),
            "totalModels": 4,
        })
```

---

### Phase 4: Export Models from Colab

**Goal:** Get model files out of Colab and into the project.

#### Step 4.1 — For each disease model in Colab

1. **Save YOLO weights:**
   ```python
   # After training in Colab
   # The best.pt is already saved by Ultralytics during training
   # Download: runs/detect/train/weights/best.pt
   ```

2. **Save classifier weights:**
   ```python
   torch.save(model.state_dict(), "best_smart_hybrid.pt")
   # Download this file from Colab
   ```

3. **Document the feature extraction function:**
   - Copy the exact feature extraction code from the notebook
   - Note the 10 feature names and their computation
   - This MUST match between training and inference

#### Step 4.2 — Place files in project

```
backend/
├── models/
│   ├── .gitkeep
│   ├── thal_yolo_best.pt           # Beta Thal YOLO weights
│   ├── thal_hybrid_best.pt         # Beta Thal classifier weights
│   ├── all_yolo_best.pt            # ALL YOLO weights (when ready)
│   ├── all_classifier_best.pt      # ALL classifier weights (when ready)
│   ├── ida_yolo_best.pt            # IDA (when ready)
│   ├── ida_classifier_best.pt
│   ├── sickle_yolo_best.pt         # Sickle Cell (when ready)
│   └── sickle_classifier_best.pt
```

> Add `backend/models/*.pt` to `.gitignore` — these files are large (50-200MB each). Share via Google Drive / OneDrive with team.

#### Step 4.3 — Copy classifier architecture

For each disease, copy the exact `nn.Module` class from the Colab notebook into the corresponding detector file. The architecture must match exactly — same layers, same dimensions, same activation functions.

---

### Phase 5: Frontend Updates

**Goal:** Display hybrid analysis results, annotated images, and model status.

#### Step 5.1 — Update ViewResults page

- Show **analysis method badge** ("CBC Only" vs "Hybrid Analysis")
- For each disease card, show:
  - **Hybrid Score** (combined) as the primary score
  - CBC Score and Image Score as sub-scores (with a small bar chart)
  - Detected cells summary (e.g., "12 hypochromic, 8 microcyte, 3 target cells")
- If image analysis is not available, show "CBC Only" with a note

#### Step 5.2 — Add annotated images gallery

- New section below disease cards showing YOLO-annotated blood smear images
- Each annotated image shows bounding boxes around detected cells
- Click to zoom (reuse existing lightbox from ViewPatient)

#### Step 5.3 — Add model status indicator

- Small indicator on the diagnosis page showing which models are loaded
- "3/4 models available" with a list
- Helps users understand when results are CBC-only vs hybrid

---

### Phase 6: Remaining Disease Models

**Goal:** Implement detectors for ALL, IDA, and Sickle Cell as models are trained.

#### For each disease, repeat this process:

1. **Train in Colab** — YOLO for cell detection + classifier for the feature vector
2. **Document** — YOLO classes, feature count, feature names, classifier architecture
3. **Export** — Download .pt files, place in `backend/models/`
4. **Implement detector** — Create `backend/ml_inference/detectors/<disease>.py`:
   - Copy classifier `nn.Module` from notebook
   - Implement `_extract_features()` matching notebook logic
   - Set YOLO_CLASSES and weight file paths
5. **Register** — Uncomment in `registry.py`
6. **Test** — Run on sample images, verify scores make sense

Each detector is independent — you can add them one at a time without breaking anything.

---

### Phase 7: Testing & Validation

#### Step 7.1 — Unit tests

- Test each detector with a known blood smear image
- Verify feature extraction produces correct number of features
- Verify hybrid scoring math (40/60 weights)
- Test graceful fallback when model files are missing

#### Step 7.2 — Integration tests

- Full flow: upload patient → extract CBC → run diagnosis → check results
- Verify annotated images are saved and retrievable
- Test with missing models (should fall back to CBC-only)

#### Step 7.3 — Validation with team

- Compare model predictions against known diagnoses
- Check that hybrid scores make clinical sense
- Tune CBC/image weight ratio if needed (currently 40/60)

---

## Dependencies to Install

```bash
# Add to backend/requirements.txt
ultralytics>=8.0.0        # YOLOv8
torch>=2.0.0              # PyTorch (for classifier inference)
torchvision>=0.15.0       # Image transforms if needed
opencv-python>=4.8.0      # For annotated image encoding
```

> **Note:** PyTorch + Ultralytics are large packages (~2GB). Consider using CPU-only torch for deployment unless you have a GPU server.

---

## Implementation Order Summary

| Phase | What | Depends On | Priority |
|-------|------|-----------|----------|
| **Phase 1** | Backend infrastructure + Beta Thal detector | Beta Thal .pt files from Colab | **Do first** |
| **Phase 2** | Database migration (new fields) | Nothing | **Do with Phase 1** |
| **Phase 3** | API integration | Phase 1 + 2 | **Do after Phase 1** |
| **Phase 4** | Export models from Colab | Trained models | **Do in parallel** |
| **Phase 5** | Frontend updates | Phase 3 | **Do after API works** |
| **Phase 6** | Remaining 3 disease models | Each model trained | **Do incrementally** |
| **Phase 7** | Testing | All above | **Do continuously** |

---

## Checklist Before Starting

- [ ] Beta Thal YOLO model trained and `best.pt` downloaded
- [ ] Beta Thal classifier trained and `best_smart_hybrid.pt` downloaded
- [ ] Feature extraction code copied from Colab notebook (exact 10 features)
- [ ] Classifier `nn.Module` class copied from Colab notebook (exact architecture)
- [ ] `ultralytics` and `torch` installed in backend virtualenv
- [ ] Model .pt files placed in `backend/models/`

---

*Last updated: March 2026*
