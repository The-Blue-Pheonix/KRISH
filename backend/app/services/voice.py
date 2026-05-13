import os
from pathlib import Path
import requests
from elevenlabs.client import ElevenLabs

# Default voice ID (can be changed)
DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"  # Rachel - clear, friendly voice

# Lazy initialize - only when needed
_client = None

def _get_client():
    """Lazy initialize ElevenLabs client"""
    global _client
    if _client is None:
        api_key = os.getenv("ELEVENLABS_API_KEY")
        if not api_key:
            raise ValueError("ELEVENLABS_API_KEY not found in environment variables. Please add it to .env file.")
        _client = ElevenLabs(api_key=api_key)
        print(f"[Voice] ElevenLabs client initialized with API key")
    return _client

def text_to_speech(text: str, voice_id: str = DEFAULT_VOICE_ID) -> bytes:
    """
    Convert text to speech using ElevenLabs API
    
    Args:
        text: The text to convert to speech
        voice_id: The voice ID to use (default: Rachel)
    
    Returns:
        Audio data as bytes (MP3 format)
    """
    try:
        if not text or len(text.strip()) == 0:
            raise ValueError("Text cannot be empty")
        
        # Use ElevenLabs Python client
        client = _get_client()
        audio = client.generate(
            text=text,
            voice=voice_id,
            model="eleven_monolingual_v1"
        )
        
        # Collect audio bytes
        audio_bytes = b"".join(audio)
        print(f"[Voice] Generated {len(audio_bytes)} bytes of audio for text: {text[:50]}...")
        return audio_bytes
    
    except Exception as e:
        print(f"[Voice] TTS Error: {str(e)}")
        raise Exception(f"ElevenLabs TTS Error: {str(e)}")


def get_available_voices():
    """
    Get list of available voices from ElevenLabs
    
    Returns:
        List of voice objects with id and name
    """
    try:
        client = _get_client()
        voices = client.voices.get_all()
        voice_list = [
            {
                "id": voice.voice_id,
                "name": voice.name,
                "category": voice.category if hasattr(voice, 'category') else "standard"
            }
            for voice in voices.voices
        ]
        print(f"[Voice] Retrieved {len(voice_list)} available voices from ElevenLabs")
        return voice_list
    except Exception as e:
        print(f"[Voice] Error fetching voices: {str(e)}")
        raise Exception(f"Error fetching voices: {str(e)}")
