"""
Core Engine for Krishi Bot
Handles the complete pipeline:
User Input → Location Save → Weather/ML Data → LLM Prompt → Response
"""

import os
import json
from typing import Dict, Optional
from datetime import datetime
from pathlib import Path
import requests
from dotenv import load_dotenv
from services.llm import cached_llm_call
import logging

load_dotenv()
logger = logging.getLogger(__name__)

# User location storage (use database in production)
USER_LOCATIONS_FILE = Path(__file__).parent.parent / "data" / "user_locations.json"
USER_LOCATIONS_FILE.parent.mkdir(exist_ok=True)

# ==================== Location Storage ====================

def save_user_location(user_id: int, location: str):
    """Save user's location"""
    try:
        locations = {}
        if USER_LOCATIONS_FILE.exists():
            with open(USER_LOCATIONS_FILE, 'r') as f:
                locations = json.load(f)
        
        locations[str(user_id)] = {
            'location': location,
            'saved_at': datetime.now().isoformat()
        }
        
        with open(USER_LOCATIONS_FILE, 'w') as f:
            json.dump(locations, f, indent=2)
        
        logger.info(f"Saved location for user {user_id}: {location}")
        return True
    except Exception as e:
        logger.error(f"Error saving location: {e}")
        return False

def get_user_location(user_id: int) -> Optional[str]:
    """Retrieve user's saved location"""
    try:
        if USER_LOCATIONS_FILE.exists():
            with open(USER_LOCATIONS_FILE, 'r') as f:
                locations = json.load(f)
            return locations.get(str(user_id), {}).get('location')
    except Exception as e:
        logger.error(f"Error retrieving location: {e}")
    return None

# ==================== Weather Data ====================

class WeatherAPI:
    """Fetch weather data for location-based context"""
    
    @staticmethod
    def get_weather(location: str) -> Dict:
        """Get weather data (using Open-Meteo free API - no key needed)"""
        try:
            # Using Open-Meteo free API (no authentication needed)
            # First, geocode the location
            geo_url = "https://geocoding-api.open-meteo.com/v1/search"
            geo_params = {
                'name': location,
                'count': 1,
                'language': 'en',
                'format': 'json'
            }
            
            geo_response = requests.get(geo_url, params=geo_params, timeout=5)
            geo_data = geo_response.json()
            
            if not geo_data.get('results'):
                return {
                    'error': f'Location "{location}" not found',
                    'location': location
                }
            
            result = geo_data['results'][0]
            latitude = result['latitude']
            longitude = result['longitude']
            
            # Get weather data
            weather_url = "https://api.open-meteo.com/v1/forecast"
            weather_params = {
                'latitude': latitude,
                'longitude': longitude,
                'current': 'temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m',
                'daily': 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum',
                'timezone': 'auto'
            }
            
            weather_response = requests.get(weather_url, params=weather_params, timeout=5)
            weather_data = weather_response.json()
            
            return {
                'location': f"{result['name']}, {result.get('admin1', '')}, {result['country']}",
                'latitude': latitude,
                'longitude': longitude,
                'current': weather_data.get('current', {}),
                'daily': weather_data.get('daily', {}),
                'success': True
            }
        
        except Exception as e:
            logger.error(f"Weather API error: {e}")
            return {'error': str(e), 'location': location}

# ==================== ML Context Data ====================

class ContextBuilder:
    """Build context from ML/historical data"""
    
    @staticmethod
    def get_season() -> str:
        """Determine current Indian agricultural season"""
        month = datetime.now().month
        
        if month in [6, 7, 8, 9, 10]:
            return "Kharif (Monsoon) - June to October"
        elif month in [11, 12, 1, 2, 3]:
            return "Rabi (Winter) - November to March"
        else:
            return "Zaid (Summer) - March to June"
    
    @staticmethod
    def get_crop_context() -> str:
        """Get best crops for current season"""
        season = ContextBuilder.get_season()
        
        crop_data = {
            "Kharif (Monsoon) - June to October": {
                'crops': ['Rice', 'Maize', 'Sugarcane', 'Cotton', 'Soybean'],
                'rainfall': 'High',
                'irrigation': 'Low (monsoon provides)'
            },
            "Rabi (Winter) - November to March": {
                'crops': ['Wheat', 'Barley', 'Chickpea', 'Mustard', 'Lentil'],
                'rainfall': 'Low',
                'irrigation': 'High'
            },
            "Zaid (Summer) - March to June": {
                'crops': ['Cucumber', 'Melon', 'Watermelon', 'Squash'],
                'rainfall': 'Very Low',
                'irrigation': 'Very High'
            }
        }
        
        data = crop_data.get(season, {})
        return f"Season: {season}\nSuitable Crops: {', '.join(data.get('crops', []))}"
    
    @staticmethod
    def get_soil_context() -> str:
        """Get generic soil recommendations"""
        return """
Common Soil Issues in India:
• Acidic soils in Western Ghats: Add lime
• Alkaline soils in North: Add sulfur
• Poor drainage: Add organic matter
• Nutrient deficiency: Use balanced fertilizers
"""

