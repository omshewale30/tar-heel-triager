"""
Main router - combines all route modules
"""
from fastapi import APIRouter

from api.routes.health import router as health_router
from api.routes.history import router as history_router
from api.routes.redirect import router as redirect_router
from api.routes.triage import router as triage_router
from api.routes.approval import router as approval_router

router = APIRouter()
router.include_router(health_router)
router.include_router(history_router)
router.include_router(redirect_router)
router.include_router(triage_router)
router.include_router(approval_router)




