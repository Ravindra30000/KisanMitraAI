# KisanMitra AI 🌾🤖

KisanMitra AI (कृषि मित्र) is a premium, voice-first digital assistant designed for Indian farmers. It bridges the digital divide with multlingual Voice Assist, Instant Crop Disease Diagnosis with RAG, Real-time Weather Advisories, and Organic Farming Recipes, all fully spoken and localized.

---

## 🌟 Key Features

### 🎙️ 1. Voice Saathi (वॉयस साथी)
- **Voice-first AI Dialogue Pipeline**: Speak in local languages (Hindi/English) and receive natural speech advice.
- **Under the hood**: Real-time voice capture ➜ Speech-to-Text via **Groq Whisper** ➜ AI Reasoning via **Gemini-1.5-Flash** ➜ Regional Speech Synthesis via **Edge-TTS**.

### 🔍 2. Fasal Jaanch (फसल जांच)
- **AI-Powered Diagnostics**: Upload leaf snapshots to diagnose crop diseases.
- **RAG Integration**: Matches diagnostics with a local **ChromaDB vector store** of regional crop data to verify recommendations, citing verified scientific sources.
- **Detailed Remediation**: Displays interactive tabs covering Disease Info, Biological/Chemical Treatment, and Prevention steps.

### ☀️ 3. Mausam (मौसम)
- **Hyperlocal Forecasts**: Open-Meteo API integration retrieves temperature, wind, humidity, and rainfall indicators.
- **Dynamic Advisories**: Warns about region-specific climate risks (e.g., yellow rust outbreaks) and speaks alerts aloud.

### 📈 4. Mandi Bhav & Crop Calendar (मंडी भाव और खेती कैलेंडर)
- **Mandi Rates**: Up-to-date tracking of regional crop market values.
- **Kheti Calendar**: Smart scheduling for crop cycles (Sowing, Fertilization, Irrigation).

### 🍃 5. Organic Farming Guide (जैविक खेती मार्गदर्शिका)
- **Natural Preparations**: Step-by-step recipes (Jeevamrut, Beejamrut, etc.) with voice assistance to guide physical field mixing.

---

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Speech-to-Text**: Groq OpenAI Whisper-large-v3 API
- **AI Engine**: Google GenAI API (Gemini-1.5-Flash)
- **Speech Synthesis**: Edge-TTS (Microsoft edge-tts library)
- **Vector DB**: ChromaDB with Sentence-Transformers embeddings

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4.0
- **Icons**: Lucide React
- **Router**: React Router v7

---

## ⚙️ Environment Variables

### Backend Configuration (`backend/.env`)
Create a `.env` file inside the `backend` folder:
```env
PORT=8000
HOST=0.0.0.0
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
```

### Frontend Configuration (`frontend/.env`)
Create a `.env` file inside the `frontend` folder:
```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the backend server
python run.py
```
The backend will run on `http://localhost:8000`.

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
The frontend will run on `http://localhost:5173` (or the next available port).

---

## 📁 Repository Structure
```
├── backend/
│   ├── app/
│   │   ├── routers/        # API route handlers (Voice, Disease, Weather, Market, etc.)
│   │   ├── services/       # Core business logic (RAG, Groq, Gemini, Edge-TTS, Location)
│   │   └── main.py         # FastAPI application entrypoint
│   ├── chroma_db/          # Chroma Vector database indexes (ignored in Git)
│   ├── run.py              # Server run script
│   └── requirements.txt    # Python package dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable layout and button components (BottomNav, VoiceOrb)
│   │   ├── pages/          # Application views (Home, Voice, Disease, Weather, Market, etc.)
│   │   ├── utils/          # Helper modules (i18n translation system)
│   │   ├── App.tsx         # Main layout wrapper
│   │   └── main.tsx        # React client entrypoint
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
```

---

## 📝 License
Distributed under the MIT License. See `LICENSE` for more information.
