import os
from fastapi import HTTPException
from kindwise import PlantApi

def analyze_plant_image(image_path: str):
    api_key = os.getenv("KINDWISE_API_KEY") or os.getenv("REACT_APP_PLANTNET_API_KEY") 
    if not api_key:
        raise ValueError("Kindwise API key is missing. Add KINDWISE_API_KEY to your .env file.")
        
    try:
        api = PlantApi(api_key=api_key)
        
        # Identify the plant and its health
        identification = api.identify(
            image_path, 
            details=['common_names', 'url', 'health_assessment']
        )
        
        # Prepare the readable result
        result_text = []
        plant_name = identification.result.classification.suggestions[0].name
        result_text.append(f"**Plant Detected**: {plant_name}")
        
        health = identification.result.health_assessment
        if health and health.is_healthy:
            result_text.append("This plant looks healthy!")
        elif health and not health.is_healthy:
            result_text.append("**Disease Detected:**")
            for disease in health.diseases:
                result_text.append(f"- {disease.name} (Probability: {disease.probability:.2%})")
                if disease.disease_details and disease.disease_details.treatment:
                    treatments = disease.disease_details.treatment
                    if treatments.get("biological"):
                        result_text.append(f"  *Organic Remedy*: {', '.join(treatments['biological'])}")
                    elif treatments.get("chemical"):
                        result_text.append(f"  *Remedy*: {', '.join(treatments['chemical'])}")
        
        return "\n".join(result_text)
    except Exception as e:
        raise Exception(f"Kindwise API Error: {str(e)}")
