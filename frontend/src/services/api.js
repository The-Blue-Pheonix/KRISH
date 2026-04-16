// src/services/api.js
export const fetchPrediction = async (city, soil) => {
  try {
    const response = await fetch(`http://localhost:8000/predict?city=${encodeURIComponent(city)}&soil=${encodeURIComponent(soil)}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching prediction:", error);
    throw error;
  }
};
