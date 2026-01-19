from pydantic import BaseModel
from typing import Optional

class RedirectEmailRequest(BaseModel):
    approval_id: str
    redirect_department_email: Optional[str] = None
    comment: Optional[str] = None