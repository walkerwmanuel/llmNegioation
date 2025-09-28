import re
import json
from typing import Iterator
from pydantic import BaseModel
from services.openai import get_openai_response

class Agent(BaseModel):
    name: str
    personality: str
    goal: str

def runSimpleNegotiate(
    model: str,
    agent1: Agent,
    agent2: Agent,
    topic: str,
    rules: str,
    rounds: int = 2,
    existing_transcript: str = "",
) -> Iterator[bytes]:
    transcript = (existing_transcript or "").strip()

    existing_rounds = len(re.findall(r"(?m)^=== Round \d+ ===\s*$", transcript))
    next_round = existing_rounds + 1
    target_total = max(1, rounds)

    to_generate = max(0, target_total - existing_rounds)

    yield (json.dumps({
        "type": "start",
        "rounds": target_total,
        "existing_rounds": existing_rounds,
        "to_generate": to_generate,
        "next_round": next_round,
    }) + "\n").encode("utf-8")

    for r in range(next_round, target_total + 1):
        if transcript:
            transcript += "\n"
        transcript += f"=== Round {r} ===\n\n"
        yield (json.dumps({"type": "round", "round": r}) + "\n").encode("utf-8")

        a = _agent_turn(model, agent1, topic, transcript, rules)
        transcript += f"{agent1.name}:\n{a}\n\n"
        yield (json.dumps({
            "type": "turn",
            "round": r,
            "speaker": agent1.name,
            "content": a,
        }) + "\n").encode("utf-8")

        b = _agent_turn(model, agent2, topic, transcript, rules)
        transcript += f"{agent2.name}:\n{b}\n\n"
        yield (json.dumps({
            "type": "turn",
            "round": r,
            "speaker": agent2.name,
            "content": b,
        }) + "\n").encode("utf-8")

    yield (json.dumps({"type": "done", "transcript": transcript.strip()}) + "\n").encode("utf-8")


def _agent_turn(
    model: str,
    agent: Agent,
    topic: str,
    transcript_so_far: str,
    rules: str,
) -> str:
    prompt = (
        f"You are {agent.name}.\n"
        f"Personality: {agent.personality}\n"
        f"Goal: {agent.goal}\n"
        f"Negotiation topic: \"{topic}\"\n\n"
        f"{rules}\n\n"
        "Transcript so far:\n"
        f"{transcript_so_far or '[start of negotiation]'}\n\n"
        f"{agent.name}:"
    )
    return get_openai_response(model, prompt)
