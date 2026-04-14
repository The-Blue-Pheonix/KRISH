def generate_recommendation(crop: str, soil_moisture: float) -> str:
    if soil_moisture < 30:
        return f"Recommend irrigation for {crop}."
    return f"No immediate irrigation needed for {crop}."