# ==================== Core Pipeline ====================

def build_llm_prompt(user_message: str, user_id: int, user_location: Optional[str] = None) -> Dict:
    """
    Build comprehensive LLM prompt with context
    
    Returns: {'prompt': str, 'context': dict}
    """
    
    # 1. Get location (saved or provided)
    location = user_location or get_user_location(user_id)
    location = location or "India (Generic)"
    
    # 2. Get weather data
    weather_info = WeatherAPI.get_weather(location)
    
    # 3. Build context
    season_info = ContextBuilder.get_season()
    crop_context = ContextBuilder.get_crop_context()
    soil_context = ContextBuilder.get_soil_context()
    
    # 4. Create weather context string
    if weather_info.get('success'):
        current = weather_info.get('current', {})
        weather_context = f"""
Current Weather in {weather_info['location']}:
• Temperature: {current.get('temperature_2m', 'N/A')}°C
• Humidity: {current.get('relative_humidity_2m', 'N/A')}%
• Wind Speed: {current.get('wind_speed_10m', 'N/A')} km/h
"""
    else:
        weather_context = f"\nLocation: {location} (Weather unavailable)"
    
    # 5. Build the LLM prompt with all context
    full_prompt = f"""
You are an expert agricultural advisor for Indian farmers.

CONTEXT:
{season_info}
{crop_context}
{soil_context}
{weather_context}

USER QUESTION: {user_message}

INSTRUCTIONS:
- Give practical, actionable advice for Indian farmers
- Consider the current season and location
- Be concise and clear
- Include specific crop names and techniques when relevant
- Suggest local-friendly solutions
- Add weather-based recommendations when applicable

RESPONSE:
"""
    
    return {
        'prompt': full_prompt,
        'context': {
            'user_id': user_id,
            'location': location,
            'season': season_info,
            'weather': weather_info,
            'timestamp': datetime.now().isoformat()
        }
    }

def clean_response(response: str) -> str:
    """Clean and format LLM response for Telegram"""
    # Remove excessive newlines
    response = '\n'.join([line.strip() for line in response.split('\n') if line.strip()])
    
    # Add emojis for better readability
    response = response.replace('Recommendation:', '💡 Recommendation:')
    response = response.replace('Warning:', '⚠️ Warning:')
    response = response.replace('Note:', '📝 Note:')
    response = response.replace('Tip:', '💡 Tip:')
    
    return response

# ==================== Main Processing Function ====================

async def process_user_query(user_id: int, message: str, location: Optional[str] = None) -> str:
    """
    Main function: Process user query through entire pipeline
    
    Flow:
    1. Save location if provided
    2. Build LLM prompt with context (weather, season, crops, soil)
    3. Call LLM with contextualized prompt
    4. Clean and format response
    5. Return to user
    """
    
    try:
        logger.info(f"Processing query from user {user_id}: {message[:50]}...")
        
        # Step 1: Save location if provided
        if location:
            save_user_location(user_id, location)
            logger.info(f"Location saved: {location}")
        
        # Step 2: Build contextualized prompt
        prompt_data = build_llm_prompt(message, user_id, location)
        
        logger.info(f"Context built. Location: {prompt_data['context']['location']}")
        
        # Step 3: Get LLM response
        logger.info("Calling LLM...")
        llm_response = await __call_llm_async(prompt_data['prompt'])
        
        # Step 4: Clean response
        cleaned_response = clean_response(llm_response)
        
        # Step 5: Return formatted response
        logger.info("Response ready for user")
        return cleaned_response
    
    except Exception as e:
        logger.error(f"Pipeline error: {e}")
        return f"❌ Error processing your request: {str(e)}"

async def __call_llm_async(prompt: str) -> str:
    """Async wrapper for LLM call"""
    import asyncio
    return await asyncio.to_thread(cached_llm_call, prompt)

# ==================== Utility Functions ====================

def get_quick_recommendations(user_id: int) -> str:
    """Get quick farming tips based on current season"""
    season = ContextBuilder.get_season()
    crop_info = ContextBuilder.get_crop_context()
    
    return f"""
*🌾 Quick Recommendations for {season}*

{crop_info}

💡 Tips:
• Prepare soil before planting
• Check weather forecast regularly
• Use certified seeds
• Practice crop rotation
• Monitor pest activity
"""

def get_farm_summary(user_id: int) -> str:
    """Get farm summary for user"""
    location = get_user_location(user_id) or "Not set"
    season = ContextBuilder.get_season()
    
    return f"""
*📊 Your Farm Status*

📍 Location: {location}
🌾 Season: {season}
⏰ Time: {datetime.now().strftime('%Y-%m-%d %H:%M')}

Use /aichat to get personalized recommendations!
"""
