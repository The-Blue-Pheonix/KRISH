export const fetchPrediction = async (city = null, soil, latitude = null, longitude = null, language = "en") => {
  try {
    let url = `http://localhost:8000/predict?`;
    const params = new URLSearchParams();

    // Add location parameters (GPS takes precedence over city)
    if (latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined) {
      params.append('latitude', latitude);
      params.append('longitude', longitude);
      console.log(`📍 GPS: ${latitude}, ${longitude}`);
    } else if (city) {
      params.append('city', city);
      console.log(`🏙️ City: ${city}`);
    }

    // Add soil parameter (REQUIRED)
    if (soil) {
      params.append('soil', soil);
      console.log(`🌱 Soil: ${soil}`);
    }

    if (language) {
      params.append('language', language);
    }


    url += params.toString();
    console.log(`📡 Full URL: ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error("❌ Error fetching prediction:", error);
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

export const chatWithAI = async (message, city, soil) => {
  try {
    const response = await fetch(`http://localhost:8000/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, city, soil })
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error chatting with AI:", error);
    throw error;
  }
};
