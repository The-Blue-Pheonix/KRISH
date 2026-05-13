from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from dataclasses import asdict
import os
import tempfile
import shutil
from dotenv import load_dotenv

load_dotenv()

from app.routes import farmer, sensor, recommendation
from app.services.predict import predict_crop
from app.services.irrigation import irrigation_decision, soil_condition_logic
from app.services.weather import get_weather
from app.services.llm import generate_agricultural_insight
from app.services.soil_mapping import get_soil_by_location
from app.services.crop_health import get_crop_health
from app.services.profit import estimate_profit

app = FastAPI(title="Smart Agri System API")

# ✅ Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str
    city: str
    soil: str
    language: str = "en"  # Language parameter with default value

@app.post("/chat")
def chat_with_ai(request: ChatRequest):
    try:
        from app.services.llm import cached_llm_call, LANGUAGE_CONFIG
        
        # Validate and get language config
        user_language = request.language.lower() if request.language else "en"
        if user_language not in LANGUAGE_CONFIG:
            user_language = "en"
        
        lang_config = LANGUAGE_CONFIG[user_language]
        
        prompt = f"""
You are Krishi AI Advisor, an expert Agricultural Assistant holding a conversation with an Indian farmer in {request.city} (Soil Type: {request.soil}).

🚨 CRITICAL RULE:
{lang_config['rule']}

Rule: Respond to the farmer concisely, strictly addressing their question. Be practical and friendly. Use short sentences.
Do not use technical jargon. Do NOT suggest checking external apps or websites.

Farmer asks: "{request.message}"
"""
        response_text = cached_llm_call(prompt)
        return {"response": response_text}
    except Exception as e:
        return {"error": str(e), "response": "Sorry, I am having trouble connecting to my agricultural database right now."}


# ✅ Routers
app.include_router(farmer.router, prefix="/farmer", tags=["Farmer"])
app.include_router(sensor.router, prefix="/sensor", tags=["Sensor"])
app.include_router(recommendation.router, prefix="/recommendation", tags=["Recommendation"])

from app.services.plant_disease import analyze_plant_image

