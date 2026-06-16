import os
import logging
from typing import List, Optional
from app.services.voice import get_gemini_client, get_gemini_response
from google.genai import types

logger = logging.getLogger("kisanmitra-schemes")

# Comprehensive database of 17 Central and State-specific Schemes
SCHEMES_DB = [
    {
        "id": "pm_kisan",
        "category": "direct-benefit",
        "state": "all",
        "translations": {
            "hi": {
                "title": "पीएम किसान सम्मान निधि योजना",
                "department": "कृषि एवं किसान कल्याण मंत्रालय",
                "benefits": "₹6,000 प्रति वर्ष सीधे बैंक खाते में (3 समान किश्तों में)",
                "eligibility": "सभी भूमिधारक किसान परिवार (जिनके पास कृषि योग्य भूमि हो)",
                "linkText": "आवेदन करें (Apply Now)"
            },
            "hl": {
                "title": "PM Kisan Samman Nidhi Yojana",
                "department": "Ministry of Agriculture and Farmers Welfare",
                "benefits": "₹6,000 per year directly in bank account (in 3 equal installments)",
                "eligibility": "All landholding farmer families with cultivable land",
                "linkText": "Avedan Karein (Apply Now)"
            },
            "en": {
                "title": "PM Kisan Samman Nidhi Yojana",
                "department": "Ministry of Agriculture and Farmers Welfare",
                "benefits": "₹6,000 per year directly in bank account (in 3 equal installments)",
                "eligibility": "All landholding farmer families with cultivable land",
                "linkText": "Apply Now"
            },
            "mr": {
                "title": "पीएम किसान सन्मान निधी योजना",
                "department": "कृषी आणि शेतकरी कल्याण मंत्रालय",
                "benefits": "₹६,००० प्रति वर्ष थेट बँक खात्यात (३ समान हप्त्यांमध्ये)",
                "eligibility": "सर्व जमीनधारक शेतकरी कुटुंबे (ज्यांच्याकडे लागवडीयोग्य जमीन आहे)",
                "linkText": "अर्ज करा (Apply Now)"
            },
            "gu": {
                "title": "પીએમ કિસાન સન્માન નિધિ યોજના",
                "department": "કૃષિ અને ખેડૂત કલ્યાણ મંત્રાલય",
                "benefits": "₹૬,૦૦૦ પ્રતિ વર્ષ સીધા બેંક ખાતામાં (૩ સમાન હપ્તામાં)",
                "eligibility": "તમામ જમીનધારક ખેડૂત પરિવારો જેમની પાસે ખેતીલાયક જਮੀન છે",
                "linkText": "અરજી કરો (Apply Now)"
            },
            "pa": {
                "title": "ਪੀਐਮ ਕਿਸਾਨ ਸਨਮਾਨ ਨਿਧੀ ਯੋਜਨਾ",
                "department": "ਖੇਤੀਬਾੜੀ ਅਤੇ ਕਿਸਾਨ ਭਲਾਈ ਮੰਤਰਾਲਾ",
                "benefits": "₹6,000 ਪ੍ਰਤੀ ਸਾਲ ਸਿੱਧੇ ਬੈਂਕ ਖਾਤੇ ਵਿੱਚ (3 ਬਰਾਬਰ ਕਿਸ਼ਤਾਂ ਵਿੱਚ)",
                "eligibility": "ਸਾਰੇ ਜ਼ਮੀਨ ਮਾਲਕ ਕਿਸਾਨ ਪਰਿਵਾਰ ਜਿਨ੍ਹਾਂ ਕੋਲ ਵਾਹੀਯੋਗ ਜ਼ਮੀਨ ਹੈ",
                "linkText": "ਹੁਣੇ ਅਪਲਾਈ ਕਰੋ (Apply Now)"
            }
        }
    },
    {
        "id": "pmfby",
        "category": "insurance",
        "state": "all",
        "translations": {
            "hi": {
                "title": "प्रधानमंत्री फसल बीमा योजना (PMFBY)",
                "department": "कृषि एवं किसान कल्याण मंत्रालय",
                "benefits": "बुवाई से पहले से लेकर कटाई के बाद तक के जोखिम को कवर करने वाला व्यापक फसल बीमा",
                "eligibility": "अधिसूचित क्षेत्रों में अधिसूचित फसलें उगाने वाले सभी किसान",
                "linkText": "दावा स्थिति की जांच करें"
            },
            "hl": {
                "title": "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
                "department": "Ministry of Agriculture and Farmers Welfare",
                "benefits": "Comprehensive crop insurance covering risk from pre-sowing to post-harvest",
                "eligibility": "All farmers growing notified crops in notified areas",
                "linkText": "Claim Status Check"
            },
            "en": {
                "title": "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
                "department": "Ministry of Agriculture and Farmers Welfare",
                "benefits": "Comprehensive crop insurance covering risk from pre-sowing to post-harvest",
                "eligibility": "All farmers growing notified crops in notified areas",
                "linkText": "Check Claim Status"
            },
            "mr": {
                "title": "पंतप्रधान पीक बीमा योजना (PMFBY)",
                "department": "कृषी आणि शेतकरी कल्याण मंत्रालय",
                "benefits": "पेरणीपूर्व ते काढणीपश्चात जोखमीचा समावेश असलेला सर्वसमावेशक पीक विमा",
                "eligibility": "अधिसूचित क्षेत्रातील अधिसूचित पिके घेणारे सर्व शेतकरी",
                "linkText": "दावा स्थिती तपासा"
            },
            "gu": {
                "title": "પ્રધાનમંત્રી ફસલ બીમા યોજના (PMFBY)",
                "department": "કૃષિ અને ખેડૂત કલ્યાણ મંત્રાલય",
                "benefits": "વાવણી પૂર્વેથી લણણી પછીના જોખમોને આવરી લેતી વ્યાપક પાક વીમા યોજના",
                "eligibility": "નોટિફાઇડ વિસ્તારોમાં નોટિફાઇડ પાક ઉગાડતા તમામ ખેડૂતો",
                "linkText": "ક્લેમ સ્ટેટસ તપાસો"
            },
            "pa": {
                "title": "ਪ੍ਰਧਾਨ ਮੰਤਰੀ ਫਸਲ ਬੀਮਾ ਯੋਜਨਾ (PMFBY)",
                "department": "ਖੇਤੀਬਾੜੀ ਅਤੇ ਕਿਸਾਨ ਭਲਾਈ ਮੰਤਰਾਲਾ",
                "benefits": "ਬਿਜਾਈ ਤੋਂ ਪਹਿਲਾਂ ਤੋਂ ਲੈ ਕੇ ਵਾਢੀ ਤੋਂ ਬਾਅਦ ਤੱਕ ਦੇ ਜੋਖਮ ਨੂੰ ਕਵਰ ਕਰਨ ਵਾਲਾ ਵਿਆਪਕ ਫਸਲ ਬੀਮਾ",
                "eligibility": "ਨੋਟੀਫਾਈਡ ਖੇਤਰਾਂ ਵਿੱਚ ਨੋਟੀਫਾਈਡ ਫਸਲਾਂ ਉਗਾਉਣ ਵਾਲੇ ਸਾਰੇ ਕਿਸਾਨ",
                "linkText": "ਕਲੇਮ ਸਟੇਟਸ ਚੈੱਕ ਕਰੋ"
            }
        }
    },
    {
        "id": "pmksy",
        "category": "irrigation",
        "state": "all",
        "translations": {
            "hi": {
                "title": "प्रधानमंत्री कृषि सिंचाई योजना (PMKSY)",
                "department": "कृषि एवं सहकारिता विभाग",
                "benefits": "टपक (Drip) और स्प्रिंकलर सिंचाई प्रणालियों पर 55% तक की सरकारी सब्सिडी",
                "eligibility": "भूमि के मालिकाना हक और पानी के स्रोत तक पहुंच वाले सभी किसान",
                "linkText": "स्प्रिंकलर सब्सिडी फॉर्म"
            },
            "hl": {
                "title": "Pradhan Mantri Krishi Sinchayee Yojana (PMKSY)",
                "department": "Department of Agriculture & Cooperation",
                "benefits": "Up to 55% subsidy on drip and sprinkler irrigation systems",
                "eligibility": "All farmers with landownership and access to water source",
                "linkText": "Sprinkler Subsidy Form"
            },
            "en": {
                "title": "Pradhan Mantri Krishi Sinchayee Yojana (PMKSY)",
                "department": "Department of Agriculture & Cooperation",
                "benefits": "Up to 55% subsidy on drip and sprinkler irrigation systems",
                "eligibility": "All farmers with landownership and access to water source",
                "linkText": "Sprinkler Subsidy Form"
            },
            "mr": {
                "title": "पंतप्रधान कृषी सिंचन योजना (PMKSY)",
                "department": "कृषी आणि सहकार विभाग",
                "benefits": "ठिबक आणि तुषार सिंचन पद्धतींवर ५५% पर्यंत सरकारी अनुदान",
                "eligibility": "जमिनीची मालकी आणि पाण्याचा स्त्रोत असलेले सर्व शेतकरी",
                "linkText": "तुषार सिंचन अनुदान अर्ज"
            },
            "gu": {
                "title": "પ્રધાનમંત્રી કૃષિ સિંચાઈ યોજના (PMKSY)",
                "department": "કૃષિ અને સહકાર વિભાગ",
                "benefits": "ટપક અને સ્પ્રિંકલર સિંચાઈ પદ્ધતિઓ પર ૫૫% સુધીની સરકારી સબસિડી",
                "eligibility": "જમીનમાલિકી અને પાણીનો સ્ત્રોત ધરાવતા તમામ ખેડૂતો",
                "linkText": "સબસિડી ફોર્મ મેળવો"
            },
            "pa": {
                "title": "ਪ੍ਰਧਾਨ ਮੰਤਰੀ ਕ੍ਰਿਸ਼ੀ ਸਿੰਚਾਈ ਯੋਜਨਾ (PMKSY)",
                "department": "ਖੇਤੀਬਾੜੀ ਅਤੇ ਸਹਿਕਾਰਤਾ ਵਿਭਾਗ",
                "benefits": "ਡਰਿਪ ਅਤੇ ਸਪ੍ਰਿੰਕਲਰ ਸਿੰਚਾਈ ਪ੍ਰਣਾਲੀਆਂ 'ਤੇ 55% ਤੱਕ ਸਰਕਾਰੀ ਸਬਸਿਡੀ",
                "eligibility": "ਜ਼ਮੀਨ ਦੀ ਮਾਲਕੀ ਅਤੇ ਪਾਣੀ ਦੇ ਸਰੋਤ ਤੱਕ ਪਹੁੰਚ ਵਾਲੇ ਸਾਰੇ ਕਿਸਾਨ",
                "linkText": "ਸਬਸਿਡੀ ਫਾਰਮ"
            }
        }
    },
    {
        "id": "pkvy",
        "category": "direct-benefit",
        "state": "all",
        "translations": {
            "hi": {
                "title": "परम्परागत कृषि विकास योजना (PKVY)",
                "department": "कृषि एवं सहकारिता विभाग",
                "benefits": "जैविक खेती अपनाने हेतु ₹50,000 प्रति हेक्टेयर वित्तीय सहायता (3 वर्षों के लिए)",
                "eligibility": "समूह में जैविक खेती करने वाले छोटे और सीमांत किसान",
                "linkText": "जैविक खेती पंजीकरण"
            },
            "hl": {
                "title": "Paramparagat Krishi Vikas Yojana (PKVY)",
                "department": "Department of Agriculture & Cooperation",
                "benefits": "₹50,000 per hectare financial aid for organic farming transition (for 3 years)",
                "eligibility": "Small and marginal farmers conducting group organic farming",
                "linkText": "Organic Farming Reg"
            },
            "en": {
                "title": "Paramparagat Krishi Vikas Yojana (PKVY)",
                "department": "Department of Agriculture & Cooperation",
                "benefits": "₹50,000 per hectare financial aid for organic farming transition (for 3 years)",
                "eligibility": "Small and marginal farmers conducting group organic farming",
                "linkText": "Register for Organic Farming"
            },
            "mr": {
                "title": "परंपरागत कृषी विकास योजना (PKVY)",
                "department": "कृषी आणि सहकार विभाग",
                "benefits": "सेंद्रिय शेती अवलंबण्यासाठी ₹५०,००० प्रति हेक्टर आर्थिक मदत (३ वर्षांसाठी)",
                "eligibility": "समूहाने सेंद्रिय शेती करणारे लहान आणि अल्पभूधारक शेतकरी",
                "linkText": "सेंद्रिय शेती नोंदणी"
            },
            "gu": {
                "title": "પરંપરાગત કૃષિ વિકાસ યોજના (PKVY)",
                "department": "કૃષિ અને સહકાર વિભાગ",
                "benefits": "સેન્દ્રીય ખેતી અપનાવવા માટે ₹૫૦,૦૦૦ પ્રતિ હેક્ટર નાણાકીય સહાય (૩ વર્ષ માટે)",
                "eligibility": "જૂથમાં સેન્દ્રીય ખેતી કરતા નાના અને સીમાંત ખેડૂતો",
                "linkText": "ઓર્ગેનિક ખેતી રજીસ્ટ્રેશન"
            },
            "pa": {
                "title": "ਪਰੰਪਰਾਗਤ ਕ੍ਰਿਸ਼ੀ ਵਿਕਾਸ ਯੋਜਨਾ (PKVY)",
                "department": "ਖੇਤੀਬਾੜੀ ਅਤੇ ਸਹਿਕਾਰਤਾ ਵਿਭਾਗ",
                "benefits": "ਜੈਵਿਕ ਖੇਤੀ ਅਪਣਾਉਣ ਲਈ ₹50,000 ਪ੍ਰਤੀ ਹੈਕਟੇਅਰ ਵਿੱਤੀ ਸਹਾਇਤਾ (3 ਸਾਲਾਂ ਲਈ)",
                "eligibility": "ਗਰੁੱਪ ਵਿੱਚ ਜੈਵਿਕ ਖੇਤੀ ਕਰਨ ਵਾਲੇ ਛੋਟੇ ਅਤੇ ਸੀਮਾਂਤ ਕਿਸਾਨ",
                "linkText": "ਜੈਵਿਕ ਖੇਤੀ ਰਜਿਸਟ੍ਰੇਸ਼ਨ"
            }
        }
    },
    {
        "id": "smam",
        "category": "direct-benefit",
        "state": "all",
        "translations": {
            "hi": {
                "title": "कृषि यंत्रीकरण उप-मिशन (SMAM)",
                "department": "कृषि एवं सहकारिता विभाग",
                "benefits": "ट्रैक्टर, रोटावेटर और कस्टम हायरिंग सेंटर पर 40% से 80% तक की सब्सिडी",
                "eligibility": "सभी पंजीकृत किसान (महिला और लघु किसानों को प्राथमिकता)",
                "linkText": "कृषि यंत्र सब्सिडी ऑनलाइन"
            },
            "hl": {
                "title": "Sub-Mission on Agricultural Mechanization (SMAM)",
                "department": "Department of Agriculture & Cooperation",
                "benefits": "40% to 80% subsidy on tractors, rotavators, and custom hiring centers",
                "eligibility": "All registered farmers (preference given to women and small farmers)",
                "linkText": "Machinery Subsidy Online"
            },
            "en": {
                "title": "Sub-Mission on Agricultural Mechanization (SMAM)",
                "department": "Department of Agriculture & Cooperation",
                "benefits": "40% to 80% subsidy on tractors, rotavators, and custom hiring centers",
                "eligibility": "All registered farmers (preference given to women and small farmers)",
                "linkText": "Apply for Equipment Subsidy"
            },
            "mr": {
                "title": "कृषी यांत्रिकीकरण उप-अभियान (SMAM)",
                "department": "कृषी आणि सहकार विभाग",
                "benefits": "ट्रॅक्टर, रोटाव्हेटर आणि कृषी औजारांवर ४०% ते ८०% पर्यंत अनुदान",
                "eligibility": "सर्व नोंदणीकृत शेतकरी (महिला आणि लहान शेतकऱ्यांना प्राधान्य)",
                "linkText": "औजारे अनुदान अर्ज"
            },
            "gu": {
                "title": "કૃષિ યાંત્રીકરણ સબ-મિશન (SMAM)",
                "department": "કૃષિ અને સહકાર વિભાગ",
                "benefits": "ટ્રેક્ટર, રોટાવેટર અને કૃષિ સાધનો પર ૪૦% થી ૮૦% સુધીની સબસીડી",
                "eligibility": "તમામ નોંધાયેલા ખેડૂતો (મહિલા અને નાના ખેડૂતોને અગ્રતા)",
                "linkText": "સાધન સબસિડી ફોર્મ"
            },
            "pa": {
                "title": "ਖੇਤੀਬਾੜੀ ਮਸ਼ੀਨੀਕਰਨ ਸਬ-ਮਿਸ਼ਨ (SMAM)",
                "department": "ਖੇਤੀਬਾੜੀ ਅਤੇ ਸਹਿਕਾਰਤਾ ਵਿਭਾਗ",
                "benefits": "ਟਰੈਕਟਰ, ਰੋਟਾਵੇਟਰ ਅਤੇ ਕਸਟਮ ਹਾਇਰਿੰਗ ਸੈਂਟਰਾਂ 'ਤੇ 40% ਤੋਂ 80% ਤੱਕ ਸਬਸਿਡੀ",
                "eligibility": "ਸਾਰੇ ਰਜਿਸਟਰਡ ਕਿਸਾਨ (ਮਹਿਲਾ ਅਤੇ ਛੋਟੇ ਕਿਸਾਨਾਂ ਨੂੰ ਪਹਿਲ)",
                "linkText": "ਮਸ਼ੀਨਰੀ ਸਬਸਿਡੀ ਆਨਲਾਈਨ"
            }
        }
    },
    {
        "id": "soil_health",
        "category": "direct-benefit",
        "state": "all",
        "translations": {
            "hi": {
                "title": "मृदा स्वास्थ्य कार्ड योजना",
                "department": "कृषि एवं किसान कल्याण मंत्रालय",
                "benefits": "निःशुल्क मिट्टी परीक्षण और खाद-उर्वरक की सही मात्रा बताने वाला कार्ड",
                "eligibility": "देश के सभी जोत धारक किसान",
                "linkText": "मिट्टी परीक्षण का अनुरोध करें"
            },
            "hl": {
                "title": "Soil Health Card Scheme",
                "department": "Ministry of Agriculture and Farmers Welfare",
                "benefits": "Free soil testing and recommendations on fertilizer usage rates",
                "eligibility": "All landholding farmers in India",
                "linkText": "Request Soil Test"
            },
            "en": {
                "title": "Soil Health Card Scheme",
                "department": "Ministry of Agriculture & Farmers Welfare",
                "benefits": "Free soil testing card with precise fertilizer recommendation",
                "eligibility": "All landholding farmers across the country",
                "linkText": "Request Soil Sample Test"
            },
            "mr": {
                "title": "मृदा आरोग्य कार्ड योजना",
                "department": "कृषी आणि शेतकरी कल्याण मंत्रालय",
                "benefits": "मोफत माती परीक्षण आणि खत-वापरासंबंधी शिफारस पत्रक",
                "eligibility": "देशातील सर्व शेतकरी",
                "linkText": "माती परीक्षण विनंती अर्ज"
            },
            "gu": {
                "title": "સોઇલ હેલ્થ કાર્ડ યોજના",
                "department": "કૃષિ અને ખેડૂત કલ્યાણ મંત્રાલય",
                "benefits": "મફત જમીન પરીક્ષણ અને ખાતર વાપરવા માટે ભલામણ પત્રક",
                "eligibility": "દેશના તમામ જમીનધારક ખેડૂतों",
                "linkText": "જમીન પરીક્ષણ વિનંતી"
            },
            "pa": {
                "title": "ਭੂਮੀ ਸਿਹਤ ਕਾਰਡ ਯੋਜਨਾ",
                "department": "ਖੇਤੀਬਾੜੀ ਅਤੇ ਕਿਸਾਨ ਭਲਾਈ ਮੰਤਰਾਲਾ",
                "benefits": "ਮੁਫਤ ਮਿੱਟੀ ਪਰਖ ਅਤੇ ਖਾਦ-ਵਰਤੋਂ ਸਬੰਧੀ ਸਿਫਾਰਸ਼ਾਂ ਵਾਲਾ ਕਾਰਡ",
                "eligibility": "ਦੇਸ਼ ਦੇ ਸਾਰੇ ਜ਼ਮੀਨ ਮਾਲਕ ਕਿਸਾਨ",
                "linkText": "ਮਿੱਟੀ ਟੈਸਟ ਲਈ ਅਪਲਾਈ ਕਰੋ"
            }
        }
    },
    {
        "id": "mp_kisan_kalyan",
        "category": "direct-benefit",
        "state": "Madhya Pradesh",
        "translations": {
            "hi": {
                "title": "मुख्यमंत्री किसान कल्याण योजना (MP)",
                "department": "राजस्व विभाग, मध्य प्रदेश सरकार",
                "benefits": "₹6,000 प्रति वर्ष सीधे बैंक खाते में (₹2,000 की 3 किश्तों में, पीएम किसान के अतिरिक्त)",
                "eligibility": "मध्य प्रदेश के मूल निवासी किसान जो पीएम किसान योजना के लाभार्थी हैं",
                "linkText": "पात्रता स्थिति देखें"
            },
            "hl": {
                "title": "Mukhyamantri Kisan Kalyan Yojana (MP)",
                "department": "Revenue Dept, Madhya Pradesh Govt",
                "benefits": "₹6,000 per year directly in bank account (additional to PM-Kisan)",
                "eligibility": "Madhya Pradesh resident farmers who are beneficiaries of PM-Kisan",
                "linkText": "Check Eligibility Status"
            },
            "en": {
                "title": "Mukhyamantri Kisan Kalyan Yojana (MP)",
                "department": "Revenue Department, Govt of MP",
                "benefits": "₹6,000 per year directly in bank account (additional to PM-Kisan)",
                "eligibility": "MP resident farmers eligible for PM-Kisan scheme",
                "linkText": "View Claim Status"
            },
            "mr": {
                "title": "मुख्यमंत्री किसान कल्याण योजना (MP)",
                "department": "महसूल विभाग, मध्य प्रदेश शासन",
                "benefits": "₹६,००० प्रति वर्ष थेट बँक खात्यात (पीएम किसान व्यतिरिक्त)",
                "eligibility": "मध्य प्रदेशातील शेतकरी जे पीएम किसान योजनेचे लाभार्थी आहेत",
                "linkText": "पात्रता तपासा"
            },
            "gu": {
                "title": "મુખ્યમંત્રી કિસાન કલ્યાણ યોજના (MP)",
                "department": "મહેસૂલ વિભાગ, મધ્ય પ્રદેશ સરકાર",
                "benefits": "₹૬,૦૦૦ પ્રતિ વર્ષ સીધા બેંક ખાતામાં (PM-Kisan ઉપરાંત)",
                "eligibility": "મધ્ય પ્રદેશના ખેડૂતો જે પીએમ કિસાન યોજનાના લાભાર્થી છે",
                "linkText": "લાભાર્થી સ્ટેટસ જુઓ"
            },
            "pa": {
                "title": "ਮੁੱਖ ਮੰਤਰੀ ਕਿਸਾਨ ਕਲਿਆਣ ਯੋਜਨਾ (MP)",
                "department": "ਮਾਲ ਵਿਭਾਗ, ਮੱਧ ਪ੍ਰਦੇਸ਼ ਸਰਕਾਰ",
                "benefits": "₹6,000 ਪ੍ਰਤੀ ਸਾਲ ਸਿੱਧੇ ਬੈਂਕ ਖਾਤੇ ਵਿੱਚ (ਪੀਐਮ ਕਿਸਾਨ ਤੋਂ ਇਲਾਵਾ)",
                "eligibility": "ਮੱਧ ਪ੍ਰਦੇਸ਼ ਦੇ ਉਹ ਕਿਸਾਨ ਜੋ ਪੀਐਮ ਕਿਸਾਨ ਯੋਜਨਾ ਦੇ ਲਾਭਪਾਤਰੀ ਹਨ",
                "linkText": "ਸਟੇਟਸ ਚੈੱਕ ਕਰੋ"
            }
        }
    },
    {
        "id": "up_krishak_durghatna",
        "category": "insurance",
        "state": "Uttar Pradesh",
        "translations": {
            "hi": {
                "title": "मुख्यमंत्री कृषक दुर्घटना कल्याण योजना (UP)",
                "department": "राजस्व विभाग, उत्तर प्रदेश सरकार",
                "benefits": "खेत में काम के दौरान मृत्यु या दिव्यांगता पर ₹5 लाख तक की वित्तीय सहायता",
                "eligibility": "उत्तर प्रदेश के खातेदार/सह-खातेदार किसान और भूमिहीन खेतिहर मजदूर",
                "linkText": "दावा फॉर्म डाउनलोड"
            },
            "hl": {
                "title": "Mukhyamantri Krishak Durghatna Kalyan Yojana (UP)",
                "department": "Revenue Dept, Uttar Pradesh Govt",
                "benefits": "Financial aid of up to ₹5 Lakhs in case of death or disability during farming",
                "eligibility": "UP landholders/co-sharers and landless agricultural laborers",
                "linkText": "Claim Form Download"
            },
            "en": {
                "title": "Mukhyamantri Krishak Durghatna Kalyan Yojana (UP)",
                "department": "Revenue Department, Govt of UP",
                "benefits": "Up to ₹5 Lakhs insurance for accidental death or permanent disability while farming",
                "eligibility": "Landholding farmers & landless laborers of Uttar Pradesh",
                "linkText": "Download Claim Form"
            },
            "mr": {
                "title": "मुख्यमंत्री कृषक दुर्घटना कल्याण योजना (UP)",
                "department": "महसूल विभाग, उत्तर प्रदेश शासन",
                "benefits": "अपघाती मृत्यू किंवा अपंगत्व आल्यास ₹५ लाखांपर्यंत आर्थिक मदत",
                "eligibility": "उत्तर प्रदेशमधील खातेदार शेतकरी आणि शेतमजूर",
                "linkText": "दावा अर्ज डाउनलोड"
            },
            "gu": {
                "title": "મુખ્યમંત્રી કૃષક દુર્ઘટના કલ્યાણ યોજના (UP)",
                "department": "મહેસૂલ વિભાગ, ઉત્તર પ્રદેશ સરકાર",
                "benefits": "અકસ્માતે મૃત્યુ કે દિવ્યાંગતાના કિસ્સામાં ₹૫ લાખ સુધીની નાણાકીય સહાય",
                "eligibility": "ઉત્તર પ્રદેશના ખાતાધારક ખેડૂતો અને ખેતમજૂરો",
                "linkText": "ક્લેમ ફોર્મ ડાઉનલોડ"
            },
            "pa": {
                "title": "ਮੁੱਖ ਮੰਤਰੀ ਕ੍ਰਿਸ਼ਕ ਦੁਰਘਟਨਾ ਕਲਿਆਣ ਯੋਜਨਾ (UP)",
                "department": "ਮਾਲ ਵਿਭਾਗ, ਉੱਤਰ ਪ੍ਰਦੇਸ਼ ਸਰਕਾਰ",
                "benefits": "ਖੇਤੀ ਦੌਰਾਨ ਮੌਤ ਜਾਂ ਅਪਾਹਜਤਾ ਹੋਣ 'ਤੇ ₹5 ਲੱਖ ਤੱਕ ਦੀ ਵਿੱਤੀ ਸਹਾਇਤਾ",
                "eligibility": "ਉੱਤਰ ਪ੍ਰਦੇਸ਼ ਦੇ ਜ਼ਮੀਨ ਮਾਲਕ ਕਿਸਾਨ ਅਤੇ ਭੂਮੀਹੀਣ ਖੇਤ ਮਜ਼ਦੂਰ",
                "linkText": "ਕਲੇਮ ਫਾਰਮ ਡਾਊਨਲੋਡ"
            }
        }
    },
    {
        "id": "raj_krishak_saathi",
        "category": "direct-benefit",
        "state": "Rajasthan",
        "translations": {
            "hi": {
                "title": "राजस्थान मुख्यमंत्री कृषक साथी योजना",
                "department": "कृषि विभाग, राजस्थान सरकार",
                "benefits": "खेत में तारबंदी पर 50% सब्सिडी, डिग्गी और कृषि पाइपलाइन निर्माण हेतु अनुदान",
                "eligibility": "राजस्थान के समस्त किसान जिनके नाम न्यूनतम 0.5 हेक्टेयर कृषि भूमि हो",
                "linkText": "फेंसिंग सब्सिडी आवेदन"
            },
            "hl": {
                "title": "Rajasthan Mukhyamantri Krishak Saathi Yojana",
                "department": "Agriculture Dept, Rajasthan Govt",
                "benefits": "50% subsidy on farm wire fencing, subsidy for farm ponds and pipelines",
                "eligibility": "All Rajasthan farmers owning at least 0.5 hectares of land",
                "linkText": "Fencing Subsidy Form"
            },
            "en": {
                "title": "Rajasthan Mukhyamantri Krishak Saathi Yojana",
                "department": "Department of Agriculture, Govt of Rajasthan",
                "benefits": "50% subsidy on wire fencing, and financial assistance for farm ponds & water pipelines",
                "eligibility": "Farmers of Rajasthan holding at least 0.5 hectares of land",
                "linkText": "Apply for Fencing Subsidy"
            },
            "mr": {
                "title": "राजस्थान मुख्यमंत्री कृषक साथी योजना",
                "department": "कृषी विभाग, राजस्थान शासन",
                "benefits": "शेतीला कुंपण घालण्यासाठी ५०% अनुदान, शेततळे आणि पाईपलाईनसाठी मदत",
                "eligibility": "किमान ०.५ हेक्टर शेती असलेले राजस्थानमधील सर्व शेतकरी",
                "linkText": "कुंपण अनुदान अर्ज"
            },
            "gu": {
                "title": "રાજસ્થાન મુખ્યમંત્રી કૃષક સાથી યોજના",
                "department": "કૃષિ વિભાગ, રાજસ્થાન સરકાર",
                "benefits": "ખેતર ફરતે કાંટાળા તારની વાડ માટે ૫૦% સબસિડી, ખેત તલાવડી માટે નાણાકીય સહાય",
                "eligibility": "ઓછામાં ઓછી ૦.૫ હેક્ટર ખેતીની જમીન ધરાવતા રાજસ્થાનના ખેડૂતો",
                "linkText": "ફેન્સિંગ સબસિડી અરજી"
            },
            "pa": {
                "title": "ਰਾਜਸਥਾਨ ਮੁੱਖ ਮੰਤਰੀ ਕਿਸਾਨ ਸਾਥੀ ਯੋਜਨਾ",
                "department": "ਖੇਤੀਬਾੜੀ ਵਿਭਾਗ, ਰਾਜਸਥਾਨ ਸਰਕਾਰ",
                "benefits": "ਖੇਤ ਦੀ ਤਾਰਬੰਦੀ 'ਤੇ 50% ਸਬਸਿਡੀ, ਖੂਹ ਅਤੇ ਪਾਈਪਲਾਈਨ ਲਈ ਗ੍ਰਾਂਟ",
                "eligibility": "ਰਾਜਸਥਾਨ ਦੇ ਉਹ ਕਿਸਾਨ ਜਿਨ੍ਹਾਂ ਕੋਲ ਘੱਟੋ-ਘੱਟ 0.5 ਹੈਕਟੇਅਰ ਜ਼ਮੀਨ ਹੈ",
                "linkText": "ਤਾਰਬੰਦੀ ਸਬਸਿਡੀ ਫਾਰਮ"
            }
        }
    },
    {
        "id": "gu_saat_pagla",
        "category": "direct-benefit",
        "state": "Gujarat",
        "translations": {
            "hi": {
                "title": "सात पगला खेड़ूत कल्याण ना (Gujarat)",
                "department": "कृषि एवं सहकारिता विभाग, गुजरात सरकार",
                "benefits": "छोटे विक्रेताओं को कृषि उपज स्टोर करने के लिए छाता, छोटे गोदाम और मालवाहक वाहनों पर सब्सिडी",
                "eligibility": "गुजरात के छोटे और सीमांत फल, सब्जी व अनाज उत्पादक किसान",
                "linkText": "फ्री अंब्रेला योजना फॉर्म"
            },
            "hl": {
                "title": "Saat Pagla Khedut Kalyanna (Gujarat)",
                "department": "Agriculture and Cooperation Dept, Gujarat Govt",
                "benefits": "Subsidies for smart hand tools, crop storage infrastructure, and transport vehicles",
                "eligibility": "Small and marginal farmers growing crops, fruits, and vegetables in Gujarat",
                "linkText": "Apply for Storage Subsidy"
            },
            "en": {
                "title": "Saat Pagla Khedut Kalyanna (Gujarat)",
                "department": "Dept of Agriculture & Cooperation, Gujarat",
                "benefits": "Subsidized hand tools, small crop godown storage kits, and loaders for farm produce transport",
                "eligibility": "Small, marginal, and roadside vegetable/fruit selling farmers in Gujarat",
                "linkText": "Apply for Storage Kit"
            },
            "mr": {
                "title": "सात पगला खेडूत कल्याण ना (Gujarat)",
                "department": "कृषी आणि सहकार विभाग, गुजरात शासन",
                "benefits": "सेंद्रिय माल साठवणुकीसाठी गोदाम आणि मालवाहतूक वाहनांवर अनुदान",
                "eligibility": "गुजरातचे लहान आणि अल्पभूधारक भाजीपाला उत्पादक शेतकरी",
                "linkText": "साठवणूक अनुदान अर्ज"
            },
            "gu": {
                "title": "સાત પગલાં ખેડૂત કલ્યાણના (Gujarat)",
                "department": "કૃષિ અને સહકાર વિભાગ, ગુજરાત સરકાર",
                "benefits": "નાના વેચાણકારો માટે પાક સંગ્રહ કરવા શેડ, છત્રી અને પાક વહન વાહન ખરીદી પર સબસિડી",
                "eligibility": "ગુજરાતના નાના અને સીમાંત ફળ, શાકભાજી ઉત્પાદક ખેડૂતો",
                "linkText": "વિનામૂલ્યે છત્રી યોજના ફોર્મ"
            },
            "pa": {
                "title": "ਸੱਤ ਪਗਲਾ ਖੇੜੂਤ ਕਲਿਆਣ ਨਾ (Gujarat)",
                "department": "ਖੇਤੀਬਾੜੀ ਅਤੇ ਸਹਿਕਾਰਤਾ ਵਿਭਾਗ, ਗੁਜਰਾਤ ਸਰਕਾਰ",
                "benefits": "ਸਬਜ਼ੀ ਵਿਕਰੇਤਾਵਾਂ ਲਈ ਛਤਰੀ, ਫਸਲ ਭੰਡਾਰਨ ਗੋਦਾਮ ਅਤੇ ਟ੍ਰਾਂਸਪੋਰਟ ਗੱਡੀਆਂ 'ਤੇ ਸਬਸਿਡੀ",
                "eligibility": "ਗੁਜਰਾਤ ਦੇ ਛੋਟੇ ਅਤੇ ਸੀਮਾਂਤ ਸਬਜ਼ੀ ਅਤੇ ਫਲ ਉਤਪਾਦਕ ਕਿਸਾਨ",
                "linkText": "ਛਤਰੀ ਯੋਜਨਾ ਫਾਰਮ"
            }
        }
    },
    {
        "id": "mah_namo_shetkari",
        "category": "direct-benefit",
        "state": "Maharashtra",
        "translations": {
            "hi": {
                "title": "नमो शेतकरी महासन्मान निधि योजना (Maharashtra)",
                "department": "कृषि विभाग, महाराष्ट्र सरकार",
                "benefits": "₹6,000 प्रति वर्ष सीधे बैंक खाते में (₹2,000 की 3 समान किश्तों में, पीएम किसान के अतिरिक्त)",
                "eligibility": "महाराष्ट्र के भूमिधारक किसान जो पीएम किसान योजना के अंतर्गत पंजीकृत हैं",
                "linkText": "लाभार्थी सूची में खोजें"
            },
            "hl": {
                "title": "Namo Shetkari Mahasanman Nidhi Yojana (Maharashtra)",
                "department": "Agriculture Dept, Maharashtra Govt",
                "benefits": "₹6,000 per year directly in bank account (additional to PM-Kisan)",
                "eligibility": "Maharashtra resident farmers registered under PM-Kisan scheme",
                "linkText": "Beneficiary List Search"
            },
            "en": {
                "title": "Namo Shetkari Mahasanman Nidhi Yojana (Maharashtra)",
                "department": "Department of Agriculture, Maharashtra",
                "benefits": "₹6,000 per year directly in bank account (additional to PM-Kisan)",
                "eligibility": "Landholding farmers of Maharashtra enrolled under PM-Kisan",
                "linkText": "Search Beneficiary List"
            },
            "mr": {
                "title": "नमो शेतकरी महासन्मान निधी योजना (Maharashtra)",
                "department": "कृषी विभाग, महाराष्ट्र शासन",
                "benefits": "₹६,००० प्रति वर्ष थेट बँक खात्यात (पीएम किसान योजनेव्यतिरिक्त)",
                "eligibility": "महाराष्ट्र राज्यातील शेतकरी जे पीएम किसान योजनेचे लाभार्थी आहेत",
                "linkText": "लाभार्थी यादीत नाव तपासा"
            },
            "gu": {
                "title": "નમો શેતકરી મહાસન્માન નિધિ યોજના (Maharashtra)",
                "department": "કૃષિ વિભાગ, મહારાષ્ટ્ર સરકાર",
                "benefits": "₹૬,૦૦૦ પ્રતિ વર્ષ સીધા બેંક ખાતામાં (PM-Kisan ઉપરાંત)",
                "eligibility": "મહારાષ્ટ્રના ખેડૂતો જે પીએમ કિસાન યોજનાના લાભાર્થી છે",
                "linkText": "લાભાર્થી લિસ્ટ જુઓ"
            },
            "pa": {
                "title": "ਨਮੋ ਸ਼ੇਤਕਰੀ ਮਹਾਸਨਮਾਨ ਨਿਧੀ ਯੋਜਨਾ (Maharashtra)",
                "department": "ਖੇਤੀਬਾੜੀ ਵਿਭਾਗ, ਮਹਾਰਾਸ਼ਟਰ ਸਰਕਾਰ",
                "benefits": "₹6,000 ਪ੍ਰਤੀ ਸਾਲ ਸਿੱਧੇ ਬੈਂਕ ਖਾਤੇ ਵਿੱਚ (ਪੀਐਮ ਕਿਸਾਨ ਤੋਂ ਇਲਾਵਾ)",
                "eligibility": "ਮਹਾਰਾਸ਼ਟਰ ਦੇ ਉਹ ਕਿਸਾਨ ਜੋ ਪੀਐਮ ਕਿਸਾਨ ਯੋਜਨਾ ਦੇ ਲਾਭਪਾਤਰੀ ਹਨ",
                "linkText": "ਲਾਭਪਾਤਰੀ ਸੂਚੀ ਚੈੱਕ ਕਰੋ"
            }
        }
    },
    {
        "id": "mp_krishak_udyami",
        "category": "direct-benefit",
        "state": "Madhya Pradesh",
        "translations": {
            "hi": {
                "title": "मुख्यमंत्री कृषक उद्यमी योजना (MP)",
                "department": "कृषि विभाग, मध्य प्रदेश सरकार",
                "benefits": "कृषि प्रसंस्करण/स्टार्टअप हेतु ₹10 लाख से ₹2 करोड़ तक का ऋण, 15% पूंजी अनुदान और 5% ब्याज सब्सिडी",
                "eligibility": "18-45 वर्ष के किसान पुत्र/पुत्रियां (10वीं पास आवश्यक)",
                "linkText": "एमएसएमई पोर्टल आवेदन"
            },
            "hl": {
                "title": "Mukhyamantri Krishak Udyami Yojana (MP)",
                "department": "Agriculture Dept, Madhya Pradesh Govt",
                "benefits": "Loan from ₹10 Lakhs to ₹2 Crores for agro-startups, 15% capital subsidy, 5% interest subsidy",
                "eligibility": "18-45 years old sons/daughters of farmers (10th pass required)",
                "linkText": "MSME Portal Apply"
            },
            "en": {
                "title": "Mukhyamantri Krishak Udyami Yojana (MP)",
                "department": "Dept of Agriculture, Govt of MP",
                "benefits": "Loans from ₹10 Lakhs up to ₹2 Crores for food processing units, with 15% capital grant & 5% interest subsidy",
                "eligibility": "Children of registered farmers in MP, age 18-45 years, holding at least a 10th-grade certificate",
                "linkText": "Apply on MSME Portal"
            },
            "mr": {
                "title": "मुख्यमंत्री कृषक उद्यमी योजना (MP)",
                "department": "कृषी विभाग, मध्य प्रदेश शासन",
                "benefits": "कृषी प्रक्रियेसाठी ₹१० लाख ते ₹२ कोटींपर्यंतचे कर्ज, १५% भांडवली अनुदान",
                "eligibility": "१८-४५ वयोगटातील शेतकऱ्यांची मुले/मुली (१० वी पास आवश्यक)",
                "linkText": "एमएसएमई पोर्टल अर्ज"
            },
            "gu": {
                "title": "મુખ્યમંત્રી કૃષક ઉદ્યમી યોજના (MP)",
                "department": "કૃષિ વિભાગ, મધ્ય પ્રદેશ સરકાર",
                "benefits": "કૃષિ પ્રોસેસિંગ એકમ સ્થાપવા ₹૧૦ લાખથી ₹૨ કરોડ સુધીની લોન અને ૧૫% કેપિટલ સબસિડી",
                "eligibility": "૧૮-૪૫ વર્ષના ખેડૂતના પુત્ર/પુત્રીઓ (૧૦ પાસ જરૂરી)",
                "linkText": "એમએસએમઈ પોર્ટલ અરજી"
            },
            "pa": {
                "title": "ਮੁੱਖ ਮੰਤਰੀ ਕ੍ਰਿਸ਼ਕ ਉਦਮੀ ਯੋਜਨਾ (MP)",
                "department": "ਖੇਤੀਬਾੜੀ ਵਿਭਾਗ, ਮੱਧ ਪ੍ਰਦੇਸ਼ ਸਰਕਾਰ",
                "benefits": "ਖੇਤੀ ਪ੍ਰੋਸੈਸਿੰਗ ਲਈ ₹10 ਲੱਖ ਤੋਂ ₹2 ਕਰੋੜ ਤੱਕ ਦਾ ਕਰਜ਼ਾ ਅਤੇ 15% ਪੂੰਜੀ ਗ੍ਰਾਂਟ",
                "eligibility": "18-45 ਸਾਲ ਦੇ ਕਿਸਾਨਾਂ ਦੇ ਧੀਆਂ/ਪੁੱਤਰ (10ਵੀਂ ਪਾਸ ਜ਼ਰੂਰੀ)",
                "linkText": "ਉਦਮੀ ਲੋਨ ਲਈ ਅਪਲਾਈ ਕਰੋ"
            }
        }
    },
    {
        "id": "gu_kisan_sahay",
        "category": "insurance",
        "state": "Gujarat",
        "translations": {
            "hi": {
                "title": "मुख्यमंत्री किसान सहाय योजना (Gujarat)",
                "department": "कृषि, किसान कल्याण एवं सहकारिता विभाग, गुजरात",
                "benefits": "सूखा, भारी बारिश या बेमौसम बारिश से 33% से अधिक फसल नुकसान पर ₹20,000 प्रति हेक्टेयर सहायता",
                "eligibility": "गुजरात के सभी पंजीकृत जोतदार किसान (अधिकतम 4 हेक्टेयर हेतु सहायता)",
                "linkText": "मुआवजा फॉर्म जमा करें"
            },
            "hl": {
                "title": "Mukhya Mantri Kisan Sahay Yojana (Gujarat)",
                "department": "Agriculture and Farmers Welfare Dept, Gujarat",
                "benefits": "₹20,000 per hectare aid for crop loss exceeding 33% due to drought or unseasonal rain",
                "eligibility": "All landholding farmers in Gujarat (assistance capped at 4 hectares)",
                "linkText": "Submit Compensation Form"
            },
            "en": {
                "title": "Mukhya Mantri Kisan Sahay Yojana (Gujarat)",
                "department": "Department of Agriculture, Govt of Gujarat",
                "benefits": "Compensation of ₹20,000 per hectare for crop damage above 33% caused by drought or excess rain",
                "eligibility": "All registered farmers in Gujarat (subsidy valid up to 4 hectares)",
                "linkText": "Apply for Calamity Compensation"
            },
            "mr": {
                "title": "मुख्यमंत्री किसान सहाय योजना (Gujarat)",
                "department": "कृषी आणि शेतकरी कल्याण विभाग, गुजरात शासन",
                "benefits": "३३% पेक्षा जास्त पीक नुकसान झाल्यास ₹२०,००० प्रति हेक्टर मदत",
                "eligibility": "गुजरातचे सर्व शेतकरी (कमाल ४ हेक्टर मर्यादेपर्यंत)",
                "linkText": "नुकसानभरपाई अर्ज"
            },
            "gu": {
                "title": "મુખ્યમંત્રી કિસાન સહાય યોજના (Gujarat)",
                "department": "કૃષિ અને ખેડૂત કલ્યાણ વિભાગ, ગુજરાત સરકાર",
                "benefits": "દુષ્કાળ કે ભારે વરસાદથી ૩૩% થી વધુ પાક નુકસાન પર ₹૨૦,૦૦૦ પ્રતિ હેક્ટર સહાય",
                "eligibility": "ગુજરાતના તમામ ખેડૂતો (વધુમાં વધુ ૪ હેક્ટર સુધી સહાય)",
                "linkText": "નુકસાન વળતર ફોર્મ"
            },
            "pa": {
                "title": "ਮੁੱਖ ਮੰਤਰੀ ਕਿਸਾਨ ਸਹਾਇ ਯੋਜਨਾ (Gujarat)",
                "department": "ਖੇਤੀਬਾੜੀ ਅਤੇ ਕਿਸਾਨ ਭਲਾਈ ਵਿਭਾਗ, ਗੁਜਰਾਤ",
                "benefits": "ਸੋਕੇ ਜਾਂ ਭਾਰੀ ਮੀਂਹ ਕਾਰਨ 33% ਤੋਂ ਵੱਧ ਫਸਲ ਖਰਾਬ ਹੋਣ 'ਤੇ ₹20,000 ਪ੍ਰਤੀ ਹੈਕਟੇਅਰ ਸਹਾਇਤਾ",
                "eligibility": "ਗੁਜਰਾਤ ਦੇ ਸਾਰੇ ਰਜਿਸਟਰਡ ਕਿਸਾਨ (ਵੱਧ ਤੋਂ ਵੱਧ 4 ਹੈਕਟੇਅਰ)",
                "linkText": "ਮੁਆਵਜ਼ਾ ਫਾਰਮ ਜਮ੍ਹਾਂ ਕਰੋ"
            }
        }
    },
    {
        "id": "up_krishi_yantra",
        "category": "direct-benefit",
        "state": "Uttar Pradesh",
        "translations": {
            "hi": {
                "title": "यूपी कृषि यंत्र सब्सिडी योजना",
                "department": "कृषि विभाग, उत्तर प्रदेश सरकार",
                "benefits": "कल्टीवेटर, सीड ड्रिल, पावर टिलर और पैडी ट्रांसप्लांटर पर 50% तक सब्सिडी",
                "eligibility": "उत्तर प्रदेश के वे किसान जो डीबीटी (DBT) पोर्टल पर पंजीकृत हैं",
                "linkText": "टोकन जनरेट करें"
            },
            "hl": {
                "title": "UP Krishi Yantra Subsidy Yojana",
                "department": "Agriculture Dept, Uttar Pradesh Govt",
                "benefits": "Up to 50% subsidy on cultivators, seed drills, power tillers, and rice transplanters",
                "eligibility": "Uttar Pradesh farmers registered on the state DBT agriculture portal",
                "linkText": "Generate Equipment Token"
            },
            "en": {
                "title": "UP Krishi Yantra Subsidy Yojana",
                "department": "Agriculture Department, Uttar Pradesh",
                "benefits": "Up to 50% subsidy on seed drills, power tillers, cultivators, and water pumps",
                "eligibility": "Farmers of Uttar Pradesh who are registered on UP Agriculture DBT portal",
                "linkText": "Generate Booking Token"
            },
            "mr": {
                "title": "यूपी कृषी यंत्र अनुदान योजना",
                "department": "कृषी विभाग, उत्तर प्रदेश शासन",
                "benefits": "सीड ड्रिल, रोटाव्हेटर आणि कल्टिव्हेटर खरेदीवर ५०% पर्यंत अनुदान",
                "eligibility": "डीबीटी पोर्टलवर नोंदणीकृत असलेले उत्तर प्रदेशचे शेतकरी",
                "linkText": "टोकन तयार करा"
            },
            "gu": {
                "title": "યુપી કૃષિ સાધનો સબસિડી યોજના",
                "department": "કૃષિ વિભાગ, ઉત્તર પ્રદેશ સરકાર",
                "benefits": "સીડ ડ્રિલ, રોટાવેટર અને પાવર ટિલરની ખરીદી પર ૫૦% સુધીની સબસિડી",
                "eligibility": "ઉત્તર પ્રદેશના ડીબીટી પોર્ટલ પર નોંધાયેલા ખેડૂતો",
                "linkText": "ટોકન જનરેટ કરો"
            },
            "pa": {
                "title": "ਯੂਪੀ ਖੇਤੀਬਾੜੀ ਸੰਦ ਸਬਸਿਡੀ ਯੋਜਨਾ",
                "department": "ਖੇਤੀਬਾੜੀ ਵਿਭਾਗ, ਉੱਤਰ ਪ੍ਰਦੇਸ਼ ਸਰਕਾਰ",
                "benefits": "ਸੀਡ ਡਰਿੱਲ, ਰੋਟਾਵੇਟਰ ਅਤੇ ਪਾਵਰ ਟਿੱਲਰ 'ਤੇ 50% ਤੱਕ ਸਬਸਿਡੀ",
                "eligibility": "ਉੱਤਰ ਪ੍ਰਦੇਸ਼ ਦੇ ਉਹ ਕਿਸਾਨ ਜੋ ਡੀਬੀਟੀ ਪੋਰਟਲ 'ਤੇ ਰਜਿਸਟਰਡ ਹਨ",
                "linkText": "ਬੁਕਿੰਗ ਟੋਕਨ ਬਣਾਓ"
            }
        }
    },
    {
        "id": "raj_irrigation_subsidy",
        "category": "irrigation",
        "state": "Rajasthan",
        "translations": {
            "hi": {
                "title": "राजस्थान ड्रिप एवं स्प्रिंकलर सब्सिडी योजना",
                "department": "उद्यानिकी विभाग, राजस्थान सरकार",
                "benefits": "सूक्ष्म सिंचाई अपनाने पर लघु और सीमांत किसानों को 70% से 75% तक की विशेष सब्सिडी",
                "eligibility": "राजस्थान के किसान जिनके पास वैध सिंचाई कूप या पानी का होज हो",
                "linkText": "सिंचाई सब्सिडी फॉर्म"
            },
            "hl": {
                "title": "Rajasthan Drip and Sprinkler Subsidy Yojana",
                "department": "Horticulture Dept, Rajasthan Govt",
                "benefits": "70% to 75% special subsidy on micro-irrigation systems for small/marginal farmers",
                "eligibility": "Rajasthan farmers having cultivable land with a functional well or water source",
                "linkText": "Irrigation Subsidy Form"
            },
            "en": {
                "title": "Rajasthan Drip and Sprinkler Subsidy Yojana",
                "department": "Department of Horticulture, Govt of Rajasthan",
                "benefits": "Special 70% to 75% subsidy on installation of drip or sprinkler pipelines for small farmers",
                "eligibility": "Rajasthan farmers with a valid irrigation source (well, tubewell, or pond)",
                "linkText": "Apply for Pipeline Subsidy"
            },
            "mr": {
                "title": "राजस्थान ठिबक आणि तुषार सिंचन अनुदान योजना",
                "department": "फलोत्पादन विभाग, राजस्थान शासन",
                "benefits": "लहान शेतकऱ्यांना ठिबक व तुषार सिंचन पद्धतींवर ७०% ते ७५% अनुदान",
                "eligibility": "राजस्थानमधील शेतकरी ज्यांच्याकडे पाण्याचा स्त्रोत उपलब्ध आहे",
                "linkText": "सिंचन अनुदान अर्ज"
            },
            "gu": {
                "title": "રાજસ્થાન ટપક અને સ્પ્રિંકલર સબસિડી યોજના",
                "department": "બાગાયત વિભાગ, રાજસ્થાન સરકાર",
                "benefits": "ટપક અને સ્પ્રિંકલર સિંચાઈ પદ્ધતિ અપનાવવા નાના ખેડૂતોને ૭૦% થી ૭૫% સુધી સબસિડી",
                "eligibility": "રાજસ્થાનના ખેડૂતો જે ખેતરમાં કૂવો અથવા પાણીનો સ્રોત ધરાવે છે",
                "linkText": "સિંચાઈ સબસિડી ફોર્મ"
            },
            "pa": {
                "title": "ਰਾਜਸਥਾਨ ਤੁਪਕਾ ਅਤੇ ਸਪ੍ਰਿੰਕਲਰ ਸਿੰਚਾਈ ਸਬਸਿਡੀ ਯੋਜਨਾ",
                "department": "ਬਾਗਬਾਨੀ ਵਿਭਾਗ, ਰਾਜਸਥਾਨ ਸਰਕਾਰ",
                "benefits": "ਸੂਖਮ ਸਿੰਚਾਈ ਅਪਣਾਉਣ 'ਤੇ ਛੋਟੇ ਕਿਸਾਨਾਂ ਨੂੰ 70% ਤੋਂ 75% ਤੱਕ ਵਿਸ਼ੇਸ਼ ਸਬਸਿਡੀ",
                "eligibility": "ਰਾਜਸਥਾਨ ਦੇ ਉਹ ਕਿਸਾਨ ਜਿਨ੍ਹਾਂ ਕੋਲ ਸਿੰਚਾਈ ਦਾ ਸਾਧਨ (ਖੂਹ ਜਾਂ ਟਿਊਬਵੈੱਲ) ਹੈ",
                "linkText": "ਸਿੰਚਾਈ ਗ੍ਰਾਂਟ ਫਾਰਮ"
            }
        }
    },
    {
        "id": "mah_hostel_allowance",
        "category": "direct-benefit",
        "state": "Maharashtra",
        "translations": {
            "hi": {
                "title": "डॉ. पंजाबराव देशमुख वसतिगृह निर्वाह भत्ता योजना (MH)",
                "department": "उच्च एवं तकनीकी शिक्षा विभाग, महाराष्ट्र",
                "benefits": "किसान संतानों को व्यावसायिक शिक्षा हेतु हॉस्टल और भोजन खर्च के लिए ₹30,000 प्रति वर्ष भत्ता",
                "eligibility": "पंजीकृत अल्पभूधारक किसानों के पाल्य जो प्रोफेशनल कोर्स कर रहे हैं",
                "linkText": "महाडीबीटी स्कॉलरशिप पोर्टल"
            },
            "hl": {
                "title": "Dr. Punjabrao Deshmukh Vastigruh Nirvah Bhatta Yojna (MH)",
                "department": "Higher and Technical Education Dept, Maharashtra",
                "benefits": "₹30,000 per year allowance for children of farmers to cover hostel and mess expenses",
                "eligibility": "Children of registered small/marginal farmers pursuing professional courses",
                "linkText": "MahaDBT Portal Apply"
            },
            "en": {
                "title": "Dr. Punjabrao Deshmukh Vastigruh Nirvah Bhatta Yojna (MH)",
                "department": "Dept of Higher & Technical Education, Maharashtra",
                "benefits": "Hostel and boarding allowance of ₹30,000 per year for farmer children in higher education",
                "eligibility": "Wards of registered small landholders pursuing professional degrees",
                "linkText": "Apply on MahaDBT Portal"
            },
            "mr": {
                "title": "डॉ. पंजाबराव देशमुख वसतिगृह निर्वाह भत्ता योजना (MH)",
                "department": "उच्च व तंत्रशिक्षण विभाग, महाराष्ट्र शासन",
                "benefits": "शेतकऱ्यांच्या पाल्यांना व्यावसायिक शिक्षणासाठी वसतिगृह भत्ता प्रति वर्ष ₹३०,०००",
                "eligibility": "व्यावसायिक अभ्यासक्रम शिकणारे अल्पभूधारक शेतकऱ्यांचे पाल्य",
                "linkText": "महाडीबीटी पोर्टलवर अर्ज करा"
            },
            "gu": {
                "title": "ડૉ. પંજાબરાવ દેશમુખ હોસ્ટેલ ભથ્થા યોજના (MH)",
                "department": "ઉચ્ચ અને ટેકનિકલ શિક્ષણ વિભાગ, મહારાષ્ટ્ર",
                "benefits": "ખેડૂતોના બાળકોને ઉચ્ચ શિક્ષણ માટે હોસ્ટેલ અને જમવા ખર્ચ પેટે વાર્ષિક ₹૩૦,૦૦૦ ભથ્થું",
                "eligibility": "નાના ખેડૂતોના બાળકો જે પ્રોફેશનલ અભ્યાસક્રમમાં ભણે છે",
                "linkText": "મહાડીબીટી પોર્ટલ અરજી"
            },
            "pa": {
                "title": "ਡਾ. ਪੰਜਾਬਰਾਓ ਦੇਸ਼ਮੁਖ ਹੋਸਟਲ ਭੱਤਾ ਯੋਜਨਾ (MH)",
                "department": "ਉੱਚ ਅਤੇ ਤਕਨੀਕੀ ਸਿੱਖਿਆ ਵਿਭਾਗ, ਮਹਾਰਾਸ਼ਟਰ",
                "benefits": "ਕਿਸਾਨਾਂ ਦੇ ਬੱਚਿਆਂ ਨੂੰ ਉੱਚ ਸਿੱਖਿਆ ਲਈ ਹੋਸਟਲ ਖਰਚੇ ਵਜੋਂ ₹30,000 ਸਾਲਾਨਾ ਭੱਤਾ",
                "eligibility": "ਛੋਟੇ ਕਿਸਾਨਾਂ ਦੇ ਬੱਚੇ ਜੋ ਪ੍ਰੋਫੈਸ਼ਨਲ ਕੋਰਸ ਕਰ ਰਹੇ ਹਨ",
                "linkText": "ਮਹਾਂਡੀਬੀਟੀ ਸਕਾਲਰਸ਼ਿਪ ਪੋਰਟਲ"
            }
        }
    },
    {
        "id": "national_livestock",
        "category": "direct-benefit",
        "state": "all",
        "translations": {
            "hi": {
                "title": "राष्ट्रीय पशुधन मिशन (NLM)",
                "department": "पशुपालन और डेयरी विभाग",
                "benefits": "पोल्ट्री, बकरी पालन, सुअर पालन और चारा विकास परियोजनाओं पर 50% तक पूंजी सब्सिडी",
                "eligibility": "व्यक्तिगत किसान, स्वयं सहायता समूह (SHG) और पशुपालक",
                "linkText": "पशुपालन लोन आवेदन"
            },
            "hl": {
                "title": "National Livestock Mission (NLM)",
                "department": "Department of Animal Husbandry and Dairying",
                "benefits": "Up to 50% capital subsidy on poultry, goat farming, piggery, and fodder development",
                "eligibility": "Individual farmers, Self Help Groups (SHGs), and cooperative societies",
                "linkText": "Apply for Livestock Subsidy"
            },
            "en": {
                "title": "National Livestock Mission (NLM)",
                "department": "Dept of Animal Husbandry & Dairying",
                "benefits": "Up to 50% capital subsidy on goat rearing, poultry, piggery, and animal fodder production",
                "eligibility": "Individual livestock farmers, cooperative societies, and SHGs",
                "linkText": "Apply for NLM Loan"
            },
            "mr": {
                "title": "राष्ट्रीय पशुधन अभियान (NLM)",
                "department": "पशुसंवर्धन आणि दुग्धव्यवसाय विभाग",
                "benefits": "शेळीपालन, कुक्कुटपालन आणि वराहपालनासाठी ५०% पर्यंत भांडवली अनुदान",
                "eligibility": "वैयक्तिक शेतकरी, बचत गट (SHGs) आणि पशुपालक",
                "linkText": "पशुसंवर्धन कर्ज अर्ज"
            },
            "gu": {
                "title": "રાષ્ટ્રીય પશુધન મિશન (NLM)",
                "department": "પશુપાલન અને ડેરી વિભાગ",
                "benefits": "બકરા પાલન, મરઘા પાલન અને ઘાસચારો વિકાસ પ્રોજેક્ટ પર ૫૦% સુધી સબસિડી",
                "eligibility": "વ્યક્તિગત ખેડૂતો, સ્વસહાય જૂથો (SHGs) અને પશુપાલકો",
                "linkText": "પશુપાલન લોન ફોર્મ"
            },
            "pa": {
                "title": "ਰਾਸ਼ਟਰੀ ਪਸ਼ੂਧਨ ਮਿਸ਼ਨ (NLM)",
                "department": "ਪਸ਼ੂ ਪਾਲਣ ਅਤੇ ਡੇਅਰੀ ਵਿਭਾਗ",
                "benefits": "ਬੱਕਰੀ ਪਾਲਣ, ਮੁਰਗੀ ਪਾਲਣ ਅਤੇ ਪਸ਼ੂ ਖੁਰਾਕ ਵਿਕਾਸ ਯੋਜਨਾ 'ਤੇ 50% ਤੱਕ ਸਬਸਿਡੀ",
                "eligibility": "ਵਿਅਕਤੀਗਤ ਕਿਸਾਨ, ਸਵੈ-ਸਹਾਇਤਾ ਸਮੂਹ (SHGs) ਅਤੇ ਪਸ਼ੂ ਪਾਲਕ",
                "linkText": "ਪਸ਼ੂ ਪਾਲਣ ਲੋਨ ਫਾਰਮ"
            }
        }
    }
]

