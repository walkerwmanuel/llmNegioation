const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export const API = {
  speechToText: {
    transcribe: `${API_BASE}/speech-to-text/transcribe`,
    respond: `${API_BASE}/speech-to-text/respond`,
    updateSettings: `${API_BASE}/speech-to-text/update-settings`,
  },
  textToText: {
    negotiate: `${API_BASE}/t2t-negotiate`,
  },
  voiceToVoice: {
    textTurn: `${API_BASE}/voice-to-voice/text-turn`,
  },
};