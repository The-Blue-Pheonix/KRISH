from fastapi import APIRouter

router = APIRouter()


@router.post("/input")
def submit_farmer_input(payload: dict):
    return {"message": "Farmer input received", "data": payload}
