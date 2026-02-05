from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from auth.middleware import get_current_user
from database.negotiation_repository import get_negotiation_with_messages
from database.message_repository import add_message

router = APIRouter(prefix="/api/negotiations", tags=["messages"])


class AddMessageRequest(BaseModel):
    role: str
    content: str


@router.post("/{negotiation_id}/messages")
async def create_message(
    negotiation_id: int,
    request: AddMessageRequest,
    user_id: int = Depends(get_current_user)
):
    """Add a message to a negotiation"""
    # Verify negotiation belongs to user
    negotiation = get_negotiation_with_messages(negotiation_id, user_id)

    if not negotiation:
        raise HTTPException(status_code=404, detail="Negotiation not found")

    message = add_message(negotiation_id, request.role, request.content)
    return message
