#!/usr/bin/env python3
"""Test script for weather API integration"""

import sys
sys.path.insert(0, "backend")

from app.services.weather import get_weather

# Test with a city
test_cities = ["London", "New York", "Delhi", "Mumbai"]

print("Testing Weather API...")
print("-" * 50)

for city in test_cities:
    try:
        print(f"\n📍 Testing {city}...")
        weather_data = get_weather(city)
        print(f"✅ Success!")
        print(f"   Temperature: {weather_data['temperature']}°C")
        print(f"   Humidity: {weather_data['humidity']}%")
        print(f"   Rainfall: {weather_data['rainfall']}mm")
    except Exception as e:
        print(f"❌ Error: {e}")

print("\n" + "-" * 50)
print("Testing complete!")
