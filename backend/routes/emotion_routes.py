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

    prompt = f"""
You are an emotion classifier for an animated avatar.

Classify the BOT's emotional expression for its latest reply.

Return exactly one label from this list:
neutral, friendly, firm, thinking, concerned, angry, sad, surprised

Rules:
- Classify the emotion the BOT should visually express.
- Prefer firm over angry unless the bot sounds clearly irritated, hostile, or offended.
- Prefer concerned for caution, warning, risk, uncertainty, or bad news.
- Prefer thinking for reflective, analytical, or deliberative language.
- Prefer friendly for warm, reassuring, cooperative language.
- Return only the label.

Conversation history:
{history_text}

Latest user message:
{payload.user_text}

Latest bot reply:
{payload.bot_text}
""".strip()

    try:
        resp = client.responses.create(
            model="gpt-4o-mini",
            input=prompt,
            temperature=0,
            max_output_tokens=8,
        )

        emotion = (resp.output_text or "").strip().lower()
        if emotion not in ALLOWED:
            emotion = "neutral"

        return EmotionResponse(emotion=emotion)
    except Exception:
        return EmotionResponse(emotion="neutral")