def get_schemes_list(lang: str = "hi", category: Optional[str] = None, search: Optional[str] = None, state: Optional[str] = None) -> List[dict]:
    """
    Filters and retrieves government schemes from the local database.
    Translates all records to target language code.
    If 'state' is provided, returns all Central schemes (state='all') plus that state's schemes.
    """
    lang = lang.lower() if lang else "hi"
    if lang not in ["hi", "hl", "en", "mr", "gu", "pa"]:
        lang = "hi"
        
    filtered = []
    for s in SCHEMES_DB:
        # 1. State Filter
        if state:
            # Match Central schemes ("all") or the specified state name
            if s["state"] != "all" and s["state"].lower() != state.lower():
                continue
                
        # 2. Category Filter
        if category and category != "all" and s["category"] != category:
            continue
            
        # Get translation
        trans = s["translations"].get(lang, s["translations"]["hi"])
        
        # 3. Search Filter
        if search:
            q = search.lower()
            if (q not in trans["title"].lower() and 
                q not in trans["benefits"].lower() and 
                q not in trans["eligibility"].lower() and 
                q not in trans["department"].lower()):
                continue
                
        record = {
            "id": s["id"],
            "category": s["category"],
            "state": s["state"],
            "title": trans["title"],
            "department": trans["department"],
            "benefits": trans["benefits"],
            "eligibility": trans["eligibility"],
            "linkText": trans["linkText"]
        }
        filtered.append(record)
        
    return filtered

