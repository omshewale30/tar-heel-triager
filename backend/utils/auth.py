from fastapi import HTTPException
import httpx

def validate_azure_ad_token(token: str) -> dict:
    """Validate by calling Microsoft Graph /me endpoint"""
    headers = {"Authorization": f"Bearer {token}"}
    
    response = httpx.get(
        "https://graph.microsoft.com/v1.0/me",
        headers=headers
    )
    
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_data = response.json()
    return {
        "email": user_data.get("userPrincipalName"),
        "name": user_data.get("displayName"),
        "id": user_data.get("id")
    }