# 🌾 KRISHI AI/ML & LLM Pipeline Architecture

## Overview
KRISHI is an intelligent agricultural advisory system that combines **Machine Learning (ML)** for crop prediction and **Large Language Models (LLM)** for contextual agricultural insights. The pipeline works in a coordinated 5-step process to deliver comprehensive farming recommendations.

---

## 📊 Complete Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     FARMER QUERY / API REQUEST                      │
│                                                                       │
│  Required Parameters:                                               │
│  - city (or latitude/longitude)  🌍                                 │
│  - soil type (Alluvial/Laterite/Black/Red)  🪨                     │
│  - Optional: query, language preference  🗣️                        │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                    START PIPELINE
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
   STEP 1️⃣                               STEP 2️⃣
   WEATHER DATA                         ML MODEL
   EXTRACTION                           CROP PREDICTION
        │                                     │
        ▼                                     ▼
   ┌─────────────┐                   ┌─────────────────┐
   │ WEATHER API │                   │ SKlearn Model   │
   │ (Open-Meteo)│                   │ (Joblib .pkl)   │
   └──────┬──────┘                   └────────┬────────┘
          │                                   │
          │ Returns:                          │ Input:
          │ • Temperature  📈                 │ • Temp
          │ • Humidity  💧                    │ • Humidity
          │ • Rainfall  🌧️                   │ • Rainfall
          │ • Location  📍                    │ • Soil Type
          │                                   │
          ▼                                   ▼
        TEMP=28°C                    PREDICTED CROP
        HUMIDITY=75%                 ↓
        RAINFALL=45mm               "Rice" / "Corn"
        LOCATION=Kolkata            "Cotton" / "Wheat"
                                    (Mock if .pkl not found)
                │                               │
                │                               │
                └───────────────┬───────────────┘
                                │
                        STEP 3️⃣  &  STEP 4️⃣
                        SOIL & IRRIGATION
                        ANALYSIS
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
    ┌────────────────┐   ┌──────────────────┐   ┌─────────────────┐
    │ SOIL LOGIC     │   │ IRRIGATION LOGIC │   │ SOIL MAPPING    │
    │ (Rainfall→State)   │ (Temp+Rainfall)  │   │ (Location→Type) │
    └────────┬───────┘   └────────┬─────────┘   └────────┬────────┘
             │                    │                      │
             │                    │                      │
    DRY / WET STATE        YES / NO / MONITOR    RECOMMENDED SOIL
    (Auto-detection)       (Water Needs)         (Database lookup)
             │                    │                      │
             └────────────────────┼──────────────────────┘
                                  │
                        AGGREGATE ML OUTPUTS
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
    CROP PREDICTION          SOIL CONDITION          IRRIGATION ADVICE
    "Rice"                    "Wet"                   "Monitor"
        │                         │                         │
        └─────────────────────────┼─────────────────────────┘
                                  │
                        STEP 5️⃣: LLM PROCESSING
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        │    PROMPT ENGINEERING   │   REQUEST THROTTLING    │
        │                         │                         │
        │  Craft context-aware    │   Rate limit protection │
        │  agricultural prompt    │   (0.5s minimum between │
        │  with:                  │    API requests)        │
        │  • Location info        │                         │
        │  • Weather data         │                         │
        │  • ML predictions       │                         │
        │  • Farmer's query       │                         │
        │  • Language preference  │                         │
        │                         │                         │
        └────────────┬────────────┼────────────┬────────────┘
                     │            │            │
                     ▼            ▼            ▼
           ┌──────────────────────────────────────┐
           │  SMART RESPONSE CACHING              │
           │  (MD5 Hash-based)                    │
           │                                      │
           │  Cache HIT?  ✅ Return cached        │
           │  Cache MISS? ❌ Call Gemini API      │
           └──────┬───────────────────────────────┘
                  │
                  ▼
           ┌──────────────────────┐
           │ GEMINI API CALL      │
           │ (google-generativeai)│
           │                      │
           │ Model: gemini-pro    │
           │ Token Limit: 60k     │
           └──────┬───────────────┘
                  │
                  ▼
           ┌──────────────────────────────────────────────┐
           │ GENERATED RECOMMENDATION                     │
           │                                              │
           │ Example Output:                              │
           │ "ধান চাষ এখন সেরা সময়। আপনার মাটি ভিজা  │
           │  থাকায় সেচ খুব কম দিন। ৩০ দিনে ফসল   │
           │  তৈরি হবে। সবুজ সার ব্যবহার করুন।"        │
           │                                              │
           │ (Supports: Bengali, Hindi, Marathi,          │
           │  Tamil, English)                             │
           └──────┬───────────────────────────────────────┘
                  │
                  ▼
        ┌──────────────────────────────────┐
        │  ASSEMBLE FINAL RESPONSE         │
        │                                  │
        │  {                               │
        │    "location": "Kolkata",       │
        │    "weather": {...},            │
        │    "predicted_crop": "Rice",    │
        │    "soil_condition": "Wet",     │
        │    "irrigation": "Monitor",     │
        │    "ai_recommendation": "..."   │
        │  }                              │
        │                                  │
        └──────┬───────────────────────────┘
               │
               ▼
        ┌──────────────────────┐
        │  RESPONSE TO CLIENT  │
        │  (REST API)          │
        └──────────────────────┘
