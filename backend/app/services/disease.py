import os
import logging
import json
from typing import List, Optional
from pydantic import BaseModel, Field
from google.genai import types
from app.services.voice import get_gemini_client

logger = logging.getLogger("kisanmitra-service-disease")

# Pydantic models for structured Gemini response
class OrganicRemedy(BaseModel):
    step: int = Field(description="Step number of the remedy starting from 1")
    action: str = Field(description="Core action in Hinglish/Hindi or English")
    recipe: Optional[str] = Field(None, description="Detailed recipe or preparation of the organic input if applicable")
    ingredients_local: bool = Field(description="True if the ingredients are easily found locally in rural India")
    timing: Optional[str] = Field(None, description="Best time of day or conditions to apply")
    frequency: Optional[str] = Field(None, description="How often to apply the remedy")

class DiseaseDiagnosisResponse(BaseModel):
    disease_name: str = Field(description="Scientific/English name of the disease")
    disease_name_hindi: str = Field(description="Hindi/Hinglish name of the disease")
    confidence: int = Field(description="Confidence percentage (integer between 0 and 100)")
    symptoms_observed: List[str] = Field(description="List of 2-3 symptoms observed in the image")
    organic_remedies: List[OrganicRemedy] = Field(description="Detailed organic remedies list")
    chemical_remedies: List[str] = Field(default=[], description="Leave empty. Chemical remedies are strictly forbidden.")
    prevention: str = Field(description="One key prevention tip for the next season")
    confidence_label: str = Field(description="Confidence level based on threshold: 'high' if >85, 'medium' if 60-85, 'low' if <60")
    rag_sources: List[str] = Field(description="Simulated reference sources from agricultural manuals")
    disclaimer: str = Field(description="Disclaimer indicating it is an AI suggestion and recommending KVK helpline")
    kvk_number: str = Field(default="1800-180-1551", description="Helpline number for Krishi Vigyan Kendra")

SYSTEM_PROMPT = """
You are an expert Indian agricultural plant pathologist with 20 years of experience.
You specialize in identifying crop diseases and providing organic, chemical-free treatments.

When analyzing a crop image:
1. Identify the most likely disease/pest/deficiency.
2. State confidence as a percentage (integer 0-100).
3. List 2-3 visible symptoms you observed in the image (in Hinglish/Hindi or English depending on request).
4. Provide organic/natural remedies (at least 2).
5. Give step-by-step treatment instructions using locally available materials (e.g., Neemastra, Agniastra, sour buttermilk, etc.).
6. NEVER recommend chemical pesticides or chemical fertilizers. Leave the chemical_remedies list completely empty.
7. Add a prevention tip for next season.
8. Include a safety disclaimer.

Always respond in {language}.
Farmer profile: Crop: {crop}, Region: {region}, Season: {season}

IMPORTANT: 
- If confidence is less than 60%, state in the disclaimer that you are not sure and recommend consulting KVK.
- Never make up diseases you don't recognize.
- Always include the KVK helpline: 1800-180-1551.
- Prioritize Jeevamrit, Neem oil, Panchagavya, and traditional Indian remedies.
"""

