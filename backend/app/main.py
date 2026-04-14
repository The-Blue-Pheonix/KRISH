from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import farmer, sensor, recommendation
from app.services.predict import predict_crop
from app.services.irrigation import irrigation_decision, soil_condition_logic
from app.services.weather import get_weather
from app.services.llm import generate_agricultural_insight

app = FastAPI(title="Smart Agri System API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(farmer.router, prefix="/farmer", tags=["Farmer"])
app.include_router(sensor.router, prefix="/sensor", tags=["Sensor"])
app.include_router(recommendation.router, prefix="/recommendation", tags=["Recommendation"])


@app.get("/")
def health_check():
    return {"status": "ok", "service": "smart-agri-backend"}

@app.get("/predict")
def predict(city: str, soil: str):
    """
    Complete agricultural prediction pipeline:
    1. Fetch real-time weather data
    2. Predict suitable crops using ML model
    3. Analyze soil condition based on rainfall
    4. Determine irrigation requirements
    5. Generate AI recommendations using LLM
    
    Parameters:
    - city: str - City name (e.g., "Kolkata")
    - soil: str - Soil type (must be: "Alluvial", "Laterite", "Black", or "Red")
    
    Returns: JSON with weather, crop prediction, soil condition, irrigation advice, and AI recommendation
    """
    try:
        # ✅ 1. FETCH WEATHER DATA
        weather = get_weather(city)
        temp = weather["temperature"]          # Float: Temperature in Celsius
        humidity = weather["humidity"]         # Int: Humidity percentage (0-100)
        rainfall = weather["rainfall"]         # Float: Rainfall in mm

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
            "city": city,                    # String: User's location
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
        return {
            "location": city,
            "weather": weather,
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
