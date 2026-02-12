# ====== PACKAGES ======
from fastapi import APIRouter, File, UploadFile
import os
from pydantic import BaseModel
from logic.openai import runSimpleNegotiate
from dotenv import load_dotenv
import tempfile
from openai import OpenAI
import json

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
    history: list[dict] = []

# Store current settings globally
current_settings: SpeechSettings | None = None


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
        
        # Create system prompt
        system_prompt = (
            f"You are {current_settings.bot.name}.\n"
            f"Personality: {current_settings.bot.personality}\n"
            f"Goal: {current_settings.bot.goal}\n"
            f"Negotiation topic: \"{current_settings.topic}\"\n\n"
            f"{current_settings.rules}\n\n"
            f"CRITICAL: This is an ongoing negotiation. You must remember ALL previous "
            f"offers and counteroffers. When the user increases their offer, you MUST "
            f"acknowledge it and adjust your counteroffer accordingly. Progress the "
            f"negotiation - do not repeat the same price if they've moved closer to you."

            f"CONTEXT AWARENESS:\n"
            f"- Read the full conversation history below\n"
            f"- Reference what YOU (Emily) said in previous messages\n"
        )

        # Build messages array from history
        messages = [
            {
                "role": "developer", 
                "content": [
                    {
                        "type": "text",
                        "text": system_prompt
                    }
                ]
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
            model=current_settings.model,
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
            "actual_system_prompt": captured_prompt,
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}        

