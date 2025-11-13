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

class TextPrompt(BaseModel):
    text: str

current_settings = None

@router.post("/speech-to-text/update-settings")
async def update_settings(settings: SpeechSettings):
    global current_settings
    current_settings = settings
    return {"status": "success"}


# 1) Transcription only
@router.post("/speech-to-text/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    try:
        file_extension = os.path.splitext(file.filename)[1] or ".webm"
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        # Whisper transcription
        with open(tmp_path, "rb") as f:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=f
            )

        user_text = transcript.text

        # Clean up temp file
        try:
            os.unlink(tmp_path)
        except:
            pass

        # 👉 ONLY return transcript here
        return {"transcript": user_text}

    except Exception as e:
        print(f"Error in transcribe_audio: {str(e)}")
        return {"error": str(e)}


# 2) Take edited text and get bot reply
@router.post("/speech-to-text/respond")
async def respond_to_text(body: TextPrompt):
    try:
        user_text = body.text

        system_prompt = f"""You are {current_settings.bot.name}.

{current_settings.bot.personality}

Your goal: {current_settings.bot.goal}

Topic of conversation: {current_settings.topic}

{current_settings.rules}

Respond to the user's message following these guidelines."""

        completion = client.chat.completions.create(
            model=current_settings.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_text},
            ],
        )

        bot_text = completion.choices[0].message.content

        return {"you": user_text, "bot": bot_text}

    except Exception as e:
        print(f"Error in respond_to_text: {str(e)}")
        return {"error": str(e)}
