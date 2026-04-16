# Weather API Configuration (Using Open-Meteo instead of OpenWeatherMap)
import requests

GEOCODING_API_URL = "https://geocoding-api.open-meteo.com/v1/search"
WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast"

def get_weather(city: str = None, latitude: float = None, longitude: float = None):
    """
    Fetch real weather data from Open-Meteo API
    
    Parameters:
    - city: str (optional) - City name to fetch weather for
    - latitude: float (optional) - GPS latitude coordinate
    - longitude: float (optional) - GPS longitude coordinate
    """
    location_name = "Unknown"
    
    try:
        # 1. Resolve city to lat/lon if GPS coordinates are not provided
        if latitude is None or longitude is None:
            if not city:
                raise ValueError("Either city name or GPS coordinates (latitude, longitude) must be provided")
            
            print(f"Geocoding city: {city}")
            geo_response = requests.get(GEOCODING_API_URL, params={"name": city, "count": 1})
            geo_response.raise_for_status()
            geo_data = geo_response.json()
            
            if not geo_data.get("results"):
                raise ValueError(f"Could not find coordinates for city: {city}")
                
            result = geo_data["results"][0]
            latitude = result["latitude"]
            longitude = result["longitude"]
            location_name = result["name"]
        else:
            print(f"Using provided GPS coordinates: lat={latitude}, lon={longitude}")
            location_name = city if city else "GPS Location"

        # 2. Fetch weather using lat/lon
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": ["temperature_2m", "relative_humidity_2m", "precipitation", "cloud_cover", "surface_pressure", "wind_speed_10m", "weather_code"]
        }
        
        response = requests.get(WEATHER_API_URL, params=params)
        response.raise_for_status()
        
        data = response.json()
        current = data.get("current", {})
        
        # Open-Meteo weather codes (WMO) to text mapping (simplified)
        wmo_code = current.get("weather_code", 0)
        weather_main = "Clear"
        if wmo_code >= 50: weather_main = "Rainy"
        elif wmo_code >= 1: weather_main = "Cloudy"
        
        cloud_coverage = current.get("cloud_cover", 0)
        
        return {
            "temperature": current.get("temperature_2m", 0),
            "feels_like": current.get("temperature_2m", 0), # Open-Meteo current doesn't provide apparent temperature by default
            "humidity": current.get("relative_humidity_2m", 0),
            "rainfall": current.get("precipitation", 0),
            "rain_probability": cloud_coverage, # Using cloud coverage as rough proxy
            "cloud_coverage": cloud_coverage,
            "weather": weather_main,
            "description": f"WMO Code {wmo_code}",
            "pressure": current.get("surface_pressure", 0),
            "visibility": 10000, # Missing in basic current
            "wind_speed": current.get("wind_speed_10m", 0),
            "location": location_name
        }
    except requests.exceptions.RequestException as e:
        print(f"Error fetching weather data: {e}")
        raise
    except KeyError as e:
        print(f"Error parsing weather data: {e}")
        raise
