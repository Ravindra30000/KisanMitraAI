from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from dotenv import load_dotenv
from app.routers.voice import router as voice_router
from app.routers.disease import router as disease_router
from app.routers.weather import router as weather_router
from app.routers.market import router as market_router
from app.routers.schemes import router as schemes_router
from app.routers.location import router as location_router
from app.routers.notifications import router as notifications_router

load_dotenv(override=True)

app = FastAPI(
    title="KisanMitra AI Backend",
    description="Voice-first natural farming advisor backend service",
    version="1.0.0"
)

# Configure CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5173,http://127.0.0.1:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure static directories exist
os.makedirs(os.path.join(os.path.dirname(os.path.dirname(__file__)), "static"), exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include routers
app.include_router(voice_router)
app.include_router(disease_router)
app.include_router(weather_router)
app.include_router(market_router)
app.include_router(schemes_router)
app.include_router(location_router)
app.include_router(notifications_router)

@app.get("/")
async def root():
    return {
        "status": "healthy",
        "service": "KisanMitra AI Backend",
        "message": "Swagat hai KisanMitra AI API mein!"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
