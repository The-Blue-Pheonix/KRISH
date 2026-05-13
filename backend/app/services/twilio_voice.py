"""
🔊 TWILIO VOICE INTEGRATION
Handles incoming phone calls and processes them through LLM with speech-to-text and text-to-speech
Uses FREE Edge-TTS (Microsoft) instead of ElevenLabs for cost savings
"""

import os
import logging
from typing import Optional, Dict
from dotenv import load_dotenv
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse
import edge_tts
import asyncio
import tempfile
from pathlib import Path

# Load environment variables
load_dotenv()
logger = logging.getLogger(__name__)

# Twilio Configuration
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")

# Edge-TTS Configuration (FREE Microsoft Voices)
# Available voices: hi-IN-SwaraNeural (Female), hi-IN-MadhurNeural (Male), en-IN-NeerjaNeural, etc.
DEFAULT_VOICE = "hi-IN-SwaraNeural"  # Indian Hindi voice (Female)
VOICES = {
    'hi': "hi-IN-SwaraNeural",      # Hindi
    'en': "en-IN-NeerjaNeural",     # English (India)
    'bn': "bn-IN-TanushreeNeural",  # Bengali
    'ta': "ta-IN-PallaviNeural",    # Tamil
    'mr': "mr-IN-ManoharaNeural",   # Marathi (fallback to Hindi if not available)
}

# Initialize Twilio client
try:
    twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    print(f"[TWILIO] Configured Twilio client")
except Exception as e:
    print(f"[TWILIO] Error initializing client: {e}")
    twilio_client = None

# ===== TEXT TO SPEECH (TTS) USING EDGE-TTS (FREE) =====

async def text_to_speech_edge_tts(text: str, language: str = "hi", filename: str = None) -> Optional[str]:
    """
    Convert text to speech using Microsoft Edge-TTS (FREE)
    
    Args:
        text: Text to convert
        language: Language code (hi, en, bn, ta, mr)
        filename: Optional custom filename
    
    Returns:
        Path to generated MP3 file or None if error
    """
    try:
        if not text or len(text.strip()) == 0:
            logger.warning("[TTS] Empty text provided")
            return None
        
        # Get voice for language
        voice = VOICES.get(language, DEFAULT_VOICE)
        
        # Create temp file for MP3
        if not filename:
            temp_dir = Path(tempfile.gettempdir())
            filename = str(temp_dir / f"tts_{hash(text) % 1000000}.mp3")
        
        # Generate speech using Edge-TTS
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(filename)
        
        logger.info(f"[TTS] Generated audio ({language}/{voice}): {text[:50]}... → {filename}")
        return filename
    
    except Exception as e:
        logger.error(f"[TTS] Error generating speech: {e}")
        return None

def text_to_speech_sync(text: str, language: str = "hi") -> Optional[str]:
    """
    Synchronous wrapper for text_to_speech_edge_tts
    Handles asyncio loop management
    """
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(text_to_speech_edge_tts(text, language))
        loop.close()
        return result
    except Exception as e:
        logger.error(f"[TTS SYNC] Error: {e}")
        return None

# ===== VOICE RESPONSE BUILDERS =====

def build_incoming_call_response(message: str = None) -> str:
    """
    Build Twilio VoiceResponse for incoming call
    Greets caller and waits for speech input
    """
    response = VoiceResponse()
    
    greeting = message or "नमस्ते! कृषि सहायक में आपका स्वागत है। कृपया अपना प्रश्न बताएं।"
    
    # Play greeting using Twilio Say (no need for audio file)
    response.say(greeting, voice="alice")
    
    # Record caller's input (up to 10 seconds of silence after speech stops)
    response.record(
        max_speech_time=60,  # Max 60 seconds of speech
        timeout=5,           # 5 seconds of silence = end of input
        transcribe=True,     # Enable transcription
        transcribe_callback="/api/voice/transcribe",  # Webhook for transcription
        action="/api/voice/process",
        method="POST"
    )
    
    # If no input, provide options
    response.say("यदि आप सुन नहीं सकते, कृपया बाद में कॉल करें। धन्यवाद।", voice="alice")
    response.hangup()
    
    return str(response)

def build_llm_response_to_voice(llm_text: str, language: str = "hi") -> str:
    """
    Convert LLM response to Twilio voice response
    Uses Edge-TTS for free speech generation
    """
    response = VoiceResponse()
    
    # Limit response length (avoid long audio)
    max_length = 500
    if len(llm_text) > max_length:
        llm_text = llm_text[:max_length] + "..."
    
    # Generate audio using Edge-TTS
    audio_file = text_to_speech_sync(llm_text, language)
    
    if audio_file:
        # Play generated audio file
        response.play(audio_file)
        logger.info(f"[VOICE] Playing generated audio: {audio_file}")
    else:
        # Fallback to Twilio Say if TTS fails
        logger.warning("[VOICE] TTS failed, using Twilio Say fallback")
        response.say(llm_text, voice="alice")
    
    # Ask if they need anything else
    response.say("क्या आपको कोई और सहायता चाहिए?", voice="alice")
    
    # Record follow-up input
    response.record(
        max_speech_time=30,
        timeout=3,
        transcribe=True,
        transcribe_callback="/api/voice/transcribe",
        action="/api/voice/process",
        method="POST"
    )
    
    return str(response)

