import os
from dotenv import load_dotenv
from functools import lru_cache
from pathlib import Path
import time
from typing import Dict
import hashlib
from groq import Groq

# Load .env from backend folder (2 levels up from this file)
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# Configure the API key
api_key = os.environ.get("GROQ_API_KEY")
if not api_key:
    raise ValueError("GROQ_API_KEY not found in environment variables. Please add it to .env file.")

client = Groq(api_key=api_key)
print(f"[LLM] Configured Groq API")

# ===== REQUEST THROTTLING & RATE LIMITING =====
class RequestThrottler:
    """Prevents rate limiting by throttling requests"""
    def __init__(self, min_interval=0.5):
        self.last_request_time = 0
        self.min_interval = min_interval
    
    def wait_if_needed(self):
        elapsed = time.time() - self.last_request_time
        if elapsed < self.min_interval:
            sleep_time = self.min_interval - elapsed
            print(f"[THROTTLE] Waiting {sleep_time:.2f}s to avoid rate limit...")
            time.sleep(sleep_time)
        self.last_request_time = time.time()

throttler = RequestThrottler(min_interval=0.5)

# ===== SMART CACHING =====
prompt_cache: Dict[str, str] = {}  # Fresh cache on each server restart
cache_hits = 0
cache_misses = 0

def get_cache_key(prompt: str) -> str:
    """Generate cache key from prompt (first 100 chars + hash)"""
    return hashlib.md5(prompt.encode()).hexdigest()

def clear_llm_cache():
    """Clear the LLM response cache (useful for debugging or API changes)"""
    global prompt_cache, cache_hits, cache_misses
    prompt_cache.clear()
    cache_hits = 0
    cache_misses = 0
    print("[CACHE] Cleared all cached responses")

