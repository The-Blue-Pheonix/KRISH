def should_irrigate(soil_moisture: float, threshold: float = 30.0) -> bool:
    return soil_moisture < threshold
