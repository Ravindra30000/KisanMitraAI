import os
import httpx
import re
from google import genai
from google.genai import types
import edge_tts
import logging
from dotenv import load_dotenv
from typing import Optional

load_dotenv(override=True)

logger = logging.getLogger("kisanmitra-voice")
logging.basicConfig(level=logging.INFO)

# ==========================================
# NUMBER TRANSLATION DICTIONARIES (0-99)
# ==========================================

HINDI_WORDS = {
    0: "शून्य", 1: "एक", 2: "दो", 3: "तीन", 4: "चार", 5: "पाँच", 6: "छह", 7: "सात", 8: "आठ", 9: "नौ", 10: "दस",
    11: "ग्यारह", 12: "बारह", 13: "तेरह", 14: "चौदह", 15: "पंद्रह", 16: "सोलह", 17: "सत्रह", 18: "अठारह", 19: "उन्नीस", 20: "बीस",
    21: "इक्कीस", 22: "बाईस", 23: "तेईस", 24: "चौबीस", 25: "पच्चीस", 26: "छब्बीस", 27: "सत्ताईस", 28: "अठ्ठावीस", 29: "उनतीस", 30: "तीस",
    31: "इकतीस", 32: "बत्तीस", 33: "तैंतीस", 34: "चौंतीस", 35: "पैंतीस", 36: "छत्तीस", 37: "सैंतीस", 38: "अड़तीस", 39: "उनतालीस", 40: "चालीस",
    41: "इकतालीस", 42: "बयालीस", 43: "तैंतालीस", 44: "चैंयालीस", 45: "पैंतालीस", 46: "छियालीस", 47: "सैंतालीस", 48: "अड़तालीस", 49: "उनचास", 50: "पचास",
    51: "इक्यावन", 52: "बावन", 53: "तिरेपन", 54: "चौवन", 55: "पचपन", 56: "छप्पपन", 57: "सतावन", 58: "अठावन", 59: "उनसठ", 60: "साठ",
    61: "इकसठ", 62: "बासठ", 63: "तिरसठ", 64: "चौnsठ", 65: "पैंसठ", 66: "छियासठ", 67: "सरसठ", 68: "अड़सठ", 69: "उनहत्तर", 70: "सत्तर",
    71: "इकहत्तर", 72: "बहत्तर", 73: "तिहत्तर", 74: "चौहत्तर", 75: "पचहत्तर", 76: "छहत्तर", 77: "सतहत्तर", 78: "अठहत्तर", 79: "उन्यासी", 80: "अस्सी",
    81: "इक्यासी", 82: "बयासी", 83: "तिरासी", 84: "चौरासी", 85: "पचासी", 86: "छियासी", 87: "सतासी", 88: "अठासी", 89: "नवासी", 90: "नब्बे",
    91: "इक्यानवे", 92: "बयानवे", 93: "तिरानवे", 94: "चौरानवे", 95: "पञ्चानवे", 96: "छियानवे", 97: "सत्तानवे", 98: "अट्ठानवे", 99: "निन्यानवे"
}

HINGLISH_WORDS = {
    0: "zero", 1: "ek", 2: "do", 3: "teen", 4: "chaar", 5: "paanch", 6: "chhe", 7: "saat", 8: "aath", 9: "nau", 10: "das",
    11: "gyarah", 12: "baarah", 13: "terah", 14: "chaudah", 15: "pandrah", 16: "solah", 17: "satrah", 18: "atharah", 19: "unnees", 20: "bees",
    21: "ekkees", 22: "baayees", 23: "teyees", 24: "chaubees", 25: "pachchees", 26: "chhabbees", 27: "sattaayees", 28: "atthaayees", 29: "untees", 30: "tees",
    31: "iktees", 32: "battees", 33: "taintees", 34: "chauntees", 35: "paintees", 36: "chhattees", 37: "saintees", 38: "adtees", 39: "untaalees", 40: "chaalees",
    41: "ektaalees", 42: "bayaalees", 43: "taintaalees", 44: "chawaalees", 45: "paintaalees", 46: "chhiyaalees", 47: "saintaalees", 48: "adtaalees", 49: "unchaas", 50: "pachaas",
    51: "ikyaawan", 52: "baawan", 53: "tirepan", 54: "chauwan", 55: "pachpan", 56: "chhappan", 57: "sataawan", 58: "athaawan", 59: "unsath", 60: "saath",
    61: "iksath", 62: "baasath", 63: "tirsath", 64: "chaunsath", 65: "painsath", 66: "chhiyaasath", 67: "sarsath", 68: "adsath", 69: "unhattar", 70: "sattar",
    71: "ikhattar", 72: "bahattar", 73: "tihattar", 74: "chauhattar", 75: "pachhattar", 76: "chhahattar", 77: "sathattar", 78: "athhattar", 79: "unyaasi", 80: "assee",
    81: "ikyaasi", 82: "bayaasi", 83: "tiraasi", 84: "chauraasi", 85: "pachaasi", 86: "chhiyaasi", 87: "sataasi", 88: "athaasi", 89: "nawaasi", 90: "nabbe",
    91: "ikyaanwe", 92: "bayaanwe", 93: "tiraanwe", 94: "chauraanwe", 95: "pachaanwe", 96: "chhiyaanwe", 97: "sattaanwe", 98: "thaanwe", 99: "ninyaanwe"
}

