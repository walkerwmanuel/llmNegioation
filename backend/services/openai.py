import os
from dotenv import load_dotenv
from openai import OpenAI
from services.gemini import get_gemini_response


load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

openai_key = os.getenv("OPENAI_API_KEY")
deepseek_key = os.getenv("DEEPSEEK_API_KEY")
xai_key = os.getenv("XAI_API_KEY")

if openai_key is None:
    raise ValueError("OPENAI_API_KEY not in .env file")

if deepseek_key is None:
    raise ValueError("DEEPSEEK_API_KEY not found in .env file")

# Default OpenAI client
openai_client = OpenAI(api_key=openai_key)

# DeepSeek client 
deepseek_client = OpenAI(api_key=deepseek_key, base_url="https://api.deepseek.com")

# Grok client
grok_client = OpenAI(api_key=xai_key, base_url="https://api.x.ai/v1")

def get_openai_response(model: str, prompt: str) -> str:
    # DeepSeek
    if model == "deepseek-chat":
        response = deepseek_client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
        )
        return (response.choices[0].message.content or "").strip()

    # Grok/xAI
    if model.startswith("grok-"):
        if grok_client is None:
            raise ValueError("XAI_API_KEY not found in .env file (required for Grok models)")
        response = grok_client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
        )
        return (response.choices[0].message.content or "").strip()
    
    # Gemini
    if model.startswith("gemini"):
        return get_gemini_response(model, prompt)

    # OpenAI (Responses API)
    response = openai_client.responses.create(
        model=model,
        input=prompt
    )
    return response.output_text

