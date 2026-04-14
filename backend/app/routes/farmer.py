from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class FarmerInput(BaseModel):
    name: str
    location: str
    farm_size: float  # in hectares
    contact: str | None = None



