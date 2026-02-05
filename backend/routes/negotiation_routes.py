from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from auth.middleware import get_current_user
from database.negotiation_repository import (
    create_negotiation,
    get_user_negotiations,
    get_negotiation_with_messages,
    delete_negotiation
)

router = APIRouter(prefix="/api/negotiations", tags=["negotiations"])


class CreateNegotiationRequest(BaseModel):
    topic: str
    negotiation_type: str


@router.get("")
async def list_negotiations(user_id: int = Depends(get_current_user)):
    """Get all negotiations for the current user"""
    negotiations = get_user_negotiations(user_id)
    return {"negotiations": negotiations}


@router.post("")
async def create_new_negotiation(
    request: CreateNegotiationRequest,
    user_id: int = Depends(get_current_user)
):
    """Create a new negotiation"""
    negotiation = create_negotiation(user_id, request.topic, request.negotiation_type)
    return negotiation


@router.get("/{negotiation_id}")
async def get_negotiation(
    negotiation_id: int,
    user_id: int = Depends(get_current_user)
):
    """Get a specific negotiation with its messages"""
    negotiation = get_negotiation_with_messages(negotiation_id, user_id)

    if not negotiation:
        raise HTTPException(status_code=404, detail="Negotiation not found")

    return negotiation


@router.delete("/{negotiation_id}")
async def remove_negotiation(
    negotiation_id: int,
    user_id: int = Depends(get_current_user)
):
    """Delete a negotiation"""
    deleted = delete_negotiation(negotiation_id, user_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Negotiation not found")

    return {"message": "Negotiation deleted"}