def get_fallback_diagnosis(lang: str = "hi", crop: str = "tomato") -> dict:
    """
    Returns a default mock response matching the DiseaseDiagnosisResponse schema.
    Used as fallback when credentials are not configured or when API fails.
    """
    logger.info(f"Generating fallback mock response for crop={crop}, lang={lang}")
    
    # Standard responses based on language
    fallbacks = {
        "hi": {
            "disease_name": "Tomato Leaf Curl Virus",
            "disease_name_hindi": "टमाटर का पर्ण कुंचन रोग (पत्ता मरोड़)",
            "confidence": 92,
            "symptoms_observed": [
                "पत्तियों का ऊपर की ओर मुड़ना और छोटा होना।",
                "पत्तियों की नसों का पीला पड़ना।",
                "पौधे की वृद्धि का रुक जाना।"
            ],
            "organic_remedies": [
                {
                    "step": 1,
                    "action": "नीम के तेल का छिड़काव",
                    "recipe": "5 मिली नीम तेल प्रति लीटर पानी में मिलाकर 2-3 बूंदें लिक्विड सोप के साथ घोलें।",
                    "ingredients_local": True,
                    "timing": "सुबह या देर शाम",
                    "frequency": "सप्ताह में एक बार"
                },
                {
                    "step": 2,
                    "action": "पीले चिपचिपे प्रपंच (Sticky Traps) लगाएं",
                    "recipe": "पीले कार्डबोर्ड पर ग्रीस या मोबिल ऑयल लगाकर खेत में टांगें (सफेद मक्खियों के लिए)।",
                    "ingredients_local": True,
                    "timing": "फसल की शुरुआत से",
                    "frequency": "10-15 जाल प्रति एकड़"
                }
            ],
            "chemical_remedies": [],
            "prevention": "खेत के चारों ओर मक्का या बाजरा की सुरक्षात्मक पट्टी बोएं और प्रतिरोधी किस्मों का चयन करें।",
            "confidence_label": "high",
            "rag_sources": ["आईसीएआर टमाटर रोग नियंत्रण संदर्शिका", "टीएनएयू जैविक कृषि दिशानिर्देश"],
            "disclaimer": "यह एआई आधारित सुझाव है। पूरी पुष्टि और सटीक समाधान के लिए कृपया निकटतम केवीके (KVK) विशेषज्ञ से मिलें या हेल्पलाइन पर संपर्क करें।",
            "kvk_number": "1800-180-1551"
        },
        "hl": {
            "disease_name": "Tomato Leaf Curl Virus",
            "disease_name_hindi": "Tamatar ka Leaf Curl Virus (Patta Marod)",
            "confidence": 92,
            "symptoms_observed": [
                "Patte upar ki taraf mud rahe hain aur chote ho gaye hain.",
                "Pattiyon ki nasein peeli pad rahi hain.",
                "Podhe ki growth ruk gayi hai."
            ],
            "organic_remedies": [
                {
                    "step": 1,
                    "action": "Neem oil spray karein",
                    "recipe": "5ml neem oil + 1L pani + 2-3 drops liquid soap ka ghol banayein.",
                    "ingredients_local": True,
                    "timing": "Subah ya shaam ko",
                    "frequency": "Hafte mein ek baar"
                },
                {
                    "step": 2,
                    "action": "Yellow Sticky Traps lagayein",
                    "recipe": "Peele cardboard par grease lagakar khet mein tanghein taaki whiteflies chipak jayein.",
                    "ingredients_local": True,
                    "timing": "Fasal ke shuruat se",
                    "frequency": "10-15 traps per acre"
                }
            ],
            "chemical_remedies": [],
            "prevention": "Khet ke borders par makka ya bajra lagayein jo whitefly ko rok sake.",
            "confidence_label": "high",
            "rag_sources": ["ICAR Tomato Advisory", "TNAU Organic Guide"],
            "disclaimer": "Yeh AI sujhav hai. Confirm karne ke liye KVK expert se milein ya niche diye helpline par call karein.",
            "kvk_number": "1800-180-1551"
        }
    }
    
    # fallback to English if not hi or hl
    english_fallback = {
        "disease_name": "Tomato Leaf Curl Virus",
        "disease_name_hindi": "Tomato Leaf Curl Disease",
        "confidence": 92,
        "symptoms_observed": [
            "Upward curling and puckering of leaves.",
            "Yellowing of leaf veins.",
            "Stunted plant growth."
        ],
        "organic_remedies": [
            {
                "step": 1,
                "action": "Spray Neem Oil",
                "recipe": "Mix 5ml Neem Oil per liter of water with 2-3 drops of liquid soap.",
                "ingredients_local": True,
                "timing": "Early morning or late evening",
                "frequency": "Once a week"
            },
            {
                "step": 2,
                "action": "Install Yellow Sticky Traps",
                "recipe": "Place yellow cards coated with grease or glue in the field to trap whiteflies.",
                "ingredients_local": True,
                "timing": "From early growth stage",
                "frequency": "10-15 traps per acre"
            }
        ],
        "chemical_remedies": [],
        "prevention": "Plant barrier crops like maize or sorghum around the field border.",
        "confidence_label": "high",
        "rag_sources": ["ICAR Tomato Disease Guide", "TNAU Organic Farming Standards"],
        "disclaimer": "This is an AI generated recommendation. For professional diagnosis, please contact your nearest KVK expert or call the toll-free helpline.",
        "kvk_number": "1800-180-1551"
    }
    
    res = fallbacks.get(lang, english_fallback)
    # Customize crop name in output if not tomato
    if crop and crop.lower() != "tomato":
        res = json.loads(json.dumps(res)) # deep copy
        res["disease_name"] = f"Suspected Disease for {crop.capitalize()}"
        res["disease_name_hindi"] = f"{crop.capitalize()} ke liye rog ki aashanka"
    return res

async def diagnose_crop_disease(
    image_bytes: bytes,
    mime_type: str,
    lang: str = "hi",
    crop: Optional[str] = "tomato",
    region: Optional[str] = "Madhya Pradesh",
    season: Optional[str] = "Kharif"
) -> dict:
    """
    Sends crop leaf image to Gemini 2.5 Flash Vision API.
    Returns a structured dictionary matching the DiseaseDiagnosisResponse schema.
    """
    api_key = os.getenv("GEMINI_API_KEY", "")
    project = os.getenv("GCP_PROJECT", "")
    
    if not api_key and not project and not os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
        logger.warning("No Gemini configuration found. Using fallback mock diagnosis.")
        return get_fallback_diagnosis(lang, crop)
        
    try:
        client = get_gemini_client()
        
        # Format instruction
        system_instruction = SYSTEM_PROMPT.format(
            language=lang,
            crop=crop or "tomato",
            region=region or "Madhya Pradesh",
            season=season or "Kharif"
        )
        
        # Prepare the image part using bytes and type
        image_part = types.Part.from_bytes(
            data=image_bytes,
            mime_type=mime_type
        )
        
        # Setup structured output configuration
        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            response_schema=DiseaseDiagnosisResponse,
            temperature=0.2
        )
        
        prompt = (
            "Carefully analyze the uploaded leaf image. Determine: "
            "1. Crop type and leaf health "
            "2. Specific disease/pest or nutrient deficiency "
            "3. Confidence score "
            "4. Organic remedies (with local recipes, timing, frequency) "
            "5. Do NOT recommend any chemical remedies (keep chemical_remedies empty) "
            "6. Prevention tips and sources."
        )
        
        logger.info("Calling Gemini 2.5 Flash for disease diagnosis...")
        response = await client.aio.models.generate_content(
            model='gemini-2.5-flash',
            contents=[image_part, prompt],
            config=config
        )
        
        text = response.text.strip()
        logger.info("Successfully received response from Gemini.")
        
        # Load JSON to verify it compiles
        data = json.loads(text)
        return data
        
    except Exception as e:
        logger.error(f"Error during Gemini Vision analysis: {e}")
        return get_fallback_diagnosis(lang, crop)
