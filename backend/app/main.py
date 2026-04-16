from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import farmer, sensor, recommendation
from app.services.predict import predict_crop
from app.services.irrigation import irrigation_decision, soil_condition_logic
from app.services.weather import get_weather
from app.services.llm import generate_agricultural_insight
from app.services.soil_mapping import get_soil_by_location

app = FastAPI(title="Smart Agri System API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
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


app.include_router(farmer.router, prefix="/farmer", tags=["Farmer"])
app.include_router(sensor.router, prefix="/sensor", tags=["Sensor"])
app.include_router(recommendation.router, prefix="/recommendation", tags=["Recommendation"])


@app.get("/")
def health_check():
    return {"status": "ok", "service": "smart-agri-backend"}

@app.get("/get-soil")
def get_recommended_soil(city: str):
    """
    Get recommended soil type for a given city location.
    
    Uses West Bengal soil distribution knowledge.
    
    Parameters:
    - city: str - City name
    
    Returns: JSON with recommended soil type
    """
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

@app.get("/predict")
def predict(city: str = None, soil: str = None, latitude: float = None, longitude: float = None):
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
    - latitude: float (optional) - GPS latitude coordinate
    - longitude: float (optional) - GPS longitude coordinate
    
    Note: If latitude & longitude are provided, they take precedence over city name.
    At least one location parameter (city or GPS coords) and soil type are required.
    
    Returns: JSON with weather, crop prediction, soil condition, irrigation advice, and AI recommendation
    """
    try:
        # Validate soil parameter
        if not soil:
            raise ValueError("soil parameter is required")
        
        # ✅ 1. FETCH WEATHER DATA (from GPS coordinates or city name)
        weather = get_weather(city=city, latitude=latitude, longitude=longitude)
        temp = weather["temperature"]          # Float: Temperature in Celsius
        humidity = weather["humidity"]         # Int: Humidity percentage (0-100)
        rainfall = weather["rainfall"]         # Float: Rainfall in mm
        weather_location = weather.get("location", city or "Unknown")

        # ✅ 2. PREDICT CROP using ML model
        # Parameters: temp (float), humidity (int), rainfall (float), soil (str)
        crop = predict_crop(temp, humidity, rainfall, soil)

        # ✅ 3. ANALYZE SOIL CONDITION
        # Returns: "Dry" (if rainfall < 20mm) or "Wet" (if rainfall >= 20mm)
        soil_condition = soil_condition_logic("Auto", rainfall)

        # ✅ 4. DETERMINE IRRIGATION NEEDS
        # Logic: Returns "Yes" (Dry + Hot), "No" (Heavy rainfall), "Monitor" (other cases)
        irrigation = irrigation_decision(temp, rainfall, soil_condition)

        # ✅ 5. GENERATE AI RECOMMENDATION using LLM
        user_inputs = {
            "city": weather_location,                    # String: User's location
            "soil": soil,                    # String: Soil type
            "weather": weather               # Dict: {temperature, humidity, rainfall}
        }
        
        ml_outputs = {
            "predicted_crop": crop,          # String: Recommended crop
            "soil_condition": soil_condition,# String: "Dry" or "Wet"
            "irrigation": irrigation         # String: "Yes", "No", or "Monitor"
        }
        
        try:
            llm_recommendation = generate_agricultural_insight(user_inputs, ml_outputs)
        except Exception as e:
            # Graceful fallback if LLM fails (no API key, network error, etc.)
            llm_recommendation = f"AI advice unavailable. Please monitor your crops manually. (Error: {str(e)})"

        # ✅ RETURN COMPLETE PREDICTION RESULT
        recommended_soil = get_soil_by_location(weather_location)
        
        return {
            "location": weather_location,
            "coordinates": {"latitude": latitude, "longitude": longitude} if latitude and longitude else None,
            "weather": weather,
            "recommended_soil": recommended_soil,  # Auto-detected soil from location
            "selected_soil": soil,                  # User-selected soil (may differ from recommended)
            "predicted_crop": crop,
            "soil_condition": soil_condition,
            "irrigation": irrigation,
            "ai_recommendation": llm_recommendation
        }
    
    except ValueError as e:
        # Validation error (e.g., invalid soil type)
        return {"error": str(e), "status": "validation_failed"}
    except Exception as e:
        # Unexpected error
        return {"error": str(e), "status": "prediction_failed"}
