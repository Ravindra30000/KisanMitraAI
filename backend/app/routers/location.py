from fastapi import APIRouter, HTTPException, Query
import logging
from app.services.location import reverse_geocode, forward_geocode

logger = logging.getLogger("kisanmitra-router-location")

router = APIRouter(
    prefix="/api/location",
    tags=["location"]
)

@router.get("/geocode")
async def get_reverse_geocode(lat: float, lon: float):
    """
    Reverse geocodes coordinate details (latitude and longitude) into Indian State and District.
    """
    try:
        location_data = await reverse_geocode(lat, lon)
        return location_data
    except Exception as e:
        logger.error(f"Geocoding router error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/forward-geocode")
async def get_forward_geocode(
    state: str = Query(..., description="Indian state name"),
    district: str = Query(..., description="Indian district name")
):
    """
    Forward geocodes an Indian State and District into approximate latitude and longitude coordinates.
    """
    try:
        coords = await forward_geocode(state, district)
        return coords
    except Exception as e:
        logger.error(f"Forward geocoding router error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

