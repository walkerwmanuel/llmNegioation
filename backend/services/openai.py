import os
from dotenv import load_dotenv
from openai import OpenAI

# Load variables from backend/.env
load_dotenv(dotenv_path=".env")

# Get API key from environment
api_key = os.getenv("OPENAI_API_KEY")
if api_key is None:
    raise ValueError("OPENAI_API_KEY not found in .env file")

client = OpenAI(api_key=api_key)

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

def get_openai_response(model: str, prompt: str) -> str:
    response = client.responses.create(
        model=model,
        input=prompt
    )
    return response.output_text