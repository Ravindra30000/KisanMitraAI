from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import logging
from app.services.schemes import get_schemes_list, get_schemes_advisory

logger = logging.getLogger("kisanmitra-router-schemes")

router = APIRouter(
    prefix="/api/schemes",
    tags=["schemes"]
)

class FarmerProfile(BaseModel):
    name: Optional[str] = "किसान भाई"
    state: Optional[str] = "Madhya Pradesh"
    district: Optional[str] = "Bhopal"
    land_area_acres: Optional[float] = 2.5
    crops: Optional[List[str]] = []

class AdvisoryRequest(BaseModel):
    profile: FarmerProfile
    lang: Optional[str] = "hi"

@router.get("")
async def get_schemes(
    lang: str = "hi",
    category: Optional[str] = None,
    search: Optional[str] = None,
    state: Optional[str] = None
):
    """
    Get a list of available government schemes filtered by language, category, search term, and state.
    """
    try:
        schemes = get_schemes_list(lang=lang, category=category, search=search, state=state)
        return {"schemes": schemes}
    except Exception as e:
        logger.error(f"Failed to fetch schemes: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch schemes: {str(e)}")

@router.post("/advisory")
async def get_advisory(req: AdvisoryRequest):
    """
    Evaluate the schemes matching the farmer's profile and generate an AI eligibility advisory.
    """
    try:
        advisory_text = await get_schemes_advisory(req.profile.model_dump(), lang=req.lang)
        return {"advisory": advisory_text}
    except Exception as e:
        logger.error(f"Failed to generate schemes advisory: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate schemes advisory: {str(e)}")
