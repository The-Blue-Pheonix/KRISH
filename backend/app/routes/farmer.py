from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class FarmerInput(BaseModel):
    name: str
    location: str
    farm_size: float  # in hectares
    contact: str | None = None


@router.post("/input")
def submit_farmer_input(payload: FarmerInput):
    return {"message": "Farmer input received", "data": payload.model_dump()}
