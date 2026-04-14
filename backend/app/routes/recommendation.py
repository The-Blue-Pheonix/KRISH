from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def get_recommendation(crop: str = "rice", soil_moisture: float = 0.0):
    return {
        "crop": crop,
        "soil_moisture": soil_moisture,
        "recommendation": "Irrigate" if soil_moisture < 30 else "No irrigation needed",
    }
