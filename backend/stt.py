# # ====== PACKAGES ======
# import sounddevice as sd
# import os
# import numpy as np
# from dotenv import load_dotenv
# import tempfile
# from scipy.io.wavfile import write
# from openai import OpenAI
# from pathlib import Path

# # ====== FETCH KEY ======
# load_dotenv()
# api_key = os.getenv("OPENAI_API_KEY")
# client = OpenAI(api_key=api_key)

# DURATION = 5  # Seconds to record 
# RATE = 16000  # Sample rate 

# # ====== VOICE INPUT ======
# print("Speak into the microphone. You have five seconds...")
# audio = sd.rec(int(DURATION * RATE), samplerate=RATE, channels=1, dtype=np.int16)
# sd.wait()
# print("Recording complete.")

# # ====== SAVE AUDIO TO TMP FILE ======
# tmp = Path(tempfile.gettempdir()) / "speech.wav"
# write(tmp, RATE, audio)

# # ====== TRANSCRIBE ======
# with open(tmp, "rb") as f:
#     transcript = client.audio.transcriptions.create(
#         model="whisper-1",
#         file=f
#     )
# text = transcript.text
# print("You said:", text)

# # ====== RESPONSE ======
# print("Agent B thinking...")
# response = client.chat.completions.create(
#     model="gpt-4o-mini",
#     messages=[{"role": "user", "content": text}]
# )

# print("Bot:", response.choices[0].message.content)