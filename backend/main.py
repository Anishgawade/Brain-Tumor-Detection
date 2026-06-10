"""
Brain Tumor Detection API – FastAPI application.
Run with: uvicorn main:app --reload --port 8000
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from model.loader import load_model_once
from routes import health, predict, stats, report


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the model asynchronously at startup."""
    import asyncio
    asyncio.create_task(asyncio.to_thread(load_model_once))
    yield


app = FastAPI(
    title="Brain Tumor Detection API",
    description=(
        "REST API for MRI-based brain tumor classification using a pre-trained "
        "deep learning model. Supports glioma, meningioma, pituitary, and no-tumor classes."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

# ── CORS ────────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ─────────────────────────────────────────────────────────────────────
app.include_router(health.router, prefix="/api")
app.include_router(predict.router, prefix="/api")
app.include_router(stats.router, prefix="/api")
app.include_router(report.router, prefix="/api")


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Brain Tumor Detection API v2.0.0",
        "docs": "/docs",
        "health": "/api/health",
    }
