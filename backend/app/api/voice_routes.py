"""Voice API routes — audio upload, transcription, and LLM chat."""
from __future__ import annotations
import json
from fastapi import APIRouter, UploadFile, File, Form
from app.voice.conversation import transcribe_audio, chat_with_astra

voice_router = APIRouter()


@voice_router.post("/api/voice/chat")
async def voice_chat(
    audio: UploadFile = File(...),
    history: str = Form(default="[]"),
):
    """Accept audio + conversation history, return transcription + LLM response.

    - audio: Audio file (webm, mp3, wav, m4a, ogg)
    - history: JSON-encoded list of {"role": "user"|"assistant", "content": "..."}

    Returns:
        {
            "transcript": "what the user said",
            "response": "Astra's reply",
            "intent": "chat" | "backtest" | "generate"
        }
    """
    # Read audio bytes
    audio_bytes = await audio.read()
    filename = audio.filename or "audio.webm"

    # Parse conversation history
    try:
        chat_history = json.loads(history)
    except (json.JSONDecodeError, TypeError):
        chat_history = []

    # Step 1: Transcribe
    transcript = transcribe_audio(audio_bytes, filename)

    if not transcript.strip():
        return {
            "transcript": "",
            "response": "I didn't catch that. Could you try speaking again?",
            "intent": "chat",
        }

    # Step 2: Chat with Astra
    result = chat_with_astra(transcript, chat_history)

    return result
