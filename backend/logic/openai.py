import re
from typing import Tuple
from services.openai import get_openai_response

def runSimpleDebate(
    model: str,
    agent1: Tuple[str, str, str],  # (name, personality, goal)
    agent2: Tuple[str, str, str],  # (name, personality, goal)
    topic: str,
    rules: str,
    rounds: int = 2,
) -> str:
    (name1, pers1, goal1) = agent1
    (name2, pers2, goal2) = agent2

    transcript = ""
    for r in range(1, rounds + 1):
        transcript += f"\n=== Round {r} ===\n\n"

        a = _agent_turn(model, name1, pers1, goal1, topic, transcript, rules)
        transcript += f"{name1}:\n{a}\n\n"

        b = _agent_turn(model, name2, pers2, goal2, topic, transcript, rules)
        transcript += f"{name2}:\n{b}\n\n"

    return transcript.strip()

def _agent_turn(
    model: str,
    agent_name: str,
    personality: str,
    goal: str,
    topic: str,
    transcript_so_far: str,
    rules: str,
) -> str:
    prompt = (
        f"You are {agent_name}.\n"
        f"Personality: {personality}\n"
        f"Goal: {goal}\n"
        f"Debate topic: \"{topic}\"\n\n"
        f"{rules}\n\n"
        "Transcript so far:\n"
        f"{transcript_so_far or '[start of debate]'}\n\n"
        f"{agent_name}:"
    )
    return get_openai_response(model, prompt)
