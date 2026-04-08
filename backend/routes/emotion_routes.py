# backend/routes/emotion_routes.py

from typing import List, Literal
import os

from fastapi import APIRouter
from pydantic import BaseModel
from openai import OpenAI

router = APIRouter(prefix="/emotion", tags=["emotion"])

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

FaceTone = Literal[
    "neutral",
    "friendly",
    "firm",
    "thinking",
    "concerned",
    "angry",
    "sad",
    "surprised",
]

ALLOWED = {
    "neutral",
    "friendly",
    "firm",
    "thinking",
    "concerned",
    "angry",
    "sad",
    "surprised",
}


class EmotionHistoryItem(BaseModel):
    speaker: str
    content: str


class EmotionRequest(BaseModel):
    user_text: str
    bot_text: str
    history: List[EmotionHistoryItem] = []


class EmotionResponse(BaseModel):
    emotion: FaceTone


@router.post("/detect", response_model=EmotionResponse)
async def emotion_detect(payload: EmotionRequest):
    history_text = "\n".join(
        f"{msg.speaker}: {msg.content}" for msg in payload.history[-12:]
    )

    user_text = (payload.user_text or "").lower()
    user_text_raw = payload.user_text or ""
    bot_text_raw = payload.bot_text or ""

    firm_user_markers = [
        "non negotiable",
        "non-negotiable",
        "final offer",
        "take it or leave it",
        "not going higher",
        "this is my price",
        "won't pay more",
        "will not pay more",
    ]

    rude_user_markers = [
        "ugly",
        "stupid",
        "idiot",
        "dumb",
        "trash",
        "awful",
        "hate",
    ]

    if any(word in user_text for word in rude_user_markers):
        return EmotionResponse(emotion="angry")

    if any(word in user_text for word in firm_user_markers):
        return EmotionResponse(emotion="firm")

    prompt = f"""
You are an emotion classifier for an animated avatar.

Your job is to classify the emotional tone of the CURRENT CONVERSATION EXCHANGE
and choose what face the bot should show in response.

Return exactly one label from:
neutral, friendly, firm, thinking, concerned, angry, sad, surprised

IMPORTANT:
- The USER's message is the primary driver of the emotion.
- The BOT's reply is secondary context.
- Classify the emotional atmosphere of the exchange, not just the bot's wording.
- The bot may still show firm, concerned, surprised, or angry even if its actual wording is polite.
- Return only the label, with no punctuation or explanation.

Guidelines:
- Use angry when the user is insulting, hostile, mocking, aggressive, or disrespectful.
- Use firm when the user is pushy, dismissive, demanding, or making rigid ultimatums.
- Use concerned when the user expresses worry, risk, uncertainty, fear, or bad news.
- Use sad when the exchange is emotionally hurtful, regretful, or clearly dejected.
- Use surprised when the user expresses shock, disbelief, or sudden surprise.
- Use thinking when the exchange is analytical, reflective, or exploratory.
- Use friendly when the exchange is warm, cooperative, appreciative, or reassuring.
- Use neutral only when the exchange is emotionally flat.

Conversation history:
{history_text}

Latest user message:
{user_text_raw}

Latest bot reply:
{bot_text_raw}

Return ONLY the label.
""".strip()

    try:
        resp = client.responses.create(
            model="gpt-4o-mini",
            input=prompt,
            temperature=0,
            max_output_tokens=8,
        )

        emotion = (resp.output_text or "").strip().lower().strip(" .,!?:;\"'")

        if emotion not in ALLOWED:
            emotion = "neutral"

        return EmotionResponse(emotion=emotion)

    except Exception as e:
        print("EMOTION ROUTE ERROR:", repr(e))
        return EmotionResponse(emotion="neutral")