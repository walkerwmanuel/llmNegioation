from typing import Optional
from pydantic import BaseModel

class BotConfig(BaseModel):
    name: str
    personality: str
    goal: str

class SpeechSettings(BaseModel):
    model: str
    topic: str
    rules: str
    bot: BotConfig

# Single global settings shared across all routes
current_settings: Optional[SpeechSettings] = None