MARATHI_WORDS = {
    1: "एक", 2: "दोन", 3: "तीन", 4: "चार", 5: "पाच", 6: "सहा", 7: "सात", 8: "आठ", 9: "नऊ", 10: "दहा",
    11: "अकरा", 12: "बारा", 13: "तेरा", 14: "चौदा", 15: "पंधरा", 16: "सोळा", 17: "सतरा", 18: "अठरा", 19: "एकोणीस", 20: "वीस",
    21: "एकवीस", 22: "बावीस", 23: "तेवीस", 24: "चोवीस", 25: "पंचवीस", 26: "सव्वीस", 27: "सत्तावीस", 28: "अठ्ठावीस", 29: "एकूणतीस", 30: "तीस",
    31: "एकतीस", 32: "बत्तीस", 33: "तेहतीस", 34: "चौतीस", 35: "पस्तीस", 36: "छत्तीस", 37: "सदतीस", 38: "अडतीस", 39: "एकूणचाळीस", 40: "चाळीस",
    41: "एकचाळीस", 42: "बेचाळीस", 43: "तेहचाळीस", 44: "चौरेचाळीस", 45: "पंचेचाळीस", 46: "सहाचाळीस", 47: "सत्तेचाळीस", 48: "अठ्ठेचाळीस", 49: "एकूणपन्नास", 50: "पन्नास",
    51: "एक्कावन्न", 52: "बावन्न", 53: "त्रेपन्न", 54: "चौपन", 55: "पंचावन्न", 56: "छप्पन्न", 57: "सत्तावन्न", 58: "अठ्ठावन्न", 59: "एकूणसाठ", 60: "साठ",
    61: "एकसष्ठ", 62: "बासष्ठ", 63: "त्रेसष्ठ", 64: "चौसष्ठ", 65: "पाचसष्ठ", 66: "सहासष्ठ", 67: "सदुसष्ठ", 68: "अडुसष्ठ", 69: "एकूणसत्तर", 70: "सत्तर",
    71: "एकाहत्तर", 72: "बहात्तर", 73: "त्याहत्तर", 74: "चौऱ्याहत्तर", 75: "पंच्याहत्तर", 76: "शहात्तर", 77: "सत्याहत्तर", 78: "अठ्ठ्याहत्तर", 79: "एकूणऐंशी", 80: "ऐंशी",
    81: "एक्क्यांशी", 82: "ब्यांशी", 83: "त्र्यांशी", 84: "चौऱ्यांशी", 85: "पंच्यांशी", 86: "शहांशी", 87: "सत्यांशी", 88: "अठ्ठ्यांशी", 89: "एकूणनव्वद", 90: "नव्वद",
    91: "एक्क्याण्णव", 92: "ब्याण्णव", 93: "त्र्याण्णव", 94: "चौऱ्याण्णव", 95: "पंच्याण्णव", 96: "शहाण्णव", 97: "सत्याण्णव", 98: "अठ्ठ्याण्णव", 99: "नव्याण्णव"
}

GUJARATI_WORDS = {
    1: "એક", 2: "બે", 3: "ત્રણ", 4: "ચાર", 5: "પાંચ", 6: "છ", 7: "સાત", 8: "આઠ", 9: "નવ", 10: "દસ",
    11: "અગિયાર", 12: "બાર", 13: "તેર", 14: "ચૌદ", 15: "પંદર", 16: "સોળ", 17: "સત્તર", 18: "અઢાર", 19: "ઓગણિસ", 20: "વીસ",
    21: "એકવીસ", 22: "બાવીસ", 23: "તેવીસ", 24: "ચોવીસ", 25: "પંચીસ", 26: "છવીસ", 27: "સત્તાવીસ", 28: "અઠ્ઠાવીસ", 29: "ઓગણત્રીસ", 30: "ત્રીસ",
    31: "એકત્રીસ", 32: "બત્રીસ", 33: "તેત્રીસ", 34: "ચોંત્રીસ", 35: "પાંત્રીસ", 36: "છત્રીસ", 37: "સડત્રીસ", 38: "આડત્રીસ", 39: "ઓગણચાળીસ", 40: "ચાળીસ",
    41: "એકતાલીસ", 42: "બેતાલીસ", 43: "તેતાલીસ", 44: "ચોમાલીસ", 45: "પિસ્તાલીસ", 46: "છેતાલીસ", 47: "સુડતાલીસ", 48: "અડતાલીસ", 49: "ઓગણપચાસ", 50: "પચાસ",
    51: "એકાવન", 52: "બાવન", 53: "ત્રેપન", 54: "ચોવન", 55: "પંચાવન", 56: "છપ્પન", 57: "સત્તાવન", 58: "અઠ્ઠાવન", 59: "ઓગણસાઇઠ", 60: "સાઇઠ",
    61: "એકસઠ", 62: "બાસઠ", 63: "ત્રેસઠ", 64: "ચોસઠ", 65: "પાંસઠ", 66: "છાસઠ", 67: "સડસઠ", 68: "અડસઠ", 69: "ઓગણસિત્તેર", 70: "સિત્તેર",
    71: "એકોતેર", 72: "બોતેર", 73: "તોતેર", 74: "ચોતેર", 75: "પંચોતેર", 76: "છોતેર", 77: "સિત્યોતેર", 78: "ઇત્યોતેર", 79: "ઓગણએસી", 80: "એસી",
    81: "એક્યાસી", 82: "બ્યાસી", 83: "ત્યાસી", 84: "ચોર્યાસી", 85: "પંચાસી", 86: "છ્યાસી", 87: "સત્યાસી", 88: "અઠ્યાસી", 89: "નેવ્યાસી", 90: "નેવું",
    91: "એકાણું", 92: "બાણું", 93: "ત્રાણું", 94: "ચોરાણું", 95: "પંચાણું", 96: "છન્નું", 97: "સત્તાણું", 98: "અઠ્ઠાણું", 99: "નવ્વાણું"
}