# ===== VOICE CALL HANDLERS =====

def handle_incoming_call(from_number: str = None, to_number: str = None) -> str:
    """
    Handle incoming call from Twilio webhook
    
    Args:
        from_number: Caller's phone number
        to_number: Number called
    
    Returns:
        Twilio VoiceResponse XML
    """
    logger.info(f"[VOICE] Incoming call from {from_number} to {to_number}")
    
    greeting = (
        "नमस्ते! कृषि सहायक में आपका स्वागत है। "
        "कृपया अपना कृषि संबंधी प्रश्न बताएं।"
    )
    
    return build_incoming_call_response(greeting)

def handle_transcription(transcript: str, confidence: float = 0.0) -> Dict:
    """
    Handle transcribed speech from caller
    
    Args:
        transcript: Transcribed text from caller
        confidence: Transcription confidence score
    
    Returns:
        Dict with processed response
    """
    logger.info(f"[VOICE] Transcribed text: {transcript} (confidence: {confidence})")
    
    if not transcript or len(transcript.strip()) == 0:
        logger.warning("[VOICE] Empty transcription received")
        return {
            'error': 'No speech detected',
            'response': "कृपया स्पष्ट आवाज में बोलें।"
        }
    
    return {
        'transcript': transcript,
        'confidence': confidence,
        'status': 'processed'
    }

def process_voice_call_with_llm(
    transcript: str,
    caller_id: str = None,
    language: str = "hi"
) -> str:
    """
    Process transcribed voice call with LLM and return voice response
    
    Args:
        transcript: Transcribed caller message
        caller_id: Unique caller identifier
        language: Language (hi, en, bn, etc.)
    
    Returns:
        Twilio VoiceResponse XML
    """
    try:
        from services.unified_ai import get_ai_response
        from services.core_engine import ContextBuilder, WeatherAPI
        import asyncio
        
        logger.info(f"[VOICE] Processing LLM request: {transcript[:50]}...")
        
        # Build context for AI response (using mock location for phone calls)
        location = "User Location (Phone Call)"
        context = {
            'location': location,
            'weather': {
                'temperature': 'Unknown',
                'humidity': 'Unknown',
                'rainfall': 'Unknown',
                'condition': 'Unknown'
            },
            'season': ContextBuilder.get_season(),
            'crops': ['Rice', 'Wheat', 'Maize'],  # Default crops
            'soil': {'type': 'Alluvial', 'tips': 'Monitor soil health'}
        }
        
        # Get LLM response (async wrapper)
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        llm_response = loop.run_until_complete(
            get_ai_response(
                user_id=hash(caller_id or transcript) % 1000000,
                message=transcript,
                context=context,
                ml_output=None,
                language=language
            )
        )
        
        loop.close()
        
        logger.info(f"[VOICE] LLM Response: {llm_response[:100]}...")
        
        # Convert LLM response to voice using Edge-TTS (FREE)
        voice_response = build_llm_response_to_voice(llm_response, language)
        
        return voice_response
    
    except Exception as e:
        logger.error(f"[VOICE] Error processing LLM call: {e}")
        response = VoiceResponse()
        response.say("क्षमा करें, एक त्रुटि हुई। कृपया बाद में कॉल करें।", voice="alice")
        response.hangup()
        return str(response)

# ===== UTILITY FUNCTIONS =====

def initiate_call_to_user(
    to_number: str,
    message: str = None
) -> Dict:
    """
    Initiate outgoing call to user (optional)
    
    Args:
        to_number: Phone number to call
        message: Message to deliver
    
    Returns:
        Call details dict
    """
    if not twilio_client:
        logger.error("[TWILIO] Client not configured")
        return {'error': 'Twilio not configured'}
    
    try:
        call = twilio_client.calls.create(
            to=to_number,
            from_=TWILIO_PHONE_NUMBER,
            url="http://your-domain.com/api/voice/incoming",  # Your webhook URL
            method="POST"
        )
        
        logger.info(f"[TWILIO] Initiated call to {to_number} (SID: {call.sid})")
        
        return {
            'call_sid': call.sid,
            'status': call.status,
            'to': to_number,
            'from': TWILIO_PHONE_NUMBER
        }
    
    except Exception as e:
        logger.error(f"[TWILIO] Error initiating call: {e}")
        return {'error': str(e)}