```

---

## 🔧 Component Deep Dive

### **STEP 1️⃣: Weather Data Extraction**

**Module:** `services/weather.py`

**Purpose:** Fetch real-time weather data for a given location

**How it works:**

1. **City Name Resolution** (Geocoding)
   ```python
   Input: city="Kolkata" (or Bengali: "কলকাতা")
   ↓
   Open-Meteo Geocoding API
   ↓
   Output: latitude=22.57, longitude=88.36
   ```

2. **Weather Fetch** (Open-Meteo API)
   ```python
   Input: latitude, longitude
   ↓
   Call: https://api.open-meteo.com/v1/forecast?
         latitude=22.57&longitude=88.36&
         current=temperature_2m,relative_humidity_2m,weather_code
   ↓
   Output: {
     "temperature": 28,
     "humidity": 75,
     "rainfall": 45,
     "weather": "Partly cloudy",
     "location": "Kolkata"
   }
   ```

**Key Features:**
- ✅ Supports Bengali city names (কলকাতা → Kolkata)
- ✅ GPS coordinates (latitude/longitude) fallback
- ✅ Real-time weather data (no hardcoded values)
- ✅ Error handling for invalid cities

---

### **STEP 2️⃣: ML Crop Prediction**

**Module:** `services/predict.py`

**Purpose:** Predict suitable crops based on weather and soil conditions

**Machine Learning Model:**
```
Type: Random Forest / XGBoost Classifier
Input Features (4):
  1. Temperature (°C)      [0-50]
  2. Humidity (%)          [0-100]
  3. Rainfall (mm)         [0-300]
  4. Soil Type (encoded)   [0-3]
     └─ 0: Alluvial
     └─ 1: Laterite
     └─ 2: Black
     └─ 3: Red

Output: Predicted Crop
  • Rice
  • Corn
  • Cotton
  • Wheat
```

**Prediction Pipeline:**
```python
def predict_crop(temp=28, humidity=75, rainfall=45, soil="Alluvial"):
    
    # 1. Validate soil type
    if soil not in ["Alluvial", "Laterite", "Black", "Red"]:
        raise ValueError("Invalid soil")
    
    # 2. Encode categorical variable (soil)
    soil_encoded = soil_encoder.transform(["Alluvial"])[0]  # e.g., 0
    
    # 3. Create feature vector
    X = np.array([[28, 75, 45, 0]])
    
    # 4. Predict
    prediction = model.predict(X)  # e.g., [2]  (Rice = 2)
    
    # 5. Decode result
    crop = label_encoder.inverse_transform([2])[0]  # "Rice"
    
    return crop
```

**Fallback Strategy:**
- If model files not found → Use mock predictions based on soil type
  ```
  Alluvial → Rice
  Laterite → Corn
  Black   → Cotton
  Red     → Wheat
  ```

**Files Used:**
- `models/model.pkl` - Trained ML model
- `models/label_encoder.pkl` - Crop label encoder
- `models/soil_encoder.pkl` - Soil type encoder

---

### **STEP 3️⃣: Soil Condition Analysis**

**Module:** `services/irrigation.py` → `soil_condition_logic()`

**Purpose:** Determine soil moisture state

**Logic:**
```python
def soil_condition_logic(user_input, rainfall):
    
    # If user manually specifies → Use that
    if user_input != "Auto":
        return user_input  # "Dry" or "Wet"
    
    # Auto-detect based on rainfall
    if rainfall < 20:        # Less rainfall
        return "Dry"         # 🟠 Soil needs water
    else:                    # More rainfall
        return "Wet"         # 💧 Soil has moisture