PUNJABI_WORDS = {
    1: "ਇੱਕ", 2: "ਦੋ", 3: "ਤਿੰਨ", 4: "ਚਾਰ", 5: "ਪੰਜ", 6: "ਛੇ", 7: "ਸੱਤ", 8: "ਅੱਠ", 9: "ਨੌ", 10: "ਦੱਸ",
    11: "ਗਿਆਰਾਂ", 12: "ਬਾਰਾਂ", 13: "ਤੇਰਾਂ", 14: "ਚੌਦਾਂ", 15: "ਪੰਦਰਾਂ", 16: "ਸੋਲਾਂ", 17: "ਸਤਾਰਾਂ", 18: "ਅਠਾਰਾਂ", 19: "ਉੱਨੀ", 20: "ਵੀਹ",
    21: "ਇੱਕੀ", 22: "ਬਾਈ", 23: "ਤੇਈ", 24: "ਚੌਵੀ", 25: "ਪੱਚੀ", 26: "ਛੱਬੀ", 27: "ਸਤਾਈ", 28: "ਅਠਾਈ", 29: "ਉੱਨਤੀ", 30: "ਤੀਹ",
    31: "ਇੱਕਤੀ", 32: "ਬੱਤੀ", 33: "ਤੀਂਤੀ", 34: "ਚੌਂਤੀ", 35: "ਪੈਂਤੀ", 36: "ਛੱਤੀ", 37: "ਸੈਂਤੀ", 38: "ਅੜਤੀ", 39: "ਉਣਤਾਲੀ", 40: "ਚਾਲੀ",
    41: "ਇਕਤਾਲੀ", 42: "ਬਿਆਲੀ", 43: "ਤੜਤਾਲੀ", 44: "ਚਵਾਲੀ", 45: "ਪੈਤਾਲੀ", 46: "ਛਿਆਲੀ", 47: "ਸੰਤਾਲੀ", 48: "ਅੜਤਾਲੀ", 49: "ਉਣੰਜਾ", 50: "ਪੰਜਾਹ",
    51: "ਇਕਵੰਜਾ", 52: "ਬਾਵੰਜਾ", 53: "ਤਰਵੰਜਾ", 54: "ਚਵੰਜਾ", 55: "ਪਚਵੰਜਾ", 56: "ਛੱਪੰਜਾ", 57: "ਸਤਵੰਜਾ", 58: "ਅਠਵੰਜਾ", 59: "ਉਣਹਠ", 60: "ਸੱਠ",
    61: "ਇਕਾਹਠ", 62: "ਬਾਹਠ", 63: "ਤਰੇਹਠ", 64: "ਚੌਂਹਠ", 65: "ਪੈਂਹਠ", 66: "ਛਿਆਹਠ", 67: "ਸਤਾਰਹਠ", 68: "ਅਠਾਰਹਠ", 69: "ਉਣੱਤਰ", 70: "ਸੱਤਰ",
    71: "ਇਕੱਤਰ", 72: "ਬਹੱਤਰ", 73: "ਤਹੱਤਰ", 74: "ਚੌਹੱਤਰ", 75: "ਪਛੱਤਰ", 76: "ਛਿਹੱਤਰ", 77: "ਸਤੱਤਰ", 78: "ਅਠੱਤਰ", 79: "ਉਣਾਸੀ", 80: "ਅੱਸੀ",
    81: "ਇਕਿਆਸੀ", 82: "ਬਿਆਸੀ", 83: "ਤਿਆਸੀ", 84: "ਚੌਰਾसी", 85: "ਪਚਾਸੀ", 86: "ਛਿਆਸੀ", 87: "ਸਤਾਸੀ", 88: "ਅਠਾਸੀ", 89: "ਉਣਾਨਵੇਂ", 90: "ਨੱਬੇ",
    91: "ਇਕਾਨਵੇਂ", 92: "ਬਾਨਵੇਂ", 93: "ਤਿਰਾਨਵੇਂ", 94: "ਚੌਰਾਨਵੇਂ", 95: "ਪੰਚਾਨਵੇਂ", 96: "ਛਿਆਨਵੇਂ", 97: "ਸਤਾਨਵੇਂ", 98: "ਅਠਾਨਵੇਂ", 99: "ਨੜਾਨਵੇਂ"
}

