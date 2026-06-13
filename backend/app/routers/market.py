from fastapi import APIRouter, Query
from app.services.market import fetch_market_data

router = APIRouter(prefix="/api/market", tags=["market"])

@router.get("")
async def get_market_data(
    state: str = Query("Madhya Pradesh", description="State name for mandi data"),
    district: str = Query("Bhopal", description="District name for local mandi price lookup"),
    lang: str = Query("hi", description="Language code for advisory translations")
):
    """
    Get real-time Mandi price list and AI market advisory for the selected state and district.
    Supports Hindi (hi), Hinglish (hl), English (en), Marathi (mr), Gujarati (gu), and Punjabi (pa).
    """
    data = await fetch_market_data(state=state, district=district, lang=lang)
    return data
