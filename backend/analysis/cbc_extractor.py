"""
Extract CBC parameters from uploaded report files (PDF or image).

Two-stage pipeline:
  1. Text extraction via pdfplumber (fast, works on text-based PDFs)
  2. OCR fallback via PyMuPDF + pytesseract (for scanned/image PDFs)

Parses extracted text using regex patterns to identify CBC parameter values
with plausible-range validation and automatic unit conversion.
"""

import io
import os
import re
import logging

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Regex patterns
# ---------------------------------------------------------------------------

# Flexible separator: optional spaces, colons, dashes, pipes, tabs — one or more
_SEP = r"[\s:\-\|]*"
# Separator that requires at least one non-space separator char (for short labels like Hb)
_SEP_STRICT = r"[\s]*[:\-\|][\s]*"
# Match a number: integer or decimal, possibly preceded by spaces
_NUM = r"(\d+\.?\d*)"

_PARAMETER_PATTERNS = {
    "wbc": {
        "patterns": [
            rf"(?:WBC|White\s*Blood\s*Cell[s]?|W\.?B\.?C\.?|Leucocyte[s]?|Leukocyte[s]?)\s*(?:Count)?{_SEP}{_NUM}",
            rf"(?:Total\s*White\s*(?:Cell|Blood)\s*(?:Cell\s*)?Count){_SEP}{_NUM}",
        ],
        "plausible_range": (0.1, 500.0),
        "auto_convert": {"threshold": 100, "divisor": 1000},
    },
    "rbc": {
        "patterns": [
            rf"(?:RBC|Red\s*Blood\s*Cell[s]?|R\.?B\.?C\.?|Erythrocyte[s]?)\s*(?:Count)?{_SEP}{_NUM}",
        ],
        "plausible_range": (0.5, 10.0),
    },
    "hemoglobin": {
        "patterns": [
            rf"(?:Hemoglobin|Haemoglobin|Hgb|HGB){_SEP}{_NUM}",
            rf"(?:Hb){_SEP_STRICT}{_NUM}",
            rf"(?:Hb)\s+{_NUM}",
        ],
        "plausible_range": (2.0, 25.0),
    },
    "hematocrit": {
        "patterns": [
            rf"(?:Hematocrit|Haematocrit|HCT|Hct|PCV){_SEP}{_NUM}",
            rf"(?:Pack(?:ed)?\s*Cell\s*Volume){_SEP}{_NUM}",
        ],
        "plausible_range": (10.0, 70.0),
    },
    "mcv": {
        "patterns": [
            rf"MCV{_SEP}{_NUM}",
            rf"Mean\s*(?:Corpuscular|Cell)\s*Volume{_SEP}{_NUM}",
        ],
        "plausible_range": (50.0, 150.0),
    },
    "mch": {
        "patterns": [
            rf"MCH{_SEP}{_NUM}(?!\s*C)",
            rf"Mean\s*(?:Corpuscular|Cell)\s*(?:Hb|Ha?emoglobin){_SEP}{_NUM}(?!\s*(?:Conc|CONCENTRATION))",
        ],
        "plausible_range": (15.0, 45.0),
    },
    "mchc": {
        "patterns": [
            rf"MCHC{_SEP}{_NUM}",
            rf"Mean\s*(?:Corpuscular|Cell)\s*(?:Hb|Ha?emoglobin)\s*(?:Conc[.\w]*|CONCENTRATION){_SEP}{_NUM}",
            rf"Mean\s*(?:Corpuscular|Cell)\s*(?:Hb|Ha?e[ae]moglobin)\s+{_NUM}\s*\n\s*CONCENTRATION",
        ],
        "plausible_range": (25.0, 40.0),
    },
    "platelets": {
        "patterns": [
            rf"(?:Platelet[s]?|PLT|Plt)\s*(?:Count)?{_SEP}{_NUM}",
            rf"(?:Thrombocyte[s]?)\s*(?:Count)?{_SEP}{_NUM}",
        ],
        "plausible_range": (5.0, 1500.0),
    },
    "rdw": {
        "patterns": [
            rf"(?:RDW|R\.?D\.?W\.?|Red\s*(?:Cell)?\s*Distribution(?:\s*Width)?|RDW[\s\-]*CV){_SEP}{_NUM}",
        ],
        "plausible_range": (8.0, 30.0),
    },
    "neutrophils": {
        "patterns": [
            rf"(?:Neutrophil[s]?|Neut|NEUT|Segmented\s*Neutrophil[s]?){_SEP}{_NUM}",
        ],
        "plausible_range": (0.0, 100.0),
    },
    "lymphocytes": {
        "patterns": [
            rf"(?:Lymphocyte[s]?|Lymph|LYMPH){_SEP}{_NUM}",
        ],
        "plausible_range": (0.0, 100.0),
    },
    "monocytes": {
        "patterns": [
            rf"(?:Monocyte[s]?|Mono|MONO){_SEP}{_NUM}",
        ],
        "plausible_range": (0.0, 100.0),
    },
    "eosinophils": {
        "patterns": [
            rf"(?:Eosinophil[s]?|Eos|EOS|Eosino){_SEP}{_NUM}",
        ],
        "plausible_range": (0.0, 100.0),
    },
    "basophils": {
        "patterns": [
            rf"(?:Basophil[s]?|Baso|BASO){_SEP}{_NUM}",
        ],
        "plausible_range": (0.0, 100.0),
    },
}

