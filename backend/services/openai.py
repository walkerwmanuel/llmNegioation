import os
from dotenv import load_dotenv
from openai import OpenAI
from services.gemini import get_gemini_response


load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

openai_key = os.getenv("OPENAI_API_KEY")
deepseek_key = os.getenv("DEEPSEEK_API_KEY")
xai_key = os.getenv("XAI_API_KEY")

client = OpenAI(api_key=openai_key)

if openai_key is None:
    raise ValueError("OPENAI_API_KEY not in .env file")

if deepseek_key is None:
    raise ValueError("DEEPSEEK_API_KEY not found in .env file")

openai_client = OpenAI(api_key=openai_key)
deepseek_client = OpenAI(api_key=deepseek_key, base_url="https://api.deepseek.com")
grok_client = OpenAI(api_key=xai_key, base_url="https://api.x.ai/v1")


def _extract_text(content) -> str:
    """Normalize content — handles both plain strings and list-of-blocks."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return " ".join(
            block.get("text", "") if isinstance(block, dict) else str(block)
            for block in content
        )
    return str(content)


def _normalize_messages(messages: list) -> list:
    """Convert messages to plain {role, content} dicts the chat API accepts.
    Maps 'developer' role -> 'system'."""
    normalized = []
    for m in messages:
        role = m["role"]
        if role == "developer":
            role = "system"
        normalized.append({"role": role, "content": _extract_text(m["content"])})
    return normalized


def get_openai_response(model: str, prompt: str) -> str:
    """Original single-prompt function — unchanged for existing callers."""
    if model.startswith("deepseek"):
        response = deepseek_client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
        )
        return (response.choices[0].message.content or "").strip()

    if model.startswith("grok-"):
        response = grok_client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
        )
        return (response.choices[0].message.content or "").strip()

    if model.startswith("gemini"):
        return get_gemini_response(model, prompt)

    response = openai_client.responses.create(
        model=model,
        input=prompt
    )
    return response.output_text


def get_openai_response_with_history(model: str, messages: list) -> str:
    """Multi-turn version that accepts a full message history list."""
    normalized = _normalize_messages(messages)

    if model.startswith("deepseek"):
        response = deepseek_client.chat.completions.create(
            model=model,
            messages=normalized,
        )
        return (response.choices[0].message.content or "").strip()

    if model.startswith("grok-"):
        response = grok_client.chat.completions.create(
            model=model,
            messages=normalized,
        )
        return (response.choices[0].message.content or "").strip()

    if model.startswith("gemini"):
        # Gemini takes a flat string — stitch history together
        flat = "\n\n".join(
            f"{m['role'].capitalize()}: {m['content']}" for m in normalized
        )
        return get_gemini_response(model, flat)

    # OpenAI — use chat completions (not responses API) so history works
    response = openai_client.chat.completions.create(
        model=model,
        messages=normalized,
    )
    return (response.choices[0].message.content or "").strip()


def get_openai_chat_response(model: str, system_prompt: str, user_message: str) -> str:
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        temperature=0.7,
    )
    return response.choices[0].message.content.strip()

# import os
# from dotenv import load_dotenv
# from openai import OpenAI
# from services.gemini import get_gemini_response


# load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

# openai_key = os.getenv("OPENAI_API_KEY")
# deepseek_key = os.getenv("DEEPSEEK_API_KEY")
# xai_key = os.getenv("XAI_API_KEY")

# client = OpenAI(api_key=openai_key)

# if openai_key is None:
#     raise ValueError("OPENAI_API_KEY not in .env file")

# if deepseek_key is None:
#     raise ValueError("DEEPSEEK_API_KEY not found in .env file")

# # Default OpenAI client
# openai_client = OpenAI(api_key=openai_key)

# # DeepSeek client 
# deepseek_client = OpenAI(api_key=deepseek_key, base_url="https://api.deepseek.com")

# # Grok client
# grok_client = OpenAI(api_key=xai_key, base_url="https://api.x.ai/v1")

# def get_openai_response(model: str, prompt: str) -> str:
#     # DeepSeek
#     if model.startswith("deepseek"):
#         response = deepseek_client.chat.completions.create(
#             model=model,
#             messages=[{"role": "user", "content": prompt}],
#         )
#         return (response.choices[0].message.content or "").strip()

#     # Grok/xAI
#     if model.startswith("grok-"):
#         if grok_client is None:
#             raise ValueError("XAI_API_KEY not found in .env file (required for Grok models)")
#         response = grok_client.chat.completions.create(
#             model=model,
#             messages=[{"role": "user", "content": prompt}],
#         )
#         return (response.choices[0].message.content or "").strip()
    
#     # Gemini
#     if model.startswith("gemini"):
#         return get_gemini_response(model, prompt)

#     # OpenAI (Responses API)
#     response = openai_client.responses.create(
#         model=model,
#         input=prompt
#     )
#     return response.output_text

# def get_openai_chat_response(model: str, system_prompt: str, user_message: str) -> str:
#     response = client.chat.completions.create(
#         model=model,
#         messages=[
#             {"role": "system", "content": system_prompt},
#             {"role": "user", "content": user_message}
#         ],
#         temperature=0.7,
#     )
#     return response.choices[0].message.content.strip()

# def get_openai_response_with_history(model: str, messages: list) -> str:
#     # DeepSeek
#     if model.startswith("deepseek"):
#         response = deepseek_client.chat.completions.create(
#             model=model,
#             messages=messages,
#         )
#         return (response.choices[0].message.content or "").strip()

#     # Grok/xAI
#     if model.startswith("grok-"):
#         if grok_client is None:
#             raise ValueError("XAI_API_KEY not found in .env file (required for Grok models)")
#         response = grok_client.chat.completions.create(
#             model=model,
#             messages=messages,
#         )
#         return (response.choices[0].message.content or "").strip()

#     # Gemini
#     if model.startswith("gemini"):
#         # Extract system prompt and build a flat prompt string for Gemini
#         system = next((m["content"] for m in messages if m["role"] == "developer"), "")
#         history_text = "\n\n".join(
#             f"{'User' if m['role'] == 'user' else 'Assistant'}: {m['content'][0]['text'] if isinstance(m['content'], list) else m['content']}"
#             for m in messages if m["role"] != "developer"
#         )
#         return get_gemini_response(model, system + "\n\n" + history_text)

#     # OpenAI — convert "developer" role to "system" for chat completions
#     normalized = [
#         {**m, "role": "system", "content": m["content"][0]["text"] if isinstance(m["content"], list) else m["content"]}
#         if m["role"] == "developer" else
#         {**m, "content": m["content"][0]["text"] if isinstance(m["content"], list) else m["content"]}
#         for m in messages
#     ]
#     response = openai_client.chat.completions.create(
#         model=model,
#         messages=normalized,
#     )
#     return (response.choices[0].message.content or "").strip()

