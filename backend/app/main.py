from fastapi import FastAPI

from app.routes import farmer, sensor, recommendation

app = FastAPI(title="Smart Agri System API")

app.include_router(farmer.router, prefix="/farmer", tags=["Farmer"])
app.include_router(sensor.router, prefix="/sensor", tags=["Sensor"])
app.include_router(recommendation.router, prefix="/recommendation", tags=["Recommendation"])


@app.get("/")
def health_check():
    return {"status": "ok", "service": "smart-agri-backend"}
