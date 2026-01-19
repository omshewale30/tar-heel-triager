from pydantic import BaseModel
from typing import Optional


class ApproveResponse(BaseModel):
    approval_id: str
    staff_edits: Optional[str] = ""


class RejectResponse(BaseModel):
    approval_id: str

class DeleteApprovalRequest(BaseModel):
    approval_id: str