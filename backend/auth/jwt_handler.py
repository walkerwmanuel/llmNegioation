from datetime import datetime, timedelta
from jose import jwt, JWTError
from auth.config import JWT_SECRET_KEY, JWT_ALGORITHM, JWT_EXPIRATION_HOURS


def create_token(user_id: int, email: str) -> str:
    """Creates a JWT token for the user"""
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': expire
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def verify_token(token: str) -> dict:
    """Verifies a JWT token and returns payload with user_id. Raises exception if invalid."""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return {'user_id': payload['user_id'], 'email': payload['email']}
    except JWTError as e:
        raise Exception(f'Invalid token: {str(e)}')
