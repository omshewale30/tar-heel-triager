from pydantic import BaseModel
from typing import Optional

class TriageResponse(BaseModel):
    email_id: str
    category: str
    priority: int
    suggested_response: Optional[str]
    confidence: float
    requires_approval: bool
    route: str  # 'auto_faq' | 'manual' | 'urgent'
