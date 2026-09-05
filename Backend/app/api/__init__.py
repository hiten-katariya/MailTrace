from fastapi import APIRouter
from backend.app.api.auth import router as auth_router
from backend.app.api.cases import router as cases_router
from backend.app.api.audit import router as audit_router
from backend.app.api.campaigns import router as campaigns_router
from backend.app.api.settings import router as settings_router
from backend.app.api.gmail import router as gmail_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(cases_router)
api_router.include_router(audit_router)
api_router.include_router(campaigns_router)
api_router.include_router(settings_router)
api_router.include_router(gmail_router)

__all__ = ["api_router"]
