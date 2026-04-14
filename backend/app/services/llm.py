import google.generativeai as genai
import os

# Configure the API key from environment variable
genai.configure(api_key=os.environ.get("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY_HERE"))

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
    Takes user input and the ML model's output, and feeds it to the Gemini LLM
    augmented by the specific soil knowledge base.
    """
    try:
        # We use a standard generative model (e.g., gemini-1.5-pro)
        model = genai.GenerativeModel('gemini-1.5-pro')
        
        prompt = f"""
You are an expert AI Agricultural Assistant. 
First, try to base your answers on the provided Knowledge Base, the user's input, and the AI/ML model's prediction. 
If the Knowledge Base does NOT contain information about the specific location, soil type, or crop, you must fall back on your own general agricultural knowledge to provide a factually correct and scientifically sound recommendation.

--- Knowledge Base ---
{KNOWLEDGE_BASE}

--- User Input ---
Location: {user_input.get('city', 'Unknown')}
Soil Type: {user_input.get('soil', 'Unknown')}
Weather: {user_input.get('weather', 'Unknown')}

--- AI/ML Model Prediction ---
Predicted Crop: {ml_output.get('predicted_crop', 'Unknown')}
Recommended Irrigation: {ml_output.get('irrigation', 'Unknown')}
Soil Condition: {ml_output.get('soil_condition', 'Unknown')}

Based on the above, provide a comprehensive but concise response to the farmer. Explain why the predicted crop is suitable for their location and soil type. If the soil mentioned matches the knowledge base, incorporate those specific insights (e.g., fertilizers, regions, characteristics). If it does not match, use your general knowledge to offer helpful, accurate advice.
"""
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error generating Gemini response: {e}"
