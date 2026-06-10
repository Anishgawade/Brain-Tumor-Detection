"""Stats and history routes."""

from fastapi import APIRouter
from services.prediction_service import get_stats, get_history

router = APIRouter(tags=["Stats"])


@router.get("/stats")
async def stats():
    return get_stats()


@router.get("/history")
async def history(limit: int = 50):
    return {"history": get_history(limit=limit)}
