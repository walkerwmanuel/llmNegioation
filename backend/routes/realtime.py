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
from shared import settings as shared_settings
from shared.settings import BotConfig, SpeechSettings, current_settings



# ====== FETCH KEY ======
router = APIRouter()

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))


client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# class BotConfig(BaseModel):
#     name: str
#     personality: str
#     goal: str

# class SpeechSettings(BaseModel):
#     model: str
#     topic: str
#     rules: str
#     bot: BotConfig

class TextPrompt(BaseModel):
    text: str
    history: list[dict] = []

class VoiceToVoiceRequest(BaseModel):
    history: list[dict] = []

# Store current settings globally
# current_settings: Optional[SpeechSettings] = None


@router.post("/speech-to-text/update-settings")
async def update_settings(settings: SpeechSettings):
    shared_settings.current_settings = settings
    print(f"Settings updated: bot={settings.bot.name}, model={settings.model}")
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
        if shared_settings.current_settings is None:
            return {"error": "Settings not configured. Call /update-settings first. This is respond endpoint"}

        user_text = body.text.strip()
        if not user_text:
            return {"error": "Empty text provided"}

        # Create system prompt
        system_prompt = (
            f"You are {shared_settings.current_settings.bot.name}.\n"
            f"Personality: {shared_settings.current_settings.bot.personality}\n"
            f"Goal: {shared_settings.current_settings.bot.goal}\n"
            f"Negotiation topic: \"{shared_settings.current_settings.topic}\"\n\n"
            f"{shared_settings.current_settings.rules}\n\n"
            f"CONTEXT AWARENESS:\n"
            f"- Read the full conversation history below\n"
            f"- Reference what YOU ({shared_settings.current_settings.bot.name}) said in previous messages\n"            
        )

        # Build messages array from history
        messages = [
            {
                "role": "developer", 
                "content": [{"type": "text", "text": system_prompt}]
            }
        ]

        # Add conversation history
        for msg in body.history:
            if msg['speaker'] == 'You':
                messages.append({
                    "role": "user", 
                    "content": [{"type": "text", "text": msg['content']}]
                })
            else:  # Bot message
                messages.append({
                    "role": "assistant",
                    "content": [{"type": "text", "text": msg['content']}]
                })
        
        # Add current user message
        messages.append({
            "role": "user",
            "content": [{"type": "text", "text": user_text}]
        })

        # Get bot response
        response = client.chat.completions.create(
            model=shared_settings.current_settings.model,
            messages=messages,           
            response_format={"type": "text"},
            verbosity="medium",
            reasoning_effort="medium",            
            temperature=1,
        )
        
        bot_response = response.choices[0].message.content.strip()
        captured_prompt = system_prompt

        return {
            "you": user_text, 
            "bot": bot_response,
            "actual_system_prompt": captured_prompt
        }

    except Exception as e:
        print(f"Error in respond_to_text: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}
    
@router.post("/voice-to-voice/turn")
async def voice_to_voice_turn(
    file: UploadFile = File(...),
    history: str = ""
):
    try:
        print(f"DEBUG: current_settings is None? {shared_settings.current_settings is None}")
        if shared_settings.current_settings is None:
            raise HTTPException(status_code=400, detail="Settings not configured. Call /speech-to-text/update-settings first. This is voice-to-voice turn endpoint.")

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
        history_list = json.loads(history) if history else []

        system_prompt = (
            f"You are {shared_settings.current_settings.bot.name}.\n"
            f"Personality: {shared_settings.current_settings.bot.personality}\n"
            f"Goal: {shared_settings.current_settings.bot.goal}\n"
            f"Negotiation topic: \"{shared_settings.current_settings.topic}\"\n\n"
            f"{shared_settings.current_settings.rules}\n\n"
            f"CONTEXT AWARENESS:\n"
            f"- Read the full conversation history below\n"
            f"- Reference what YOU ({shared_settings.current_settings.bot.name}) said in previous messages\n" 
        )

        messages = [
            {"role": "developer", "content": [{"type": "text", "text": system_prompt}]}
        ]

        for msg in history_list:
            if msg['speaker'] == 'You':
                messages.append({
                    "role": "user", 
                    "content": [{"type": "text", "text": msg['content']}]
                })
            else:
                messages.append({
                    "role": "assistant",
                    "content": [{"type": "text", "text": msg['content']}]
                })
        # Add current user message
        messages.append({
            "role": "user",
            "content": [{"type": "text", "text": you_text}]
        })

        response = client.chat.completions.create(
            model=shared_settings.current_settings.model,
            messages=messages,
            temperature=1,
        )

        bot_text = response.choices[0].message.content.strip()

        if not bot_text:
            raise HTTPException(status_code=500, detail="No response generated from bot.")

        # ---- 4) Synthesize bot voice (TTS) ----
        # Pick a voice name you like (e.g., "alloy", "verse", etc.)
        tts = client.audio.speech.create(
            model="gpt-4o-mini-tts",
            voice="coral",
            input=bot_text,
            response_format="mp3",
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

class TextTurnRequest(BaseModel):
    text: str
    history: list[dict] = []

@router.post("/voice-to-voice/text-turn")
async def voice_to_voice_text_turn(body: TextTurnRequest):
    try:
        if shared_settings.current_settings is None:
            raise HTTPException(status_code=400, detail="Settings not configured.")

        user_text = body.text.strip()
        if not user_text:
            raise HTTPException(status_code=400, detail="Empty text provided")

        # Build system prompt
        system_prompt = (
            f"You are {shared_settings.current_settings.bot.name}.\n"
            f"Personality: {shared_settings.current_settings.bot.personality}\n"
            f"Goal: {shared_settings.current_settings.bot.goal}\n"
            f"Negotiation topic: \"{shared_settings.current_settings.topic}\"\n\n"
            f"{shared_settings.current_settings.rules}\n\n"
            f"CONTEXT AWARENESS:\n"
            f"- Read the full conversation history below\n"
            f"- Reference what YOU ({shared_settings.current_settings.bot.name}) said in previous messages\n" 
        )

        messages = [
            {"role": "developer", "content": [{"type": "text", "text": system_prompt}]}
        ]

        # Add history
        for msg in body.history:
            if msg['speaker'] == 'You':
                messages.append({
                    "role": "user", 
                    "content": [{"type": "text", "text": msg['content']}]
                })
            else:
                messages.append({
                    "role": "assistant",
                    "content": [{"type": "text", "text": msg['content']}]
                })
        
        # Add current message
        messages.append({
            "role": "user",
            "content": [{"type": "text", "text": user_text}]
        })

        # Get bot response
        response = client.chat.completions.create(
            model=shared_settings.current_settings.model,
            messages=messages,
            temperature=1,
        )

        bot_text = response.choices[0].message.content.strip()

        if not bot_text:
            raise HTTPException(status_code=500, detail="No response generated from bot.")

        # Generate TTS
        tts = client.audio.speech.create(
            model="gpt-4o-mini-tts",
            voice="coral",
            input=bot_text,
            response_format="mp3",
        )
        audio_bytes = tts.read()
        bot_audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")

        return {
            "you_text": user_text,
            "bot_text": bot_text,
            "bot_audio_base64": bot_audio_base64,
            "bot_audio_mime": "audio/mpeg",
            "actual_system_prompt": system_prompt
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in voice_to_voice_text_turn: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))