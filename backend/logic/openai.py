import re
import json
from typing import Iterator
from pydantic import BaseModel
from services.openai import get_openai_chat_response

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

    pending_b = False
    resume_round = None
    m = list(re.finditer(r"(?m)^=== Round (\d+) ===\s*$", transcript))
    if m:
        last = m[-1]
        rnum = int(last.group(1))
        body = transcript[last.end():]
        has_a = re.search(rf"(?m)^{re.escape(agent1.name)}:\s*\n", body) is not None
        has_b = re.search(rf"(?m)^{re.escape(agent2.name)}:\s*\n", body) is not None
        if has_a and not has_b:
            pending_b = True
            resume_round = rnum
            next_round = rnum

    to_generate = max(0, target_total - existing_rounds)

    yield (json.dumps({
        "type": "start",
        "rounds": target_total,
        "existing_rounds": existing_rounds,
        "to_generate": to_generate,
        "next_round": next_round,
        "pending_b": pending_b,
        "resume_round": resume_round,
    }) + "\n").encode("utf-8")

    for r in range(next_round, target_total + 1):
        if pending_b and r == resume_round:
            yield (json.dumps({"type": "round", "round": r, "resume": True}) + "\n").encode("utf-8")
            b = _agent_turn(model, agent2, topic, transcript, rules)
            transcript += ("" if transcript.endswith("\n") else "\n") + f"{agent2.name}:\n{b}\n\n"
            yield (json.dumps({
                "type": "turn",
                "round": r,
                "speaker": agent2.name,
                "content": b,
            }) + "\n").encode("utf-8")
            pending_b = False
            continue

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
    system_prompt = (
        f"You are {agent.name}.\n"
        f"Personality: {agent.personality}\n"
        f"Goal: {agent.goal}\n"
        f"Negotiation topic: \"{topic}\"\n\n"
        f"{rules}"
    )

    user_message = (
        "Here is the conversation transcript so far:\n\n"
        f"{transcript_so_far or '[start of negotiation]'}\n\n"
        f"Based on this conversation history, provide your next response as {agent.name}. "
        f"Remember all previous offers and details from the conversation above."
    )
        # DEBUG
    print("=" * 80)
    print("USER MESSAGE BEING SENT TO OPENAI:")
    print(user_message)
    print("=" * 80)
    return get_openai_chat_response(model, system_prompt, user_message)
