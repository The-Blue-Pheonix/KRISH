# 🌾 KRISHI: Intelligent Smart Farming System

<div align="center">
  <h3>Empowering Farmers with AI, ML, and IoT</h3>
  <p>Real-time weather tracking, ML-powered crop prediction, AI advisory, and IoT automated irrigation.</p>
</div>

---

## 🌟 Features

* **🌦️ Real-time Weather & 7-Day Forecast:** Integrated with Open-Meteo API to accurately pull current conditions and next week's rain predictions.
* **🌱 Crop Prediction (ML):** Recommends the highest yield crop based on soil type, temperature, and humidity using Scikit-Learn.
* **🤖 AI Agronomist (LLM):** Delivers multilingual actionable advice (Hindi, Bengali, Marathi, Tamil, English) based on live local context.
* **💧 Smart Irrigation:** Advises on when exactly to water crops. Integrates directly with ESP8266 IoT devices for hardware pump control.
* **🗺️ Automatic Soil Mapping:** Recommends soil types based on Ge-location.
* **📱 Modern Dashboard:** Built with React, Tailwind CSS, and localized via react-i18next.

---

## 🚀 Quick Start Guide

### Prerequisites
* Python 3.9+
* Node.js & npm (v16+)

### 1️⃣ Backend Setup
```bash
git clone https://github.com/your-username/krishi.git
cd krishi

# Create and activate virtual environment
python -m venv .venv
# On Windows: .venv\Scripts\Activate.ps1
# On Mac/Linux: source .venv/bin/activate

# Install dependencies
pip install -r backend/app/requirements.txt

# Run the FastAPI server
cd backend/app
uvicorn main:app --reload
```
The backend API will run on **http://localhost:8000**
Interactive API Docs: **http://localhost:8000/docs**

### 2️⃣ Frontend Setup
```bash
cd frontend

# Install packages
npm install

# Start the development server
npm start
```
The dashboard will open on **http://localhost:3000**

---

## 🗂️ Project Structure

```text
KRISH/
├── backend/                  # Python FastAPI Backend
│   └── app/
│       ├── main.py           # API Endpoints
│       ├── models/           # DB schema & request models
│       ├── services/         # Core Logic (Weather, ML, LLM)
│       └── requirements.txt
├── frontend/                 # React App
│   ├── src/
│   │   ├── components/       # UI Components
│   │   ├── pages/            # Dashboard, FarmMap, Chat
│   │   ├── hooks/            # Custom React hooks (useGeolocation)
│   │   └── services/         # API connectors
│   └── package.json
├── iot/                      # Arduino/C++ Code
│   └── esp8266/              # Pump & sensor sketches
└── README.md                 # You are here
```

---

## 🛠️ Tech Stack
* **Frontend:** React, Tailwind CSS, Lucide Icons, i18next
* **Backend:** FastAPI, Python, Scikit-Learn
* **Databases:** Supabase (PostgreSQL)
* **External APIs:** Open-Meteo (Weather), Groq / Gemini (LLM)
* **IoT:** Arduino C++ (ESP8266)

---

## 📜 Contributing
See `progress.md` for deep internal API mappings, state architectures, and ongoing technical development plans.

## 📄 License
MIT License
