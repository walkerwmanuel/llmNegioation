from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from auth.middleware import get_current_user
from database.negotiation_repository import get_negotiation_with_messages, get_negotiation_by_id
from database.message_repository import add_message, get_message_by_id, update_message_content

router = APIRouter(prefix="/api", tags=["messages"])


class AddMessageRequest(BaseModel):
    role: str
    content: str


class UpdateMessageRequest(BaseModel):
    content: str


@router.post("/negotiations/{negotiation_id}/messages")
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


@router.patch("/messages/{message_id}")
async def update_message(
    message_id: int,
    request: UpdateMessageRequest,
    user_id: int = Depends(get_current_user)
):
    """
    Update a message's content.
    Verifies the message belongs to a negotiation owned by the user.
    On first edit, preserves original_content. Sets edited_at timestamp.
    """
    # Get the message
    message = get_message_by_id(message_id)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    # Verify negotiation belongs to user
    negotiation = get_negotiation_by_id(message['negotiation_id'], user_id)
    if not negotiation:
        raise HTTPException(status_code=403, detail="Not authorized to edit this message")

    # Update the message
    updated = update_message_content(message_id, request.content)
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to update message")

    return updated