def send_sms(
    to_number: str,
    message: str
) -> Dict:
    """
    Send SMS message (fallback if voice fails)
    
    Args:
        to_number: Phone number to send SMS
        message: Message text
    
    Returns:
        SMS details dict
    """
    if not twilio_client:
        logger.error("[TWILIO] Client not configured")
        return {'error': 'Twilio not configured'}
    
    try:
        sms = twilio_client.messages.create(
            to=to_number,
            from_=TWILIO_PHONE_NUMBER,
            body=message
        )
        
        logger.info(f"[TWILIO] Sent SMS to {to_number} (SID: {sms.sid})")
        
        return {
            'message_sid': sms.sid,
            'status': sms.status,
            'to': to_number
        }
    
    except Exception as e:
        logger.error(f"[TWILIO] Error sending SMS: {e}")
        return {'error': str(e)}

def get_call_info(call_sid: str) -> Dict:
    """
    Get information about a call
    
    Args:
        call_sid: Twilio Call SID
    
    Returns:
        Call information dict
    """
    if not twilio_client:
        return {'error': 'Twilio not configured'}
    
    try:
        call = twilio_client.calls(call_sid).fetch()
        
        return {
            'sid': call.sid,
            'status': call.status,
            'from': call.from_,
            'to': call.to,
            'duration': call.duration,
            'direction': call.direction,
            'start_time': call.start_time,
            'end_time': call.end_time
        }
    
    except Exception as e:
        logger.error(f"[TWILIO] Error fetching call info: {e}")
        return {'error': str(e)}

# ===== VOICE RESPONSE BUILDERS =====

def build_incoming_call_response(message: str = None) -> str:
    """
    Build Twilio VoiceResponse for incoming call
    Greets caller and waits for speech input
    """
    response = VoiceResponse()
    
    greeting = message or "नमस्ते! कृषि सहायक में आपका स्वागत है। कृपया अपना प्रश्न बताएं।"
    
    # Play greeting
    response.say(greeting, voice="Alice")
    
    # Record caller's input (up to 10 seconds of silence after speech stops)
    response.record(
        max_speech_time=60,  # Max 60 seconds of speech
        timeout=5,           # 5 seconds of silence = end of input
        transcribe=True,     # Enable transcription
        transcribe_callback="/api/voice/transcribe",  # Webhook for transcription
        record_callback="/api/voice/process",         # Process the recording
        action="/api/voice/process",
        method="POST"
    )
    
    # If no input, provide options
    response.say("यदि आप सुन नहीं सकते, कृपया बाद में कॉल करें। धन्यवाद।")
    response.hangup()
    
    return str(response)

def build_llm_response_to_voice(llm_text: str, language: str = "hi") -> str:
    """
    Convert LLM response to Twilio voice response
    Uses Edge-TTS for free speech generation
    """
    response = VoiceResponse()
    
    # Limit response length (avoid long audio)
    max_length = 500
    if len(llm_text) > max_length:
        llm_text = llm_text[:max_length] + "..."
    
    # Generate audio using Edge-TTS
    audio_file = text_to_speech_sync(llm_text, language)
    
    if audio_file:
        # Play generated audio file
        response.play(audio_file)
        logger.info(f"[VOICE] Playing generated audio: {audio_file}")
    else:
        # Fallback to Twilio Say if TTS fails
        logger.warning("[VOICE] TTS failed, using Twilio Say fallback")
        response.say(llm_text, voice="alice")
    
    # Ask if they need anything else
    response.say("क्या आपको कोई और सहायता चाहिए?", voice="alice")
    
    # Record follow-up input
    response.record(
        max_speech_time=30,
        timeout=3,
        transcribe=True,
        transcribe_callback="/api/voice/transcribe",
        action="/api/voice/process",
        method="POST"
    )
    
    return str(response)

# ===== VOICE CALL HANDLERS =====

def handle_incoming_call(from_number: str = None, to_number: str = None) -> str:
    """
    Handle incoming call from Twilio webhook
    
    Args:
        from_number: Caller's phone number
        to_number: Number called
    
    Returns:
        Twilio VoiceResponse XML
    """
    logger.info(f"[VOICE] Incoming call from {from_number} to {to_number}")
    
    greeting = (
        "नमस्ते! कृषि सहायक में आपका स्वागत है। "
        "कृपया अपना कृषि संबंधी प्रश्न बताएं।"
    )
    
    return build_incoming_call_response(greeting)

def handle_transcription(transcript: str, confidence: float = 0.0) -> Dict:
    """
    Handle transcribed speech from caller
    
    Args:
        transcript: Transcribed text from caller
        confidence: Transcription confidence score
    
    Returns:
        Dict with processed response
    """
    logger.info(f"[VOICE] Transcribed text: {transcript} (confidence: {confidence})")
    
    if not transcript or len(transcript.strip()) == 0:
        logger.warning("[VOICE] Empty transcription received")
        return {
            'error': 'No speech detected',
            'response': "कृपया स्पष्ट आवाज में बोलें।"
        }
    
    return {
        'transcript': transcript,
        'confidence': confidence,
        'status': 'processed'
    }