# Map parser field names to DiagnosisResult model field names
_FIELD_MAP = {
    "platelets": "platelet_count",
}

MIN_PARAMS_THRESHOLD = 3


# ---------------------------------------------------------------------------
# Text extraction (pdfplumber)
# ---------------------------------------------------------------------------

def _extract_text(file_path):
    """Extract text from PDF using pdfplumber. Returns (text, success)."""
    import pdfplumber

    try:
        full_text = ""
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    full_text += text + "\n"

                tables = page.extract_tables()
                for table in tables:
                    for row in table:
                        if row:
                            full_text += " | ".join(
                                str(cell) for cell in row if cell
                            ) + "\n"

        if not full_text.strip():
            return "", False
        return full_text, True
    except Exception as e:
        logger.warning("pdfplumber text extraction failed: %s", e)
        return "", False


# ---------------------------------------------------------------------------
# OCR extraction (PyMuPDF + pytesseract)
# ---------------------------------------------------------------------------

def _extract_ocr(file_path):
    """Extract text from scanned PDF/image using PyMuPDF + pytesseract. Returns (text, success)."""
    try:
        import fitz  # PyMuPDF
        import pytesseract
        from PIL import Image

        # Configure tesseract path if set in Django settings
        try:
            from django.conf import settings
            tesseract_cmd = getattr(settings, "TESSERACT_CMD", None)
            if tesseract_cmd:
                pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
        except Exception:
            pass

        ext = os.path.splitext(file_path)[1].lower()

        if ext in (".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif", ".gif", ".webp"):
            img = Image.open(file_path)
            full_text = pytesseract.image_to_string(img)
        else:
            full_text = ""
            doc = fitz.open(file_path)
            for page in doc:
                pix = page.get_pixmap(dpi=300)
                img = Image.open(io.BytesIO(pix.tobytes("png")))
                text = pytesseract.image_to_string(img)
                full_text += text + "\n"
            doc.close()

        if not full_text.strip():
            return "", False
        return full_text, True
    except Exception as e:
        logger.warning("OCR extraction failed: %s", e)
        return "", False


# ---------------------------------------------------------------------------
# Parser
# ---------------------------------------------------------------------------

def _parse_cbc(raw_text):
    """Parse CBC parameters from raw text using regex patterns with validation."""
    if not raw_text:
        return {}

    # Normalize whitespace: collapse multiple spaces/tabs into single space per line
    cleaned = "\n".join(" ".join(line.split()) for line in raw_text.splitlines())
    logger.debug("CBC extracted text (first 2000 chars):\n%s", cleaned[:2000])

    extracted = {}

    for param_name, config in _PARAMETER_PATTERNS.items():
        patterns = config["patterns"]
        plausible_range = config["plausible_range"]
        auto_convert = config.get("auto_convert")

        for pattern in patterns:
            matches = re.findall(pattern, cleaned, re.IGNORECASE | re.MULTILINE)
            found = False
            for match_str in matches:
                try:
                    value = float(match_str)

                    # Auto-convert units if above threshold
                    if auto_convert and value > auto_convert["threshold"]:
                        value = value / auto_convert["divisor"]

                    if plausible_range[0] <= value <= plausible_range[1]:
                        field_name = _FIELD_MAP.get(param_name, param_name)
                        extracted[field_name] = value
                        logger.debug("Extracted %s = %s (from pattern: %s)", field_name, value, param_name)
                        found = True
                        break
                except ValueError:
                    continue
            if found:
                break

    logger.info("CBC parsing complete: extracted %d parameters: %s", len(extracted), list(extracted.keys()))
    return extracted


# ---------------------------------------------------------------------------
# Pipeline
# ---------------------------------------------------------------------------

def extract_cbc_from_file(file_path):
    """
    Full extraction pipeline: text first, OCR fallback if < 3 params extracted.

    Returns:
        dict with:
          - parameters: dict of param_name -> float value
          - source: "text" | "ocr" | "unknown"
          - extractedCount: number of parameters found
    """
    ext = os.path.splitext(file_path)[1].lower()
    is_image = ext in (".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif", ".gif", ".webp")

    if is_image:
        raw_text, success = _extract_ocr(file_path)
        source = "ocr"
        parameters = _parse_cbc(raw_text) if success else {}
    else:
        raw_text, success = _extract_text(file_path)
        parameters = _parse_cbc(raw_text) if success else {}
        source = "text"

        if len(parameters) < MIN_PARAMS_THRESHOLD:
            logger.info(
                "Text extraction got %d params (< %d), falling back to OCR for %s",
                len(parameters), MIN_PARAMS_THRESHOLD, file_path,
            )
            ocr_text, ocr_success = _extract_ocr(file_path)
            if ocr_success:
                ocr_params = _parse_cbc(ocr_text)
                if len(ocr_params) > len(parameters):
                    parameters = ocr_params
                    source = "ocr"

    return {
        "parameters": parameters,
        "source": source,
        "extractedCount": len(parameters),
    }
