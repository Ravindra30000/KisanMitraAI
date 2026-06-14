# Connecting Dreams Foundation — Technical Assignment
## Round 2 Submission: Option B — Multilevel Natural Farming Consultant

**Project Name**: KisanMitra AI (कृषि मित्र)  
**Deliverables Included**: Live URL, GitHub Repository, README Submission, Video Walkthrough

---

## 🛠️ 1. Technical Stack Architecture

The technical stack is architected to address accessibility constraints in rural India, prioritizing high performance, zero-latency speech synthesis, and offline-ready local RAG structures.

```
                  ┌───────────────────────────────┐
                  │      React + Vite Client      │
                  │   (Mobile-First UI / PWA)     │
                  └───────────────┬───────────────┘
                                  │ HTTPS Requests
                                  ▼
                  ┌───────────────────────────────┐
                  │      FastAPI Backend API      │
                  └───────────────┬───────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  Groq STT API   │      │ Google GenAI API│      │ Local ChromaDB  │
│  (Whisper v3)   │      │ (Gemini Flash)  │      │ (Multilingual)  │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │   Edge-TTS      │
                         │(Speech Synthesis)│
                         └─────────────────┘
```

### Backend Components
* **FastAPI Framework**: An asynchronous Python framework chosen for its low memory footprint and high concurrency, crucial for processing binary audio streams.
* **Google GenAI SDK (Gemini-1.5-Flash)**: Selected for its exceptionally fast response time, cost-efficiency, and native multimodal compatibility, enabling simultaneous analysis of leaf images and textual queries.
* **Groq SDK (Whisper-large-v3)**: Utilized for ultra-low latency speech-to-text transcription. It transcribes Hindi and English dialects in under 300ms.
* **Edge-TTS**: A non-blocking asynchronous TTS library that utilizes Microsoft's cognitive speech services, producing natural regional accents for free without requiring premium API subscriptions.
* **ChromaDB**: An open-source vector database deployed locally on the server to store dense embeddings of natural farming manuals, avoiding cloud lookup latencies.

### Frontend Components
* **React 19 + TypeScript**: Ensures robust type-safety and modern component management.
* **Vite Build Tool**: Hot-module replacement provides quick build and minification pipelines for lightweight static deployment.
* **Tailwind CSS v4**: Mobile-first fluid utility framework ensuring high-fidelity layouts on low-end smartphones.

---

## ✍️ 2. Prompt Design & Guardrails

To protect farmers from crop damage, strict prompt engineering and API guardrails were constructed.

### A. Structured JSON Schema Constraints (Fasal Jaanch)
For crop disease analysis, the Gemini API is constrained to return a structured JSON object matching a Pydantic schema. This prevents model hallucinations and guarantees clean parsed cards in the UI:

```python
class DiseaseDiagnosisResponse(BaseModel):
    disease_name: str         # Scientific name
    disease_name_hindi: str   # Hindi/Hinglish name
    confidence: int           # Confidence percentage (0-100)
    symptoms_observed: List[str]
    organic_remedies: List[OrganicRemedy]  # Detailed natural recipes
    chemical_remedies: List[str]           # Enforced as empty
    prevention: str
    confidence_label: str     # Threshold mapping
    rag_sources: List[str]    # Document references
```

### B. Prompt Guardrails (Voice Saathi)
The system instruction enforces 5 critical boundaries for LLM responses:

1. **Organic-Only Limitation**: The system is explicitly forbidden from recommending chemical fertilizers or pesticides. 
   > *"Only recommend natural/organic farming remedies (Jeevamrut, Neemastra, buttermilk). Never recommend chemical pesticides or chemical fertilizers. Leave the chemical_remedies list completely empty."*
2. **KVK Helpline Citation**: Every diagnostic response is instructed to cite the government toll-free helpline number `1800-180-1551` to verify safety.
3. **Domain Lock (Non-Agriculture Refusal)**: The assistant politely declines queries outside of farming, market rates, weather, and government schemes.
   > *Refusal prompt: "I am KisanMitra, your farming companion. I can only assist you with agriculture-related questions."*
4. **Speech-Optimized Length**: Output is strictly capped under 150 words to ensure Edge-TTS generates brief, listenable audio clips without overwhelming the farmer.
5. **Dynamic Language Injectors**: Prompts are dynamically compiled depending on the query's resolved language profile (`hi`, `hl` - Hinglish, `en`, `mr`, `gu`, `pa`).

---

## 🌐 3. Localization & Speech Pipeline

To bridge the language gap for rural users, KisanMitra AI implements a two-way localized routing system.

### A. Bilingual Hinglish & Regional Routing
The application processes speech transcription in multiple regional formats:
* **STT Processing**: Whisper-large-v3 is initialized with language parameter constraints (`hi` or `en`) to capture dialectal spelling accurately.
* **Code-Switching (Hinglish)**: The backend recognizes "Hinglish" queries (e.g., *"tamatar ke patte sukh rahe hain kya karein"*). It routes the query to the `hl` prompt instruction, generating replies in Hinglish (Hindi words written in Latin script) which matches how most Indian farmers write text messages.

### B. Custom Number-to-Words Translation Engine
Standard TTS synthesizers read numbers (like `12350`) character-by-character or in English format, which sounds artificial to local farmers. KisanMitra AI features a pure-Python translation engine supporting English, Hindi, Hinglish, Marathi, Gujarati, and Punjabi number conversion:
* **Example**: `₹4500/quintal` in Mandi Bhav is translated:
  * **Hindi**: *"चार हज़ार पाँच सौ रुपये प्रति क्विंटल"*
  * **Hinglish**: *"Chaar hazaar paanch sau rupaye prati quintal"*
This ensures audio readouts are completely natural.

### C. Voice Accent Synthesis Map
Synthesized speech matches the regional dialect using Edge-TTS neural voices:
| Language | Edge-TTS Voice Accent | Style |
|---|---|---|
| **Hindi (hi)** | `hi-IN-MadhurNeural` | Warm, clear rural tone |
| **Hinglish (hl)** | `hi-IN-MadhurNeural` | Phonetically matches Hindi |
| **English (en)** | `en-IN-PrabhatNeural` | Clear Indian English |
| **Marathi (mr)** | `mr-IN-ManoharNeural` | Regional Marathi accent |
| **Gujarati (gu)** | `gu-IN-NiranjanNeural` | Regional Gujarati accent |
| **Punjabi (pa)** | `pa-IN-HarpreetNeural` | Regional Punjabi accent |

---

## 🌾 4. Impact & Human-Centered Design

KisanMitra AI is designed with **empathy for the user**:
* **Mobile-First Layout**: Fully constrained UI resembling a mobile application wrapper (`max-w-[480px]`), ensuring optimized grid scaling and easy accessibility.
* **Low Literacy Support**: Every advisory, diagnostic result, and recipe includes a text-to-speech play/pause button, enabling illiterate or elderly farmers to listen to guidance instead of reading.
* **Actionable RAG Verification**: The integration of local manuals via ChromaDB ensures that the organic recipes suggested (like Jeevamrut ratios) are scientifically verified and safe.
