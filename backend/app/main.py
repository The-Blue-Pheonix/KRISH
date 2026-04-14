from fastapi import FastAPI

from app.routes import farmer, sensor, recommendation
from app.services.predict import predict_crop
from app.services.irrigation import irrigation_decision, soil_condition_logic
from app.services.weather import get_weather

app = FastAPI(title="Smart Agri System API")

app.include_router(farmer.router, prefix="/farmer", tags=["Farmer"])
app.include_router(sensor.router, prefix="/sensor", tags=["Sensor"])
app.include_router(recommendation.router, prefix="/recommendation", tags=["Recommendation"])


@app.get("/")
def health_check():
    return {"status": "ok", "service": "smart-agri-backend"}

@app.get("/predict")
def predict(city: str, soil: str):

    # 1. Weather
    weather = get_weather(city)
    temp = weather["temperature"]
    humidity = weather["humidity"]
    rainfall = weather["rainfall"]

    # 2. ML
    crop = predict_crop(temp, humidity, rainfall, soil)

    # 3. Soil Condition
    soil_condition = soil_condition_logic("Auto", rainfall)

    # 4. Irrigation
    irrigation = irrigation_decision(temp, rainfall, soil_condition)

    return {
        "location": city,
        "weather": weather,
        "predicted_crop": crop,
        "soil_condition": soil_condition,
        "irrigation": irrigation
    }
