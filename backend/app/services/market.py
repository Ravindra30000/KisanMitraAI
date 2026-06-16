import os
import json
import logging
import random
import time
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from pydantic import BaseModel, Field

from google import genai
from google.genai import types

logger = logging.getLogger("market_service")

class MandiPriceItem(BaseModel):
    commodityId: str = Field(description="Name of the commodity: wheat, onion, tomato, potato, paddy, cotton, corn, sugarcane")
    mandi: str = Field(description="Name of the mandi in English")
    state: str = Field(description="Name of the state")
    price: int = Field(description="Price in INR per quintal")
    change: int = Field(description="Change from yesterday (positive or negative integer)")
    date: str = Field(description="Always 'today' or 'yesterday'")

class MandiResponse(BaseModel):
    prices: List[MandiPriceItem] = Field(description="List of exactly 8 commodity prices")
    advisory: str = Field(description="2-3 sentences of market advice in the requested language")

# ---------------------------------------------------------------------------
# In-memory response cache  (key → (timestamp, result))
# Avoids hammering Gemini when multiple frontend tabs / effects fire at once
# ---------------------------------------------------------------------------
_CACHE_TTL_SECONDS = 300   # 5 minutes
_cache: Dict[str, Tuple[float, Dict[str, Any]]] = {}


def _cache_key(state: str, district: str, lang: str) -> str:
    return f"{state}|{district}|{lang}"


def _get_cached(state: str, district: str, lang: str) -> Optional[Dict[str, Any]]:
    key = _cache_key(state, district, lang)
    entry = _cache.get(key)
    if entry:
        ts, data = entry
        if time.time() - ts < _CACHE_TTL_SECONDS:
            logger.info(f"Cache HIT for {district}, {state} ({lang}). Returning cached mandi data.")
            return data
    return None


def _set_cache(state: str, district: str, lang: str, data: Dict[str, Any]) -> None:
    key = _cache_key(state, district, lang)
    _cache[key] = (time.time(), data)


# ---------------------------------------------------------------------------
# Static data for fallback
# ---------------------------------------------------------------------------
COMMODITY_BASE_PRICES = {
    "wheat":     {"base": 2450, "min": 2100, "max": 2800, "emoji": "🌾"},
    "onion":     {"base": 1850, "min": 1400, "max": 2600, "emoji": "🧅"},
    "tomato":    {"base": 1300, "min":  800, "max": 2200, "emoji": "🍅"},
    "potato":    {"base": 1450, "min": 1000, "max": 1800, "emoji": "🥔"},
    "paddy":     {"base": 2180, "min": 1800, "max": 2500, "emoji": "🍚"},
    "cotton":    {"base": 6800, "min": 6000, "max": 8000, "emoji": "🧥"},
    "corn":      {"base": 1950, "min": 1600, "max": 2300, "emoji": "🌽"},
    "sugarcane": {"base":  340, "min":  300, "max":  420, "emoji": "🎋"},
}

COMMODITY_EMOJIS = {k: v["emoji"] for k, v in COMMODITY_BASE_PRICES.items()}


def _static_fallback_prices(state: str, district: str) -> List[Dict[str, Any]]:
    """Deterministic day-seeded fallback prices when Gemini is unavailable."""
    day_seed = datetime.now().strftime("%Y%m%d")
    random.seed(f"{day_seed}_{state}_{district}")

    mandi_names = [
        f"{district} Krishi Mandi",
        f"{district} Subji Mandi",
        f"Kisan Mandi ({district})",
    ]
    prices = []
    for comm_id, info in COMMODITY_BASE_PRICES.items():
        selected_mandis = random.sample(mandi_names, random.randint(1, 2))
        for mandi in selected_mandis:
            offset = sum(ord(c) for c in mandi) % 150 - 75
            price = info["base"] + offset + random.randint(-100, 100)
            price = max(info["min"], min(info["max"], price))
            change = random.randint(-80, 120)
            if random.random() < 0.2:
                change = 0
            prices.append({
                "commodityId": comm_id,
                "emoji": info["emoji"],
                "mandi": mandi,
                "state": state,
                "price": int(price),
                "change": int(change),
                "date": "today",
            })
    random.seed(None)
    return prices