def cached_llm_call(prompt: str, max_retries: int = 3) -> str:
    """
    Cached wrapper for Gemini LLM calls with retry logic
    - Reduces API calls via intelligent caching
    - Retries on quota errors with exponential backoff
    - Throttles requests to avoid rate limiting
    
    Args:
        prompt: The prompt to send to Gemini
        max_retries: Number of retry attempts on quota errors (default: 3)
    
    Returns:
        Generated response text
    """
    global cache_hits, cache_misses
    
    cache_key = get_cache_key(prompt)
    
    # Check cache first
    if cache_key in prompt_cache:
        cache_hits += 1
        print(f"[CACHE HIT] ({cache_hits} hits, {cache_misses} misses)")
        return prompt_cache[cache_key]
    
    cache_misses += 1
    print(f"[CACHE MISS] ({cache_hits} hits, {cache_misses} misses)")
    
    # Retry logic with exponential backoff
    for attempt in range(1, max_retries + 1):
        try:
            # Throttle to prevent rate limiting
            throttler.wait_if_needed()
            
            # Try Groq API call
            chat_completion = client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                model="llama-3.1-8b-instant",
            )
            result = chat_completion.choices[0].message.content
            
            # Cache only valid responses (not errors or quota messages)
            if not any(x in result.lower() for x in ["quota", "error", "failed", "❌", "🚨"]):
                prompt_cache[cache_key] = result
                print(f"[LLM SUCCESS] Response cached (cache size: {len(prompt_cache)})")
            else:
                print(f"[LLM] Skipped caching error response")
            return result
            
        except Exception as e:
            error_msg = str(e).lower()
            
            # Check if it's a quota/rate limit error
            if "429" in str(e) or "quota" in error_msg or "resource exhausted" in error_msg:
                if attempt < max_retries:
                    # Exponential backoff: 2^attempt seconds
                    wait_time = 2 ** attempt
                    print(f"[QUOTA ERROR] Attempt {attempt}/{max_retries}. Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                    continue
                else:
                    print(f"[QUOTA EXCEEDED] Max retries reached after {max_retries} attempts")
                    return f"🚨 API quota exceeded. This typically means either:\n" \
                           f"1. Daily request limit reached (try after 24 hours)\n" \
                           f"2. Free tier quota exhausted (upgrade to paid plan)\n" \
                           f"3. Too many concurrent requests (wait a minute and retry)\n" \
                           f"\nFor now, use local recommendations based on your soil and weather."
            
            # Handle other errors
            error_msg = str(e)
            print(f"[LLM ERROR] Attempt {attempt}/{max_retries}: {error_msg}")
            
            if "404" in str(e) or "not found" in error_msg:
                return "❌ Model not found. Please check your API key permissions."
            if "401" in str(e) or "permission" in error_msg or "unauthenticated" in error_msg:
                return "❌ API key authentication failed. Please verify your GEMINI_API_KEY in .env"
            if "invalid" in error_msg or "api_key" in error_msg:
                return "❌ Invalid API key. Check your .env file."
            
            # For other errors, retry if attempts remain
            if attempt < max_retries:
                wait_time = 2 ** attempt
                print(f"[RETRY] Attempt {attempt}/{max_retries}. Waiting {wait_time}s...")
                time.sleep(wait_time)
            else:
                return f"❌ Error generating recommendation: {str(e)[:100]}"
    
    return "❌ Failed to generate recommendation after all retries."

# Define the knowledge base (RAG chunks) provided by the user
KNOWLEDGE_BASE = """
Q: What is the most common soil type in West Bengal?
A: Alluvial soil is the most widespread soil type in West Bengal. It covers the majority of the Gangetic Plains and the delta region, spanning approximately 28,921 sq km. It is the most fertile and agriculturally important soil in the state.

Q: Which soil is best for growing tea in West Bengal?
A: Laterite soil in the hilly regions of Darjeeling and Jalpaiguri is used for tea cultivation. Although this soil has low natural fertility due to high iron oxide content and excessive leaching, proper fertilization and farming methods allow the world-famous Darjeeling tea to thrive on it.

Q: What crops grow in red soil in West Bengal?
A: Red soil, found mainly in Bankura, Purulia, and Birbhum, is suitable for millets, oilseeds, fruits, and vegetables. It is used primarily for dry farming due to its well-drained nature, though it responds well to nitrogenous and phosphatic fertilizers when paddy is grown.

Q: What is the pH range of Terai soils?
A: Terai soils are acidic with a pH range of 4.7 to 5.8, due to severe leaching by rainfall and high organic matter content.

Q: How are coastal soils classified in West Bengal?
A: Coastal soils (also called saline soils) in West Bengal are classified into four types: (1) Saline soils, (2) Saline sodic soils, (3) Non-saline sodic soils, and (4) Degraded sodic soils, based on their salt content and exchangeable sodium percentage.

Q: What is the difference between Khadar and Bhangar soil?
A: Khadar refers to younger alluvial soil (Ganga alluvium) — newer, more fertile, and found closer to river channels. Bhangar refers to older alluvial soil (Vindhya alluvium) — found along the outer edges of the plateau fringe, and has lost some fertility through leaching over time.

Q: Which districts have laterite soil in West Bengal?
A: Laterite and lateritic soils are found in Birbhum, Burdwan (Barddhaman), Bankura, and Midnapur districts. In hilly areas, laterite soils also occur in Darjeeling and Jalpaiguri.

Q: What fertilizer is most effective for paddy on Terai soil?
A: A combination of nitrogen and phosphate fertilizers has been found to be most effective for increasing paddy yield on Terai soils.

Q: Which soil type in West Bengal is suitable for mangrove growth?
A: Marshy and saline coastal soils found in the Sundarbans region are suitable for specific mangrove species. These soils are wet, saline, and organic-rich.

Q: What are the main agricultural soils of the Sundarbans?
A: The Sundarbans region has coastal sandy soil and marshy/saline soil. Coastal sandy soil is used for coconut cultivation and fish farming. Marshy saline soils support mangrove ecosystems. Excess salt and clay generally limit rice and vegetable cultivation.
"""

# Language configuration
LANGUAGE_CONFIG = {
    'en': {
        'name': 'English',
        'rule': 'ALWAYS respond in English language ONLY',
        'no_question': 'No question provided - give general advice',
        'location_label': 'West Bengal, India'
    },
    'bn': {
        'name': 'Bengali',
        'rule': 'ALWAYS respond in Bengali language ONLY',
        'no_question': 'কোনো প্রশ্ন নেই - সাধারণ পরামর্শ দিন',
        'location_label': 'পশ্চিমবঙ্গ'
    },
    'hi': {
        'name': 'Hindi',
        'rule': 'ALWAYS respond in Hindi language ONLY',
        'no_question': 'कोई सवाल नहीं दिया गया है - सामान्य सलाह दें',
        'location_label': 'भारत'
    },
    'mr': {
        'name': 'Marathi',
        'rule': 'ALWAYS respond in Marathi language ONLY',
        'no_question': 'कोणतेही प्रश्न दिलेले नाहीत - सामान्य सल्ला द्या',
        'location_label': 'भारत'
    },
    'ta': {
        'name': 'Tamil',
        'rule': 'ALWAYS respond in Tamil language ONLY',
        'no_question': 'கேள்வி எதுவும் இல்லை - பொது ஆலோசனை கொடுக்கவும்',
        'location_label': 'இந்தியா'
    }
}

def generate_agricultural_insight(user_input: dict, ml_output: dict) -> str:
    """
    Takes user input (including farmer's question) and ML model output,
    and generates AI recommendation using LLM with knowledge base.
    Responds in the user's selected website language.
    """
    
    try:
        # Get language from user input (default to English)
        user_language = user_input.get('language', 'en').lower()
        if user_language not in LANGUAGE_CONFIG:
            user_language = 'en'
        
        lang_config = LANGUAGE_CONFIG[user_language]
        user_question = user_input.get('query')
        
        crop_health = ml_output.get("crop_health") or {}
        crop_health_block = ""
        if crop_health:
            pest_text = (
                f"YES - {crop_health.get('pest_name', 'Unknown')}"
                if crop_health.get("pest_alert")
                else "No current threat"
            )
            crop_health_block = f"""

Crop Health Analysis:
- Disease risk: {crop_health.get('disease_risk', 'Unknown')} ({crop_health.get('disease_name', 'Unknown')})
- Pest alert: {pest_text}
- Soil nutrient gap: {crop_health.get('nutrient_deficiency', 'Unknown')} - {crop_health.get('nutrient_tip', 'Unknown')}
- Overall health score: {crop_health.get('health_score', crop_health.get('score', 'Unknown'))}/100
"""

        prompt = f"""
You are an expert Agricultural AI Assistant for farmers in {lang_config['location_label']}.

🚨 CRITICAL RULES (MUST FOLLOW):
1. {lang_config['rule']}
2. Use THESE EXACT VALUES provided - DO NOT suggest checking apps
3. Keep response within 2-3 short sentences MAXIMUM
4. ANSWER THE FARMER'S QUESTION DIRECTLY
5. NEVER say "check your weather app" or "see mobile"
6. NEVER suggest external resources
7. Use ONLY the data provided below - no hallucinations
8. say hello only first time. If the farmer asks again, skip greetings and get straight to the point.

⭐ REAL-TIME DATA (Use these exact values):
Temperature: {user_input['weather'].get('temperature', 'Unknown')} °C
Humidity: {user_input['weather'].get('humidity', 'Unknown')} %
Rainfall: {user_input['weather'].get('rainfall', 'Unknown')} mm
Weather Condition: {user_input.get('weather_condition', 'Unknown')}
Soil Type: {user_input.get('soil', 'Unknown')}
Recommended Crop: {ml_output.get('predicted_crop', 'Unknown')}
Irrigation Needed: {ml_output.get('irrigation', 'Unknown')}
{crop_health_block}

❓ Farmer's Question:
{user_question if user_question else lang_config['no_question']}

📋 TASK (REQUIRED):
- MUST include exactly this temperature in your reply: {user_input['weather'].get('temperature', 'Unknown')}°C
- MUST include exactly this rainfall in your reply: {user_input['weather'].get('rainfall', 'Unknown')}mm
- If asked about CROPS: Recommend {ml_output.get('predicted_crop', 'Unknown')} based on soil
- If asked about WATER: Say irrigation is needed = {ml_output.get('irrigation', 'Unknown')}
- ANSWER IN {lang_config['name'].upper()} ONLY
- Be direct and practical, integrating the live data smoothly into your response.
"""
        print(f"[LLM] Language: {lang_config['name']} | Prompt (first 200 chars): {prompt[:200]}")
        response = cached_llm_call(prompt)
        return response
    except Exception as e:
        error_msg = str(e)
        print(f"[LLM ERROR] generate_agricultural_insight failed: {error_msg}")
        # Fallback to local recommendation on any error
        user_language = user_input.get('language', 'en').lower()
        if user_language not in LANGUAGE_CONFIG:
            user_language = 'en'
        lang_config = LANGUAGE_CONFIG[user_language]
        return generate_local_recommendation(user_input, ml_output, lang_config)


def generate_local_recommendation(user_input: dict, ml_output: dict, lang_config: dict) -> str:
    """
    Generate recommendation from local knowledge base when API quota is exceeded.
    This ensures farmers still get helpful advice even when API limits are hit.
    """
    soil = user_input.get('soil', 'Alluvial')
    temp = user_input['weather'].get('temperature', 0)
    rainfall = user_input['weather'].get('rainfall', 0)
    crop = ml_output.get('predicted_crop', 'Rice')
    irrigation = ml_output.get('irrigation', 'Yes')
    
    # Language-specific fallback recommendations
    recommendations = {
        'en': generate_english_fallback(soil, crop, temp, rainfall, irrigation),
        'bn': generate_bengali_fallback(soil, crop, temp, rainfall, irrigation),
        'hi': generate_hindi_fallback(soil, crop, temp, rainfall, irrigation),
        'mr': generate_marathi_fallback(soil, crop, temp, rainfall, irrigation),
        'ta': generate_tamil_fallback(soil, crop, temp, rainfall, irrigation),
    }
    
    language = lang_config.get('name', 'en').lower()
    if language == 'bengali':
        language = 'bn'
    elif language == 'hindi':
        language = 'hi'
    elif language == 'marathi':
        language = 'mr'
    elif language == 'tamil':
        language = 'ta'
    else:
        language = 'en'
    
    return recommendations.get(language, recommendations['en'])


def generate_english_fallback(soil: str, crop: str, temp: int, rainfall: int, irrigation: str) -> str:
    """English fallback recommendations"""
    rec = f"Your {soil} soil is ideal for {crop}. "
    if temp > 30:
        rec += "High temperature detected - ensure adequate water supply. "
    if rainfall < 5:
        rec += "Low rainfall - irrigation is recommended. "
    elif rainfall > 15:
        rec += "Good rainfall - check field drainage. "
    rec += f"Current forecast: {irrigation} irrigation needed."
    return rec


def generate_bengali_fallback(soil: str, crop: str, temp: int, rainfall: int, irrigation: str) -> str:
    """Bengali fallback recommendations"""
    bengali_soils = {
        'Alluvial': 'পলিযুক্ত মাটি',
        'Laterite': 'ল্যাটেরাইট মাটি',
        'Black': 'কালো মাটি',
        'Red': 'লাল মাটি'
    }
    bengali_crops = {
        'Rice': 'ধান',
        'Wheat': 'গম',
        'Corn': 'ভুট্টা',
        'Sugarcane': 'আখ',
        'Jute': 'পাট'
    }
    
    soil_bn = bengali_soils.get(soil, 'আপনার মাটি')
    crop_bn = bengali_crops.get(crop, 'চাষ') 
    irrigation_bn = 'প্রয়োজন' if irrigation == 'Yes' else 'করবেন না'
    
    rec = f"আপনার {soil_bn} {crop_bn} চাষের জন্য উপযুক্ত। "
    if temp > 30:
        rec += "তাপমাত্রা বেশি - পর্যাপ্ত জল নিশ্চিত করুন। "
    if rainfall < 5:
        rec += "বৃষ্টি কম - সেচ করার পরামর্শ দিচ্ছি। "
    rec += f"আজ সেচ {irrigation_bn}।"
    return rec


def generate_hindi_fallback(soil: str, crop: str, temp: int, rainfall: int, irrigation: str) -> str:
    """Hindi fallback recommendations"""
    hindi_soils = {
        'Alluvial': 'जलोढ़ मिट्टी',
        'Laterite': 'लेटराइट मिट्टी',
        'Black': 'काली मिट्टी',
        'Red': 'लाल मिट्टी'
    }
    hindi_crops = {
        'Rice': 'चावल',
        'Wheat': 'गेहूं',
        'Corn': 'मकई',
        'Sugarcane': 'गन्ना',
        'Jute': 'पटसन'
    }
    
    soil_hi = hindi_soils.get(soil, 'आपकी मिट्टी')
    crop_hi = hindi_crops.get(crop, 'फसल')
    irrigation_hi = 'करें' if irrigation == 'Yes' else 'न करें'
    
    rec = f"आपकी {soil_hi} {crop_hi} की खेती के लिए उत्तम है। "
    if temp > 30:
        rec += "तापमान अधिक है - पर्याप्त पानी दें। "
    if rainfall < 5:
        rec += "वर्षा कम है - सिंचाई की सलाह है। "
    rec += f"आज सिंचाई {irrigation_hi}।"
    return rec


def generate_marathi_fallback(soil: str, crop: str, temp: int, rainfall: int, irrigation: str) -> str:
    """Marathi fallback recommendations"""
    marathi_soils = {
        'Alluvial': 'दोन्या मातीच',
        'Laterite': 'लॅटेराइट मातीच',
        'Black': 'काळी माती',
        'Red': 'लाल माती'
    }
    
    soil_mr = marathi_soils.get(soil, 'तुमची माती')
    irrigation_mr = 'करण्यास सुचवितो' if irrigation == 'Yes' else 'करू नका'
    
    rec = f"तुमची {soil_mr} {crop} शेतीसाठी मूल्यवान आहे। "
    if temp > 30:
        rec += "तापमान जास्त आहे - पुरेशी पाणी द्या। "
    if rainfall < 5:
        rec += "पाऊस कमी आहे - सिंचन {irrigation_mr}। "
    return rec


def generate_tamil_fallback(soil: str, crop: str, temp: int, rainfall: int, irrigation: str) -> str:
    """Tamil fallback recommendations"""
    tamil_soils = {
        'Alluvial': 'களிமண் மண்',
        'Laterite': 'லேட்டிரைட் மண்',
        'Black': 'கருப்பு மண்',
        'Red': 'சிவந்த மண்'
    }
    tamil_crops = {
        'Rice': 'நெல்',
        'Wheat': 'கோதுமை',
        'Corn': 'மக்காச்சோளம்',
        'Sugarcane': 'கரும்பு',
        'Jute': 'ஆட்டை'
    }
    
    soil_ta = tamil_soils.get(soil, 'உங்கள் மண்')
    crop_ta = tamil_crops.get(crop, 'பயிர்')
    irrigation_ta = 'செய்க' if irrigation == 'Yes' else 'செய்ய வேண்டாம்'
    
    rec = f"உங்கள் {soil_ta} {crop_ta} பயிர்ச்செயல்பாட்டிற்கு சிறந்தது. "
    if temp > 30:
        rec += "வெப்பநிலை அதிகம் - போதுமான நீர் கொடுக்கவும். "
    if rainfall < 5:
        rec += "மழை குறைவு - பாசனம் {irrigation_ta}। "
    return rec