```

**Example:**
```
Rainfall: 15 mm → soil_condition = "Dry"
Rainfall: 50 mm → soil_condition = "Wet"
```

---

### **STEP 4️⃣: Irrigation Decision**

**Module:** `services/irrigation.py` → `irrigation_decision()`

**Purpose:** Determine if irrigation is needed

**Decision Logic:**
```python
def irrigation_decision(temp, rainfall, soil_condition):
    
    # Rule 1: Hot + Dry soil → Needs water
    if soil_condition == "Dry" and temp > 30:
        return "Yes"  # ✅ Irrigate
    
    # Rule 2: Heavy rainfall → No need
    if rainfall > 50:
        return "No"   # ❌ Don't irrigate
    
    # Rule 3: Otherwise → Observe
    return "Monitor"  # 👁️ Keep watching
```

**Decision Tree:**
```
┌─ Temp > 30°C + Dry soil? ─→ YES
├─ Rainfall > 50mm?         ─→ NO
└─ Otherwise                ─→ MONITOR
```

---

### **Soil Mapping Service**

**Module:** `services/soil_mapping.py`

**Purpose:** Auto-detect soil type based on location

**Implementation:**
```python
def get_soil_by_location(city: str) -> str:
    
    # Database/Mapping of cities to soil types
    soil_map = {
        "Kolkata": "Alluvial",      # Bengal: Alluvial
        "Pune": "Black",             # Maharashtra: Black soil
        "Chennai": "Red",            # South India: Red soil
        "Malda": "Laterite",         # North Bengal: Laterite
        # ... more cities
    }
    
    return soil_map.get(city, "Alluvial")  # Default: Alluvial
```

**Real-world Use:**
- ✅ Validates farmer's soil selection
- ✅ Suggests if farmer picks wrong soil type
- ✅ Provides alternatives

---

### **STEP 5️⃣: LLM Processing Pipeline**

**Module:** `services/llm.py`

**Purpose:** Generate natural, contextual agricultural advice using Google Gemini API

#### **5A. Prompt Engineering**

**System Prompt Construction:**
```python
prompt = f"""
You are Krishi AI Advisor, an expert Agricultural Assistant 
holding a conversation with an Indian farmer in {city} 
(Soil Type: {soil}).

🚨 CRITICAL RULE:
{language_config['rule']}

Rule: Respond concisely. Be practical and friendly. 
Use short sentences. No technical jargon.

Context:
- Weather: {weather_data}
- Predicted Crop: {crop}
- Soil Condition: {soil_condition}
- Irrigation Need: {irrigation}

Farmer asks: "{farmer_query}"
"""
```

**Language Support:**
```python
LANGUAGE_CONFIG = {
    "en": {
        "rule": "Respond in English to Indian farmers...",
        "system_prompt": "..."
    },
    "bn": {
        "rule": "বাংলায় সাড়া দিন...",
        "system_prompt": "..."
    },
    "hi": {
        "rule": "हिंदी में उत्तर दें...",
        "system_prompt": "..."
    },
    "ta": {
        "rule": "தமிழில் பதிலளிக்கவும்...",
        "system_prompt": "..."
    },
    "mr": {
        "rule": "मराठीत उत्तर द्या...",
        "system_prompt": "..."
    }
}
```

#### **5B. Request Throttling**

**Purpose:** Avoid Gemini API rate limiting

**Implementation:**
```python
class RequestThrottler:
    def __init__(self, min_interval=0.5):  # 500ms between requests
        self.last_request_time = 0
        self.min_interval = 0.5
    
    def wait_if_needed(self):
        elapsed = time.time() - self.last_request_time
        if elapsed < self.min_interval:
            sleep_time = self.min_interval - elapsed
            time.sleep(sleep_time)  # Wait before next request
        self.last_request_time = time.time()
```

**Benefits:**
- ✅ Prevents API rate limits (429 errors)
- ✅ Ensures fair usage
- ✅ Maintains service stability

#### **5C. Smart Response Caching**

**Purpose:** Reduce API calls and improve response time

**How it Works:**
```python
# Generate unique cache key from prompt
cache_key = MD5(prompt)  # Hash the prompt

# Check cache
if cache_key in prompt_cache:
    return prompt_cache[cache_key]  # ✅ Cache HIT
