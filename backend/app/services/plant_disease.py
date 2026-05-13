import os
import requests
from io import BytesIO

def analyze_plant_image(image_path: str):
    """Analyze plant disease using PlantNet API"""
    api_key = os.getenv("PLANTNET_API_KEY")
    if not api_key:
        raise ValueError("PlantNet API key is missing. Add PLANTNET_API_KEY to your .env file.")
    
    try:
        # PlantNet API endpoint for plant identification
        api_url = "https://api.plantnet.org/v2/identify"
        
        # Read the image file
        with open(image_path, 'rb') as f:
            files = {'images': f}
            params = {
                'api-key': api_key,
                'lang': 'en',
                'include-related-images': 'false'
            }
            
            response = requests.post(api_url, files=files, params=params)
            response.raise_for_status()
        
        data = response.json()
        
        # Prepare the readable result
        result_text = []
        
        if not data.get('results'):
            return "No plant detected in the image. Please provide a clearer image."
        
        # Get the best match
        best_match = data['results'][0]
        plant_species = best_match.get('species', {}).get('sciName', 'Unknown')
        common_names = best_match.get('species', {}).get('commonNames', [])
        
        result_text.append(f"**Plant Detected**: {', '.join(common_names) if common_names else plant_species}")
        
        # Get probability score
        score = best_match.get('score', 0)
        result_text.append(f"**Confidence**: {score*100:.1f}%")
        
        # Get disease information from the best match details
        disease_info = best_match.get('diseases', [])
        
        if disease_info:
            result_text.append("**Potential Issues Detected:**")
            for disease in disease_info:
                disease_name = disease.get('name', 'Unknown disease')
                probability = disease.get('probability', 0)
                result_text.append(f"- {disease_name} (Confidence: {probability*100:.1f}%)")
        else:
            result_text.append("**Status**: This plant appears to be healthy!")
        
        return "\n".join(result_text)
    except Exception as e:
        raise Exception(f"PlantNet API Error: {str(e)}")
