import os
from dotenv import load_dotenv
from google import genai

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

def get_gemini_response(model: str, prompt: str) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found in .env file")

    client = genai.Client(api_key=api_key)

    # Adapter 
    resp = client.models.generate_content(
        model=model,
        contents=prompt,
    )

    return (resp.text or "").strip()