else:
    # Make API call
    response = gemini_api.generate_content(prompt)
    
    # Store in cache
    prompt_cache[cache_key] = response
    return response  # ✅ Cache MISS → API call
```

**Cache Statistics:**
```python
cache_hits = 0       # Requests served from cache
cache_misses = 0     # Requests hitting API
hit_rate = cache_hits / (cache_hits + cache_misses) * 100
```

**Cache Lifetime:**
- ⏱️ Per server session (cleared on restart)
- 🔄 Can be cleared manually via `/clear-llm-cache`

#### **5D. API Integration**

**Service:** Google Gemini API

```python
import google.generativeai as genai

# Configure API
genai.configure(api_key=os.environ["GEMINI_API_KEY"])

# Call model
model = genai.GenerativeModel("gemini-pro")
response = model.generate_content(
    prompt,
    generation_config=genai.types.GenerationConfig(
        max_output_tokens=500,
        temperature=0.7,  # Balanced creativity
        top_p=0.9,        # Nucleus sampling
    )
)

# Extract text
recommendation = response.text
```

**API Specifications:**
- 🔌 Model: `gemini-pro`
- 📝 Max Input Tokens: 60,000
- ⚙️ Temperature: 0.7 (balanced)
- 🌡️ Top-P: 0.9 (diverse responses)

#### **5E. Error Handling**

**Fallback Behavior:**
```python
try:
    llm_recommendation = generate_agricultural_insight(
        user_inputs, 
        ml_outputs
    )
except Exception as e:
    print(f"[ERROR] LLM failed: {e}")
    
    # Fallback message in Bengali
    llm_recommendation = (
        "AI পরামর্শ পাওয়া যায়নি। নিজে পর্যবেক্ষণ করুন।"
        # "AI advice unavailable. Please observe conditions."
    )
```

---

## 🔄 Data Flow Example

### **Scenario: Farmer in Kolkata with Black Soil**

```
INPUT:
  city = "Kolkata"
  soil = "Black"
  query = "Should I plant rice now?"
  language = "bn" (Bengali)

STEP 1: WEATHER FETCH
  GET https://geocoding-api.open-meteo.com/v1/search?name=Kolkata
  ↓
  latitude=22.57, longitude=88.36
  ↓
  GET https://api.open-meteo.com/v1/forecast?...
  ↓
  {
    "temperature": 28,
    "humidity": 75,
    "rainfall": 45,
    "location": "Kolkata"
  }

STEP 2: ML CROP PREDICTION
  Features: [28, 75, 45, soil_encoded("Black")]
  ↓
  model.predict([28, 75, 45, 2])  # 2 = Black soil
  ↓
  OUTPUT: "Cotton" (or "Rice" if mock)

STEP 3: SOIL CONDITION
  rainfall=45 > 20 ?
  ↓
  OUTPUT: "Wet"

STEP 4: IRRIGATION
  temp=28 > 30? NO
  rainfall=45 > 50? NO
  ↓
  OUTPUT: "Monitor"

STEP 5: LLM GENERATION
  Prompt: """
  You are Krishi AI Advisor for Kolkata (Black soil)
  
  Weather: 28°C, 75% humidity, 45mm rainfall
  Predicted Crop: Cotton
  Soil: Wet
  Irrigation: Monitor
  
  Farmer: "Should I plant rice now?"
  """
  ↓
  Gemini API → Generate response in Bengali
  ↓
  "ধান এই সময়ে আপনার কালো মাটিতে ভালো হবে না।
   তুলো চাষ করুন। মাটি ভিজা থাকায় সেচ কম দিন।"

FINAL RESPONSE:
{
  "location": "Kolkata",
  "weather": {
    "temperature": 28,
    "humidity": 75,
    "rainfall": 45
  },
  "predicted_crop": "Cotton",
  "soil_condition": "Wet",
  "irrigation": "Monitor",
  "ai_recommendation": "ধান এই সময়ে আপনার কালো মাটিতে..."
}
```

---

## 📡 API Endpoints

### **1. Main Prediction Pipeline**
```http
GET /predict?city=Kolkata&soil=Black&query=rice&language=bn

Response:
{
  "location": "Kolkata",
  "weather": {...},
  "predicted_crop": "Cotton",
  "soil_condition": "Wet",
  "irrigation": "Monitor",
  "ai_recommendation": "..."
}
```

### **2. Chat Interface**
```http
POST /chat
{
  "message": "Should I plant rice?",
  "city": "Kolkata",
  "soil": "Black",
  "language": "bn"
}

