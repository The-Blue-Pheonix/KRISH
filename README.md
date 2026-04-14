# KRISH

Project scaffold for a smart agriculture platform with:
- FastAPI backend
- React frontend
- ESP8266 IoT firmware

## ✨ Recent Updates

✅ **Fixed critical parameter bug** in soil condition logic  
✅ **Added comprehensive error handling** for LLM integration  
✅ **Created complete test suite** and documentation  
✅ **System now production-ready**



## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## 🧪 Testing the Complete System

```powershell
# Terminal 1: Start backend
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2: Test API
$env:GEMINI_API_KEY = "your_api_key"
Invoke-RestMethod -Uri "http://localhost:8000/predict?city=Kolkata&soil=Alluvial"
```

Expected response:
```json
{
  "location": "Kolkata",
  "weather": {"temperature": 28.5, "humidity": 75, "rainfall": 5.2},
  "predicted_crop": "Rice",
  "soil_condition": "Dry",
  "irrigation": "Monitor",
  "ai_recommendation": "..."
}
```

## ✅ System Status
- ✅ All parameters verified and correct
- ✅ Error handling implemented
- ✅ LLM integration with graceful fallback
- ✅ Complete test suite ready
- ✅ Production ready

For detailed information, read the documentation files listed above.
