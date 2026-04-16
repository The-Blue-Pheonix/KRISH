# Soil Mapping based on West Bengal Geography & Soil Types
# This mapping uses local knowledge of soil distribution in West Bengal districts

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

def get_soil_by_location(city: str):
    """
    Get recommended soil type based on city location.
    
    Parameters:
    - city: str - City name
    
    Returns: str - Soil type ("Alluvial", "Laterite", "Black", "Red", or "Terai")
    
    Uses West Bengal soil distribution knowledge.
    Falls back to "Alluvial" as default if city not found.
    """
    if not city:
        return "Alluvial"
    
    # Try exact match first
    return SOIL_MAP.get(city, "Alluvial")
