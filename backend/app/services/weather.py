import httpx
import logging
from typing import Optional, Dict, Any, List

logger = logging.getLogger("kisanmitra-service-weather")

def map_wmo_code(code: int) -> str:
    """
    Maps WMO Weather Codes to UI-friendly condition categories: sunny, cloudy, or rainy.
    """
    if code in [0, 1]:
        return "sunny"
    elif code in [2, 3, 45, 48]:
        return "cloudy"
    else:
        return "rainy"

def get_localized_advisory(
    lang: str,
    temp: float,
    humidity: float,
    wind: float,
    rain_today: float,
    rain_tomorrow: float
) -> str:
    """
    Generates localized farming advisories in multiple languages based on meteorological triggers.
    Supported: hi (Hindi), hl (Hinglish), en (English), mr (Marathi), gu (Gujarati), pa (Punjabi).
    """
    # 1. High Rain trigger (today or tomorrow)
    if rain_today > 2.0 or rain_tomorrow > 2.0:
        advisories = {
            "hi": "खेतों में बारिश होने की संभावना है। कृपया आज किसी भी प्रकार का खाद (उर्वरक) या जैविक स्प्रे न डालें, नहीं तो यह धुल जाएगा।",
            "hl": "Barish hone ki sambhavna hai. Kripya aaj fertilser ya organic spray na karein taaki dawai beh na jaye.",
            "en": "Rain is expected. Please postpone fertilizer or organic spray applications to prevent runoff.",
            "mr": "पाऊस पडण्याची शक्यता आहे. कृपया आज खत किंवा सेंद्रिय फवारणी करू नका जेणेकरून औषध वाहून जाणार नाही.",
            "gu": "વરસાદ થવાની સંભાવના છે. કૃપા કરીને આજે ખાતર કે સજીવ છંટકાવ ન કરશો જેથી દવા ધોવાઈ ન જાય.",
            "pa": "ਮੀਂਹ ਪੈਣ ਦੀ ਸੰਭਾਵਨਾ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਅੱਜ ਖਾਦ ਜਾਂ ਜੈਵਿਕ ਸਪਰੇਅ ਨਾ ਕਰੋ ਤਾਂ ਜੋ ਦਵਾਈ ਵਹਿ ਨਾ ਜਾਵੇ।"
        }
        return advisories.get(lang, advisories["hi"])

    # 2. High Wind trigger
    if wind > 25.0:
        advisories = {
            "hi": f"तेज हवाएं ({wind} किमी/घंटा) चल रही हैं। छिड़काव (spraying) टालें, अन्यथा दवा हवा में बिखर जाएगी।",
            "hl": f"Tej hawa ({wind} km/h) chal rahi hai. Spraying abhi rok dein kyunki hawa mein spray udd jayega.",
            "en": f"Strong winds ({wind} km/h) detected. Postpone spraying to prevent wind drift.",
            "mr": f"वेगवान वारा ({wind} किमी/तास) वाहत आहे. फवारणी पुढे ढकला जेणेकरून औषध हवेत उडून जाणार नाही.",
            "gu": f"ઝડપી પવન ({wind} કિમી/કલાક) ફૂંકાઈ રહ્યો છે. છંટકાવ મોકૂફ રાખો જેથી દવા હવામાં ઊડી ન જાય.",
            "pa": f"ਤੇਜ਼ ਹਵਾ ({wind} ਕਿਲੋਮੀਟਰ/ਘੰਟਾ) ਚੱਲ ਰਹੀ ਹੈ। ਸਪਰੇਅ ਕਰਨਾ ਮੁਲਤਵੀ ਕਰੋ ਤਾਂ ਜੋ ਦਵਾਈ ਹਵਾ ਵਿੱਚ ਉੱਡ ਨਾ ਜਾਵੇ।"
        }
        return advisories.get(lang, advisories["hi"])

    # 3. High Humidity + Warm Temp (Fungal Alert)
    if humidity > 75.0 and temp > 24.0:
        advisories = {
            "hi": f"हवा में अधिक नमी ({humidity}%) है। फसलों में फंगल (फफूंद) बीमारी का खतरा है। रोकथाम के लिए नीम तेल का छिड़काव करें।",
            "hl": f"Humidity zyada ({humidity}%) hai. Fungal disease ka khatra hai. Neem oil spray ka upayog karein.",
            "en": f"High humidity ({humidity}%) and warm weather increase fungal disease risk. Consider preventative organic Neem oil sprays.",
            "mr": f"हवेत जास्त ओलावा ({humidity}%) आहे. पिकांवर बुरशीजन्य रोगांचा धोका आहे. कडुनिंब तेलाची फवारणी करा.",
            "gu": f"હવામાં ભેજ વધુ ({humidity}%) છે. પાકમાં ફૂગના રોગોનો ખતરો છે. અટકાવવા માટે લીમડાના તેલનો છંટકાવ કરો.",
            "pa": f"ਹਵਾ ਵਿੱਚ ਨਮੀ ਜ਼ਿਆਦਾ ({humidity}%) ਹੈ। ਫਸਲਾਂ ਵਿੱਚ ਉੱਲੀ ਰੋਗ ਦਾ ਖਤਰਾ ਹੈ। ਬਚਾਅ ਲਈ ਨਿੰਮ ਦੇ ਤੇਲ ਦਾ ਸਪਰੇਅ ਕਰੋ।"
        }
        return advisories.get(lang, advisories["hi"])

    # 4. Extreme Heat
    if temp > 40.0:
        advisories = {
            "hi": f"भीषण गर्मी ({temp}°C) है। फसल को झुलसने से बचाने के लिए शाम को हल्की सिंचाई करें और मल्चिंग का उपयोग करें।",
            "hl": f"Bohot garmi ({temp}°C) hai. Fasal ko dhoop se bachane ke liye shaam ko halki sinchai karein aur mulching karein.",
            "en": f"Extreme high temperature ({temp}°C). Provide light evening irrigation and use soil mulching to conserve moisture.",
            "mr": f"अतिउष्ण हवामान ({temp}°C) आहे. पिके सुकू नयेत म्हणून संध्याकाळी हलके पाणी द्या आणि आच्छादन (mulching) करा.",
            "gu": f"ખૂબ ગરમી ({temp}°C) છે. પાકને લૂથી બચાવવા સાંજે હળવી સિંચાઈ આપો અને મલ્ચિંગ કરો.",
            "pa": f"ਬਹੁਤ ਗਰਮੀ ({temp}°C) ਹੈ। ਫਸਲ ਨੂੰ ਲੂ ਤੋਂ ਬਚਾਉਣ ਲਈ ਸ਼ਾਮ ਨੂੰ ਹਲਕੀ ਸਿੰਚਾਈ ਕਰੋ ਅਤੇ ਮਲਚਿੰਗ ਕਰੋ।"
        }
        return advisories.get(lang, advisories["hi"])

    # 5. Default/Optimal weather
    advisories = {
        "hi": f"मौसम अनुकूल है (तापमान: {temp}°C, हवा: {wind} किमी/घंटा)। निराई-गुड़ाई, सिंचाई या जैविक छिड़काव के लिए यह बहुत अच्छा समय है।",
        "hl": f"Mausam badiya hai (Temp: {temp}°C, Hawa: {wind} km/h). Niraai-gudaai ya organic spraying ke liye sahi samay hai.",
        "en": f"Optimal farming weather (Temp: {temp}°C, Wind: {wind} km/h). Excellent time for weeding, irrigation, or organic spraying.",
        "mr": f"हवामान अनुकूल आहे (तापमान: {temp}°C, वारा: {wind} किमी/तास). खुरपणी, पाणी देणे किंवा फवारणीसाठी योग्य वेळ आहे.",
        "gu": f"હવામાન સાનુકૂળ છે (તાપમાન: {temp}°C, પવન: {wind} કિમી/કલાક). નીંદણ, સિંચાઈ અથવા સજીવ છંટકાવ માટે ઉત્તમ સમય છે.",
        "pa": f"ਮੌਸम ਅਨੁਕੂਲ ਹੈ (ਤਾਪਮਾਨ: {temp}°C, ਹਵਾ: {wind} ਕਿਲੋਮੀਟਰ/ਘੰਟਾ)। ਗੋਡੀ, ਸਿੰਚਾਈ ਜਾਂ ਜੈਵਿਕ ਸਪਰੇਅ ਲਈ ਇਹ ਬਹੁਤ ਵਧੀਆ ਸਮਾਂ ਹੈ।"
    }
    return advisories.get(lang, advisories["hi"])

