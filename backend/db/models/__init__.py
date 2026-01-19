# Re-export models for cleaner imports
from .base import Base
from .approval_queue import ApprovalQueue
from .email_history import EmailHistory

__all__ = ["Base", "ApprovalQueue", "EmailHistory"]
