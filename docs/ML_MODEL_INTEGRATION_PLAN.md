# **ML Model Integration Plan for Hemora**

## **📋 Overview**

This document outlines the complete strategy for integrating PyTorch-trained blood disease classification models into the Hemora Django backend. This is a **reference for future implementation** - not to be done immediately.

**Project Context:**
- Hemora is a **diagnostic tool**, NOT a patient management system
- Input: CBC report data + Blood smear images
- Output: Disease probabilities for 4 diseases
- Users: Lab technicians, doctors, researchers
- No long-term patient records stored

---

## **🎯 Core Workflow**

```
User Login (Lab Tech)
         ↓
Upload CBC Report + Blood Smear Images
         ↓
Backend receives data
         ↓
ML Model processes images + CBC data
         ↓
Return probabilities for 4 diseases
         ↓
Display results to user
         ↓
Store minimal metadata (NO images in production)
```

---

## **🔬 How ML Models Connect to Web Apps**

### **Two Separate Phases:**

#### **Phase 1: Training (Offline - Colab/Jupyter)**

1. **Develop and train model in Colab/Jupyter:**
   ```python
   model = HemoraNet(...)  # Your CNN / hybrid model
   # Training loop with your dataset
   # Evaluation and validation
   ```

2. **Save trained weights:**
   ```python
   import torch
   
   MODEL_PATH = "/content/blood_disease_classifier_v1.pth"
   torch.save(model.state_dict(), MODEL_PATH)
   ```

3. **Download the `.pth` file and store in repo:**
   - Location: `data/models/blood_disease_classifier_v1.pth`
   - This file contains only the trained weights, NOT the notebook

4. **Key Point:**
   - You do NOT run the notebook inside Django
   - You do NOT call Colab remotely during inference
   - Training and inference are completely separate

---

#### **Phase 2: Inference (Inside Django App)**

1. **Model definition in codebase:**
   - Create `ml_models/inference/blood_model.py` with same architecture:
   ```python
   import torch
   import torch.nn as nn

   class HemoraNet(nn.Module):
       def __init__(self, num_classes=4):
           super().__init__()
           # Define same layers as training
           self.conv_layers = ...
           self.fc_layers = ...

       def forward(self, image_tensor, cbc_features=None):
           # Combine image features + CBC data
           # Return logits
           return logits
   ```

2. **Create model loader (loads once per process):**
   - Create `ml_models/inference/loader.py`:
   ```python
   import os
   import torch
   from .blood_model import HemoraNet
   from django.conf import settings

   _model = None  # Singleton pattern

   def get_model():
       global _model
       if _model is None:
           model = HemoraNet(num_classes=4)
           model_path = os.path.join(
               settings.BASE_DIR, 
               "data", 
               "models", 
               "blood_disease_classifier_v1.pth"
           )
           state_dict = torch.load(model_path, map_location="cpu")
           model.load_state_dict(state_dict)
           model.eval()  # Set to evaluation mode
           _model = model
       return _model
   ```

3. **Create inference function:**
   - Create `ml_models/inference/predict.py`:
   ```python
   import torch
   import numpy as np
   from .loader import get_model
   from ml_models.preprocessing.image_preprocessor import preprocess_image

   def run_inference(image_file, cbc_data):
       """
       Run inference on blood smear image + CBC data.
       
       Args:
           image_file: Uploaded image file (Django InMemoryUploadedFile)
           cbc_data: Dictionary with CBC values (WBC, RBC, Hb, etc.)
       
       Returns:
           Dictionary with predictions and probabilities
       """
       model = get_model()
       
       # 1. Preprocess image to tensor [1, 3, H, W]
       img_tensor = preprocess_image(image_file)
       
       # 2. Prepare CBC features as tensor
       cbc_values = [
           cbc_data['wbc'],
           cbc_data['rbc'],
           cbc_data['hemoglobin'],
           cbc_data['platelets'],
           # ... other CBC values
       ]
       cbc_tensor = torch.tensor([cbc_values], dtype=torch.float32)
       
       # 3. Run inference
       with torch.no_grad():
           logits = model(img_tensor, cbc_features=cbc_tensor)
           probs = torch.softmax(logits, dim=1).cpu().numpy()[0]
       
       # 4. Format output
       disease_labels = [
           "Normal",
           "Acute Lymphoblastic Leukemia",
           "Acute Myeloid Leukemia",
           "Chronic Myeloid Leukemia"
       ]
       
       results = {
           "prediction": disease_labels[np.argmax(probs)],
           "probabilities": {
               label: float(prob) 
               for label, prob in zip(disease_labels, probs)
           },
           "confidence": float(np.max(probs))
       }
       
       return results
   ```

