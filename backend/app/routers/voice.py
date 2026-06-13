from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
import os
import uuid
import logging
import re
from app.services.voice import transcribe_voice_groq, get_gemini_response, synthesize_voice_edge

logger = logging.getLogger("kisanmitra-router-voice")

router = APIRouter(
    prefix="/api/voice",
    tags=["voice"]
)

# Ensure audio directories exist
AUDIO_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "static", "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

VOICE_MAP = {
    "hi": "hi-IN-SwaraNeural",
    "hl": "hi-IN-SwaraNeural",
    "en": "en-IN-NeerjaNeural",
    "mr": "mr-IN-AarohiNeural",
    "gu": "gu-IN-DhwaniNeural",
    "pa": "pa-IN-OjasNeural"
}

def resolve_query_language(text: str, requested_lang: str) -> str:
    """
    Checks characters in text to automatically detect Indic scripts (Devanagari, Gujarati, Gurmukhi).
    If a script is detected, returns the corresponding language code.
    If no Indic script is found (i.e. Latin script/English), falls back to the requested UI language.
    """
    has_devnagari = bool(re.search(r'[\u0900-\u097F]', text))
    has_gujarati = bool(re.search(r'[\u0A80-\u0AFF]', text))
    has_gurmukhi = bool(re.search(r'[\u0A00-\u0A7F]', text))
    
    if has_devnagari:
        # Default to Marathi if that was requested, otherwise default to Hindi
        return "mr" if requested_lang == "mr" else "hi"
    elif has_gujarati:
        return "gu"
    elif has_gurmukhi:
        return "pa"
        
    return requested_lang

class ChatTurn(BaseModel):
    role: str  # "user" or "model"
    content: str

class RespondRequest(BaseModel):
    prompt: str
    history: Optional[List[ChatTurn]] = None
    lang: Optional[str] = "hi"

class SynthesizeRequest(BaseModel):
    text: str
    voice: Optional[str] = None
    lang: Optional[str] = "hi"

@router.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    """
    STT endpoint. Upload an audio recording and get the transcribed text.
    """
    try:
        content = await file.read()
        text = await transcribe_voice_groq(content, file.filename)
        return {"text": text}
    except Exception as e:
        logger.error(f"Failed to transcribe: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

@router.post("/respond")
async def respond(req: RespondRequest):
    """
    LLM endpoint. Feed query and get localized response.
    """
    try:
        # Convert ChatTurn list to Gemini structure
        gemini_history = []
        if req.history:
            for turn in req.history:
                # Map "model" to "model" and others to "user"
                role = "model" if turn.role == "model" else "user"
                gemini_history.append({
                    "role": role,
                    "parts": [turn.content]
                })

        resolved_lang = resolve_query_language(req.prompt, req.lang or "hi")
        response_text = await get_gemini_response(req.prompt, gemini_history, lang=resolved_lang)
        return {"response": response_text}
    except Exception as e:
        logger.error(f"Failed to generate response: {e}")
        raise HTTPException(status_code=500, detail=f"Response generation failed: {str(e)}")

@router.post("/synthesize")
async def synthesize(req: SynthesizeRequest):
    """
    TTS endpoint. Transmit text and download static synthesized audio file.
    """
    try:
        filename = f"speech_{uuid.uuid4().hex[:8]}.mp3"
        filepath = os.path.join(AUDIO_DIR, filename)
        
        resolved_lang = resolve_query_language(req.text, req.lang or "hi")
        voice = req.voice or VOICE_MAP.get(resolved_lang, "hi-IN-SwaraNeural")
        success = await synthesize_voice_edge(req.text, filepath, voice, resolved_lang)
        if not success:
            raise HTTPException(status_code=500, detail="Voice synthesis failed")
            
        return FileResponse(filepath, media_type="audio/mpeg", filename=filename)
    except Exception as e:
        logger.error(f"Failed to synthesize: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process")
async def process_voice_pipeline(
    lang: str = "hi",
    file: UploadFile = File(...)
):
    """
    Full voice-in to voice-out pipeline.
    1. Transcribe incoming voice file
    2. Ask Gemini for farm advisory response
    3. Synthesize response to MP3
    4. Return transcript, AI text response, and audio playback URL
    """
    try:
        # 1. Transcribe audio
        audio_content = await file.read()
        query_text = await transcribe_voice_groq(audio_content, file.filename)
        
        if not query_text.strip():
            raise HTTPException(status_code=400, detail="Could not understand query. Please speak again.")
            
        # Dynamically resolve language from transcription script
        resolved_lang = resolve_query_language(query_text, lang)
        logger.info(f"Resolved script language for pipeline: {resolved_lang} (UI requested: {lang}) for query: '{query_text[:40]}...'")
            
        # 2. Get LLM response
        ai_response_text = await get_gemini_response(query_text, lang=resolved_lang)
        
        # 3. Synthesize output audio
        filename = f"reply_{uuid.uuid4().hex[:8]}.mp3"
        filepath = os.path.join(AUDIO_DIR, filename)
        
        # Resolve TTS Voice
        voice = VOICE_MAP.get(resolved_lang, "hi-IN-SwaraNeural")
        await synthesize_voice_edge(ai_response_text, filepath, voice, resolved_lang)
        
        # Static URL to access audio from frontend
        audio_url = f"/static/audio/{filename}"
        
        return {
            "query": query_text,
            "response": ai_response_text,
            "audio_url": audio_url
        }
    except Exception as e:
        logger.error(f"Error processing full pipeline: {e}")
        raise HTTPException(status_code=500, detail=f"Pipeline processing failed: {str(e)}")
