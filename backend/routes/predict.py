"""Prediction route – accepts an MRI image and returns classification + Grad-CAM."""

import os
import tempfile

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from services.prediction_service import predict_image

router = APIRouter(tags=["Prediction"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/bmp", "image/gif"}

@router.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Upload a brain MRI image and receive:
    - prediction label (Tumor / No Tumor)
    - confidence score
    - subtype (glioma / meningioma / pituitary / notumor)
    - per-class probabilities
    - Grad-CAM heatmap overlay (base64 PNG)
    - tumor information and treatment notes
    """
    content_type = file.content_type or ""
    if content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{content_type}'. Please upload a JPEG or PNG image.",
        )

    suffix = os.path.splitext(file.filename or "scan.jpg")[1] or ".jpg"
    import time
    start_time = time.perf_counter()

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        result = predict_image(tmp_path)
        
        # Add performance metadata
        end_time = time.perf_counter()
        result["meta"] = {
            "inference_time_ms": round((end_time - start_time) * 1000, 2),
            "engine": "TensorFlow 2.16+ (Keras 3)",
        }
        
        return JSONResponse(content=result)

    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(exc)}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass
