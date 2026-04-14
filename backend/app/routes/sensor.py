from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class SensorData(BaseModel):
    temperature: float
    humidity: float
    soil_moisture: float
    location: str


