from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import farmer, sensor, recommendation
from app.services.predict import predict_crop
from app.services.irrigation import irrigation_decision, soil_condition_logic
from app.services.weather import get_weather
from app.services.llm import generate_agricultural_insight
from app.services.soil_mapping import get_soil_by_location

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

@app.post("/chat")
def chat_with_ai(request: ChatRequest):
    try:
        from app.services.llm import cached_llm_call
        
        prompt = f"""
You are Krishi AI Advisor, an expert Agricultural Assistant holding a conversation with an Indian farmer in {request.city} (Soil Type: {request.soil}).
Rule: Respond to the farmer concisely, strictly addressing their question. Be practical and friendly. Use short sentences.
Try replying in standard English or Bengali depending on the query (Default: English). Do not use technical jargon.

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
        # 5️⃣ LLM AI RECOMMENDATION
        # =========================
        user_inputs = {
            "city": weather_location,
            "soil": soil,
            "weather": weather,
            "query": query,
            "language": language
        }

        ml_outputs = {
            "predicted_crop": crop,
            "soil_condition": soil_condition,
            "irrigation": irrigation
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