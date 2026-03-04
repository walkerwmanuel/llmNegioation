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

# ====== FETCH KEY ======
router = APIRouter()

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

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

        # Create system prompt
        system_prompt = (
            f"You are {current_settings.bot.name}.\n"
            f"Personality: {current_settings.bot.personality}\n"
            f"Goal: {current_settings.bot.goal}\n"
            f"Negotiation topic: \"{current_settings.topic}\"\n\n"
            f"{current_settings.rules}\n\n"
            f"CONTEXT AWARENESS:\n"
            f"- Read the full conversation history below\n"
            f"- Reference what YOU ({current_settings.bot.name}) said in previous messages\n"            
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
            "actual_system_prompt": captured_prompt
        }

        # # Import the Agent class from wherever it's defined
        # from logic.openai import Agent
        
        # # Create Agent objects (not dictionaries)
        # agent1 = Agent(
        #     name=current_settings.bot.name,
        #     personality=current_settings.bot.personality,
        #     goal=current_settings.bot.goal
        # )
        
        # agent2 = Agent(
        #     name="You",
        #     personality="You are the human user in this conversation.",
        #     goal="Engage in the negotiation."
        # )

        # # Build existing transcript with user's latest message
        # existing_transcript = f"You:\n{user_text}\n\n"

        # # Collect the bot's response from runSimpleNegotiate
        # bot_response = ""
        
        # for chunk_bytes in runSimpleNegotiate(
        #     model=current_settings.model,
        #     agent1=agent1,
        #     agent2=agent2,
        #     topic=current_settings.topic,
        #     rules=current_settings.rules,
        #     rounds=1,
        #     existing_transcript=existing_transcript,
        # ):
        #     # Decode bytes to string
        #     chunk_str = chunk_bytes.decode("utf-8").strip()
        #     if not chunk_str:
        #         continue
                
        #     try:
        #         data = json.loads(chunk_str)
                
        #         # Extract only the bot's response (agent1 in this case)
        #         if data.get("type") == "turn" and data.get("speaker") == current_settings.bot.name:
        #             bot_response = data.get("content", "")
                    
        #     except json.JSONDecodeError:
        #         continue

        # if not bot_response:
        #     return {"error": "No response generated from bot"}

        # return {"you": user_text, "bot": bot_response.strip()}

    except Exception as e:
        print(f"Error in respond_to_text: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}