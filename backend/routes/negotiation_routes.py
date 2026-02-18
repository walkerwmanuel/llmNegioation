import logging
from typing import Optional, Any
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from auth.middleware import get_current_user
from database.negotiation_repository import (
    create_negotiation,
    get_user_negotiations,
    get_negotiation_with_messages,
    update_negotiation_settings,
    delete_negotiation
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/negotiations", tags=["negotiations"])


class CreateNegotiationRequest(BaseModel):
    topic: str
    negotiation_type: str
    settings: Optional[dict] = None


class UpdateSettingsRequest(BaseModel):
    settings: dict


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
    negotiation = create_negotiation(user_id, request.topic, request.negotiation_type, request.settings)
    return negotiation


@router.get("/{negotiation_id}")
async def get_negotiation(
    negotiation_id: int,
    user_id: int = Depends(get_current_user)
):
    """Get a specific negotiation with its messages"""
    logger.info(f"[get_negotiation] Loading negotiation_id={negotiation_id} for user_id={user_id}")

    negotiation = get_negotiation_with_messages(negotiation_id, user_id)

    if not negotiation:
        logger.warning(f"[get_negotiation] NOT FOUND: negotiation_id={negotiation_id}, user_id={user_id}")
        raise HTTPException(status_code=404, detail=f"Negotiation {negotiation_id} not found or not owned by user")

    message_count = len(negotiation.get('messages', []))
    logger.info(f"[get_negotiation] SUCCESS: negotiation_id={negotiation_id} with {message_count} messages")

    return negotiation


@router.patch("/{negotiation_id}/settings")
async def update_settings(
    negotiation_id: int,
    request: UpdateSettingsRequest,
    user_id: int = Depends(get_current_user)
):
    """Update negotiation settings"""
    logger.info(f"[update_settings] Updating settings for negotiation_id={negotiation_id}")

    negotiation = update_negotiation_settings(negotiation_id, user_id, request.settings)

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
