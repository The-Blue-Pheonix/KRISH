def fetch_weather(location: str) -> dict:
    return {
        "location": location,
        "temperature_c": 30,
        "humidity": 65,
        "condition": "Sunny",
    }
