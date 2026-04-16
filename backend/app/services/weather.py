# Weather API Configuration
import requests

WEATHER_API_KEY = "4c141661f65e59c0577c0c3759fbde43"
WEATHER_API_URL = "https://api.openweathermap.org/data/2.5/weather"

def get_weather(city: str = None, latitude: float = None, longitude: float = None):
    """
    Fetch real weather data from OpenWeatherMap API
    
    Parameters:
    - city: str (optional) - City name to fetch weather for
    - latitude: float (optional) - GPS latitude coordinate
    - longitude: float (optional) - GPS longitude coordinate
    
    If both GPS coordinates and city are provided, GPS coordinates take precedence.
    At least one of (city) or (latitude, longitude) must be provided.
    """
    try:
        params = {
            "appid": WEATHER_API_KEY,
            "units": "metric"  # Get temperature in Celsius
        }
        
        # Use GPS coordinates if provided, otherwise use city name
        if latitude is not None and longitude is not None:
            params["lat"] = latitude
            params["lon"] = longitude
            print(f"Fetching weather for GPS coordinates: lat={latitude}, lon={longitude}")
        elif city:
            params["q"] = city
            print(f"Fetching weather for city: {city}")
        else:
            raise ValueError("Either city name or GPS coordinates (latitude, longitude) must be provided")
        
        response = requests.get(WEATHER_API_URL, params=params)
        response.raise_for_status()
        
        data = response.json()
        return {
            "temperature": data["main"]["temp"],
            "humidity": data["main"]["humidity"],
            "rainfall": data.get("rain", {}).get("1h", 0),  # 1 hour rainfall in mm
            "location": data.get("name", "Unknown")  # Location name from API
        }
    except requests.exceptions.RequestException as e:
        print(f"Error fetching weather data: {e}")
        print(f"API Key used: {WEATHER_API_KEY}")
        print(f"API URL: {WEATHER_API_URL}")
        raise
