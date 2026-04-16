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
    query: str = None,   # 🔥 ADDED (user question)
    latitude: float = None,
    longitude: float = None
):
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
            "query": query   # 🔥 IMPORTANT
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