ENGLISH_WORDS = {
    1: "one", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven", 8: "eight", 9: "nine", 10: "ten",
    11: "eleven", 12: "twelve", 13: "thirteen", 14: "fourteen", 15: "fifteen", 16: "sixteen", 17: "seventeen", 18: "eighteen", 19: "nineteen", 20: "twenty",
    30: "thirty", 40: "forty", 50: "fifty", 60: "sixty", 70: "seventy", 80: "eighty", 90: "ninety"
}

ZERO_WORDS = {
    "hi": "शून्य", "hl": "zero", "en": "zero", "mr": "शून्य", "gu": "શૂન્ય", "pa": "ਸਿਫ਼ਰ"
}
LAKH_WORDS = {
    "hi": "लाख", "hl": "lakh", "en": "lakh", "mr": "लाख", "gu": "લાખ", "pa": "ਲੱਖ"
}
THOUSAND_WORDS = {
    "hi": "हज़ार", "hl": "hazaar", "en": "thousand", "mr": "हजार", "gu": "હજાર", "pa": "ਹਜ਼ਾਰ"
}
HUNDRED_WORDS = {
    "hi": "सौ", "hl": "sau", "en": "hundred", "mr": "शंभर", "gu": "સો", "pa": "ਸੌ"
}
POINT_WORDS = {
    "hi": "दशमलव", "hl": "point", "en": "point", "mr": "दशमलव", "gu": "દશાંશ", "pa": "ਦਸ਼ਮਲਵ"
}
RUPEE_WORDS = {
    "hi": "रुपये", "hl": "rupaye", "en": "rupees", "mr": "रुपये", "gu": "રૂપિયા", "pa": "ਰੁਪਏ"
}
PERCENT_WORDS = {
    "hi": "प्रतिशत", "hl": "percent", "en": "percent", "mr": "टक्के", "gu": "ટકા", "pa": "ਪ੍ਰਤੀਸ਼ਤ"
}

SINGLE_DIGITS = {
    "hi": ["शून्य", "एक", "दो", "तीन", "चार", "पाँच", "छह", "सात", "आठ", "नौ"],
    "hl": ["zero", "ek", "do", "teen", "chaar", "paanch", "chhe", "saat", "aath", "nau"],
    "en": ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"],
    "mr": ["शून्य", "एक", "दोन", "तीन", "चार", "पाच", "सहा", "सात", "आठ", "नऊ"],
    "gu": ["શૂન્ય", "એક", "બે", "ત્રણ", "ચાર", "પાંચ", "છ", "સાત", "આઠ", "નવ"],
    "pa": ["ਸਿਫ਼ਰ", "ਇੱਕ", "ਦੋ", "ਤਿੰਨ", "ਚਾਰ", "ਪੰਜ", "ਛੇ", "ਸੱਤ", "ਅੱਠ", "ਨੌ"]
}

