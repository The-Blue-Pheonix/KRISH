def irrigation_decision(temp, rainfall):
    if rainfall < 20 and temp > 30:
        return "Yes"
    return "No"


def should_irrigate(soil_moisture: float, threshold: float = 30.0) -> bool:
    return soil_moisture < threshold