@app.post("/plant-disease")
async def detect_plant_disease(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")
    
    try:
        # Save uploaded file temporarily for PlantNet API
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_path = temp_file.name
            
        # Analyze using PlantNet
        analysis_result = analyze_plant_image(temp_path)
        
        # Clean up temp file
        os.remove(temp_path)
        
        return {"result": analysis_result}
    except ValueError as ve:
        raise HTTPException(status_code=401, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ✅ Voice AI Endpoint
class VoiceChatRequest(BaseModel):
    text: str
    city: str
    soil: str
    language: str = "en"

@app.post("/voice-chat")
async def voice_chat(request: VoiceChatRequest):
    """
    Process voice chat: Convert user query to AI response using unified AI system
    """
    try:
        from app.services.unified_ai import get_ai_response
        from app.services.core_engine import ContextBuilder, WeatherAPI
        
        # Get AI response to the text using unified system
        user_language = request.language.lower() if request.language else "en"
        
        # Build weather context
        weather_info = WeatherAPI.get_weather(request.city)
        
        context = {
            'location': request.city,
            'weather': weather_info if weather_info.get('success') else {
                'temperature': 'Unknown',
                'humidity': 'Unknown',
                'rainfall': 'Unknown',
                'condition': 'Unknown'
            },
            'season': ContextBuilder.get_season(),
            'crops': [request.soil],  # Placeholder
            'soil': {'type': request.soil, 'tips': 'Monitor soil health'}
        }
        
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        ai_response = await get_ai_response(
            user_id=hash(request.text) % 1000000,
            message=request.text,
            context=context,
            ml_output=None,
            language=user_language
        )
        
        loop.close()
        
        return {
            "text": ai_response,
            "status": "success"
        }
    except ValueError as ve:
        print(f"[Voice] ValueError: {str(ve)}")
        raise HTTPException(status_code=401, detail=str(ve))
    except Exception as e:
        print(f"[Voice] Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Voice chat error: {str(e)}")


@app.get("/voices")
def get_voices():
    """
    Get available voices for TTS
    Returns hardcoded list of available voices
    """
    return {
        "voices": [
            {"id": "21m00Tcm4TlvDq8ikWAM", "name": "Rachel", "language": "en"},
            {"id": "EXAVITQu4vr4xnSDxMaL", "name": "Bella", "language": "en"},
            {"id": "EXAVITQu4vr4xnSDxMaL", "name": "Male Voice", "language": "en"}
        ],
        "status": "success"
    }


@app.get("/")
def health_check():
    return {"status": "ok", "service": "smart-agri-backend"}


# ✅ Soil Detection API
@app.get("/get-soil")
def get_recommended_soil(city: str):
    try:
        soil = get_soil_by_location(city)
        return {
            "city": city,
            "recommended_soil": soil,
            "message": f"Detected soil type for {city}: {soil}",
            "status": "success"
        }
    except Exception as e:
        return {
            "error": str(e),
            "status": "failed"
        }


# ✅ MAIN AI PIPELINE
@app.get("/predict")
def predict(
    city: str = None,
    soil: str = None,
    query: str = None,
    latitude: float = None,
    longitude: float = None,
    language: str = "en"
):
    """
    Complete agricultural prediction pipeline:
    1. Fetch real-time weather data
    2. Predict suitable crops using ML model
    3. Analyze soil condition based on rainfall
    4. Determine irrigation requirements
    5. Generate AI recommendations using LLM

    Parameters:
    - city: str (optional) - City name (e.g., "Kolkata")
    - soil: str (required) - Soil type (must be: "Alluvial", "Laterite", "Black", or "Red")
    - query: str (optional) - Farmer's specific question for the AI
    - latitude: float (optional) - GPS latitude coordinate
    - longitude: float (optional) - GPS longitude coordinate
    - language: str (optional) - Target response language for the AI (default: "en")

    Note: If latitude & longitude are provided, they take precedence over city name.
    At least one location parameter (city or GPS coords) and soil type are required.

    Returns: JSON with weather, crop prediction, soil condition, irrigation advice, and AI recommendation
    """
    try:
        # 🔒 Validate input
        if not soil:
            raise ValueError("soil parameter is required")

        # =========================
        # 1️⃣ WEATHER FETCH
        # =========================
        weather = get_weather(city=city, latitude=latitude, longitude=longitude)
        temp = weather["temperature"]
        humidity = weather["humidity"]
        rainfall = weather["rainfall"]
        weather_location = weather.get("location", city or "Unknown")

        # =========================
        # 2️⃣ ML CROP PREDICTION
        # =========================
        crop = predict_crop(temp, humidity, rainfall, soil)

        # =========================
        # 3️⃣ SOIL CONDITION
        # =========================
        soil_condition = soil_condition_logic("Auto", rainfall)

        # =========================
        # 4️⃣ IRRIGATION DECISION
        # =========================
        irrigation = irrigation_decision(temp, rainfall, soil_condition)

        # =========================
        # 4.5️⃣ CROP HEALTH INSIGHTS
        # =========================
        health_report = get_crop_health(
            crop=crop,
            soil=soil,
            temp=temp,
            humidity=humidity,
            month=datetime.now().month,
        )

        # =========================
        # 5️⃣ LLM AI RECOMMENDATION
        # =========================
        user_inputs = {
            "city": weather_location,
            "soil": soil,
            "weather": weather,
            "weather_condition": weather["weather"],
            "query": query,
            "language": language
        }

        ml_outputs = {
            "predicted_crop": crop,
            "soil_condition": soil_condition,
            "irrigation": irrigation,
            "crop_health": asdict(health_report)
        }

        try:
            llm_recommendation = generate_agricultural_insight(user_inputs, ml_outputs)
        except Exception as e:
            print(f"[ERROR] LLM failed: {str(e)}")
            llm_recommendation = (
                "AI পরামর্শ পাওয়া যায়নি। নিজে পর্যবেক্ষণ করুন।"
            )

        # =========================
        # 6️⃣ SOIL AUTO DETECTION
        # =========================
        recommended_soil = get_soil_by_location(weather_location)

        # =========================
        # FINAL RESPONSE
        # =========================
        return {
            "location": weather_location,
            "coordinates": {
                "latitude": latitude,
                "longitude": longitude
            } if latitude and longitude else None,

            "weather": weather,

            "recommended_soil": recommended_soil,
            "selected_soil": soil,

            "predicted_crop": crop,
            "soil_condition": soil_condition,
            "irrigation": irrigation,
            "crop_health": {
                "score": health_report.health_score,
                "disease_risk": health_report.disease_risk,
                "disease_name": health_report.disease_name,
                "pest_alert": health_report.pest_alert,
                "pest_name": health_report.pest_name,
                "nutrient_deficiency": health_report.nutrient_deficiency,
                "nutrient_tip": health_report.nutrient_tip
            },

            "query_received": query,   # 🔥 DEBUG FIELD

            "ai_recommendation": llm_recommendation
        }

    except ValueError as e:
        return {
            "error": str(e),
            "status": "validation_failed"
        }

    except Exception as e:
        return {
            "error": str(e),
            "status": "prediction_failed"
        }


# ✅ Crop health snapshot
@app.get("/crop-health")
def crop_health(city: str, soil: str, crop: str):
    weather = get_weather(city=city)
    report = get_crop_health(
        crop=crop,
        soil=soil,
        temp=weather["temperature"],
        humidity=weather["humidity"],
        month=datetime.now().month,
    )
    return asdict(report)


# ✅ Profit estimator
@app.get("/profit-estimate")
def profit_estimate(
    city: str,
    soil: str,
    crop: str = None,
    area: float = 1.0,
    market_price: float = None,
):
    weather = get_weather(city=city)
    if not crop:
        crop = predict_crop(
            weather["temperature"],
            weather["humidity"],
            weather["rainfall"],
            soil,
        )

    soil_condition = soil_condition_logic("Auto", weather["rainfall"])
    irrigation = irrigation_decision(weather["temperature"], weather["rainfall"], soil_condition)

    estimate = estimate_profit(
        crop=crop,
        soil=soil,
        area_acres=area,
        market_price=market_price,
        irrigation_needed=(irrigation == "Yes"),
    )
    return asdict(estimate)


# ===== 🔊 TWILIO VOICE INTEGRATION =====

from fastapi import Request
from app.services.twilio_voice import (
    handle_incoming_call,
    process_voice_call_with_llm,
    handle_transcription,
    build_incoming_call_response,
    get_call_info,
    send_sms
)

@app.post("/api/voice/incoming")
async def voice_incoming_call(request: Request):
    """
    Handle incoming phone call from Twilio
    This is the main webhook that gets called when someone dials the number
    """
    try:
        form_data = await request.form()
        from_number = form_data.get("From", "Unknown")
        to_number = form_data.get("To", "Unknown")
        call_sid = form_data.get("CallSid", "Unknown")
        
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"[VOICE API] Incoming call - From: {from_number}, To: {to_number}, SID: {call_sid}")
        
        # Build voice response with greeting
        response_xml = handle_incoming_call(from_number, to_number)
        
        from fastapi.responses import Response
        return Response(content=response_xml, media_type="application/xml")
    
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"[VOICE API] Error in voice_incoming_call: {e}")
        
        from twilio.twiml.voice_response import VoiceResponse
        response = VoiceResponse()
        response.say("क्षमा करें, एक त्रुटि हुई।")
        response.hangup()
        
        from fastapi.responses import Response
        return Response(content=str(response), media_type="application/xml")


