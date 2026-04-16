# Soil Mapping based on West Bengal Geography & Soil Types
# This mapping uses local knowledge of soil distribution in West Bengal districts

# Bengali to English city name mapping
BENGALI_TO_ENGLISH_CITIES = {
    "কলকাতা": "Kolkata",
    "হাওড়া": "Howrah",
    "বর্ধমান": "Barddhaman",
    "বিষ্ণুপুর": "Birbhum",
    "মুর্শিদাবাদ": "Murshidabad",
    "নদিয়া": "Nadia",
    "পূর্ব মেদিনীপুর": "East Medinipur",
    "পশ্চিম মেদিনীপুর": "West Medinipur",
    "বাঁকুড়া": "Bankura",
    "পুরুলিয়া": "Purulia",
    "দার্জিলিং": "Darjeeling",
    "কালিম্পং": "Kalimpong",
    "জলপাইগুড়ি": "Jalpaiguri",
    "কুচ বিহার": "Cooch Behar",
    "আসানসোল": "Asansol",
    "ইদিলপুর": "Idilpur",
}

SOIL_MAP = {
    # Alluvial soils - River plains and deltaic regions
    "Kolkata": "Alluvial",
    "Howrah": "Alluvial",
    "Barddhaman": "Alluvial",
    "Birbhum": "Alluvial",
    "Murshidabad": "Alluvial",
    "Nadia": "Alluvial",
    "East Medinipur": "Alluvial",
    "West Medinipur": "Alluvial",
    
    # Red soils - Highland regions with laterite formations
    "Bankura": "Red",
    "Purulia": "Red",
    
    # Laterite soils - Hill regions
    "Darjeeling": "Laterite",
    "Kalimpong": "Laterite",
    
    # Terai soils - Northern foothills
    "Jalpaiguri": "Terai",
    "Cooch Behar": "Terai",
    
    # Black soils - Limited areas
    "Asansol": "Black",
}

def normalize_city_name(city: str) -> str:
    """Convert Bengali city names to English if needed"""
    if not city:
        return city
    
    # Check if city is in Bengali and convert to English
    if city in BENGALI_TO_ENGLISH_CITIES:
        english_city = BENGALI_TO_ENGLISH_CITIES[city]
        print(f"[SOIL] Converting Bengali city '{city}' to English: '{english_city}'")
        return english_city
    
    return city

def get_soil_by_location(city: str):
    """
    Get recommended soil type based on city location.
    
    Parameters:
    - city: str - City name (can be in Bengali or English)
    
    Returns: str - Soil type ("Alluvial", "Laterite", "Black", "Red", or "Terai")
    
    Uses West Bengal soil distribution knowledge.
    Falls back to "Alluvial" as default if city not found.
    """
    if not city:
        return "Alluvial"
    
    # Normalize city name (convert Bengali to English if needed)
    city = normalize_city_name(city)
    
    # Try exact match first
    return SOIL_MAP.get(city, "Alluvial")