def process_voice_call_with_llm(
    transcript: str,
    caller_id: str = None,
    language: str = "hi"
) -> str:
    """
    Process transcribed voice call with LLM and return voice response
    
    Args:
        transcript: Transcribed caller message
        caller_id: Unique caller identifier
        language: Language (hi, en, bn, etc.)
    
    Returns:
        Twilio VoiceResponse XML
    """
    try:
        from services.unified_ai import get_ai_response
        from services.core_engine import ContextBuilder, WeatherAPI
        import asyncio
        
        logger.info(f"[VOICE] Processing LLM request: {transcript[:50]}...")
        
        # Build context for AI response (using mock location for phone calls)
        location = "User Location (Phone Call)"
        context = {
            'location': location,
            'weather': {
                'temperature': 'Unknown',
                'humidity': 'Unknown',
                'rainfall': 'Unknown',
                'condition': 'Unknown'
            },
            'season': ContextBuilder.get_season(),
            'crops': ['Rice', 'Wheat', 'Maize'],  # Default crops
            'soil': {'type': 'Alluvial', 'tips': 'Monitor soil health'}
        }
        
        # Get LLM response (async wrapper)
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        llm_response = loop.run_until_complete(
            get_ai_response(
                user_id=hash(caller_id or transcript) % 1000000,
                message=transcript,
                context=context,
                ml_output=None,
                language=language
            )
        )
        
        loop.close()
        
        logger.info(f"[VOICE] LLM Response: {llm_response[:100]}...")
        
        # Convert LLM response to voice
        voice_response = build_llm_response_to_voice(llm_response)
        
        return voice_response
    
    except Exception as e:
        logger.error(f"[VOICE] Error processing LLM call: {e}")
        response = VoiceResponse()
        response.say("क्षमा करें, एक त्रुटि हुई। कृपया बाद में कॉल करें।", voice="Alice")
        response.hangup()
        return str(response)

# ===== UTILITY FUNCTIONS =====

def initiate_call_to_user(
    to_number: str,
    message: str = None
) -> Dict:
    """
    Initiate outgoing call to user (optional)
    
    Args:
        to_number: Phone number to call
        message: Message to deliver
    
    Returns:
        Call details dict
    """
    if not twilio_client:
        logger.error("[TWILIO] Client not configured")
        return {'error': 'Twilio not configured'}
    
    try:
        call = twilio_client.calls.create(
            to=to_number,
            from_=TWILIO_PHONE_NUMBER,
            url="http://your-domain.com/api/voice/incoming",  # Your webhook URL
            method="POST"
        )
        
        logger.info(f"[TWILIO] Initiated call to {to_number} (SID: {call.sid})")
        
        return {
            'call_sid': call.sid,
            'status': call.status,
            'to': to_number,
            'from': TWILIO_PHONE_NUMBER
        }
    
    except Exception as e:
        logger.error(f"[TWILIO] Error initiating call: {e}")
        return {'error': str(e)}

def send_sms(
    to_number: str,
    message: str
) -> Dict:
    """
    Send SMS message (fallback if voice fails)
    
    Args:
        to_number: Phone number to send SMS
        message: Message text
    
    Returns:
        SMS details dict
    """
    if not twilio_client:
        logger.error("[TWILIO] Client not configured")
        return {'error': 'Twilio not configured'}
    
    try:
        sms = twilio_client.messages.create(
            to=to_number,
            from_=TWILIO_PHONE_NUMBER,
            body=message
        )
        
        logger.info(f"[TWILIO] Sent SMS to {to_number} (SID: {sms.sid})")
        
        return {
            'message_sid': sms.sid,
            'status': sms.status,
            'to': to_number
        }
    
    except Exception as e:
        logger.error(f"[TWILIO] Error sending SMS: {e}")
        return {'error': str(e)}

def get_call_info(call_sid: str) -> Dict:
    """
    Get information about a call
    
    Args:
        call_sid: Twilio Call SID
    
    Returns:
        Call information dict
    """
    if not twilio_client:
        return {'error': 'Twilio not configured'}
    
    try:
        call = twilio_client.calls(call_sid).fetch()
        
        return {
            'sid': call.sid,
            'status': call.status,
            'from': call.from_,
            'to': call.to,
            'duration': call.duration,
            'direction': call.direction,
            'start_time': call.start_time,
            'end_time': call.end_time
        }
    
    except Exception as e:
        logger.error(f"[TWILIO] Error fetching call info: {e}")
        return {'error': str(e)}
