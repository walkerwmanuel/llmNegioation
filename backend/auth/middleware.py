from fastapi import Request, HTTPException
from auth.jwt_handler import verify_token


async def get_current_user(request: Request) -> int:
    """
    FastAPI dependency that extracts Bearer token from Authorization header,
    verifies it, and returns user_id. Raises 401 if invalid.
    """
    auth_header = request.headers.get('Authorization')

    if not auth_header:
        raise HTTPException(status_code=401, detail='Authorization header missing')

    if not auth_header.startswith('Bearer '):
        raise HTTPException(status_code=401, detail='Invalid authorization format')

    token = auth_header[7:]  # Remove 'Bearer ' prefix

    try:
        payload = verify_token(token)
        return payload['user_id']
    except Exception:
        raise HTTPException(status_code=401, detail='Invalid or expired token')