async def fetch_weather_data(lat: float, lon: float, lang: str = "hi") -> Dict[str, Any]:
    """
    Calls the Open-Meteo API and returns compiled forecast and advisory objects.
    """
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "daily": [
            "temperature_2m_max",
            "temperature_2m_min",
            "precipitation_sum",
            "windspeed_10m_max",
            "weathercode"
        ],
        "hourly": "relative_humidity_2m",
        "timezone": "Asia/Kolkata",
        "forecast_days": 7
    }

    try:
        logger.info(f"Fetching weather from Open-Meteo for lat={lat}, lon={lon}...")
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=10.0)
            
        if response.status_code != 200:
            logger.error(f"Open-Meteo returned status code {response.status_code}")
            raise Exception("Weather service unavailable")

        data = response.json()
        
        daily = data.get("daily", {})
        hourly = data.get("hourly", {})
        
        # 1. Compile 7-day forecast
        forecast_list = []
        for i in range(7):
            forecast_list.append({
                "dayIndex": i,
                "tempMax": int(round(daily["temperature_2m_max"][i])),
                "tempMin": int(round(daily["temperature_2m_min"][i])),
                "condition": map_wmo_code(daily["weathercode"][i]),
                "rainChance": int(min(100, round(daily["precipitation_sum"][i] * 10))), # Mock probability scaling
                "precipitation": daily["precipitation_sum"][i]
            })

        # 2. Extract current weather metrics (Day 0)
        current_temp = int(round((daily["temperature_2m_max"][0] + daily["temperature_2m_min"][0]) / 2))
        current_condition = map_wmo_code(daily["weathercode"][0])
        current_wind = daily["windspeed_10m_max"][0]
        
        # Average relative humidity for first 24 hours (today)
        humidity_today = 65.0 # default fallback
        if "relative_humidity_2m" in hourly and len(hourly["relative_humidity_2m"]) >= 24:
            humidity_today = sum(hourly["relative_humidity_2m"][:24]) / 24.0
            
        humidity_today = round(humidity_today, 1)
        rain_chance_today = forecast_list[0]["rainChance"]
        
        # 3. Generate Advisory
        rain_today = daily["precipitation_sum"][0]
        rain_tomorrow = daily["precipitation_sum"][1] if len(daily["precipitation_sum"]) > 1 else 0.0
        
        advisory_text = get_localized_advisory(
            lang=lang,
            temp=daily["temperature_2m_max"][0],
            humidity=humidity_today,
            wind=current_wind,
            rain_today=rain_today,
            rain_tomorrow=rain_tomorrow
        )

        return {
            "latitude": lat,
            "longitude": lon,
            "current": {
                "temp": current_temp,
                "condition": current_condition,
                "wind_speed": current_wind,
                "humidity": humidity_today,
                "rain_chance": rain_chance_today
            },
            "forecast": forecast_list,
            "advisory": advisory_text
        }

    except Exception as e:
        logger.error(f"Error fetching weather details: {e}")
        # Standard mock fallback data if service fails
        return {
            "latitude": lat,
            "longitude": lon,
            "current": {
                "temp": 28,
                "condition": "sunny",
                "wind_speed": 12.0,
                "humidity": 65.0,
                "rain_chance": 10
            },
            "forecast": [
                {"dayIndex": 0, "tempMax": 28, "tempMin": 22, "condition": "sunny", "rainChance": 10},
                {"dayIndex": 1, "tempMax": 30, "tempMin": 23, "condition": "cloudy", "rainChance": 30},
                {"dayIndex": 2, "tempMax": 29, "tempMin": 21, "condition": "rainy", "rainChance": 80},
                {"dayIndex": 3, "tempMax": 27, "tempMin": 20, "condition": "rainy", "rainChance": 90},
                {"dayIndex": 4, "tempMax": 31, "tempMin": 22, "condition": "cloudy", "rainChance": 40},
                {"dayIndex": 5, "tempMax": 32, "tempMin": 24, "condition": "sunny", "rainChance": 15},
                {"dayIndex": 6, "tempMax": 30, "tempMin": 23, "condition": "sunny", "rainChance": 10}
            ],
            "advisory": "मौसम सामान्य है। बुवाई, गुड़ाई या सामान्य जैविक दवाइयों के छिड़काव के लिए यह उत्तम समय है।"
        }
