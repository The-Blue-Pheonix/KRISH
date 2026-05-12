from dataclasses import dataclass

DISEASE_RISK_RULES = {
    "Rice": {"high_humidity": 80, "high_temp": 30, "disease": "Blast fungus"},
    "Wheat": {"high_humidity": 70, "high_temp": 25, "disease": "Rust"},
    "Cotton": {"high_humidity": 75, "high_temp": 35, "disease": "Bollworm"},
    "Corn": {"high_humidity": 72, "high_temp": 28, "disease": "Leaf blight"},
}

NUTRIENT_MAP = {
    "Alluvial": {"deficient": "Zinc", "tip": "Apply zinc sulfate before sowing"},
    "Black": {"deficient": "Phosphorus", "tip": "Use DAP fertilizer"},
    "Red": {"deficient": "Nitrogen", "tip": "Use urea or green manure"},
    "Laterite": {"deficient": "Potassium", "tip": "Use MOP (muriate of potash)"},
}

PEST_SEASON_MAP = {
    "Rice": {"months": [7, 8, 9], "pest": "Brown planthopper"},
    "Wheat": {"months": [11, 12, 1], "pest": "Aphids"},
    "Cotton": {"months": [6, 7, 8, 9], "pest": "Whitefly"},
    "Corn": {"months": [6, 7, 8], "pest": "Fall armyworm"},
}


@dataclass
class CropHealthReport:
    disease_risk: str
    disease_name: str
    pest_alert: bool
    pest_name: str
    nutrient_deficiency: str
    nutrient_tip: str
    health_score: int


def get_crop_health(crop: str, soil: str, temp: float, humidity: float, month: int) -> CropHealthReport:
    rule = DISEASE_RISK_RULES.get(crop, {})
    if humidity >= rule.get("high_humidity", 999) and temp >= rule.get("high_temp", 999):
        risk = "High"
    elif humidity >= rule.get("high_humidity", 999) - 10:
        risk = "Moderate"
    else:
        risk = "Low"

    pest_info = PEST_SEASON_MAP.get(crop, {})
    pest_alert = month in pest_info.get("months", [])

    nutrient = NUTRIENT_MAP.get(soil, {"deficient": "Unknown", "tip": "Test soil first"})

    score = 100
    if risk == "High":
        score -= 30
    elif risk == "Moderate":
        score -= 15
    if pest_alert:
        score -= 20

    return CropHealthReport(
        disease_risk=risk,
        disease_name=rule.get("disease", "None identified"),
        pest_alert=pest_alert,
        pest_name=pest_info.get("pest", "None"),
        nutrient_deficiency=nutrient["deficient"],
        nutrient_tip=nutrient["tip"],
        health_score=max(score, 0),
    )
