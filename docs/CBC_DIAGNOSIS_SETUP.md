# CBC Extraction & Diagnosis Feature - Setup Guide

## Step-by-Step Setup

### Step 1: Install Tesseract OCR

Tesseract is required for extracting CBC parameters from scanned PDF reports using OCR.

**Windows:**
```bash
winget install UB-Mannheim.TesseractOCR
```

Default install path: `C:\Program Files\Tesseract-OCR\tesseract.exe`

If installed to a different location, update the `TESSERACT_CMD` value in `backend/config/settings.py`:
```python
TESSERACT_CMD = r'C:\Your\Custom\Path\tesseract.exe'
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt install tesseract-ocr
```

**macOS:**
```bash
brew install tesseract
```

### Step 2: Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

Key new packages:
- `PyMuPDF` - Renders scanned PDF pages to images for OCR
- `pytesseract` - Python wrapper for Tesseract OCR engine
- `pdfplumber` - Extracts text from text-based PDFs

### Step 3: Run Database Migrations

```bash
cd backend
python manage.py migrate
```

This creates the `DiagnosisResult` table which stores CBC parameter values and analysis results per patient.

### Step 4: Install Frontend Dependencies

```bash
cd frontend
npm install
```

No new frontend packages were added — this step is only needed if `node_modules` is missing.

### Step 5: Start the Servers

```bash
# Terminal 1 - Backend
cd backend
python manage.py runserver

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Step 6: Verify Extraction Works

1. Log in as a Lab Technician
2. Navigate to the Patients page
3. Click the **Diagnose** button on any patient that has a CBC report uploaded
4. The CBC Input Modal should open and auto-extract parameters from the uploaded report
5. Review the extracted values, edit if needed, then click **Run Diagnosis**
6. You should be redirected to the View Results page showing the CBC parameter report and disease suspicion analysis

## Feature Overview

### How It Works

1. **CBC Extraction** (`backend/analysis/cbc_extractor.py`)
   - First tries text extraction via `pdfplumber` (fast, for text-based PDFs)
   - Falls back to OCR via `PyMuPDF + pytesseract` if fewer than 3 parameters are extracted (for scanned PDFs)
   - Parses 14 CBC parameters using regex patterns with plausible-range validation
   - Auto-converts units (e.g., WBC in cells/uL to x10^3/uL)

2. **CBC Analysis** (`backend/analysis/cbc_analyzer.py`)
   - Compares extracted values against normal reference ranges
   - Checks for disease-specific patterns using weighted criteria scoring
   - Analyzes 4 target diseases:
     - Acute Lymphoblastic Leukemia (ALL)
     - Beta Thalassemia Minor
     - Iron Deficiency Anemia (IDA)
     - Sickle Cell Anemia
   - Returns suspicion scores (0-100%), risk levels, and matched criteria

3. **Diagnosis Storage** (`backend/analysis/models.py` - `DiagnosisResult`)
   - Stores all 14 CBC parameter values
   - Stores full analysis results as JSON
   - One-to-one relationship with Patient

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/patients/<id>/extract-cbc/` | Extract CBC parameters from uploaded report |
| POST | `/api/patients/<id>/diagnose/` | Submit CBC parameters, run analysis, save results |
| GET | `/api/patients/<id>/diagnose/` | Retrieve existing diagnosis results |

### Frontend Changes

- **CBC Input Modal** - Auto-extracts CBC values, allows manual editing, runs diagnosis
- **View Results Page** - Displays CBC parameter table with High/Low/Normal status, disease suspicion cards with expandable matched criteria
- **View Patient Modal** - New tabs for CBC Report viewer (PDF/image) and Blood Smear image gallery with lightbox

## Troubleshooting

### "0 parameters extracted"
- The PDF is likely scanned (image-based) and Tesseract OCR is not accessible
- Verify Tesseract is installed: `tesseract --version`
- Check `TESSERACT_CMD` in `backend/config/settings.py` points to the correct path

### "tesseract is not installed or it's not in your PATH"
- Install Tesseract OCR (see Step 1)
- Or set the explicit path in settings:
  ```python
  TESSERACT_CMD = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
  ```

### OCR quality is poor / missing parameters
- OCR accuracy depends on scan quality
- Parameters that cannot be extracted can be entered manually in the CBC Input Modal
- The extractor uses plausible-range validation to filter out garbage matches

### Migration errors
- Make sure you run `python manage.py migrate` after pulling changes
- The migration `0006_add_diagnosis_result` adds the DiagnosisResult table

