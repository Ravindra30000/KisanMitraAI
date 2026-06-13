from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
import os
import uuid
import logging
from app.services.disease import diagnose_crop_disease

logger = logging.getLogger("kisanmitra-router-disease")

router = APIRouter(
    prefix="/api/disease",
    tags=["disease"]
)

# Ensure upload directory for diagnoses images exists
DIAGNOSES_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "static", "diagnoses")
os.makedirs(DIAGNOSES_DIR, exist_ok=True)

@router.post("/diagnose")
async def diagnose(
    file: UploadFile = File(...),
    lang: str = Form("hi"),
    crop: Optional[str] = Form(None),
    region: Optional[str] = Form(None),
    season: Optional[str] = Form(None)
):
    """
    Diagnoses crop diseases from an uploaded leaf image.
    Saves the image locally and sends it to the Gemini 2.5 Flash Vision model.
    """
    try:
        content_type = file.content_type
        if not content_type or not content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

        # Read image contents
        image_bytes = await file.read()
        
        # Save image locally for reference
        file_ext = os.path.splitext(file.filename or "")[1] or ".jpg"
        unique_filename = f"diag_{uuid.uuid4().hex[:8]}{file_ext}"
        filepath = os.path.join(DIAGNOSES_DIR, unique_filename)
        
        with open(filepath, "wb") as f:
            f.write(image_bytes)
            
        logger.info(f"Saved diagnosis upload to {filepath}")
        
        # Call Gemini Vision service
        diagnosis_result = await diagnose_crop_disease(
            image_bytes=image_bytes,
            mime_type=content_type,
            lang=lang,
            crop=crop,
            region=region,
            season=season
        )
        
        # Add local image URL to response for rendering in UI if needed
        local_url = f"/static/diagnoses/{unique_filename}"
        diagnosis_result["image_url"] = local_url
        
        return diagnosis_result
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Failed to diagnose crop leaf: {e}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error during diagnosis: {str(e)}")
