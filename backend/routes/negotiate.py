# routes.py
from fastapi import APIRouter
from pydantic import BaseModel
from logic.openai import runSimpleNegotiate
from starlette.responses import StreamingResponse

router = APIRouter()

class Agent(BaseModel):
    name: str
    personality: str
    goal: str
    model: str

class NegotiateRequest(BaseModel):
    agent1: Agent
    agent2: Agent
    topic: str
    rules: str
    rounds: int = 2
    existing_transcript: str = ""

@router.post("/t2t-negotiate")
def negotiate_endpoint(req: NegotiateRequest):
    gen = runSimpleNegotiate(
        agent1=req.agent1,
        agent2=req.agent2,
        topic=req.topic,
        rules=req.rules,
        rounds=req.rounds,
        existing_transcript=req.existing_transcript,
    )
    return StreamingResponse(
        gen,
        media_type="application/x-ndjson",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
