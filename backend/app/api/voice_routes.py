"""Voice API routes — audio upload, transcription, and LLM chat."""
from __future__ import annotations
import json
import traceback
from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse
from app.voice.conversation import transcribe_audio, chat_with_astra

voice_router = APIRouter()


@voice_router.post("/api/voice/chat")
async def voice_chat(
    audio: UploadFile = File(...),
    history: str = Form(default="[]"),
):
    """Accept audio + conversation history, return transcription + LLM response."""
    try:
        # Read audio bytes
        audio_bytes = await audio.read()
        filename = audio.filename or "audio.webm"
        print(f"[Voice] Received audio: {filename}, size={len(audio_bytes)} bytes")

        # Parse conversation history
        try:
            chat_history = json.loads(history)
        except (json.JSONDecodeError, TypeError):
            chat_history = []

        # Step 1: Transcribe
        print("[Voice] Transcribing audio...")
        transcript = transcribe_audio(audio_bytes, filename)
        print(f"[Voice] Transcript: {transcript[:100] if transcript else '(empty)'}")

        if not transcript.strip():
            return {
                "transcript": "",
                "response": "I didn't catch that. Could you try speaking again?",
                "intent": "chat",
            }

        # Step 2: Chat with Astra
        print("[Voice] Generating response...")
        result = chat_with_astra(transcript, chat_history)
        print(f"[Voice] Response generated: {result['response'][:100]}")

        return result

    except Exception as e:
        print(f"[Voice] ERROR: {e}")
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"detail": f"Voice processing error: {str(e)}"},
        )
