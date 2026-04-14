# Weather API Configuration
import requests

WEATHER_API_KEY = "4c141661f65e59c0577c0c3759fbde43"
WEATHER_API_URL = "https://api.openweathermap.org/data/2.5/weather"

def get_weather(city: str):
    """Fetch real weather data from OpenWeatherMap API"""
    try:
        params = {
            "q": city,
            "appid": WEATHER_API_KEY,
            "units": "metric"  # Get temperature in Celsius
        }
        response = requests.get(WEATHER_API_URL, params=params)
        response.raise_for_status()
        
        data = response.json()
        return {
            "temperature": data["main"]["temp"],
            "humidity": data["main"]["humidity"],
            "rainfall": data.get("rain", {}).get("1h", 0)  # 1 hour rainfall in mm
        }
    except requests.exceptions.RequestException as e:
        print(f"Error fetching weather data: {e}")
        print(f"API Key used: {WEATHER_API_KEY}")
        print(f"API URL: {WEATHER_API_URL}")
        raise