async def get_schemes_advisory(profile: dict, lang: str = "hi") -> str:
    """
    Uses Gemini 2.5 Flash to evaluate the schemes list against the farmer's profile,
    and returns a short, conversational, customized eligibility advisory in the chosen language.
    """
    farmer_name = profile.get("name", "किसान भाई")
    farmer_state = profile.get("state", "Madhya Pradesh")
    farmer_district = profile.get("district", "Bhopal")
    farmer_land = profile.get("land_area_acres", "2.5")
    farmer_crops = profile.get("crops", ["wheat"])
    
    # Fetch schemes matching this state
    schemes = get_schemes_list(lang=lang, state=farmer_state)
    
    schemes_context = ""
    for idx, s in enumerate(schemes):
        schemes_context += f"{idx+1}. {s['title']} (Category: {s['category']}): Benefits: {s['benefits']}, Eligibility: {s['eligibility']}\n"
        
    prompt = f"""
You are KisanMitra AI, a government scheme eligibility advisor for Indian farmers.
Evaluate the following farmer profile:
- Name: {farmer_name}
- State: {farmer_state}
- District: {farmer_district}
- Land Size: {farmer_land} acres
- Crops: {', '.join(farmer_crops)}
- Language: {lang}

Here are the schemes matching their state or central criteria:
{schemes_context}

Generate a friendly, warm, and highly actionable eligibility advisory in the target language.
Rules:
1. Greet the farmer by name (in the target language).
2. Explicitly reference their land size ({farmer_land} acres) and state ({farmer_state}).
3. Identify 2 specific schemes from the list above that they are highly eligible for based on their profile.
4. Keep the answer brief, warm, conversational and perfect for voice synthesis.
5. Aim for 150-200 words. Be complete and specific — name at least 2 schemes with their key benefit and eligibility detail.
6. Do not use markdown styling (*, #, _, -) or numbers/bullet points. Write in flowing paragraphs.
7. Return ONLY the translation in the requested language: {lang} (if "hl", write in Hinglish - Hindi written in English letters).
"""
    try:
        response_text = await get_gemini_response(prompt, lang=lang)
        # Clean text
        response_text = response_text.replace("*", "").replace("#", "").strip()
        logger.info("Generated scheme advisory successfully.")
        return response_text
    except Exception as e:
        logger.error(f"Error generating schemes advisory: {e}")
        # Return a localized fallback advisory
        fallbacks = {
            "hi": f"किसान भाई {farmer_name}, आपकी प्रोफाइल के अनुसार आपके पास {farmer_land} एकड़ भूमि है और आप {farmer_state} से हैं। आप पीएम किसान सम्मान निधि योजना के तहत प्रतिवर्ष छह हजार रुपये और सूक्ष्म सिंचाई योजना के तहत सरकारी सब्सिडी प्राप्त करने के लिए पूर्ण रूप से पात्र हैं।",
            "hl": f"Kisan bhai {farmer_name}, aapki profile ke anusaar aapke paas {farmer_land} acre zameen hai aur aap {farmer_state} se hain. Aap PM-Kisan ke 6,000 rupaye aur Drip Irrigation micro-irrigation subsidies ke liye eligible hain.",
            "en": f"Dear farmer {farmer_name}, based on your landholding of {farmer_land} acres in {farmer_state}, you are eligible for PM-Kisan income support and micro-irrigation subsidies.",
            "mr": f"शेतकरी बंधू {farmer_name}, तुमच्या प्रोफाइलनुसार तुमच्याकडे {farmer_land} एकर जमीन आहे आणि तुम्ही {farmer_state} मधून आहात. तुम्ही पीएम-किसान आणि ठिबक सिंचन योजनांच्या अनुदानासाठी पात्र आहात.",
            "gu": f"ખેડૂત મિત્ર {farmer_name}, આપની પ્રોફાઇલ મુજબ આપની પાસે {farmer_land} એકર જમીન છે અને આપ {farmer_state} થી છો. આપ પીએમ-કિસાન અને ટપક સિંચાઈ સબસિડી માટે લાયક છો.",
            "pa": f"ਕਿਸਾਨ ਵੀਰ {farmer_name}, ਤੁਹਾਡੀ ਪ੍ਰੋਫਾਈਲ ਦੇ ਅਨੁਸਾਰ ਤੁਹਾਡੇ ਕੋਲ {farmer_land} ਏਕੜ ਜ਼ਮੀਨ ਹੈ ਅਤੇ ਤੁਸੀਂ {farmer_state} ਤੋਂ ਹੋ। ਤੁਸੀਂ ਪੀਐਮ-ਕਿਸਾਨ ਅਤੇ ਤੁਪਕਾ ਸਿੰਚਾਈ ਸਕੀਮਾਂ ਲਈ ਯੋਗ ਹੋ।"
        }
        return fallbacks.get(lang, fallbacks["hi"])
