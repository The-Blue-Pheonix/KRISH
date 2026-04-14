const API_BASE_URL = "http://localhost:8000";

export async function getRecommendation() {
  const response = await fetch(`${API_BASE_URL}/recommendation`);
  return response.json();
}
