# ====== PACKAGES ======
from fastapi import APIRouter, File, UploadFile
import os
from pydantic import BaseModel
from logic.openai import runSimpleNegotiate
from dotenv import load_dotenv
import tempfile
from openai import OpenAI

# ====== FETCH KEY ======
router = APIRouter()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class BotConfig(BaseModel):
    name: str
    personality: str
    goal: str

class SpeechSettings(BaseModel):
    model: str
    topic: str
    rules: str
    bot: BotConfig

current_settings = SpeechSettings(
    model="gpt-4o-mini",
    topic="Is senior design for electrical and computer engineers actually useful?",
    rules="NEGOTIATION RULES:\n1) Respond in EXACTLY two sentences per turn.\n2) Address the topic directly; cite concrete practices, examples, or trade-offs.\n3) No markdown, no emojis, no bullet points.\n4) Stay civil, concise, and on-topic; avoid generic platitudes.\n5) If referencing evidence, summarize briefly rather than citing sources.",
    bot=BotConfig(
        name="Bot",
        personality="You are a thoughtful conversational partner.",
        goal="Engage constructively with the human's perspective."
    )
)

@router.post("/speech-to-text/update-settings")
async def update_settings(settings: SpeechSettings):
    """Update the bot configuration for speech-to-text conversations"""
    global current_settings
    current_settings = settings
    return {"status": "success", "settings": settings}

@router.post("/speech-to-text")
async def speech_to_response(file: UploadFile = File(...)):
    try:
        file_extension = os.path.splitext(file.filename)[1] or ".webm"
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        with open(tmp_path, "rb") as f:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=f
            )

        user_text = transcript.text

        system_prompt = f"""You are {current_settings.bot.name}.

{current_settings.bot.personality}

Your goal: {current_settings.bot.goal}

Topic of conversation: {current_settings.topic}

{current_settings.rules}

Respond to the user's message following these guidelines."""

        # Get bot response using configured settings
        completion = client.chat.completions.create(
            model=current_settings.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_text}
            ]
        )

        bot_text = completion.choices[0].message.content
        
        # Clean up temp file
        try:
            os.unlink(tmp_path)
        except:
            pass

        return {"you": user_text, "bot": bot_text}
    
    except Exception as e:
        print(f"Error: {str(e)}")
