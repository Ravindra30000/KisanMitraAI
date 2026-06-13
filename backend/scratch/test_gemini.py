import os
import sys
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List

sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv(override=True)

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

async def main():
    api_key = os.getenv("GEMINI_API_KEY")
    client = genai.Client(api_key=api_key)
    
    system_prompt = (
        "You are an expert on Indian agricultural commodity markets (Mandi Bhav). "
        "You provide realistic, current mandi price data matching the requested JSON schema."
    )
    
    user_prompt = (
        "Generate realistic mandi price data for a farmer in Bhopal, Madhya Pradesh, India.\n"
        "Current date: June 2026. Season: Kharif.\n\n"
        "Rules:\n"
        "- Include EXACTLY 8 price entries, one per commodity in the list: wheat, onion, tomato, potato, paddy, cotton, corn, sugarcane\n"
        "- Use 2-3 realistic mandi names in English from Bhopal district or nearby Madhya Pradesh\n"
        "- Prices are INR per quintal: wheat 2100-2800, onion 800-3500, tomato 600-2500, potato 900-1800, paddy 1800-2600, cotton 5500-8500, corn 1600-2300, sugarcane 300-420\n"
        "- change: integer price difference from yesterday (can be negative, zero, or positive)\n"
        "- date: the string today or yesterday\n"
        "- advisory: 2-3 sentences in Hindi advising the farmer what to sell or hold\n"
        "- mandi names must be written in English only"
    )

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
    
    print("FINISH REASON:", response.candidates[0].finish_reason)
    # Write response.text to output.json with utf-8 encoding
    with open("scratch/output.json", "w", encoding="utf-8") as f:
        f.write(response.text)
    print("Saved response.text to scratch/output.json")

import asyncio
asyncio.run(main())
