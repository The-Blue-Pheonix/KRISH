"""
🔊 TEXT-TO-SPEECH MODULE
Uses Microsoft Edge-TTS (FREE) instead of ElevenLabs for cost savings
No API key required!
"""

import os
from pathlib import Path
import edge_tts
import asyncio
import tempfile

# Default voice for different languages
VOICES = {
    'hi': "hi-IN-SwaraNeural",      # Hindi - Female
    'en': "en-IN-NeerjaNeural",     # English (India) - Female
    'bn': "bn-IN-TanushreeNeural",  # Bengali - Female
    'ta': "ta-IN-PallaviNeural",    # Tamil - Female
    'mr': "mr-IN-ManoharaNeural",   # Marathi - Female
}

DEFAULT_VOICE = "hi-IN-SwaraNeural"  # Hindi voice as default


async def text_to_speech_async(text: str, language: str = "hi", voice_id: str = None) -> bytes:
    """
    Convert text to speech using Microsoft Edge-TTS (FREE)
    
    Args:
        text: The text to convert to speech
        language: Language code (hi, en, bn, ta, mr)
        voice_id: Custom voice ID (optional, uses language default)
    
    Returns:
        Audio data as bytes (MP3 format)
    """
    try:
        if not text or len(text.strip()) == 0:
            raise ValueError("Text cannot be empty")
        
        # Use language-specific voice or provided voice_id
        voice = voice_id or VOICES.get(language, DEFAULT_VOICE)
        
        # Create temporary file for MP3
        temp_dir = Path(tempfile.gettempdir())
        temp_file = temp_dir / f"tts_{hash(text) % 1000000}.mp3"
        
        # Generate speech using Edge-TTS
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(str(temp_file))
        
        # Read the file and return as bytes
        with open(temp_file, 'rb') as f:
            audio_bytes = f.read()
        
        # Clean up temp file
        try:
            os.remove(temp_file)
        except:
            pass
        
        print(f"[Voice] Generated {len(audio_bytes)} bytes of audio ({language}/{voice}): {text[:50]}...")
        return audio_bytes
    
    except Exception as e:
        print(f"[Voice] TTS Error: {str(e)}")
        raise Exception(f"Edge-TTS Error: {str(e)}")


def text_to_speech(text: str, language: str = "hi", voice_id: str = None) -> bytes:
    """
    Synchronous wrapper for text_to_speech_async
    
    Args:
        text: The text to convert to speech
        language: Language code
        voice_id: Custom voice ID
    
    Returns:
        Audio data as bytes
    """
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        audio_bytes = loop.run_until_complete(text_to_speech_async(text, language, voice_id))
        loop.close()
        return audio_bytes
    except Exception as e:
        print(f"[Voice] Sync TTS Error: {str(e)}")
        raise Exception(f"Text-to-speech error: {str(e)}")


def get_available_voices():
    """
    Get list of available voices (Edge-TTS Microsoft voices)
    
    Returns:
        List of voice objects with id and name
    """
    voice_list = [
        {
            "id": "hi-IN-SwaraNeural",
            "name": "Swara (Hindi)",
            "language": "hi",
            "category": "neural"
        },
        {
            "id": "hi-IN-MadhurNeural",
            "name": "Madhur (Hindi)",
            "language": "hi",
            "category": "neural"
        },
        {
            "id": "en-IN-NeerjaNeural",
            "name": "Neerja (English India)",
            "language": "en",
            "category": "neural"
        },
        {
            "id": "bn-IN-TanushreeNeural",
            "name": "Tanushree (Bengali)",
            "language": "bn",
            "category": "neural"
        },
        {
            "id": "ta-IN-PallaviNeural",
            "name": "Pallavi (Tamil)",
            "language": "ta",
            "category": "neural"
        },
        {
            "id": "mr-IN-ManoharaNeural",
            "name": "Manohara (Marathi)",
            "language": "mr",
            "category": "neural"
        }
    ]
    print(f"[Voice] Available Edge-TTS voices: {len(voice_list)} voices")
    return voice_list
