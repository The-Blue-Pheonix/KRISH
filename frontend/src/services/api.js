// src/services/api.js
export const fetchPrediction = async (city, soil, latitude = null, longitude = null) => {
  try {
    // Build query parameters
    let url = `http://localhost:8000/predict?`;
    
    const params = new URLSearchParams();
    
    // Add location parameters (GPS takes precedence)
    if (latitude !== null && longitude !== null) {
      params.append('latitude', latitude);
      params.append('longitude', longitude);
      console.log(`📍 Sending GPS coordinates to backend: lat=${latitude}, lon=${longitude}`);
    } else if (city) {
      params.append('city', city);
      console.log(`🏙️  Sending city to backend: ${city}`);
    }
    
    // Add soil parameter
    if (soil) {
      params.append('soil', soil);
    }
    
    url += params.toString();
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching prediction:", error);
    throw error;
  }
};

export const getRecommendedSoil = async (city) => {
  try {
    const response = await fetch(`http://localhost:8000/get-soil?city=${encodeURIComponent(city)}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching recommended soil:", error);
    throw error;
  }
};
