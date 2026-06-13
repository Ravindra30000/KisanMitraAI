from fastapi import APIRouter, Query, HTTPException
import logging
from app.services.weather import fetch_weather_data

logger = logging.getLogger("kisanmitra-router-weather")

router = APIRouter(
    prefix="/api/weather",
    tags=["weather"]
)

@router.get("")
async def get_weather(
    lat: float = Query(23.2599, description="Latitude of location"),
    lon: float = Query(77.4126, description="Longitude of location"),
    lang: str = Query("hi", description="Output language (hi, hl, en, mr, gu, pa)")
):
    """
    Returns live weather forecast and localized agricultural advisory.
    Uses Open-Meteo API.
    """
    try:
        data = await fetch_weather_data(lat, lon, lang)
        return data
    except Exception as e:
        logger.error(f"Failed to retrieve weather router response: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch weather details.")
