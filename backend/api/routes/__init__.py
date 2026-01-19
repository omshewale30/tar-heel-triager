from .health import router as health_router
from .history import router as history_router
from .redirect import router as redirect_router
from .triage import router as triage_router
from .approval import router as approval_router

__all__ = ["health_router", "history_router", "redirect_router", "triage_router", "approval_router"]