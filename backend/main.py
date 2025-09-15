from typing import Tuple
from services.openai import get_openai_response
from logic.openai import runSimpleDebate


# if __name__ == "__main__":
#     model = "gpt-4o-mini"
#     prompt = "Write a one-sentence bedtime story about a puppy."

#     output = get_openai_response(model, prompt)
#     print(output)

if __name__ == "__main__":
    MODEL = "gpt-4o-mini"

    agent1: Tuple[str, str, str] = (
        "Neil Sood",
        (
            "You are Neil Sood, a 21-year-old Caucasian male undergraduate at North Carolina State University. "
            "You are curious, reflective, and enjoy connecting technical coursework to bigger-picture societal impacts. "
            "You are involved in campus organizations and value teamwork, problem framing, and learning experiences that mirror real-world challenges."
        ),
        (
            "Argue that senior design is useful because it teaches collaboration, project planning, and integrating multiple disciplines, "
            "preparing students for the complexities of professional engineering work."
        ),
    )

    agent2: Tuple[str, str, str] = (
        "Kaden Nelson",
        (
            "You are Kaden Nelson, a 21-year-old Asian male undergraduate at North Carolina State University. "
            "You are pragmatic, efficiency-oriented, and focused on building a resume that will impress recruiters. "
            "You believe practical experience through internships and co-ops provides more valuable preparation than classroom projects."
        ),
        (
            "Argue that senior design is overrated compared to internships and co-ops, "
            "because it often lacks industry tools, realistic scope, and the pressure of true stakeholder expectations."
        ),
    )

    topic = "Is senior design for electrical and computer engineers actually useful?"

    rules = (
        "DEBATE RULES:\n"
        "1) Respond in EXACTLY two sentences per turn.\n"
        "2) Address the topic directly; cite concrete practices, examples, or trade-offs.\n"
        "3) No markdown, no emojis, no bullet points.\n"
        "4) Stay civil, concise, and on-topic; avoid generic platitudes.\n"
        "5) If referencing evidence, summarize briefly rather than citing sources."
    )

    transcript = runSimpleDebate(
        model=MODEL,
        agent1=agent1,
        agent2=agent2,
        topic=topic,
        rules=rules,
        rounds=4,
    )

    print(transcript)