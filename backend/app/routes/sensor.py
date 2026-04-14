from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class SensorData(BaseModel):
    temperature: float
    humidity: float
    soil_moisture: float
    location: str


@router.post("/data")
def receive_sensor_data(payload: SensorData):
    return {"message": "Sensor data received", "data": payload.model_dump()}