Response:
{
  "response": "ধান এই সময়ে..."
}
```

### **3. Soil Detection**
```http
GET /get-soil?city=Kolkata

Response:
{
  "city": "Kolkata",
  "recommended_soil": "Alluvial",
  "status": "success"
}
```

---

## 🛠️ Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Backend Framework** | FastAPI | REST API server |
| **Weather Data** | Open-Meteo API | Real-time weather |
| **ML Model** | scikit-learn (Joblib) | Crop prediction |
| **LLM** | Google Gemini API | Text generation |
| **Caching** | Python dict (MD5 hash) | Response caching |
| **Rate Limiting** | Custom throttler | API protection |
| **Environment** | Python 3.9+ | Backend runtime |

---

## 🚀 Performance Metrics

### **Response Time Breakdown**
```
Weather API Call:        100-200 ms
ML Model Prediction:     50-100 ms
Soil/Irrigation Logic:   10-20 ms
LLM API Call:           2000-5000 ms (cached: 5-10 ms)
─────────────────────────────────────
Total (uncached):       2200-5400 ms
Total (cached):         150-350 ms
```

### **Cache Performance**
```
Cache Hit Rate Target:  70-80%
Typical Query Time:     200-400ms (with caching)
API Call Reduction:     ~75% with cache
```

---

## 🔐 Security & Best Practices

### **Environment Variables**
```bash
# .env file
GEMINI_API_KEY=your_api_key_here
```

### **Input Validation**
```python
# Soil type validation
VALID_SOILS = {"Alluvial", "Laterite", "Black", "Red"}
if soil not in VALID_SOILS:
    raise ValueError(f"Invalid soil: {soil}")

# Language validation
if language not in LANGUAGE_CONFIG:
    language = "en"  # Default fallback
```

### **Error Handling**
- ✅ Graceful fallbacks for API failures
- ✅ Mock predictions if ML models missing
- ✅ Fallback text if LLM fails
- ✅ Comprehensive logging

---

## 📚 File Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI app, main pipeline
│   ├── requirements.txt        # Dependencies
│   ├── services/
│   │   ├── weather.py          # Weather API integration
│   │   ├── predict.py          # ML model predictions
│   │   ├── irrigation.py       # Irrigation logic
│   │   ├── llm.py              # LLM integration
│   │   ├── soil_mapping.py     # Soil location mapping
│   │   └── __init__.py
│   ├── routes/
│   │   ├── farmer.py           # Farmer endpoints
│   │   ├── sensor.py           # IoT sensor endpoints
│   │   └── recommendation.py   # Recommendation endpoints
│   ├── models/
│   │   ├── model.pkl           # ML model
│   │   ├── label_encoder.pkl   # Crop encoder
│   │   └── soil_encoder.pkl    # Soil encoder
│   └── database/
│       ├── db.py               # Database connection
│       └── schema.py           # Database schema
├── .env                        # API keys
└── venv/                       # Virtual environment
```

---

## 🎯 Future Enhancements

1. **Real-time Sensor Integration** → IoT device data feeding directly into pipeline
2. **Advanced ML Models** → Deep learning for better predictions
3. **Personalized Learning** → Model adapts to individual farmer behavior
4. **Multi-crop Recommendations** → Ranked list instead of single prediction
5. **Historical Analysis** → Compare recommendations with actual outcomes
6. **Mobile Optimization** → Reduced latency for field access
7. **Offline Mode** → Cache frequently accessed data

---

## 📖 Summary

KRISHI's AI/ML pipeline is a **6-step intelligent system**:

1. 🌍 **Weather Fetch** → Get real-time environmental data
2. 🌾 **ML Prediction** → Predict suitable crops (scikit-learn)
3. 🪨 **Soil Analysis** → Determine soil moisture state
4. 💧 **Irrigation Logic** → Decide water requirements
5. 🤖 **LLM Generation** → Create contextual advice (Gemini API)
6. 📊 **Response Assembly** → Return comprehensive recommendation

The system balances **computational efficiency** (ML for fast predictions) with **AI understanding** (LLM for contextual wisdom), all while handling **rate limiting**, **caching**, and **multilingual support**.

---

**Version:** 1.0  
**Last Updated:** May 10, 2026  
**Maintained By:** KRISHI Development Team


to read and study