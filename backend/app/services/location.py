import httpx
import logging
import json
from typing import Dict
from google.genai import types
from app.services.voice import get_gemini_client

logger = logging.getLogger("kisanmitra-service-location")

async def reverse_geocode(lat: float, lon: float) -> Dict[str, str]:
    """
    Translates latitude and longitude coordinates into the Indian State and District.
    Queries OpenStreetMap Nominatim first, and uses Gemini 2.5 Flash as a robust fallback.
    """
    # Try Nominatim first
    url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}&zoom=10&addressdetails=1"
    headers = {"User-Agent": "KisanMitraAI/1.0 (contact@kisanmitra.in)"}
    
    try:
        logger.info(f"Geocoding coordinates via Nominatim: lat={lat}, lon={lon}")
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, timeout=6.0)
            
        if response.status_code == 200:
            data = response.json()
            address = data.get("address", {})
            
            state = address.get("state")
            # In India, districts can be under district, state_district, county, city, etc.
            district = (
                address.get("district") or 
                address.get("state_district") or 
                address.get("county") or 
                address.get("city") or 
                address.get("subdistrict")
            )
            
            # Clean district name
            if district:
                district = district.replace(" District", "").replace(" Division", "").strip()
                
            if state:
                logger.info(f"Nominatim resolved location: state='{state}', district='{district}'")
                return {
                    "state": state,
                    "district": district or "Unknown"
                }
    except Exception as e:
        logger.warning(f"Nominatim geocoding failed: {e}. Falling back to Gemini...")

    # Fallback to Gemini 2.5 Flash
    try:
        prompt = f"""
You are a reverse geocoder helper for India.
Given the latitude {lat} and longitude {lon}, identify the exact Indian State and District.
If the location is not in India, return the closest Indian border state and its nearest district.
Format your response strictly as JSON with keys "state" and "district":
{{"state": "Name of State", "district": "Name of District"}}
Return ONLY this JSON object, no introductory text, no markdown code block fences.
"""
        client = get_gemini_client()
        
        logger.info(f"Calling Gemini 2.5 Flash to geocode coordinates: lat={lat}, lon={lon}")
        response = await client.aio.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        
        text = response.text.strip()
        result = json.loads(text)
        
        state = result.get("state", "Madhya Pradesh")
        district = result.get("district", "Bhopal")
        
        logger.info(f"Gemini geocoding fallback resolved: state='{state}', district='{district}'")
        return {
            "state": state,
            "district": district
        }
        
    except Exception as gemini_err:
        logger.error(f"Gemini geocoding fallback also failed: {gemini_err}")
        return {
            "state": "Madhya Pradesh",
            "district": "Bhopal"
        }

async def forward_geocode(state: str, district: str) -> Dict[str, float]:
    """
    Forward geocodes an Indian State and District into approximate latitude and longitude coordinates.
    Queries Gemini 2.5 Flash to resolve.
    """
    try:
        prompt = f"""
You are a geocoder helper for India.
Given the State "{state}" and District "{district}", return the approximate latitude and longitude coordinates near the center of this district.
Format your response strictly as JSON with keys "lat" and "lon":
{{"lat": 23.2599, "lon": 77.4126}}
Return ONLY this JSON object, no introductory text, no markdown code block fences.
"""
        client = get_gemini_client()
        logger.info(f"Calling Gemini 2.5 Flash to forward-geocode: {district}, {state}")
        response = await client.aio.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        text = response.text.strip()
        result = json.loads(text)
        return {
            "lat": float(result.get("lat", 23.2599)),
            "lon": float(result.get("lon", 77.4126))
        }
    except Exception as e:
        logger.error(f"Forward geocoding failed: {e}")
        # Return default coordinate for State/District if possible, otherwise Bhopal
        state_defaults = {
            "Madhya Pradesh": {"lat": 23.2599, "lon": 77.4126},
            "Uttar Pradesh": {"lat": 26.8467, "lon": 80.9462},
            "Maharashtra": {"lat": 19.7515, "lon": 75.7139},
            "Gujarat": {"lat": 22.2587, "lon": 71.1924},
            "Punjab": {"lat": 31.1471, "lon": 75.3412}
        }
        return state_defaults.get(state, {"lat": 23.2599, "lon": 77.4126})

