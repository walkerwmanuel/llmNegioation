from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests

from auth.config import GOOGLE_CLIENT_ID
from auth.jwt_handler import create_token
from auth.middleware import get_current_user
from database.user_repository import create_or_get_user, get_user_by_id

router = APIRouter(prefix="/api/auth", tags=["auth"])


class GoogleAuthRequest(BaseModel):
    credential: str


@router.post("/google")
async def google_auth(request: GoogleAuthRequest):
    """Authenticate with Google OAuth and return JWT token"""
    try:
        # Verify Google ID token
        idinfo = id_token.verify_oauth2_token(
            request.credential,
            requests.Request(),
            GOOGLE_CLIENT_ID
        )

        # Extract user info from Google token
        oauth_id = idinfo['sub']
        email = idinfo['email']
        name = idinfo.get('name', '')
        avatar_url = idinfo.get('picture', '')

        # Create or get user in database
        user = create_or_get_user(oauth_id, email, name, avatar_url)

        # Create JWT token
        token = create_token(user['id'], user['email'])

        return {
            "token": token,
            "user": {
                "id": user['id'],
                "email": user['email'],
                "name": user['name'],
                "avatar_url": user['avatar_url']
            }
        }

    except ValueError as e:
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {str(e)}")


@router.get("/me")
async def get_me(user_id: int = Depends(get_current_user)):
    """Get current authenticated user"""
    user = get_user_by_id(user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": user['id'],
        "email": user['email'],
        "name": user['name'],
        "avatar_url": user['avatar_url']
    }
