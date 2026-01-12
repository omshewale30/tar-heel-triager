#This file handles the redirecting of emails to the appropriate department
#We can handle the forward of the email
from email_client import EmailClient
from typing import Any


redirect_email_address_dict = {
    "Library": "library@unc.edu",
    "Parking & Transportation": "parking@unc.edu",
    "Housing": "housing@unc.edu",
    "Registrar": "registrar@unc.edu",
    "OSSA": "ossa@unc.edu",

}



class RedirectHandler:
    def __init__(self, email_client: EmailClient):
        self.email_client = email_client

    async def redirect_email(self, email_id: str, department_name: str, department_email: str, comment: str = "") -> dict[str, Any]:
        return await self.email_client.forward_email(email_id, department_name, department_email, comment)