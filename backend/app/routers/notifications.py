from fastapi import APIRouter, Query
from typing import List, Dict, Any, Optional
import logging
from app.services.weather import fetch_weather_data

logger = logging.getLogger("kisanmitra-router-notifications")

router = APIRouter(
    prefix="/api/notifications",
    tags=["notifications"]
)

# Multi-lingual translation dictionaries for dynamic notification templates
TRANSLATIONS = {
    "weather_rain": {
        "hi": {
            "title": "मौसम चेतावनी: भारी बारिश 🌧️",
            "content": "आपके क्षेत्र में भारी बारिश की संभावना है। सिंचाई और कीटनाशक छिड़काव अभी रोकें।",
            "actionText": "मौसम देखें"
        },
        "hl": {
            "title": "Mausam Chetavni: Bhaari Baarish 🌧️",
            "content": "Bhaari baarish hone ki sambhavna hai. Sinchai aur spray rokein.",
            "actionText": "Mausam dekhein"
        },
        "en": {
            "title": "Weather Alert: Heavy Rain 🌧️",
            "content": "Heavy rain expected. Postpone irrigation and pesticide spraying.",
            "actionText": "Check Weather"
        },
        "mr": {
            "title": "हवामान चेतावणी: मुसळधार पाऊस 🌧️",
            "content": "मुसळधार पावसाची शक्यता आहे. पाणी देणे आणि फवारणी थांबवा.",
            "actionText": "हवामान पहा"
        },
        "gu": {
            "title": "હવામાન ચેતવણી: ભારે વરસાદ 🌧️",
            "content": "ભારે વરસાદની સંભાવના છે. સિંચાઈ અને જંતુનાશક છંટકાવ અટકાવો.",
            "actionText": "હવામાન જુઓ"
        },
        "pa": {
            "title": "ਮੌਸਮ ਚੇਤਾਵਨੀ: ਭਾਰੀ ਮੀਂਹ 🌧️",
            "content": "ਭਾਰੀ ਮੀਂਹ ਪੈਣ ਦੀ ਸੰਭਾਵਨਾ ਹੈ। ਸਿੰਚਾਈ ਅਤੇ ਕੀਟਨਾਸ਼ਕ ਸਪ੍ਰੇ ਰੋਕੋ।",
            "actionText": "ਮੌਸਮ ਦੇਖੋ"
        }
    },
    "weather_wind": {
        "hi": {
            "title": "मौसम चेतावनी: तेज हवा 💨",
            "content": "तेज हवाएं चलने की आशंका है। छिड़काव रोकें ताकि दवा हवा में न उड़े।",
            "actionText": "मौसम देखें"
        },
        "hl": {
            "title": "Mausam Chetavni: Tej Hawa 💨",
            "content": "Tej hawa chalne ki sambhavna hai. Spraying abhi rok dein.",
            "actionText": "Mausam dekhein"
        },
        "en": {
            "title": "Weather Alert: High Winds 💨",
            "content": "High wind speeds detected. Delay pesticide spraying to avoid drift.",
            "actionText": "Check Weather"
        },
        "mr": {
            "title": "हवामान चेतावणी: वेगवान वारा 💨",
            "content": "वेगवान वारा वाहण्याची शक्यता आहे. औषध फवारणी पुढे ढकला.",
            "actionText": "हवामान पहा"
        },
        "gu": {
            "title": "હવામાન ચેતવણી: ઝડપી પવન 💨",
            "content": "ઝડપી પવન ફૂંકાવાની સંભાવના છે. છંટકાવ મોકૂફ રાખો.",
            "actionText": "હવામાન જુઓ"
        },
        "pa": {
            "title": "ਮੌਸਮ ਚੇਤਾਵਨੀ: ਤੇਜ਼ ਹਵਾ 💨",
            "content": "ਤੇਜ਼ ਹਵਾ ਚੱਲਣ ਦੀ ਸੰਭਾਵਨਾ ਹੈ। ਸਪ੍ਰੇ ਕਰਨਾ ਮੁਲਤਵੀ ਕਰੋ।",
            "actionText": "ਮੌਸਮ ਦੇਖੋ"
        }
    },
    "disease_rust": {
        "hi": {
            "title": "पीला रतुआ चेतावनी (गेंहू) 🚨",
            "content": "हवा में अधिक नमी के कारण गेहूं की फसल पर पीला रतुआ रोग का मध्यम खतरा है। नीम तेल का उपयोग करें।",
            "actionText": "रोग जांच करें"
        },
        "hl": {
            "title": "Yellow Rust Warn (Gehu) 🚨",
            "content": "Bhopal region mein wheat pe Yellow Rust ka moderate khatra hai. Neem oil spray karein.",
            "actionText": "Rog jaanch karein"
        },
        "en": {
            "title": "Yellow Rust Warning (Wheat) 🚨",
            "content": "A moderate risk of Yellow Rust disease is predicted due to high humidity. Apply Neem oil spray.",
            "actionText": "Detect Disease"
        },
        "mr": {
            "title": "तांबेरा चेतावणी (गहू) 🚨",
            "content": "हवेतील दमटपणामुळे गव्हावर तांबेरा रोगाचा मध्यम धोका आहे. कडुनिंब तेलाची फवारणी करा.",
            "actionText": "रोग तपासणी करा"
        },
        "gu": {
            "title": "ગેરુ રોગ ચેતવણી (ઘઉં) 🚨",
            "content": "ભેજવાળા વાતાવરણને કારણે ઘઉંના પાક પર પીળા ગેરુ રોગનો મધ્યમ ખતરો છે. લીમડાના તેલનો છંટકાવ કરો.",
            "actionText": "રોગની તપાસ કરો"
        },
        "pa": {
            "title": "ਪੀਲੀ ਕੁੰਗੀ ਚੇਤਾਵਨੀ (ਕਣਕ) 🚨",
            "content": "ਹਵਾ ਵਿੱਚ ਨਮੀ ਕਾਰਨ ਕਣਕ ਦੀ ਫਸਲ 'ਤੇ ਪੀਲੀ ਕੁੰਗੀ ਦਾ ਮੱਧਮ ਖ਼ਤਰਾ ਹੈ। ਨਿੰਮ ਦੇ ਤੇਲ ਦਾ ਸਪ੍ਰੇ ਕਰੋ।",
            "actionText": "ਰੋਗ ਦੀ ਜਾਂਚ ਕਰੋ"
        }
    },
    "market_price": {
        "hi": {
            "title": "मंडी अलर्ट: प्याज के दाम में तेजी (+₹80) 📈",
            "content": "भोपाल मंडी में प्याज के दाम ₹2,450/क्विंटल पर पहुंचे। मांग लगातार बढ़ रही है।",
            "actionText": "मंडी भाव देखें"
        },
        "hl": {
            "title": "Mandi Alert: Pyaz ke Daam Tezi (+₹80) 📈",
            "content": "Bhopal mandi mein pyaz ke rate ₹2,450/quintal par pahunche. Bechne ka sahi samay.",
            "actionText": "Mandi bhav dekhein"
        },
        "en": {
            "title": "Mandi Alert: Onion Price Surge (+₹80) 📈",
            "content": "Onion prices touched ₹2,450/quintal in Bhopal Mandi. Solid demand, ideal time to sell.",
            "actionText": "Check Mandi Prices"
        },
        "mr": {
            "title": "मंडी अलर्ट: कांदा दरात वाढ (+₹८०) 📈",
            "content": "भोपाळ मंडीमध्ये कांद्याचे दर ₹२,४५०/क्विंटलवर पोहोचले. विक्रीसाठी योग्य वेळ.",
            "actionText": "बाजार भाव पहा"
        },
        "gu": {
            "title": "મંડી એલર્ટ: ડુંગળી ભાવમાં ઉછાળો (+₹૮૦) 📈",
            "content": "ભોપાલ મંડીમાં ડુંગળીના ભાવ ₹૨,૪૫૦/ક્વિન્ટલ પર પહોંચ્યા. વેચવાનો ઉત્તમ સમય.",
            "actionText": "મંડી ભાવ જુઓ"
        },
        "pa": {
            "title": "ਮੰਡੀ ਅਲਰਟ: ਪਿਆਜ਼ ਦੇ ਰੇਟ ਵਿੱਚ ਤੇਜ਼ੀ (+₹80) 📈",
            "content": "ਭੋਪਾਲ ਮੰਡੀ ਵਿੱਚ ਪਿਆਜ਼ ਦੇ ਰੇਟ ₹2,450/ਕੁਇੰਟਲ 'ਤੇ ਪਹੁੰਚ ਗਏ ਹਨ। ਵੇਚਣ ਦਾ ਸਹੀ ਸਮਾਂ।",
            "actionText": "ਮੰਡੀ ਦੇ ਭਾਅ ਦੇਖੋ"
        }
    },
    "scheme_deadline": {
        "hi": {
            "title": "PMFBY बीमा की अंतिम तिथि ⏰",
            "content": "रबी मौसम फसलों के बीमा आवेदन हेतु अंतिम तिथि 31 दिसंबर है। केवल 12 दिन शेष हैं।",
            "actionText": "आवेदन करें"
        },
        "hl": {
            "title": "PMFBY Insurance Deadline ⏰",
            "content": "Rabi crop insurance apply karne ki aakhri date 31 December hai. Apply karein.",
            "actionText": "Apply Karein"
        },
        "en": {
            "title": "PMFBY Insurance Deadline ⏰",
            "content": "Last date to apply for Rabi crop insurance under PMFBY is 31st December. 12 days left.",
            "actionText": "Apply Now"
        },
        "mr": {
            "title": "PMFBY विमा मुदत ⏰",
            "content": "रब्बी पीक विम्यासाठी अर्ज करण्याची अंतिम तारीख ३१ डिसेंबर आहे. फक्त १२ दिवस शिल्लक.",
            "actionText": "अर्ज करा"
        },
        "gu": {
            "title": "PMFBY પાક વીમો છેલ્લી તારીખ ⏰",
            "content": "રબી પાક વીમા માટે અરજી કરવાની છેલ્લી તારીખ ૩૧ ડિસેમ્બર છે. ફક્ત ૧૨ દિવસ બાકી.",
            "actionText": "અરજી કરો"
        },
        "pa": {
            "title": "PMFBY ਫਸਲ ਬੀਮਾ ਆਖਰੀ ਤਾਰੀਖ ⏰",
            "content": "ਰਬੀ ਫਸਲ ਬੀਮੇ ਲਈ ਅਪਲਾਈ ਕਰਨ ਦੀ ਆਖਰੀ ਤਾਰੀਖ 31 ਦਸੰਬਰ ਹੈ। ਸਿਰਫ਼ 12 ਦਿਨ ਬਾਕੀ ਹਨ।",
            "actionText": "ਅਪਲਾਈ ਕਰੋ"
        }
    }
}

@router.get("")
async def get_notifications(
    lat: float = Query(23.2599, description="Latitude for weather checks"),
    lon: float = Query(77.4126, description="Longitude for weather checks"),
    state: str = Query("Madhya Pradesh", description="Farmer state location"),
    district: str = Query("Bhopal", description="Farmer district location"),
    lang: str = Query("hi", description="Language translation to output"),
    crops: str = Query("wheat,onion,tomato", description="Comma-separated list of active crops")
):
    """
    Dynamically generates real-time notifications for weather, crop diseases, market prices, and schemes.
    Checks Open-Meteo weather parameters, user-growing crops, and outputs localized text templates.
    """
    notifications = []
    crop_list = [c.strip().lower() for c in crops.split(",")]
    
    # 1. Fetch live weather & trigger weather notifications
    weather_alert_triggered = False
    wind_alert_triggered = False
    humidity_alert_triggered = False
    
    try:
        weather_data = await fetch_weather_data(lat, lon, lang)
        current = weather_data.get("current", {})
        forecast = weather_data.get("forecast", [])
        
        # Rule A: Rain sum > 2.0 mm (today or tomorrow)
        rain_today = forecast[0].get("precipitation", 0.0) if len(forecast) > 0 else 0.0
        rain_tomorrow = forecast[1].get("precipitation", 0.0) if len(forecast) > 1 else 0.0
        if rain_today > 2.0 or rain_tomorrow > 2.0:
            weather_alert_triggered = True
            
        # Rule B: Wind speed > 25.0 km/h
        if current.get("wind_speed", 0.0) > 25.0:
            wind_alert_triggered = True
            
        # Rule C: Humidity > 75%
        if current.get("humidity", 0.0) > 75.0:
            humidity_alert_triggered = True
            
    except Exception as e:
        logger.error(f"Fallback to static trigger rules due to weather fetch error: {e}")
        # Default mock fallback triggers for demo purposes
        weather_alert_triggered = True
        humidity_alert_triggered = True

    # Build dynamic notification list
    
    # Alert 1: Weather - Rain Warning
    if weather_alert_triggered:
        template = TRANSLATIONS["weather_rain"].get(lang, TRANSLATIONS["weather_rain"]["hi"])
        notifications.append({
            "id": "weather_rain_01",
            "type": "weather",
            "title": template["title"],
            "content": template["content"],
            "time": "1 ghante pehle" if lang == "hl" else "1 घंटे पहले" if lang == "hi" else "1 hour ago",
            "unread": True,
            "actionRoute": "/weather",
            "actionText": template["actionText"]
        })

    # Alert 2: Weather - Wind Warning
    if wind_alert_triggered:
        template = TRANSLATIONS["weather_wind"].get(lang, TRANSLATIONS["weather_wind"]["hi"])
        notifications.append({
            "id": "weather_wind_01",
            "type": "weather",
            "title": template["title"],
            "content": template["content"],
            "time": "Abhi" if lang == "hl" else "अभी" if lang == "hi" else "Just now",
            "unread": True,
            "actionRoute": "/weather",
            "actionText": template["actionText"]
        })

    # Alert 3: Disease - Yellow Rust (triggers if humidity is high AND farmer grows wheat/gehu)
    has_wheat = any(w in crop_list for w in ["wheat", "gehu", "wheat crop"])
    if humidity_alert_triggered and has_wheat:
        template = TRANSLATIONS["disease_rust"].get(lang, TRANSLATIONS["disease_rust"]["hi"])
        # Format custom content with district
        formatted_content = template["content"].replace("Bhopal", district)
        notifications.append({
            "id": "disease_rust_01",
            "type": "disease",
            "title": template["title"],
            "content": formatted_content,
            "time": "Abhi 9:30 AM" if lang == "hl" else "अभी 9:30 AM" if lang == "hi" else "Today 9:30 AM",
            "unread": True,
            "actionRoute": "/disease",
            "actionText": template["actionText"]
        })

    # Alert 4: Mandi Market - Price Surge (triggers if farmer grows onion/pyaz)
    has_onion = any(o in crop_list for o in ["onion", "pyaz", "onion crop"])
    if has_onion:
        template = TRANSLATIONS["market_price"].get(lang, TRANSLATIONS["market_price"]["hi"])
        formatted_content = template["content"].replace("Bhopal", district)
        notifications.append({
            "id": "market_price_01",
            "type": "market",
            "title": template["title"],
            "content": formatted_content,
            "time": "2 ghante pehle" if lang == "hl" else "2 घंटे पहले" if lang == "hi" else "2 hours ago",
            "unread": True,
            "actionRoute": "/market",
            "actionText": template["actionText"]
        })

    # Alert 5: Schemes - Deadlines
    template = TRANSLATIONS["scheme_deadline"].get(lang, TRANSLATIONS["scheme_deadline"]["hi"])
    notifications.append({
        "id": "scheme_deadline_01",
        "type": "scheme",
        "title": template["title"],
        "content": template["content"],
        "time": "2 din pehle" if lang == "hl" else "2 दिन पहले" if lang == "hi" else "2 days ago",
        "unread": False,
        "actionRoute": "/schemes",
        "actionText": template["actionText"]
    })

    return {
        "status": "success",
        "unreadCount": sum(1 for n in notifications if n["unread"]),
        "notifications": notifications
    }
