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

response = client.responses.create(
    model="gpt-5",
    input="Write a one-sentence bedtime story about a puppy."
)

print(response.output_text)