def get_under_100_words(n: int, lang: str) -> str:
    if lang == "hi" and n in HINDI_WORDS:
        return HINDI_WORDS[n]
    if lang == "hl" and n in HINGLISH_WORDS:
        return HINGLISH_WORDS[n]
    if lang == "mr" and n in MARATHI_WORDS:
        return MARATHI_WORDS[n]
    if lang == "gu" and n in GUJARATI_WORDS:
        return GUJARATI_WORDS[n]
    if lang == "pa" and n in PUNJABI_WORDS:
        return PUNJABI_WORDS[n]
    if lang == "en":
        if n in ENGLISH_WORDS:
            return ENGLISH_WORDS[n]
        tens = (n // 10) * 10
        ones = n % 10
        if tens in ENGLISH_WORDS and ones in ENGLISH_WORDS:
            return f"{ENGLISH_WORDS[tens]}-{ENGLISH_WORDS[ones]}"
        if ones in ENGLISH_WORDS:
            return ENGLISH_WORDS[ones]
    return HINDI_WORDS.get(n, str(n))

def int_to_words(n: int, lang: str) -> str:
    if n == 0:
        return ZERO_WORDS.get(lang, "0")
        
    parts = []
    
    # 1 Lakh = 1,00,000
    if n >= 100000:
        lakhs = n // 100000
        n %= 100000
        parts.append(f"{int_to_words(lakhs, lang)} {LAKH_WORDS.get(lang, 'lakh')}")
        
    # 1 Thousand = 1,000
    if n >= 1000:
        thousands = n // 1000
        n %= 1000
        parts.append(f"{int_to_words(thousands, lang)} {THOUSAND_WORDS.get(lang, 'thousand')}")
        
    # 1 Hundred = 100
    if n >= 100:
        hundreds = n // 100
        n %= 100
        parts.append(f"{int_to_words(hundreds, lang)} {HUNDRED_WORDS.get(lang, 'hundred')}")
        
    if n > 0:
        parts.append(get_under_100_words(n, lang))
        
    return " ".join(parts)

def float_to_words(num_str: str, lang: str) -> str:
    if "." not in num_str:
        return int_to_words(int(num_str), lang)
    parts = num_str.split(".")
    int_part = int(parts[0]) if parts[0] else 0
    frac_part = parts[1]
    
    int_words = int_to_words(int_part, lang)
    pt_word = POINT_WORDS.get(lang, "point")
    
    frac_words = []
    digits_list = SINGLE_DIGITS.get(lang, SINGLE_DIGITS["hi"])
    for char in frac_part:
        if char.isdigit():
            frac_words.append(digits_list[int(char)])
            
    return f"{int_words} {pt_word} {' '.join(frac_words)}"

def translate_numbers_in_text(text: str, lang: str = "hi") -> str:
    if not text:
        return ""
        
    lang = lang.lower() if lang else "hi"
    if lang not in ["hi", "hl", "en", "mr", "gu", "pa"]:
        lang = "hi"
        
    # Replace Rupee symbol or Rs prefix
    rupee_word = RUPEE_WORDS.get(lang, "रुपये")
    text = re.sub(r'(?:₹|Rs\.|Rs)\s*(\d+(?:,\d+)*(?:\.\d+)?)', rf'\1 {rupee_word}', text)
    
    # Replace Percent symbol
    pct_word = PERCENT_WORDS.get(lang, "प्रतिशत")
    text = re.sub(r'(\d+(?:\.\d+)?)\s*%', rf'\1 {pct_word}', text)
    
    # Now find all remaining numbers (integers or decimals)
    def replace_num(match):
        num_str = match.group(0)
        clean_num_str = num_str.replace(",", "")
        try:
            if "." in clean_num_str:
                return float_to_words(clean_num_str, lang)
            else:
                return int_to_words(int(clean_num_str), lang)
        except Exception:
            return num_str
            
    pattern = r'\b\d+(?:,\d+)*(?:\.\d+)?\b'
    text = re.sub(pattern, replace_num, text)
    
    return text

# ==========================================
# CORE VOICE FUNCTIONS
# ==========================================

def get_groq_key():
    return os.getenv("GROQ_API_KEY", "")

_gemini_client = None

def get_gemini_client():
    global _gemini_client
    if _gemini_client is None:
        key = os.getenv("GEMINI_API_KEY", "")
        project = os.getenv("GCP_PROJECT", "")
        
        if key:
            _gemini_client = genai.Client(api_key=key)
        elif project or os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
            location = os.getenv("GCP_LOCATION", "us-central1")
            _gemini_client = genai.Client(vertexai=True, project=project, location=location)
        else:
            _gemini_client = genai.Client()
    return _gemini_client


async def transcribe_voice_groq(audio_bytes: bytes, filename: str = "audio.webm") -> str:
    """
    Transcribes audio bytes into text using Groq's Whisper Large V3 API.
    """
    groq_key = get_groq_key()
    if not groq_key:
        logger.warning("GROQ_API_KEY not found in environment. Using fallback mock transcription.")
        return "गेंहू की फसल में पीला रतुआ का इलाज कैसे करें?"

    try:
        content_type = "audio/webm"
        if filename.endswith(".wav"):
            content_type = "audio/wav"
        elif filename.endswith(".mp3"):
            content_type = "audio/mp3"

        headers = {"Authorization": f"Bearer {groq_key}"}
        files = {"file": (filename, audio_bytes, content_type)}
        data = {
            "model": "whisper-large-v3",
            "language": "hi",
            "response_format": "json"
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/audio/transcriptions",
                headers=headers,
                files=files,
                data=data,
                timeout=30.0
            )
            response.raise_for_status()
            text = response.json().get("text", "")
            logger.info(f"Groq transcription completed: {text}")
            return text

    except Exception as e:
        logger.error(f"Error in Groq transcription: {e}")
        return "टमाटर की फसल में पत्ती लपेटक रोग का उपचार बताएं।"


async def get_gemini_response(prompt: str, history: list = None, lang: str = "hi") -> str:
    """
    Sends the user query along with RAG context and farm details to Gemini 2.5 Flash.
    Returns a grounded, safe text response in the selected language.
    """
    from app.services.rag import query_knowledge_base

    # Retrieve context from our ChromaDB RAG store
    rag_context = query_knowledge_base(prompt, limit=2, lang=lang)

    key = os.getenv("GEMINI_API_KEY", "")
    project = os.getenv("GCP_PROJECT", "")
    if not key and not project and not os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
        logger.warning("Gemini credentials not found in environment. Using organic fallback response.")
        fallback_responses = {
            "hi": "किसान भाई, गेहूं की फसल में पीला रतुआ के जैविक नियंत्रण के लिए 5 लीटर खट्टी छाछ को 100 लीटर पानी में मिलाकर प्रति एकड़ छिड़काव करें। यदि प्रकोप गंभीर है, तो सरकारी हेल्पलाइन 1800-180-1551 पर कृषि वैज्ञानिक से संपर्क करें। क्या आपके खेत में अन्य फसलें भी हैं?",
            "hl": "Kisan bhai, gehun ki crop mein yellow rust disease ke organic control ke liye 5 liter khatti chhaachh ko 100 liter paani mein milakar spray karein. Severe attack mein government helpline 1800-180-1551 par free advice lein. Kya koi aur dikkat hai?",
            "en": "Dear farmer, to control yellow rust organically in wheat, spray 5 liters of sour buttermilk mixed in 100 liters of water per acre. For severe symptoms, contact the government helpline at 1800-180-1551. Do you have other questions?",
            "mr": "शेतकरी बंधूंनो, गव्हावरील पिवळा तांबेरा रोगाच्या नैसर्गिक नियंत्रणासाठी ५ लीटर आंबट ताक १०० लीटर पाण्यात मिसळून प्रति एकर फवारणी करावी. गंभीर समस्येसाठी सरकारी हेल्पलाइन १८००-१८०-१५५१ वर संपर्क साधावा. काय तुम्हाला इतर काही माहिती हवी आहे?",
            "gu": "ખેડૂત મિત્ર, ઘઉંમાં પીળો ગેરુ નિયંત્રણ માટે ૫ લીટર ખાટી છાશ ૧૦૦ લીટર પાણીમાં ભેળવી છંટકાવ કરો. કોઈ પણ ગંભીર સમસ્યા માટે સરકારી હેલ્પલાઇન ૧૮૦૦-૧૮૦-૧૫૭૧ પર સંપર્ક કરો. શું તમારે કોઈ અન્ય પાક વિશે જાણવું છે?",
            "pa": "ਕਿਸਾਨ ਵੀਰੋ, ਕਣਕ ਵਿੱਚ ਪੀਲੀ ਕੁੰਗੀ ਦੇ ਰੋਕਥਾਮ ਲਈ ੫ ਲੀਟਰ ਖੱਟੀ ਲੱਸੀ ਨੂੰ ੧੦੦ ਲੀਟਰ ਪਾਣੀ ਵਿੱਚ ਮਿਲਾ ਕੇ ਪ੍ਰਤੀ ਏਕੜ ਛਿੜਕਾਅ ਕਰੋ। ਵਧੇਰੇ ਜਾਣਕਾਰੀ ਲਈ ਸਰਕਾਰੀ ਹੈਲਪਲਾਈਨ ੧੮੦੦-੧੮੦-੧੫੫੧ ਤੇ ਸੰਪਰਕ ਕਰੋ। ਕੀ ਤੁਹਾਨੂੰ ਕੋਈ ਹੋਰ ਜਾਣਕਾਰੀ ਚਾਹੀਦੀ ਹੈ?"
        }
        return fallback_responses.get(lang, fallback_responses["hi"])

    try:
        client = get_gemini_client()

        # Strict Prompt Guardrails (explicity blocking chemical advice, enforcing word count, refuting non-agriculture, citing KVK)
        system_instructions = {
            "hi": (
                "आप किसानमित्र एआई हैं, एक आवाज-प्रथम कृषि सहायक।\n"
                "नियम:\n"
                "1. केवल प्राकृतिक/जैविक खेती (जैसे जीवामृत, नीमास्त्र, छाछ) के उपाय बताएं। रासायनिक कीटनाशकों या रासायनिक खादों की सलाह कभी न दें।\n"
                "2. यदि किसान किसी रोग या कीट का जिक्र करे, तो जैविक उपाय बताएं और हमेशा टोल-फ्री सरकारी हेल्पलाइन '1800-180-1551' का उल्लेख करें।\n"
                "3. उत्तर सरल हिंदी (देवनागरी) में, गर्मजोशी भरा और 200 शब्दों से कम का रखें।\n"
                "4. कृषि, मंडी भाव, मौसम, या सरकारी योजनाओं के अलावा किसी भी अन्य विषय के प्रश्नों को विनम्रतापूर्वक मना कर दें (जैसे: 'मैं केवल खेती-किसानी से जुड़े सवालों के जवाब दे सकता हूँ।')।\n"
                "5. उत्तर का प्रारूप: पहले किसान की समस्या स्वीकार करें -> जैविक समाधान दें -> बातचीत जारी रखने के लिए एक सरल खुला प्रश्न पूछें।"
            ),
            "hl": (
                "You are KisanMitra AI, a voice-first agriculture assistant.\n"
                "Rules:\n"
                "1. ONLY recommend natural/organic farming remedies (Jeevamrut, Neemastra, buttermilk). NEVER recommend chemical pesticides or fertilizers.\n"
                "2. If the user mentions a pest/disease, suggest organic treatments and ALWAYS cite KVK helpline 1800-180-1551.\n"
                "3. Respond strictly in simple Hinglish language (Hindi text written in English/Latin/Roman script). Keep responses under 200 words.\n"
                "4. Gracefully decline non-farming queries (e.g. 'Main keval kheti-kisani aur mandi bhav se jude sawalo ke jawab de sakta hu.').\n"
                "5. Structure: Acknowledge problem -> Give organic solution -> End with a friendly open question."
            ),
            "en": (
                "You are KisanMitra AI, a voice-first agriculture assistant.\n"
                "Rules:\n"
                "1. ONLY recommend natural/organic farming remedies (Jeevamrut, Neemastra, sour buttermilk). NEVER recommend chemical pesticides or fertilizers.\n"
                "2. If the user mentions a disease or pest, suggest organic treatment and ALWAYS include the government toll-free KVK helpline 1800-180-1551.\n"
                "3. Respond strictly in English language. Keep responses warm, clear, and strictly under 200 words.\n"
                "4. Gracefully decline non-farming queries (e.g., 'I am KisanMitra, your farming companion. I can only assist you with agriculture-related questions.').\n"
                "5. Structure: Acknowledge problem -> Give organic solution -> End with a simple open question."
            ),
            "mr": (
                "तुम्ही किसानमित्र एआई आहात, एक व्हॉइस-फर्स्ट कृषी सहाय्यक।\n"
                "n नियम:\n"
                "1. फक्त नैसर्गिक/सेंद्रिय शेतीचे (उदा. जीवामृत, नीमास्त्र, आंबट ताक) उपाय सुचवा. रासायनिक कीटकनाशके किंवा खतांची शिफारस कधीही करू नका.\n"
                "2. रोगाचा किंवा कीटकांचा उल्लेख असल्यास सेंद्रिय उपाय सांगा आणि नेहमी टोल-फ्री हेल्पलाइन '1800-180-1551' चा उल्लेख करा.\n"
                "3. उत्तर सोप्या मराठीत, प्रेमळ आणि २०० शब्दांपेक्षा कमी असावे.\n"
                "4. शेतीव्यतिरिक्त इतर विषयांच्या प्रश्नांना नम्रपणे नकार द्या (उदा: 'मी फक्त शेतीविषयक प्रश्नांची उत्तरे देऊ शकतो.')।\n"
                "5. रचना: शेतकऱ्याची समस्या मान्य करा -> सेंद्रिय उपाय सांगा -> शेवटी एक सोपा प्रश्न विचारा।"
            ),
            "gu": (
                "તમે કિસાનમિત્ર એઆઈ છો, એક કૃષિ સહાયક।\n"
                "નિયમો:\n"
                "1. ફક્ત કુદરતી/ઓર્ગેનિક ખેતી (જીવામૃત, નીમાસ્ત્ર, ખાટી છાશ) ના ઉપાયો સૂચવો. રાસાયણિક જંતુનાશકો અથવા ખાતરની ભલામણ ક્યારેય કરશો નહીં.\n"
                "2. કોઈ પણ રોગ કે જીવાત માટે હંમેશા ટોલ-ફ્રી હેલ્પલાઇન '1800-180-1551' નો ઉલ્લેખ કરો.\n"
                "3. જવાબ સરળ ગુજરાતીમાં અને ૨૦૦ શબ્દોથી ઓછો રાખો.\n"
                "4. ખેતી સિવાયના પ્રશ્નો માટે નમ્રતાપૂર્વક ના પાડો.\n"
                "5. માળખું: સમસ્યા સ્વીકારો -> ઓર્ગેનિક ઉપાય આપો -> છેલ્લે એક સરળ પ્રશ્ન પૂછો."
            ),
            "pa": (
                "ਤੁਸੀਂ ਕਿਸਾਨਮਿੱਤਰ ਏਆਈ ਹੋ, ਇੱਕ ਆਵਾਜ਼-ਅਧਾਰਤ ਖੇਤੀਬਾੜੀ ਸਹਾਇਕ।\n"
                "ਨਿਯਮ:\n"
                "1. ਸਿਰਫ਼ ਕੁਦਰਤੀ/ਆਰਗੈਨਿਕ ਖੇਤੀ (ਜਿਵੇਂ ਜੀਵਾਮ੍ਰਿਤ, ਨੀਮਾਸਤਰ, ਖੱਟੀ ਲੱਸੀ) ਦੇ ਨੁਸਖੇ ਦੱਸੋ। ਰਸਾਇਣਕ ਖਾਦਾਂ ਜਾਂ ਕੀਟਨਾਸ਼ਕਾਂ ਦੀ ਸਲਾਹ ਕਦੇ ਨਾ ਦਿਓ।\n"
                "2. ਰੋਗ ਜਾਂ ਕੀੜੇ ਦੀ ਸੂਰਤ ਵਿੱਚ ਆਰਗੈਨਿਕ ਇਲਾਜ ਦੱਸੋ ਅਤੇ ਹਮੇਸ਼ਾ ਟੋਲ-ਫ੍ਰੀ ਹੈਲਪਲਾਈਨ '1800-180-1551' ਦਾ ਜ਼ਿਕਰ ਕਰੋ।\n"
                "3. ਜਵਾਬ ਸਰਲ ਪੰਜਾਬੀ ਵਿੱਚ ਅਤੇ ੨੦੦ ਸ਼ਬਦਾਂ ਤੋਂ ਘੱਟ ਰੱਖੋ।\n"
                "4. ਖੇਤੀਬਾੜੀ ਤੋਂ ਇਲਾਵਾ ਹੋਰ ਸਵਾਲਾਂ ਲਈ ਨਿਮਰਤਾ ਨਾਲ ਮਨ੍ਹਾ ਕਰੋ।\n"
                "5. ਢਾਂਚਾ: ਸਮੱਸਿਆ ਸਵੀਕਾਰ ਕਰੋ -> ਆਰਗੈਨਿਕ ਹੱਲ ਦੱਸੋ -> ਅਖੀਰ ਵਿੱਚ ਇੱਕ ਸਵਾਲ ਪੁੱਛੋ।"
            )
        }

        system_instruction = system_instructions.get(lang, system_instructions["hi"])

        # Inject RAG context into prompt
        grounded_prompt = prompt
        if rag_context:
            grounded_prompt = (
                f"Verified Natural Farming Reference Data:\n"
                f"{rag_context}\n\n"
                f"User Request: {prompt}\n\n"
                f"Instructions: Answer the user request using the provided reference data where applicable, strictly obeying all system rules."
            )

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.2,
            max_output_tokens=2048
        )

        if history:
            history_contents = []
            for turn in history:
                role = "model" if turn.get("role") == "model" else "user"
                parts = []
                for part in turn.get("parts", []):
                    parts.append(types.Part.from_text(text=part))
                history_contents.append(types.Content(role=role, parts=parts))

            chat = client.aio.chats.create(
                model='gemini-2.5-flash',
                config=config,
                history=history_contents
            )
            response = await chat.send_message(grounded_prompt)
        else:
            response = await client.aio.models.generate_content(
                model='gemini-2.5-flash',
                contents=grounded_prompt,
                config=config
            )

        text = response.text.strip()
        logger.info(f"Gemini response generated: {text[:50]}...")
        return text

    except Exception as e:
        logger.error(f"Error in Gemini response generation: {e}")
        return "माफ़ कीजिये, अभी संपर्क करने में परेशानी हो रही है। कृपया जैविक नियंत्रण के लिए नीम तेल का प्रयोग करें और रासायनिक विकल्प के स्थान पर सरकारी हेल्पलाइन 1800-180-1551 पर संपर्क करें।"


