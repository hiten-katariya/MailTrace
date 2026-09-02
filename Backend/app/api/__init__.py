from fastapi import APIRouter
from backend.app.api.auth import router as auth_router
from backend.app.api.cases import router as cases_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(cases_router)

__all__ = ["api_router"]