@app.post("/api/voice/transcribe")
async def voice_transcribe(request: Request):
    """
    Handle transcription webhook from Twilio
    Receives the transcribed text from caller's speech
    """
    try:
        form_data = await request.form()
        transcript = form_data.get("SpeechResult", "")
        confidence = float(form_data.get("Confidence", "0.0"))
        call_sid = form_data.get("CallSid", "Unknown")
        
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"[VOICE API] Transcribed: '{transcript}' (confidence: {confidence}) - Call: {call_sid}")
        
        # Handle transcription
        result = handle_transcription(transcript, confidence)
        
        return {
            "status": "transcribed",
            "transcript": transcript,
            "confidence": confidence,
            "call_sid": call_sid
        }
    
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"[VOICE API] Error in voice_transcribe: {e}")
        
        from fastapi.responses import JSONResponse
        return JSONResponse({"error": str(e)}, status_code=500)


@app.post("/api/voice/process")
async def voice_process_call(request: Request):
    """
    Process transcribed speech with LLM and return voice response
    This gets called after transcription is complete
    """
    try:
        form_data = await request.form()
        transcript = form_data.get("SpeechResult", "")
        call_sid = form_data.get("CallSid", "Unknown")
        caller_id = form_data.get("From", "Unknown")
        
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"[VOICE API] Processing voice call - Transcript: '{transcript[:50]}...' - Caller: {caller_id}")
        
        if not transcript or len(transcript.strip()) == 0:
            # No speech detected, ask again
            from twilio.twiml.voice_response import VoiceResponse
            response = VoiceResponse()
            response.say("कृपया स्पष्ट आवाज में बोलें। फिर से प्रयास करें।")
            response.record(
                max_speech_time=30,
                timeout=3,
                transcribe=True,
                transcribe_callback="/api/voice/transcribe",
                action="/api/voice/process",
                method="POST"
            )
            
            from fastapi.responses import Response
            return Response(content=str(response), media_type="application/xml")
        
        # Process with LLM and get voice response
        voice_response_xml = process_voice_call_with_llm(
            transcript=transcript,
            caller_id=caller_id,
            language="hi"  # Default to Hindi, can be dynamic
        )
        
        from fastapi.responses import Response
        return Response(content=voice_response_xml, media_type="application/xml")
    
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"[VOICE API] Error in voice_process_call: {e}")
        import traceback
        traceback.print_exc()
        
        from twilio.twiml.voice_response import VoiceResponse
        response = VoiceResponse()
        response.say("क्षमा करें, एक त्रुटि हुई। कृपया बाद में कॉल करें।")
        response.hangup()
        
        from fastapi.responses import Response
        return Response(content=str(response), media_type="application/xml")


@app.get("/api/voice/call-info/{call_sid}")
def voice_call_info(call_sid: str):
    """
    Get information about a specific call
    """
    try:
        call_info = get_call_info(call_sid)
        return {
            "status": "success",
            "call_info": call_info
        }
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"[VOICE API] Error getting call info: {e}")
        
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/voice/send-sms")
async def voice_send_sms(request: Request):
    """
    Send SMS fallback message
    """
    try:
        data = await request.json()
        to_number = data.get("to_number")
        message = data.get("message")
        
        if not to_number or not message:
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail="Missing to_number or message")
        
        result = send_sms(to_number, message)
        return {
            "status": "success",
            "result": result
        }
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"[VOICE API] Error sending SMS: {e}")
        
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))