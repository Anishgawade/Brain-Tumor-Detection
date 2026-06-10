"""Health check route."""

from fastapi import APIRouter
from model.loader import is_model_loaded, get_model_error

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health():
    loaded = is_model_loaded()
    error = get_model_error()
    
    if loaded:
        status = "active"
    elif error:
        status = "error"
    else:
        status = "loading"
        
    return {
        "status": status,
        "model": {
            "loaded": loaded,
            "error": error if error else None,
            "architecture": "ResNet50 + Custom Head",
            "classes": ["glioma", "meningioma", "notumor", "pituitary"]
        },
        "system": {
            "api_version": "2.1.0",
            "environment": "production" if not error else "recovery"
        }
    }