4. **Django API endpoint:**
   - In `analysis/views.py`:
   ```python
   from rest_framework.views import APIView
   from rest_framework.response import Response
   from rest_framework.permissions import IsAuthenticated
   from ml_models.inference.predict import run_inference

   class DiagnoseView(APIView):
       permission_classes = [IsAuthenticated]

       def post(self, request):
           # Get CBC data from request
           cbc_data = {
               'wbc': request.data.get('wbc'),
               'rbc': request.data.get('rbc'),
               'hemoglobin': request.data.get('hemoglobin'),
               'platelets': request.data.get('platelets'),
               # ... other fields
           }
           
           # Get uploaded image
           image_file = request.FILES.get('image')
           
           if not image_file:
               return Response(
                   {"error": "Image file required"}, 
                   status=400
               )
           
           # Run ML inference
           results = run_inference(image_file, cbc_data)
           
           # Optionally: Save results to database (NOT the image)
           # AnalysisSession.objects.create(
           #     user=request.user,
           #     cbc_data=cbc_data,
           #     results=results
           # )
           
           return Response(results)
   ```

5. **URL routing:**
   - In `analysis/urls.py`:
   ```python
   from django.urls import path
   from .views import DiagnoseView

   urlpatterns = [
       path('diagnose/', DiagnoseView.as_view(), name='diagnose'),
   ]
   ```

6. **Frontend integration:**
   - In `frontend/src/services/api.js`:
   ```javascript
   export const analysisAPI = {
     diagnose: async (cbcData, imageFile) => {
       const formData = new FormData();
       
       // Add CBC data
       Object.keys(cbcData).forEach(key => {
         formData.append(key, cbcData[key]);
       });
       
       // Add image
       formData.append('image', imageFile);
       
       const response = await api.post('/analysis/diagnose/', formData, {
         headers: { 'Content-Type': 'multipart/form-data' },
       });
       
       return response.data;
     },
   };
   ```

---

## **🖼️ Image Storage Strategy**

### **Critical Security Decision: DON'T Store Images in Production**

**Why:**
- Blood smear images are PHI (Protected Health Information)
- High security risk if stored long-term
- Not needed for primary diagnosis workflow
- Reduces storage costs and complexity

---

### **Recommended Two-Tier Strategy:**

#### **Tier 1: Production Mode (Default)**

**Behavior:**
- Images are **NEVER saved to disk or database**
- Process flow:
  1. User uploads image via frontend
  2. Django receives file in memory (`InMemoryUploadedFile`)
  3. ML model processes image directly from memory
  4. Return results to user
  5. Image is discarded (garbage collected)
  6. Only structured results are saved to database

**What IS stored:**
```python
# AnalysisSession model
{
    "user": "lab_tech_user",
    "timestamp": "2025-12-07 10:30:00",
    "cbc_data": {
        "wbc": 7500,
        "rbc": 4.5,
        "hemoglobin": 14.2,
        "platelets": 250000
    },
    "results": {
        "prediction": "Normal",
        "probabilities": {
            "Normal": 0.85,
            "ALL": 0.05,
            "AML": 0.05,
            "CML": 0.05
        },
        "confidence": 0.85
    }
}
```

**What is NOT stored:**
- Raw image bytes
- Image file paths
- Any visual data

---

#### **Tier 2: Research Mode (Optional, Controlled)**

**When to use:**
- Building training datasets
- Model validation
- Research studies with proper IRB approval

**How to enable:**
```python
# In .env file
HEMORA_RESEARCH_MODE=True
```

**Behavior when enabled:**
```python
# settings.py
HEMORA_RESEARCH_MODE = os.getenv("HEMORA_RESEARCH_MODE", "False").lower() == "true"

# In diagnose view
if settings.HEMORA_RESEARCH_MODE:
    # Save anonymized image to secure storage
    # Add strict access controls
    # Log all access
```

**Storage options for research mode:**

1. **Secure Local Filesystem (for small datasets):**
   - Encrypted disk volume
   - Restricted OS permissions
   - Clear retention policies
   - Regular audits

2. **AWS S3 / Similar (recommended for scale):**
   - Private bucket with encryption
   - IAM roles for access
   - Versioning enabled
   - Audit logging
   - Pre-signed URLs only

3. **NOT Recommended:**
   - Storing as BLOBs in PostgreSQL (bloats DB)
   - Public file storage
   - Unencrypted storage

---

### **Storage Comparison Table:**

| Option | Security | Performance | Scalability | Complexity | Recommendation |
|--------|----------|-------------|-------------|------------|----------------|
| **In-Memory Only** | ✅ Best | ✅ Fast | ✅ Easy | ✅ Simple | **Use for production** |
| **Local Filesystem** | ⚠️ Depends on setup | ✅ Fast | ❌ Single server | ⚠️ Medium | Research mode only |
| **S3 / Cloud Storage** | ✅ Good (if configured) | ⚠️ Network dependent | ✅ Unlimited | ⚠️ More setup | Future if needed |
| **Database BLOBs** | ⚠️ Depends on DB security | ❌ Slow for large images | ❌ Bloats DB | ❌ Complex | **Avoid** |

---

## **📊 Database Models**

### **Minimal Production Schema:**

```python
# analysis/models.py

from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class AnalysisSession(models.Model):
    """
    Stores metadata and results of a diagnosis session.
    NO images are stored in production.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # CBC Data (stored as JSON)
    cbc_data = models.JSONField()
    
    # ML Model Results (stored as JSON)
    results = models.JSONField()
    
    # Optional: Model version used
    model_version = models.CharField(max_length=50, default='v1.0')
    
    # Optional: Processing time
    processing_time_ms = models.IntegerField(null=True, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.user.username} - {self.timestamp}"
```

### **Research Mode Addition (optional):**

```python
class AnalysisImage(models.Model):
    """
    Only used when HEMORA_RESEARCH_MODE=True.
    Stores anonymized images for research purposes.
    """
    session = models.ForeignKey(AnalysisSession, on_delete=models.CASCADE)
    image = models.ImageField(
        upload_to='research/blood_smears/%Y/%m/%d/',
        null=True,
        blank=True
    )
    
    # Flag for consent/anonymization
    is_anonymized = models.BooleanField(default=False)
    
    # Research dataset inclusion
    included_in_training = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'analysis_research_images'
```

---

## **🔐 Security Considerations**

### **Production Requirements:**

1. **Data Minimization:**
   - Only store what's absolutely necessary
   - CBC data + results only
   - No raw images

2. **Access Control:**
   - JWT authentication required for all endpoints
   - Role-based permissions (lab tech can diagnose, admin can view history)
   - Audit logging for sensitive operations

3. **Data Retention:**
   - Clear policy on how long results are kept
   - Automatic cleanup after X days/months
   - User can request deletion

4. **Encryption:**
   - TLS for all API communications
   - Database encryption at rest
   - Environment variables for secrets

### **Research Mode Requirements (if enabled):**

1. **Explicit Consent:**
   - Users must opt-in to have images stored
   - Clear consent form in UI

2. **Anonymization:**
   - Remove any identifying markers from images
   - No patient names or IDs in filenames
   - Hash-based identifiers only

3. **Storage Security:**
   - Encrypted storage volumes
   - Restricted access (research team only)
   - Separate from production data

4. **Compliance:**
   - HIPAA compliance if in US
   - GDPR if handling EU data
   - Local healthcare data protection laws

---

## **🎯 Implementation Phases**

### **Phase 1: Dummy Backend (Now → Next Week)**

**Goal:** Get the contract and structure right before real ML.

**Tasks:**
1. Create `AnalysisSession` model
2. Create `/api/analysis/diagnose/` endpoint that:
   - Accepts CBC data + image
   - Returns fixed dummy probabilities
   - Does NOT save image
3. Test with Postman/Insomnia

**Outcome:** Frontend can be built against stable API.

---

### **Phase 2: Frontend Diagnosis UI (Next → 1-2 weeks)**

**Goal:** Complete user interface for diagnosis flow.

**Tasks:**
1. Create `Diagnosis.jsx` component
2. Form for CBC values (WBC, RBC, Hb, Platelets, etc.)
3. Image upload (drag-and-drop or file input)
4. Submit to `/api/analysis/diagnose/`
5. Display results with probabilities
6. Add to navigation from Dashboard

**Outcome:** End-to-end flow from login → diagnosis → results.

---

### **Phase 3: ML Model Training (Parallel with Phase 2)**

**Goal:** Train actual model in Colab.

**Tasks:**
1. Prepare dataset in Colab
2. Define HemoraNet architecture
3. Train and validate model
4. Save model weights to `.pth` file
5. Test inference in notebook
6. Document model architecture

**Outcome:** Trained `blood_disease_classifier_v1.pth` ready to deploy.

---

### **Phase 4: ML Integration (After Phases 1-3)**

**Goal:** Replace dummy inference with real model.

**Tasks:**
1. Copy `.pth` file to `data/models/`
2. Implement `ml_models/inference/blood_model.py`
3. Implement `ml_models/inference/loader.py`
4. Update `ml_models/preprocessing/image_preprocessor.py`
5. Implement `ml_models/inference/predict.py`
6. Update Django view to use real inference
7. Test with real images