def _static_fallback_advisory(prices: List[Dict[str, Any]], lang: str) -> str:
    wheat_prices = [p["price"] for p in prices if p["commodityId"] == "wheat"]
    wheat_avg = int(sum(wheat_prices) / len(wheat_prices)) if wheat_prices else 2450

    advisories = {
        "hi":  f"बाजार विश्लेषण: गेहूं का औसत भाव ₹{wheat_avg}/क्विंटल चल रहा है। भंडारण उचित हो तो फसल रोककर रखें।",
        "hl":  f"Market analysis: Gehun ka average rate ₹{wheat_avg}/quintal chal raha hai. Storage ho toh hold karein.",
        "en":  f"Market analysis: Wheat average is ₹{wheat_avg}/quintal. Hold stock if you have dry storage available.",
        "mr":  f"बाजार विश्लेषण: गव्हाचा सरासरी दर ₹{wheat_avg}/क्विंटल आहे. साठवणूक असल्यास थांबा.",
        "gu":  f"બજાર વિશ્લેષણ: ઘઉંનો સરેરાશ ભાવ ₹{wheat_avg}/ક્વિન્ટલ છે. સ્ટોરેજ હોય તો રાહ જુઓ.",
        "pa":  f"ਮਾਰਕੀਟ ਵਿਸ਼ਲੇਸ਼ਣ: ਕਣਕ ਦੀ ਔਸਤ ਕੀਮਤ ₹{wheat_avg}/ਕੁਇੰਟਲ ਹੈ। ਸਟੋਰੇਜ ਹੋਵੇ ਤਾਂ ਰੋਕੋ।",
    }
    return advisories.get(lang, advisories["hi"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _get_season() -> str:
    month = datetime.now().month
    if month in (11, 12, 1, 2, 3):
        return "Rabi (winter crops: wheat, mustard, chickpea)"
    elif month in (6, 7, 8, 9, 10):
        return "Kharif (monsoon crops: paddy, cotton, sugarcane, corn)"
    else:
        return "Zaid/Summer (summer crops: watermelon, moong, vegetables)"


def _lang_name(lang: str) -> str:
    return {
        "hi": "Hindi (Devanagari script)",
        "hl": "Hinglish (Hindi written in Roman/English characters)",
        "en": "English",
        "mr": "Marathi (Devanagari script)",
        "gu": "Gujarati (Gujarati script)",
        "pa": "Punjabi (Gurmukhi script)",
    }.get(lang, "Hindi")


def _strip_fences(raw: str) -> str:
    """Remove markdown code fences from Gemini response."""
    raw = raw.strip()
    if raw.startswith("```"):
        # Remove opening fence line
        lines = raw.split("\n")
        lines = lines[1:]  # remove ```json or ``` line
        # Remove closing fence if present
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        raw = "\n".join(lines)
    return raw.strip()


# ---------------------------------------------------------------------------
# Gemini AI price generation
# ---------------------------------------------------------------------------
async def _gemini_mandi_prices(state: str, district: str, lang: str) -> Optional[Dict[str, Any]]:
    """
    Uses Gemini 2.5 Flash to generate realistic, current, context-aware
    Indian mandi prices for the farmer's state and district.
    Returns dict with keys: prices (list), advisory (str), or None on failure.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None

    client = genai.Client(api_key=api_key)
    current_month = datetime.now().strftime("%B %Y")
    season = _get_season()

    system_prompt = (
        "You are an expert on Indian agricultural commodity markets (Mandi Bhav). "
        "You provide realistic, current mandi price data matching the requested JSON schema. "
        "Your prices must reflect actual seasonal patterns, MSP (Minimum Support Price) floors, "
        "state-specific crop profiles, and current market conditions."
    )

    commodity_list = "wheat, onion, tomato, potato, paddy, cotton, corn, sugarcane"

    user_prompt = (
        f"Generate realistic mandi price data for a farmer in {district}, {state}, India.\n"
        f"Current date: {current_month}. Season: {season}.\n\n"
        "Rules:\n"
        f"- Include EXACTLY 8 price entries, one per commodity in the list: {commodity_list}\n"
        f"- Use 2-3 realistic mandi names in English from {district} district or nearby {state}\n"
        "- Prices are INR per quintal: wheat 2100-2800, onion 800-3500, tomato 600-2500, "
        "potato 900-1800, paddy 1800-2600, cotton 5500-8500, corn 1600-2300, sugarcane 300-420\n"
        "- change: integer price difference from yesterday (can be negative, zero, or positive)\n"
        "- date: the string today or yesterday\n"
        f"- advisory: 3-5 sentences of detailed market advice in {_lang_name(lang)}, explaining what to sell now, what to hold, and why based on current season and prices\n"
        f"- Adjust prices to reflect {season} seasonal supply and demand\n"
        "- mandi names must be written in English only"
    )

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json",
                response_schema=MandiResponse,
                temperature=0.3,
            )
        )
        raw = response.text.strip()

        # Parse JSON cleanly
        data = json.loads(raw)
        prices = data.get("prices", [])
        advisory = data.get("advisory", "")

        # Ensure each price entry has the correct emoji and format correctly
        formatted_prices = []
        for p in prices:
            comm_id = p.get("commodityId", "wheat")
            formatted_prices.append({
                "commodityId": comm_id,
                "emoji": COMMODITY_EMOJIS.get(comm_id, "🌾"),
                "mandi": p.get("mandi", f"{district} Mandi"),
                "state": p.get("state", state),
                "price": int(p.get("price", 2000)),
                "change": int(p.get("change", 0)),
                "date": p.get("date", "today")
            })

        logger.info(f"Gemini generated {len(formatted_prices)} mandi price entries for {district}, {state}.")
        return {"prices": formatted_prices, "advisory": advisory}

    except Exception as e:
        logger.error(f"Gemini mandi price generation or parse failed: {e}. Raw was: {raw}")
        return None


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------
async def fetch_market_data(state: str, district: str, lang: str = "hi") -> Dict[str, Any]:
    """
    Primary entry point for mandi price data.

    Priority order:
      1. In-memory cache (5-minute TTL) — avoids duplicate Gemini calls
      2. Gemini AI live price generation
      3. Static day-seeded mock fallback
    """
    # 1. Check cache first
    cached = _get_cached(state, district, lang)
    if cached:
        return cached

    # 2. Try Gemini
    logger.info(f"Fetching mandi prices for {district}, {state} (lang={lang}) via Gemini AI...")
    gemini_result = await _gemini_mandi_prices(state, district, lang)

    if gemini_result and gemini_result.get("prices"):
        result = {
            "state": state,
            "district": district,
            "prices": gemini_result["prices"],
            "advisory": gemini_result["advisory"],
            "source": "gemini_ai",
        }
        _set_cache(state, district, lang, result)
        return result

    # 3. Fallback to static mock
    logger.warning("Gemini mandi price call failed or returned empty. Using static fallback.")
    mock_prices = _static_fallback_prices(state, district)
    advisory = _static_fallback_advisory(mock_prices, lang)
    result = {
        "state": state,
        "district": district,
        "prices": mock_prices,
        "advisory": advisory,
        "source": "static_fallback",
    }
    _set_cache(state, district, lang, result)
    return result
