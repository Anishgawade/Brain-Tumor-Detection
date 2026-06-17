"""
model/loader.py
---------------
Singleton model loader for the Brain Tumor Detection backend.

Expected model file location (relative to the backend/ directory):
    ../models/model.h5   (or model (1).h5)

The loader searches for any .h5 / .keras file under the 'models/' folder
at the project root.  Once found it loads it once and caches it globally.

Classes (in the order the model's softmax outputs them):
    0 – glioma
    1 – meningioma
    2 – notumor
    3 – pituitary
"""

import os
import glob
import gdown
import threading
from pathlib import Path
from typing import Optional, Tuple, Dict

import numpy as np
from PIL import Image

# ── Constants ────────────────────────────────────────────────────────────────────
MODEL_INPUT_SIZE: Tuple[int, int] = (224, 224)

# Class labels in model output order
CLASS_NAMES = ["glioma", "meningioma", "notumor", "pituitary"]

# Tumor subtypes that indicate a positive diagnosis
_TUMOR_CLASSES = {"glioma", "meningioma", "pituitary"}

# Rich tumor information for each class
_TUMOR_INFO: Dict[str, Dict] = {
    "glioma": {
        "display_name": "Glioma",
        "grade": "Grade II–IV (WHO)",
        "description": (
            "Gliomas arise from glial cells (astrocytes, oligodendrocytes). "
            "They are the most common primary brain tumors and range from slow-growing "
            "low-grade (grade II) to highly aggressive glioblastoma (grade IV)."
        ),
        "treatment": "Surgical resection + radiotherapy + temozolomide chemotherapy",
        "prognosis": "Varies widely: low-grade GBM median survival ~15 months; low-grade ~5–10 years",
        "urgency": "HIGH",
    },
    "meningioma": {
        "display_name": "Meningioma",
        "grade": "Grade I–III (WHO)",
        "description": (
            "Meningiomas originate in the meninges (protective brain coverings). "
            "~90 % are benign grade I; atypical (II) and anaplastic (III) forms are rare "
            "but recur more aggressively."
        ),
        "treatment": "Surgical resection; stereotactic radiosurgery for residual/recurrent tumors",
        "prognosis": "Excellent for grade I (>90 % 10-year survival); worse for grade II-III",
        "urgency": "MODERATE",
    },
    "pituitary": {
        "display_name": "Pituitary Adenoma",
        "grade": "Typically benign",
        "description": (
            "Pituitary adenomas are non-cancerous tumors of the pituitary gland. "
            "They may cause hormonal imbalances (functioning) or mass-effect symptoms "
            "(non-functioning) such as vision changes."
        ),
        "treatment": "Transsphenoidal surgery; dopamine agonists (prolactinomas); radiosurgery",
        "prognosis": "Generally excellent; most patients achieve remission after treatment",
        "urgency": "LOW–MODERATE",
    },
    "notumor": {
        "display_name": "No Tumor Detected",
        "grade": "N/A",
        "description": "The MRI scan does not show evidence of a brain tumor.",
        "treatment": "No immediate intervention required; routine follow-up as clinically indicated",
        "prognosis": "Normal baseline",
        "urgency": "NONE",
    },
}

# ── Singleton state ──────────────────────────────────────────────────────────────
_model = None
_model_error: Optional[str] = None
_lock = threading.Lock()


def _find_model_path() -> Optional[str]:
    """Search for the .h5 / .keras model file relative to this file's location."""
    # backend/model/loader.py  → project root = ../../
    here = Path(__file__).resolve().parent          # backend/model/
    backend_dir = here.parent                       # backend/
    project_root = backend_dir.parent               # Brain-Tumor-Detection-main/

    # Also search relative to cwd (uvicorn is launched from backend/)
    cwd = Path.cwd().resolve()

    search_dirs = [
        project_root / "models",
        backend_dir / "models",
        cwd.parent / "models",   # if cwd == backend/, this is project_root/models
        cwd / "models",
        project_root,
        backend_dir,
        cwd,
    ]

    for directory in search_dirs:
        for ext in ("*.h5", "*.keras", "*.hdf5"):
            matches = sorted(glob.glob(str(directory / ext)))
            if matches:
                return matches[0]   # Return the first match found

    return None


def load_model_once() -> None:
    """
    Load the Keras model into the global singleton.
    Safe to call multiple times – loads only once.
    Sets _model_error if the file is missing or loading fails.
    """
    global _model, _model_error

    with _lock:
        if _model is not None:
            return  # Already loaded

        model_path = _find_model_path()

        if model_path is None:
            print("[loader] Model not found locally. Downloading...")

            here = Path(__file__).resolve().parent
            backend_dir = here.parent
            project_root = backend_dir.parent

            models_dir = project_root / "models"
            models_dir.mkdir(exist_ok=True)

            model_path = str(models_dir / "model.h5")

            gdown.download(
                "https://drive.google.com/file/d/1CLSdIAufb8gr-RwFp6wUwb_IIHUCYb2n/view?usp=sharing", #Google Drive Link for model.h5
                model_path,
                quiet=False
            )

            print("[loader] Model downloaded successfully.")

        try:
            import tensorflow as tf
            print(f"[loader] Loading model from: {model_path}")
            _model = tf.keras.models.load_model(model_path, compile=False)
            print(f"[loader] Model loaded successfully. Input shape: {_model.input_shape}")
            _model_error = None
        except Exception as exc:
            _model_error = f"Failed to load model: {exc}"
            print(f"[loader] ERROR: {_model_error}")


def get_model():
    """Return the loaded model. Raises RuntimeError if not yet loaded or failed."""
    if _model is None:
        if _model_error:
            raise RuntimeError(_model_error)
        raise RuntimeError("Model is still loading. Please try again in a moment.")
    return _model


def is_model_loaded() -> bool:
    return _model is not None


def get_model_error() -> Optional[str]:
    return _model_error


# ── Preprocessing ────────────────────────────────────────────────────────────────

def preprocess_image(file_path: str) -> np.ndarray:
    """
    Load an image from disk, resize to MODEL_INPUT_SIZE, normalise to [0, 1],
    and return a (1, H, W, 3) float32 array ready for model.predict().
    """
    img = Image.open(file_path).convert("RGB")
    img = img.resize(MODEL_INPUT_SIZE, Image.LANCZOS)
    arr = np.array(img, dtype=np.float32) #/ 255.0
    return np.expand_dims(arr, axis=0)   # shape: (1, 224, 224, 3)


# ── Decoding ─────────────────────────────────────────────────────────────────────

def decode_prediction(preds: np.ndarray) -> Tuple[str, float, str, Dict, Dict]:
    """
    Decode raw softmax probabilities into human-readable outputs.

    Returns:
        label        – "Tumour" or "No Tumour"
        
           – float in [0, 1]
        subtype      – one of CLASS_NAMES
        all_probs    – dict {class_name: probability}
        tumor_info   – dict with description, treatment, etc.
    """
    probs = preds[0]  # shape: (4,)
    pred_idx = int(np.argmax(probs))
    subtype = CLASS_NAMES[pred_idx]
    confidence = float(probs[pred_idx])

    label = "Tumour" if subtype in _TUMOR_CLASSES else "No Tumour"

    all_probs = {name: round(float(p), 6) for name, p in zip(CLASS_NAMES, probs)}
    tumor_info = _TUMOR_INFO.get(subtype, {})

    return label, confidence, subtype, all_probs, tumor_info

