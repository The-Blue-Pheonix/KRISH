import google.generativeai as genai
import os
from dotenv import load_dotenv
from functools import lru_cache

load_dotenv()

# Configure the API key from environment variable (.env file)
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY not found in environment variables. Please add it to .env file.")

genai.configure(api_key=api_key)
print(f"[LLM] Configured Gemini API with key: {api_key[:10]}...{api_key[-10:]}")

# Cached helper function to reduce API calls
@lru_cache(maxsize=100)
def cached_llm_call(prompt: str) -> str:
    """
    Cached wrapper for Gemini LLM calls
    Uses gemini-2.5-pro (latest production model)
    Falls back to gemini-2.5-flash if needed
    """
    try:
        # Try primary model first (best quality)
        try:
            model = genai.GenerativeModel('gemini-2.5-flash')
            response = model.generate_content(prompt)
            return response.text
        except Exception as primary_error:
            # Fallback to pro model
            print(f"[LLM] Primary model error, trying fallback. Error: {primary_error}")
            model = genai.GenerativeModel('gemini-pro')
            response = model.generate_content(prompt)
            return response.text
            
    except Exception as e:
        error_msg = str(e)
        print(f"ACTUAL GEMINI ERROR: {error_msg}")
        if "429" in error_msg or "quota" in error_msg.lower():
            return "Quota exceeded. Your daily API limit is reached. Please try again tomorrow or upgrade your API plan."
        if "404" in error_msg or "not found" in error_msg.lower():
            return "Model not found. Please check your API key permissions."
        if "401" in error_msg or "permission" in error_msg.lower():
            return "API key authentication failed. Please verify your credentials."
        return f"Error generating recommendation: {str(e)[:100]}"

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

def generate_agricultural_insight(user_input: dict, ml_output: dict) -> str:
    """
    Takes user input (including farmer's question) and ML model output,
    and generates AI recommendation using LLM with knowledge base.
    """
    

    try:
        user_question = user_input.get('query')
        
        prompt = f"""
You are an expert AI Agricultural Assistant for Indian farmers in West Bengal.

STRICT RULES:
- Respond ONLY in simple Bengali (not English)
- Use 2-3 short sentences max
- Give practical advice only
- Do NOT use technical language
- If farmer asks a specific question, ANSWER IT first
- Then provide crop/irrigation recommendation

--- Knowledge Base (West Bengal Soil Information) ---
{KNOWLEDGE_BASE}

--- Farm Details ---
Location: {user_input.get('city', 'Unknown')}
Soil Type: {user_input.get('soil', 'Unknown')}
Weather: {user_input.get('weather', 'Unknown')}

--- ML Model Prediction ---
Recommended Crop: {ml_output.get('predicted_crop', 'Unknown')}
Irrigation Need: {ml_output.get('irrigation', 'Unknown')}
Soil Condition: {ml_output.get('soil_condition', 'Unknown')}

--- Farmer's Question ---
{user_question if user_question else '(No specific question - provide general farming recommendation)'}

TASK:
Answer the farmer's question using the knowledge base and ML recommendations.
If no question asked, explain why the recommended crop is suitable and what actions to take.
Respond ONLY in Bengali.
"""
        print(f"[LLM] Prompt being sent to Gemini (first 200 chars): {prompt[:200]}")
        return cached_llm_call(prompt)
    except Exception as e:
        error_msg = str(e)
        print(f"[LLM ERROR] generate_agricultural_insight failed: {error_msg}")
        if "429" in error_msg or "quota" in error_msg.lower():
            return "API quota exceeded. Please enable billing or try again later."
        return f"Error generating Gemini response: {e}"
