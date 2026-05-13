import os
import requests

def analyze_plant_image(image_path: str):
    api_key = os.getenv("PLANTNET_API_KEY")
    # 1. Use the '/all' endpoint for global species identification
    api_url = "https://api.plantnet.org/v2/identify/all"
    
    try:
        with open(image_path, 'rb') as f:
            # 2. Files must be sent as a list of tuples for PlantNet
            files = [('images', (os.path.basename(image_path), f))]
            
            # 3. THIS IS WHAT IS CURRENTLY MISSING:
            # You MUST provide one 'organ' for every image you send.
            # Options: 'leaf', 'flower', 'fruit', 'bark', or 'auto'
            data = {'organs': ['leaf']} 
            
            params = {
                'api-key': api_key,
                'lang': 'en',
                'include-related-images': 'false'
            }
            
            # 4. Include both 'files' and 'data' in the POST request
            response = requests.post(api_url, files=files, params=params, data=data)
            
            # Print the server's specific error message if it fails
            if response.status_code != 200:
                print(f"Server says: {response.text}")
                
            response.raise_for_status()
            return response.json()
            
    except Exception as e:
        print(f"PlantNet API Error: {e}")
        raise Exception(f"PlantNet API Error: {str(e)}")
