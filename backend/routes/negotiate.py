from fastapi import APIRouter
from pydantic import BaseModel
from typing import Tuple
from logic.openai import runSimpleNegotiate

router = APIRouter()

class NegotiateRequest(BaseModel):
    model: str
    agent1: Tuple[str, str, str]
    agent2: Tuple[str, str, str]
    topic: str
    rules: str
    rounds: int = 2

@router.post("/t2t-negotiate")
def negotiate_endpoint(req: NegotiateRequest):
    transcript = runSimpleNegotiate(
        model=req.model,
        agent1=req.agent1,
        agent2=req.agent2,
        topic=req.topic,
        rules=req.rules,
        rounds=req.rounds,
    )
    return {"transcript": transcript}