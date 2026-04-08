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

Your job is to determine the BOT's facial expression.

Return exactly one label:
neutral, friendly, firm, thinking, concerned, angry, sad, surprised

IMPORTANT:
- The PRIMARY signal is the BOT's reply
- The USER message should influence the result (emotional bias)

Rules:
1. If the USER message is insulting, rude, hostile, or aggressive,
   lean toward "angry" or "firm" EVEN IF the bot sounds polite.

2. If the USER expresses sadness or vulnerability,
   lean toward "concerned" or "friendly"

3. If the USER expresses surprise or excitement,
   you may lean toward "surprised"

4. Otherwise, classify based mainly on the BOT tone.

5. Prefer "angry" more often than before if tension exists.

Conversation history:
{history_text}

Latest user message:
{payload.user_text}

Latest bot reply:
{payload.bot_text}

Return ONLY the label.
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