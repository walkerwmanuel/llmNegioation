# ====== PACKAGES ======
from typing import Optional
from fastapi import APIRouter, File, UploadFile
import os
from pydantic import BaseModel
from logic.openai import runSimpleNegotiate
from dotenv import load_dotenv
import tempfile
from openai import OpenAI
import json
import base64
from fastapi import HTTPException


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

# Store current settings globally
current_settings: Optional[SpeechSettings] = None


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

        return {"transcript": user_text}

    except Exception as e:
        print(f"Error in transcribe_audio: {str(e)}")
        return {"error": str(e)}


# 2) Take edited text and get bot reply using runSimpleNegotiate
@router.post("/speech-to-text/respond")
async def respond_to_text(body: TextPrompt):
    try:
        if current_settings is None:
            return {"error": "Settings not configured. Call /update-settings first."}

        user_text = body.text.strip()
        if not user_text:
            return {"error": "Empty text provided"}

        # Import the Agent class from wherever it's defined
        from logic.openai import Agent
        
        # Create Agent objects (not dictionaries)
        agent1 = Agent(
            name=current_settings.bot.name,
            personality=current_settings.bot.personality,
            goal=current_settings.bot.goal
        )
        
        agent2 = Agent(
            name="You",
            personality="You are the human user in this conversation.",
            goal="Engage in the negotiation."
        )

        # Build existing transcript with user's latest message
        existing_transcript = f"You:\n{user_text}\n\n"

        # Collect the bot's response from runSimpleNegotiate
        bot_response = ""
        
        for chunk_bytes in runSimpleNegotiate(
            model=current_settings.model,
            agent1=agent1,
            agent2=agent2,
            topic=current_settings.topic,
            rules=current_settings.rules,
            rounds=1,
            existing_transcript=existing_transcript,
        ):
            # Decode bytes to string
            chunk_str = chunk_bytes.decode("utf-8").strip()
            if not chunk_str:
                continue
                
            try:
                data = json.loads(chunk_str)
                
                # Extract only the bot's response (agent1 in this case)
                if data.get("type") == "turn" and data.get("speaker") == current_settings.bot.name:
                    bot_response = data.get("content", "")
                    
            except json.JSONDecodeError:
                continue

        if not bot_response:
            return {"error": "No response generated from bot"}

        return {"you": user_text, "bot": bot_response.strip()}

    except Exception as e:
        print(f"Error in respond_to_text: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}
    
@router.post("/voice-to-voice/turn")
async def voice_to_voice_turn(file: UploadFile = File(...)):
    try:
        if current_settings is None:
            raise HTTPException(status_code=400, detail="Settings not configured. Call /speech-to-text/update-settings first.")

        # ---- 1) Save upload with correct extension ----
        file_extension = os.path.splitext(file.filename)[1] or ".webm"
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        # ---- 2) Transcribe user audio ----
        with open(tmp_path, "rb") as f:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=f,
            )
        you_text = (transcript.text or "").strip()

        try:
            os.unlink(tmp_path)
        except:
            pass

        if not you_text:
            raise HTTPException(status_code=400, detail="Empty transcript from audio.")

        # ---- 3) Get bot response using your existing respond logic ----
        from logic.openai import Agent

        agent1 = Agent(
            name=current_settings.bot.name,
            personality=current_settings.bot.personality,
            goal=current_settings.bot.goal,
        )
        agent2 = Agent(
            name="You",
            personality="You are the human user in this conversation.",
            goal="Engage in the negotiation.",
        )

        existing_transcript = f"You:\n{you_text}\n\n"

        bot_text = ""
        for chunk_bytes in runSimpleNegotiate(
            model=current_settings.model,
            agent1=agent1,
            agent2=agent2,
            topic=current_settings.topic,
            rules=current_settings.rules,
            rounds=1,
            existing_transcript=existing_transcript,
        ):
            chunk_str = chunk_bytes.decode("utf-8").strip()
            if not chunk_str:
                continue
            try:
                data = json.loads(chunk_str)
                if data.get("type") == "turn" and data.get("speaker") == current_settings.bot.name:
                    bot_text = (data.get("content") or "").strip()
            except json.JSONDecodeError:
                continue

        if not bot_text:
            raise HTTPException(status_code=500, detail="No response generated from bot.")

        # ---- 4) Synthesize bot voice (TTS) ----
        # Pick a voice name you like (e.g., "alloy", "verse", etc.)
        tts = client.audio.speech.create(
            model="gpt-4o-mini-tts",
            voice="alloy",
            input=bot_text,
            format="mp3",
        )
        audio_bytes = tts.read()  # returns bytes

        bot_audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")

        return {
            "you_text": you_text,
            "bot_text": bot_text,
            "bot_audio_base64": bot_audio_base64,
            "bot_audio_mime": "audio/mpeg",
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in voice_to_voice_turn: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
