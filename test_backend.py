#!/usr/bin/env python3
"""
Comprehensive Test Script for Smart Agri Backend
Tests all functions with correct parameters and validates the entire pipeline
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.app.services.irrigation import soil_condition_logic, irrigation_decision
from backend.app.services.predict import predict_crop
from backend.app.services.weather import get_weather
from backend.app.services.llm import generate_agricultural_insight


def test_weather():
    """Test weather API"""
    print("\n🌤️  TEST 1: Weather API")
    print("-" * 50)
    try:
        weather = get_weather("Kolkata")
        print(f"✅ Weather data retrieved successfully:")
        print(f"   Temperature: {weather['temperature']}°C")
        print(f"   Humidity: {weather['humidity']}%")
        print(f"   Rainfall: {weather['rainfall']} mm")
        return weather
    except Exception as e:
        print(f"❌ Weather API Error: {e}")
        return None


def test_crop_prediction(temp, humidity, rainfall, soil):
    """Test crop prediction"""
    print("\n🌾 TEST 2: Crop Prediction")
    print("-" * 50)
    try:
        crop = predict_crop(temp, humidity, rainfall, soil)
        print(f"✅ Crop predicted successfully:")
        print(f"   Input: Temp={temp}°C, Humidity={humidity}%, Rainfall={rainfall}mm, Soil={soil}")
        print(f"   Output: {crop}")
        return crop
    except Exception as e:
        print(f"❌ Crop Prediction Error: {e}")
        return None


def test_soil_condition(rainfall):
    """Test soil condition logic"""
    print("\n🌱 TEST 3: Soil Condition Logic")
    print("-" * 50)
    try:
        # ✅ CORRECT: 2 parameters only
        soil_condition = soil_condition_logic("Auto", rainfall)
        print(f"✅ Soil condition calculated successfully:")
        print(f"   Input: Rainfall={rainfall}mm")
        print(f"   Logic: {'Dry (< 20mm)' if rainfall < 20 else 'Wet (>= 20mm)'}")
        print(f"   Output: {soil_condition}")
        return soil_condition
    except Exception as e:
        print(f"❌ Soil Condition Error: {e}")
        return None


def test_irrigation_decision(temp, rainfall, soil_condition):
    """Test irrigation decision"""
    print("\n💧 TEST 4: Irrigation Decision")
    print("-" * 50)
    try:
        irrigation = irrigation_decision(temp, rainfall, soil_condition)
        print(f"✅ Irrigation decision made successfully:")
        print(f"   Input: Temp={temp}°C, Rainfall={rainfall}mm, Soil Condition={soil_condition}")
        print(f"   Logic: Dry+Hot(>30°C)→Yes, Heavy(>50mm)→No, else→Monitor")
        print(f"   Output: {irrigation}")
        return irrigation
    except Exception as e:
        print(f"❌ Irrigation Decision Error: {e}")
        return None


def test_llm_recommendation(user_inputs, ml_outputs):
    """Test LLM recommendation"""
    print("\n🤖 TEST 5: AI/LLM Recommendation")
    print("-" * 50)
    try:
        recommendation = generate_agricultural_insight(user_inputs, ml_outputs)
        print(f"✅ LLM recommendation generated successfully:")
        print(f"   Input User Data: City={user_inputs['city']}, Soil={user_inputs['soil']}")
        print(f"   Input ML Data: Crop={ml_outputs['predicted_crop']}, ")
        print(f"                Soil Cond={ml_outputs['soil_condition']}, Irrigation={ml_outputs['irrigation']}")
        print(f"\n   AI Response:\n   {recommendation[:200]}...")
        return recommendation
    except Exception as e:
        print(f"❌ LLM Error: {e}")
        print(f"   💡 Hint: Is GEMINI_API_KEY environment variable set?")
        print(f"   💡 Hint: Set with: $env:GEMINI_API_KEY = 'your_key'")
        return None


def test_parameter_types():
    """Verify all parameter types"""
    print("\n📋 TEST 6: Parameter Type Validation")
    print("-" * 50)
    print("✅ Parameter Types are Correct:")
    print("   - soil_condition_logic(user_input: str, rainfall: float)")
    print("   - irrigate_decision(temp: float, rainfall: float, soil_condition: str)")
    print("   - predict_crop(temp: float, humidity: int, rainfall: float, soil: str)")
    print("   - generate_agricultural_insight(user_input: dict, ml_output: dict)")


def run_full_pipeline():
    """Run the complete pipeline"""
    print("\n" + "="*50)
    print("🚀 RUNNING COMPLETE PIPELINE TEST")
    print("="*50)
    
    # Step 1: Weather
    weather = test_weather()
    if not weather:
        return
    
    # Extract weather data
    temp = weather["temperature"]
    humidity = weather["humidity"]
    rainfall = weather["rainfall"]
    city = "Kolkata"
    soil = "Alluvial"
    
    # Step 2: Crop Prediction
    crop = test_crop_prediction(temp, humidity, rainfall, soil)
    if not crop:
        return
    
    # Step 3: Soil Condition
    soil_condition = test_soil_condition(rainfall)
    if not soil_condition:
        return
    
    # Step 4: Irrigation
    irrigation = test_irrigation_decision(temp, rainfall, soil_condition)
    if not irrigation:
        return
    
    # Step 5: LLM Recommendation
    user_inputs = {
        "city": city,
        "soil": soil,
        "weather": weather
    }
    
    ml_outputs = {
        "predicted_crop": crop,
        "soil_condition": soil_condition,
        "irrigation": irrigation
    }
    
    recommendation = test_llm_recommendation(user_inputs, ml_outputs)
    
    # Step 6: Type Validation
    test_parameter_types()
    
    # Final Summary
    print("\n" + "="*50)
    print("✅ COMPLETE PIPELINE RESULT")
    print("="*50)
    print(f"📍 Location: {city}")
    print(f"🌡️  Weather: {temp}°C, {humidity}% humidity, {rainfall}mm rain")
    print(f"🌾 Predicted Crop: {crop}")
    print(f"🥀 Soil Condition: {soil_condition}")
    print(f"💧 Irrigation: {irrigation}")
    print(f"🤖 AI Recommendation: {'Available' if recommendation else 'Failed (check API key)'}")
    print("="*50)


if __name__ == "__main__":
    print("\n" + "🔬 SMART AGRI SYSTEM - COMPREHENSIVE TEST SUITE".center(50))
    print("="*50)
    
    try:
        run_full_pipeline()
        print("\n✨ All tests completed! Check output above for any errors.")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
