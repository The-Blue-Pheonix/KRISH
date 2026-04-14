from fastapi import APIRouter

router = APIRouter()


@router.post("/data")
def receive_sensor_data(payload: dict):
    return {"message": "Sensor data received", "data": payload}
