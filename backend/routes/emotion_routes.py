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


EMOTION_KEYWORDS = {
    "friendly": [
        "thanks",
        "thank you",
        "appreciate",
        "glad",
        "happy",
        "great",
        "awesome",
        "sounds good",
        "that works",
        "perfect",
        "nice",
        "good idea",
        "love that",
        "i'd love",
        "i would love",
        "excited",
        "no worries",
        "all good",
        "totally fair",
        "fair enough",
    ],
    "firm": [
        "non negotiable",
        "non-negotiable",
        "final offer",
        "take it or leave it",
        "not going higher",
        "not going lower",
        "this is my price",
        "won't pay more",
        "will not pay more",
        "can't go higher",
        "cannot go higher",
        "can't go lower",
        "cannot go lower",
        "best i can do",
        "that's my limit",
        "that is my limit",
        "no exceptions",
        "must be",
        "needs to be",
        "has to be",
        "i'm firm",
        "i am firm",
        "not budging",
        "my final price",
        "my final offer",
        "decide now",
    ],
    "thinking": [
        "maybe",
        "perhaps",
        "possibly",
        "let me think",
        "i need to think",
        "i'll think about it",
        "i will think about it",
        "consider",
        "what if",
        "if we",
        "it depends",
        "i wonder",
        "one option",
        "another option",
        "on the other hand",
        "could we",
        "would it make sense",
        "let's think",
        "lets think",
        "how about",
    ],
    "concerned": [
        "worried",
        "concerned",
        "not sure",
        "unsure",
        "uncertain",
        "risk",
        "risky",
        "problem",
        "issue",
        "afraid",
        "nervous",
        "anxious",
        "this could go wrong",
        "might not work",
        "may not work",
        "too expensive",
        "out of budget",
        "over budget",
        "can't afford",
        "cannot afford",
        "deadline",
        "delay",
        "delayed",
        "not comfortable",
        "hesitant",
        "i don't know if",
        "i do not know if",
    ],
    "angry": [
        "ugly",
        "stupid",
        "idiot",
        "dumb",
        "trash",
        "awful",
        "hate",
        "ridiculous",
        "pathetic",
        "annoying",
        "useless",
        "garbage",
        "shut up",
        "nonsense",
        "what is wrong with you",
        "are you serious",
        "this is a joke",
        "terrible",
        "absurd",
        "worst",
        "unacceptable",
        "that's insulting",
        "that is insulting",
    ],
    "sad": [
        "sad",
        "upset",
        "disappointed",
        "hurt",
        "sorry",
        "regret",
        "regretful",
        "unfortunate",
        "that sucks",
        "this sucks",
        "frustrated",
        "defeated",
        "let down",
        "heartbroken",
        "discouraged",
        "i feel bad",
        "i'm tired of this",
        "i am tired of this",
        "it hurts",
    ],
    "surprised": [
        "wait what",
        "seriously",
        "really",
        "no way",
        "i can't believe",
        "i cant believe",
        "unexpected",
        "that's crazy",
        "thats crazy",
        "wow",
        "whoa",
        "what happened",
        "how is that possible",
        "you're kidding",
        "youre kidding",
        "that much",
        "so high",
        "so low",
        "out of nowhere",
        "did not expect",
    ],
}

# stronger weight for user than bot
USER_WEIGHT = 3
BOT_WEIGHT = 1
MODEL_WEIGHT = 2


def score_keywords(text: str, weight: int):
    scores = {emotion: 0 for emotion in ALLOWED}
    for emotion, keywords in EMOTION_KEYWORDS.items():
        for kw in keywords:
            if kw in text:
                scores[emotion] += weight
    return scores


@router.post("/detect", response_model=EmotionResponse)
async def emotion_detect(payload: EmotionRequest):
    history_text = "\n".join(
        f"{msg.speaker}: {msg.content}" for msg in payload.history[-12:]
    )

    user_text = (payload.user_text or "").lower()
    bot_text = (payload.bot_text or "").lower()
    user_text_raw = payload.user_text or ""
    bot_text_raw = payload.bot_text or ""

    # keyword bias scores
    scores = {emotion: 0 for emotion in ALLOWED}

    user_scores = score_keywords(user_text, USER_WEIGHT)
    bot_scores = score_keywords(bot_text, BOT_WEIGHT)

    for emotion in ALLOWED:
        scores[emotion] += user_scores[emotion]
        scores[emotion] += bot_scores[emotion]

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
- The bot may still show firm, concerned, surprised, angry, or sad even if its wording is polite.
- Return only the label, with no punctuation or explanation.

Guidelines:
- Use angry when the user is insulting, hostile, mocking, aggressive, or disrespectful.
- Use firm when the user is pushy, dismissive, demanding, or making rigid ultimatums.
- Use concerned when the user expresses worry, risk, uncertainty, fear, or bad news.
- Use sad when the exchange is emotionally hurtful, regretful, frustrated, or dejected.
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

        model_emotion = (resp.output_text or "").strip().lower().strip(" .,!?:;\"'")

        if model_emotion in ALLOWED:
            scores[model_emotion] += MODEL_WEIGHT

        # light neutral fallback only if nothing else hit
        if all(v == 0 for v in scores.values()):
            final_emotion = "neutral"
        else:
            # prefer non-neutral if tied
            sorted_emotions = sorted(
                scores.items(),
                key=lambda item: (item[1], item[0] != "neutral"),
                reverse=True,
            )
            final_emotion = sorted_emotions[0][0]

        return EmotionResponse(emotion=final_emotion)

    except Exception as e:
        print("EMOTION ROUTE ERROR:", repr(e))

        if all(v == 0 for v in scores.values()):
            return EmotionResponse(emotion="neutral")

        sorted_emotions = sorted(
            scores.items(),
            key=lambda item: (item[1], item[0] != "neutral"),
            reverse=True,
        )
        return EmotionResponse(emotion=sorted_emotions[0][0])