async def synthesize_voice_edge(text: str, output_path: str, voice: str = "hi-IN-SwaraNeural", lang: Optional[str] = None) -> bool:
    """
    Synthesizes text to audio using edge-tts (Microsoft Edge translation engine).
    Converts numbers/percentages/prices to language-specific words first so they speak correctly.
    """
    try:
        # Clean markdown elements
        clean_text = text.replace('*', '').replace('#', '').replace('_', '')
        
        # Determine language code for digit transliteration
        if not lang:
            # Infer from voice name
            if "mr-IN" in voice:
                lang = "mr"
            elif "gu-IN" in voice:
                lang = "gu"
            elif "pa-IN" in voice:
                lang = "pa"
            elif "en-IN" in voice or "en-US" in voice:
                lang = "en"
            else:
                # Swara/Madhur hi-IN voices
                # Simple check: if more than 50% chars are ascii alpha, treat as Hinglish (hl)
                alpha_chars = [c for c in clean_text if c.isalpha()]
                ascii_alpha = [c for c in alpha_chars if c.isascii()]
                if len(alpha_chars) > 0 and (len(ascii_alpha) / len(alpha_chars)) > 0.5:
                    lang = "hl"
                else:
                    lang = "hi"
                    
        # Perform number-to-words translation
        translated_text = translate_numbers_in_text(clean_text, lang)
        
        # Check text characters to ensure voice compatibility and avoid silent crashes
        # 1. Devnagari characters (\u0900-\u097F)
        # 2. Gujarati characters (\u0A80-\u0AFF)
        # 3. Gurmukhi/Punjabi characters (\u0A00-\u0A7F)
        has_devnagari = bool(re.search(r'[\u0900-\u097F]', translated_text))
        has_gujarati = bool(re.search(r'[\u0A80-\u0AFF]', translated_text))
        has_gurmukhi = bool(re.search(r'[\u0A00-\u0A7F]', translated_text))
        
        adjusted_voice = voice
        if has_devnagari and not ("hi-IN" in voice or "mr-IN" in voice):
            adjusted_voice = "hi-IN-SwaraNeural"
            logger.info(f"Detected Devnagari characters in text. Switched voice to {adjusted_voice} (was {voice}).")
        elif has_gujarati and "gu-IN" not in voice:
            adjusted_voice = "gu-IN-DhwaniNeural"
            logger.info(f"Detected Gujarati characters in text. Switched voice to {adjusted_voice} (was {voice}).")
        elif has_gurmukhi and "pa-IN" not in voice:
            adjusted_voice = "pa-IN-OjasNeural"
            logger.info(f"Detected Gurmukhi characters in text. Switched voice to {adjusted_voice} (was {voice}).")
            
        logger.info(f"Synthesizing text (original: '{clean_text[:40]}...', numeric-translated: '{translated_text[:40]}...') with voice {adjusted_voice}")
        
        communicate = edge_tts.Communicate(translated_text, adjusted_voice)
        await communicate.save(output_path)
        logger.info(f"Speech synthesis saved to: {output_path}")
        return True
    except Exception as e:
        logger.error(f"Error in edge-tts speech synthesis: {e}")
        return False