**Outcome:** Live disease detection system!

---

### **Phase 5: History & Analysis Management (Optional)**

**Goal:** Let users view past diagnoses.

**Tasks:**
1. Add pagination to `AnalysisSession`
2. Create `/api/analysis/history/` endpoint
3. Create History page in frontend
4. Filter by date, user, disease type

**Outcome:** Users can track analysis history.

---

## **📝 Project Structure After Integration**

```
Hemora/
├── backend/
│   ├── analysis/
│   │   ├── models.py              # AnalysisSession model
│   │   ├── serializers.py         # CBC + results serializers
│   │   ├── views.py               # DiagnoseView endpoint
│   │   └── urls.py                # /api/analysis/ routes
│   └── config/
│       └── settings.py            # HEMORA_RESEARCH_MODE flag
│
├── ml_models/
│   ├── inference/
│   │   ├── blood_model.py         # HemoraNet architecture
│   │   ├── loader.py              # Model loader singleton
│   │   └── predict.py             # Main inference function
│   ├── preprocessing/
│   │   └── image_preprocessor.py  # Image transforms
│   └── training/                  # (Optional) Training notebooks
│
├── data/
│   └── models/
│       └── blood_disease_classifier_v1.pth  # Trained weights
│
└── frontend/
    └── src/
        ├── components/
        │   ├── Diagnosis.jsx      # Upload form + results
        │   └── History.jsx        # Past analyses
        └── services/
            └── api.js             # analysisAPI.diagnose()
```

---

## **🧪 Testing Strategy**

### **Unit Tests:**

```python
# tests/test_inference.py

def test_model_loads():
    model = get_model()
    assert model is not None

def test_inference_output_shape():
    # Test with dummy data
    image = create_dummy_image()
    cbc = {'wbc': 7500, 'rbc': 4.5, ...}
    
    results = run_inference(image, cbc)
    
    assert 'prediction' in results
    assert 'probabilities' in results
    assert len(results['probabilities']) == 4
```

### **Integration Tests:**

```python
# tests/test_api.py

def test_diagnose_endpoint():
    client = APIClient()
    client.force_authenticate(user=user)
    
    with open('test_image.jpg', 'rb') as img:
        response = client.post('/api/analysis/diagnose/', {
            'wbc': 7500,
            'rbc': 4.5,
            'hemoglobin': 14.2,
            'platelets': 250000,
            'image': img
        }, format='multipart')
    
    assert response.status_code == 200
    assert 'prediction' in response.data
```

---

## **📚 Key Takeaways**

### **What You DO:**

✅ Train model in Colab/Jupyter  
✅ Save model weights as `.pth` file  
✅ Copy `.pth` to `data/models/` in repo  
✅ Define same model architecture in Django code  
✅ Load weights once at startup  
✅ Process images in memory during inference  
✅ Return probabilities to frontend  
✅ Store only results, NOT images (production)  

### **What You DON'T DO:**

❌ Run notebooks inside Django  
❌ Call Colab remotely during user requests  
❌ Store raw images in production  
❌ Mix training and inference code paths  
❌ Put model training in the web app  

### **Security Principles:**

🔒 Images are PHI - minimize retention  
🔒 Process in memory, delete immediately  
🔒 Only store structured, anonymized results  
🔒 Research mode is separate and controlled  
🔒 Clear data retention policies  
🔒 Encryption at rest and in transit  

---

## **🚀 When to Start ML Integration**

**Start Phase 4 (ML Integration) when:**

1. ✅ Phases 1-2 complete (dummy backend + frontend UI working)
2. ✅ Phase 3 complete (model trained in Colab)
3. ✅ You have:
   - Trained `.pth` file
   - Model architecture documented
   - Test images for validation
   - CBC data format finalized

**Don't rush to integrate ML before frontend is ready** - it's easier to build UI with dummy data first, then swap in real inference later.

---

## **📞 Questions to Answer Before ML Integration**

- [ ] What are the exact 4 diseases the model detects?
- [ ] What image size/format does the model expect?
- [ ] What CBC parameters are required? (exact fields)
- [ ] What's the expected inference time? (for timeout settings)
- [ ] Will you support multiple images per diagnosis?
- [ ] What's the minimum confidence threshold to show results?
- [ ] Do you need to handle grayscale vs RGB images?
- [ ] Are there preprocessing steps (normalization, resizing)?

---

**Last Updated:** December 7, 2025  
**Status:** Reference document - implementation pending  
**Next Review:** Before Phase 4 begins

---

*This document will be updated as requirements are refined and implementation progresses.*
