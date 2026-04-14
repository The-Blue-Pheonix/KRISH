import joblib
import numpy as np
import os

# ✅ Correct path (important!)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))

# Valid soil types
VALID_SOILS = {"Alluvial", "Laterite", "Black", "Red"}

# Try to load models, fall back to mock data if not available
try:
    model = joblib.load(os.path.join(BASE_DIR, "models", "model.pkl"))
    label_encoder = joblib.load(os.path.join(BASE_DIR, "models", "label_encoder.pkl"))
    soil_encoder = joblib.load(os.path.join(BASE_DIR, "models", "soil_encoder.pkl"))
    MODELS_LOADED = True
except FileNotFoundError:
    model = None
    label_encoder = None
    soil_encoder = None
    MODELS_LOADED = False
    print("⚠️  Model files not found. Using mock predictions.")

def predict_crop(temp, humidity, rainfall, soil):
    # ✅ Validate soil type
    if soil not in VALID_SOILS:
        raise ValueError(f"Invalid soil type: {soil}. Must be one of {VALID_SOILS}")
    
    if MODELS_LOADED:
        soil_encoded = soil_encoder.transform([soil])[0]
        features = np.array([[temp, humidity, rainfall, soil_encoded]])
        pred = model.predict(features)
        crop = label_encoder.inverse_transform(pred)[0]
    else:
        # Mock prediction for testing
        crop_map = {
            "Alluvial": "Rice",
            "Laterite": "Corn",
            "Black": "Cotton",
            "Red": "Wheat"
        }
        crop = crop_map[soil]

    return crop
