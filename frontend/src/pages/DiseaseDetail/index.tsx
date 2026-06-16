import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, VolumeX, ShieldCheck, AlertCircle, Sparkles, Thermometer, Droplets, Info } from 'lucide-react';
import { useLanguage } from '../../utils/i18n';
import { getApiBase } from '../../utils/apiBase';

const API_BASE_URL = getApiBase();

interface OrganicRemedy {
  step: number;
  action: string;
  recipe?: string;
  ingredients_local: boolean;
  timing?: string;
  frequency?: string;
}

interface DiseaseData {
  disease_name: string;
  disease_name_hindi: string;
  scientific_name: string;
  confidence: number;
  image_url: string;
  severity: Record<string, string>;
  crops: Record<string, string>;
  climate: Record<string, string>;
  symptoms: Record<string, string[]>;
  cause: Record<string, string>;
  temp_range: string;
  humidity_range: string;
  organic_remedies: Record<string, OrganicRemedy[]>;
  prevention: Record<string, string>;
  related_diseases: { id: string; name: string; name_local: string; img: string }[];
  sources: string[];
}

// Full localized static database for common tomato diseases
const STATIC_DISEASES: Record<string, DiseaseData> = {
  'early-blight': {
    disease_name: 'Early Blight',
    disease_name_hindi: 'अगेती झुलसा (Early Blight)',
    scientific_name: 'Alternaria Solani',
    confidence: 95,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDtVrfRjY46wsBoonXlQlpXTuoSWaCbY__peJjWJDPbJGsb9rsm_csRwzUcYRwOk0rP7HsQ3tfzHocGtmwYbdF7EUdunL3ngUEqGGCC3kAKKALzKPBaO8ZgptTgG580WKHC-U3BH2J_6ZDOJTuFi8Uuu71VMQHhg_suCJHhwcgMRqWI79Ljv-P30sMPhSMDWEE5GMojj_G127Qv5OnJS-y_RGsR_gM3f6W7FQ6pfSfpghT-X3UsKJgGmYyPQO4IrigfrFGgHpAd9FQ',
    temp_range: '25-30°C',
    humidity_range: '> 70%',
    severity: {
      hi: 'मध्यम', hl: 'Madhyam', en: 'Medium', mr: 'मध्यम', gu: 'મધ્યમ', pa: 'ਦਰਮਿਆਨਾ'
    },
    crops: {
      hi: 'टमाटर, आलू, बैंगन', hl: 'Tamatar, Aalu, Baingan', en: 'Tomato, Potato, Eggplant', mr: 'टोमॅटो, बटाटा, वांगी', gu: 'ટમેટા, બટાકા, રીંગણ', pa: 'ਟਮਾਟਰ, ਆਲੂ, ਬੈਂਗਣ'
    },
    climate: {
      hi: 'खरीफ में ज्यादा', hl: 'Kharif mein zyada', en: 'High in Kharif', mr: 'खरीप हंगामात जास्त', gu: 'ચોમાસામાં વધુ', pa: 'ਖਰੀਫ ਵਿੱਚ ਜ਼ਿਆਦਾ'
    },
    symptoms: {
      hi: [
        'पत्तियों पर गहरे भूरे-काले संकेंद्रित छल्ले (bullseye) बनना।',
        'धब्बों के चारों ओर स्पष्ट पीला घेरा (halo ring) दिखाई देना।',
        'सबसे पहले नीचे की पुरानी पत्तियों का प्रभावित होना और सूखकर गिरना।',
        'गंभीर स्थिति में तनों और फलों पर काले धब्बे बनना।'
      ],
      hl: [
        'Pattiyon par bhoore-kale gol challe (concentric rings) banna.',
        'Dhabbon ke chaaron taraf peela ring (halo) dikhna.',
        'Sabse pehle neeche ki purani pattiyon ka sukh kar girna.',
        'Jyaada failne par stem aur fruit par bhi dhabbe banna.'
      ],
      en: [
        'Dark brown to black circular spots with concentric rings forming a "target board" pattern.',
        'Yellow chlorotic halos surrounding the leaf lesions.',
        'Defoliation starting from lower older leaves and progressing upwards.',
        'Leathery black spots developing on stems and tomato fruit ends.'
      ],
      mr: [
        'पानांवर गडद तपकिरी-काळे वर्तुळाकार ठिपके तयार होणे.',
        'ठिपक्यांभोवती पिवळसर वलय स्पष्ट दिसणे.',
        'सुरुवातीला खालची जुनी पाने सुकणे व गळणे.',
        'तीव्र प्रादुर्भावात खोडावर आणि फळांवर काळे डाग पडणे.'
      ],
      gu: [
        'પાંદડા પર ઘેરા કથ્થઈ-કાળા ગોળાકાર ડાઘ (ચક્રાકાર રીંગ) બનવા.',
        'ડાઘાની આસપાસ પીળો ભાગ (halo ring) દેખાવો.',
        'સૌપ્રથમ નીચેના જૂના પાંદડા સુકાઈને ખરી પડવા.',
        'વધુ નુકસાન થવા પર થડ અને ફળો પર કાળા ડાઘા પડવા.'
      ],
      pa: [
        'ਪੱਤਿਆਂ \'ਤੇ ਗੂੜ੍ਹੇ ਭੂਰੇ-ਕਾਲੇ ਗੋਲ ਛੱਲੇ (bullseye) ਬਣਨਾ।',
        'ਧੱਬਿਆਂ ਦੇ ਚਾਰੇ ਪਾਸੇ ਪੀਲਾ ਘੇਰਾ ਦਿਖਾਈ ਦੇਣਾ।',
        'ਸਭ ਤੋਂ ਪਹਿਲਾਂ ਹੇਠਲੇ ਪੁਰਾਣੇ ਪੱਤਿਆਂ ਦਾ ਪ੍ਰਭਾਵਿਤ ਹੋ ਕੇ ਝੜਨਾ।',
        'ਜ਼ਿਆਦਾ ਫੈਲਣ \'ਤੇ ਟਾਹਣੀਆਂ ਅਤੇ ਫਲਾਂ \'ਤੇ ਕਾਲੇ ਧੱਬੇ ਬਣਨਾ।'
      ]
    },
    cause: {
      hi: 'अल्टरनेरिया सोलानी (Alternaria Solani) नाम के फंगस (फफूंद) के कारण होता है। यह हवा और पानी की बौछार से फैलता है।',
      hl: 'Alternaria Solani naam ke fungus (faphund) ke karan hota hai. Yeh hawa aur pani ki boochhar se phailta hai.',
      en: 'Caused by the fungal pathogen Alternaria solani. The spores persist in soil debris and spread via wind and rain splashes.',
      mr: 'अल्टरनेरिया सोलानी (Alternaria Solani) नावाच्या बुरशीमुळे होतो. हा हवा आणि पाण्याच्या थेंबांद्वारे पसरतो.',
      gu: 'અલ્ટરનેરિયા સોલાની (Alternaria Solani) નામની ફૂગને લીધે થાય છે. તે હવા અને પાણી દ્વારા ફેલાય છે.',
      pa: 'ਅਲਟਰਨੇਰੀਆ ਸੋਲਾਨੀ (Alternaria Solani) ਨਾਮਕ ਉੱਲੀ ਦੇ ਕਾਰਨ ਹੁੰਦਾ ਹੈ। ਇਹ ਹਵਾ ਅਤੇ ਪਾਣੀ ਰਾਹੀਂ ਫੈਲਦਾ ਹੈ।'
    },
    organic_remedies: {
      hi: [
        { step: 1, action: 'नीम के तेल का छिड़काव', recipe: '5 मिली नीम तेल प्रति लीटर पानी में मिलाकर 2-3 बूंदें लिक्विड सोप के साथ अच्छी तरह घोलें और स्प्रे करें।', ingredients_local: true, timing: 'सुबह या देर शाम', frequency: 'सप्ताह में एक बार' },
        { step: 2, action: 'खट्टी छाछ का छिड़काव', recipe: '4-5 दिन पुरानी खट्टी छाछ को 1:10 के अनुपात में पानी के साथ मिलाकर पत्तियों पर छिड़कें। यह एक प्राकृतिक कवकनाशी है।', ingredients_local: true, timing: 'धूप निकलने से पहले', frequency: '10 दिन में एक बार' }
      ],
      hl: [
        { step: 1, action: 'Neem oil ka spray karein', recipe: '5ml neem oil + 1L pani + 2-3 drops liquid soap ka ghol banakar pattiyon par achhe se spray karein.', ingredients_local: true, timing: 'Subah ya shaam ko', frequency: 'Hafte mein ek baar' },
        { step: 2, action: 'Khatti chhaachh ka spray', recipe: '4-5 din purani khatti chhaachh ko 1:10 pani ke sath milakar chhidkaav karein. Yeh fungus ko rokta hai.', ingredients_local: true, timing: 'Subah ke samay', frequency: '10 din mein ek baar' }
      ],
      en: [
        { step: 1, action: 'Spray Neem Oil Solution', recipe: 'Mix 5ml pure Neem Oil per liter of lukewarm water along with 2-3 drops of mild liquid soap as an emulsifier.', ingredients_local: true, timing: 'Early morning or late evening', frequency: 'Once every 7 days' },
        { step: 2, action: 'Sour Buttermilk Spray', recipe: 'Mix 1 liter of 5-day old fermented sour buttermilk with 10 liters of water. Spray thoroughly on the leaves.', ingredients_local: true, timing: 'Under mild sunlight', frequency: 'Every 10 days' }
      ],
      mr: [
        { step: 1, action: 'कडुनिंब तेलाची फवारणी', recipe: '५ मिली कडुनिंब तेल प्रति लीटर पाण्यात २-३ थेंब लिक्विड सोप मिसळून पानांवर फवारणी करावी.', ingredients_local: true, timing: 'सकाळी किंवा संध्याकाळी', frequency: 'आठवड्यातून एकदा' },
        { step: 2, action: 'आंबट ताकाची फवारणी', recipe: '४-५ दिवस जुने आंबट ताक १:१० प्रमाणात पाण्यात मिसळून फवारावे. हे बुरशी रोखण्यास मदत करते.', ingredients_local: true, timing: 'सकाळच्या वेळी', frequency: '१० दिवसांतून एकदा' }
      ],
      gu: [
        { step: 1, action: 'લીમડાના તેલનો છંટકાવ', recipe: '૫ મિલી લીમડાનું તેલ પ્રતિ લીટર પાણીમાં મેળવી ૨-૩ ટીપાં પ્રવાહી સાબુ સાથે મિશ્ર કરીને પાંદડા પર છાંટો.', ingredients_local: true, timing: 'સવારે અથવા મોડી સાંજે', frequency: 'અઠવાડિયામાં એક વાર' },
        { step: 2, action: 'ખાટી છાશનો છંટકાવ', recipe: '૪-૫ દિવસ જૂની ખાટી છાશને ૧:૧૦ ના પ્રમાણમાં પાણી સાથે ભેળવી છંટકાવ કરો.', ingredients_local: true, timing: 'સવારના સમયે', frequency: '૧૦ દિવસે એક વાર' }
      ],
      pa: [
        { step: 1, action: 'ਨਿੰਮ ਦੇ ਤੇਲ ਦਾ ਛਿੜਕਾਅ', recipe: '੫ ਮਿਲੀ ਨਿੰਮ ਦਾ ਤੇਲ ਪ੍ਰਤੀ ਲੀਟਰ ਪਾਣੀ ਵਿੱਚ ਮਿਲਾ ਕੇ ੨-੩ ਬੂੰਦਾਂ ਤਰਲ ਸਾਬਣ ਨਾਲ ਘੋਲ ਕੇ ਸਪ੍ਰੇਅ ਕਰੋ।', ingredients_local: true, timing: 'ਸਵੇਰੇ ਜਾਂ ਦੇਰ ਸ਼ਾਮ', frequency: 'ਹਫ਼ਤੇ ਵਿੱਚ ਇੱਕ ਵਾਰ' },
        { step: 2, action: 'ਖੱਟੀ ਲੱਸੀ ਦਾ ਛਿੜਕਾਅ', recipe: '੪-੫ ਦਿਨ ਪੁਰਾਣੀ ਖੱਟੀ ਲੱਸੀ ਨੂੰ ੧:੧੦ ਦੇ ਅਨੁਪਾਤ ਵਿੱਚ ਪਾਣੀ ਨਾਲ ਮਿਲਾ ਕੇ ਪੱਤਿਆਂ \'ਤੇ ਛਿੜਕੋ।', ingredients_local: true, timing: 'ਧੁੱਪ ਨਿਕਲਣ ਤੋਂ ਪਹਿਲਾਂ', frequency: '੧੦ ਦਿਨਾਂ ਵਿੱਚ ਇੱਕ ਵਾਰ' }
      ]
    },
    prevention: {
      hi: 'फसल चक्र अपनाएं (टमाटर के बाद आलू या बैंगन न बोएं)। खेत की जल निकासी दुरुस्त रखें और नीचे की खराब पत्तियों को समय-समय पर तोड़कर नष्ट कर दें।',
      hl: 'Crop rotation karein (tomato ke baad aalu ya baingan na boyein). Khet ki jal nikaasi sahi rakhein aur kharab pattiyon ko nikaal dein.',
      en: 'Practice crop rotation (avoid planting Solanaceae crop families back-to-back). Ensure wide plant spacing for aeration and prune the lower leaves to avoid soil contact.',
      mr: 'पीक फेरपालट करा (टोमॅट नंतर बटाटा किंवा वांगी लावू नका). शेतातील पाण्याचा निचरा चांगला ठेवा आणि खालची खराब पाने कापून नष्ट करा.',
      gu: 'પાક ચક્ર અપનાવો (ટમેટા પછી બટાકા કે રીંગણ ન વાવો). ખેતરમાં પાણી ભરાવા ન દો અને નીચેના નકામા પાંદડા તોડીને નષ્ટ કરો.',
      pa: 'ਫਸਲੀ ਚੱਕਰ ਅਪਣਾਓ (ਟਮਾਟਰ ਤੋਂ ਬਾਅਦ ਆਲੂ ਜਾਂ ਬੈਂਗਣ ਨਾ ਬੀਜੋ)। ਖੇਤ ਵਿੱਚੋਂ ਪਾਣੀ ਦੇ ਨਿਕਾਸ ਦਾ ਪ੍ਰਬੰਧ ਠੀਕ ਰੱਖੋ।'
    },
    related_diseases: [
      { id: 'late-blight', name: 'Late Blight', name_local: 'Pachheti Jhulsa', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDfM-M-ReTETYsXh6U3mrP9EC_4lNPs1UjQyeyINQJXZehSb0_5cQM4B3PROHKFcE4R9Bvo1jXY2Q_iEqTnNb5IB-cRDlo9aSMk7JY-ZKq_pXWU-RHSgG2UlYK5BaOg_FtFS3o0UNx3pR2-s5TuI2XHZo9kFeBfR3kI_Lh0lVyE-4Pl0cFlM2keGFJWdkIgIjEVejiBS3ex0YijfGIt84YKNmW7eKwXkH72PwV_6JhPure93b_rg6OWvw-k9LIdSCRQh5M8jnIk_5o' },
      { id: 'septoria-leaf-spot', name: 'Septoria Leaf Spot', name_local: 'Septoria Dhabba', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCkCfOVDF8A1DuTKqim_Wzw1PjA-a536qDNF47UbPzQVjaoNs8HjNIIhdUybkftX3-QI5BD2YPzcWMK2C5CqwBT4aTqYOIuUFo1YwbSa9KZrEOUR9pYcn1yw7TpM7EArOJxcaQeJF0-ePHWSE9PTAhzb--_oI-8QOxwF6RUkuNPLBnjfKE-5MGSSyPe7mm8hcwMEVTC2U64_GVD7kpG2_QVlYO9PukJgB-lU0ThK8MQstOdzLqhxm1gVif4V43dfFw8xggxxR9RZxs' }
    ],
    sources: ['ICAR Disease Management Guide, 2023', 'TNAU Organic Farming Extension Materials']
  },
  'late-blight': {
    disease_name: 'Late Blight',
    disease_name_hindi: 'पछेती झुलसा (Late Blight)',
    scientific_name: 'Phytophthora Infestans',
    confidence: 93,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDfM-M-ReTETYsXh6U3mrP9EC_4lNPs1UjQyeyINQJXZehSb0_5cQM4B3PROHKFcE4R9Bvo1jXY2Q_iEqTnNb5IB-cRDlo9aSMk7JY-ZKq_pXWU-RHSgG2UlYK5BaOg_FtFS3o0UNx3pR2-s5TuI2XHZo9kFeBfR3kI_Lh0lVyE-4Pl0cFlM2keGFJWdkIgIjEVejiBS3ex0YijfGIt84YKNmW7eKwXkH72PwV_6JhPure93b_rg6OWvw-k9LIdSCRQh5M8jnIk_5o',
    temp_range: '15-22°C',
    humidity_range: '> 85%',
    severity: {
      hi: 'उच्च', hl: 'Uchha', en: 'High', mr: 'उच्च', gu: 'તીવ્ર', pa: 'ਬਹੁਤ ਗੰਭੀਰ'
    },
    crops: {
      hi: 'टमाटर, आलू', hl: 'Tamatar, Aalu', en: 'Tomato, Potato', mr: 'टोमॅटो, बटाटा', gu: 'ટમેટા, બટાકા', pa: 'ਟਮਾਟਰ, ਆਲੂ'
    },
    climate: {
      hi: 'सर्दियों और कोहरे में ज्यादा', hl: 'Sardiyo aur kohre mein zyada', en: 'Cold & Foggy conditions', mr: 'थंडी आणि धुक्यात जास्त', gu: 'શિયાળા અને ધુમ્મસમાં વધુ', pa: 'ਸਰਦੀਆਂ ਅਤੇ ਕੋਹਰੇ ਵਿੱਚ ਜ਼ਿਆਦਾ'
    },
    symptoms: {
      hi: [
        'पत्तियों पर पानी से भीगे हुए बड़े-बड़े गहरे अनियमित धब्बे बनना।',
        'ठंडी और ओस वाली रातों में पत्तों के नीचे सफेद रोयेंदार फफूंद दिखना।',
        'यह बीमारी बहुत तेजी से फैलती है और पूरे खेत को 2-3 दिन में नष्ट कर सकती है।',
        'फलों पर भूरे रंग के कड़े धब्बे बनना।'
      ],
      hl: [
        'Pattiyon par pani se bheege baday dhabbe banna.',
        'Thandi aur os ke samay patti ke neeche safed ruyi jaisa fungus dikhna.',
        'Yeh bimari tezi se phailti hai aur 2-3 din mein fasal kharab karti hai.',
        'Tamatar par bhoore aur sakht dhabbe padna.'
      ],
      en: [
        'Large, irregular water-soaked lesions appearing rapidly on leaves.',
        'White fuzzy growth of spores appearing on the undersides of leaves during damp nights.',
        'Rapid collapse of the foliage within days, looking like frost damage.',
        'Large, firm, dark brown patches on developing green or red tomatoes.'
      ],
      mr: [
        'पानांवर पाण्याचे ओले डाग पडल्यासारखे मोठे आणि अनियमित ठिपके तयार होणे.',
        'थंड आणि दवाच्या हवामानात पानाच्या खालच्या बाजूला पांढरी बुरशी दिसणे.',
        'हा रोग अतिशय वेगाने पसरतो आणि २-३ दिवसांत संपूर्ण पीक नष्ट करू शकतो.',
        'फळांवर तपकिरी रंगाचे कडक चट्टे पडणे.'
      ],
      gu: [
        'પાંદડા પર પાણીથી ભીંજાયેલા હોય તેવા મોટા અને અસમપ્રમાણ ડાઘ બનવા.',
        'ઠંડી અને ઝાકળવાળી રાત્રિઓમાં પાંદડાની નીચેના ભાગે સફેદ ફૂગ દેખાવી.',
        'આ રોગ ખૂબ જ ઝડપથી ફેલાય છે અને આખા ખેતરને ૨-૩ દિવસમાં નષ્ટ કરી શકે છે.',
        'ફળો પર કથ્થઈ રંગના કઠણ ડાઘા પડવા.'
      ],
      pa: [
        'ਪੱਤਿਆਂ \'ਤੇ ਪਾਣੀ ਨਾਲ ਭਿੱਜੇ ਹੋਏ ਵੱਡੇ-ਵੱਡੇ ਗੂੜ੍ਹੇ ਧੱਬੇ ਬਣਨਾ।',
        'ਠੰਡੀਆਂ ਅਤੇ ਤ੍ਰੇਲ ਵਾਲੀਆਂ ਰਾਤਾਂ ਵਿੱਚ ਪੱਤਿਆਂ ਦੇ ਹੇਠਾਂ ਚਿੱਟੀ ਉੱਲੀ ਦਿਖਣਾ।',
        'ਇਹ ਬਿਮਾਰੀ ਬਹੁਤ ਤੇਜ਼ੀ ਨਾਲ ਫੈਲਦੀ ਹੈ ਅਤੇ ਫਸਲ ਨੂੰ ੨-੩ ਦਿਨਾਂ ਵਿੱਚ ਨਸ਼ਟ ਕਰ ਸਕਦੀ ਹੈ।',
        'ਫਲਾਂ \'ਤੇ ਭੂਰੇ ਰੰਗ ਦੇ ਸਖ਼ਤ ਧੱਬੇ ਬਣਨਾ।'
      ]
    },
    cause: {
      hi: 'फाइटोफ्थोरा इन्फेस्टैन्स (Phytophthora Infestans) नामक ओमीसीट (water mold) के कारण होता है। यह नमी में अत्यधिक संक्रामक है।',
      hl: 'Phytophthora Infestans naam ke water mold ke karan hota hai. Yeh nami mein bohot tezi se phailta hai.',
      en: 'Caused by the oomycete pathogen Phytophthora infestans. It is highly aggressive and spread by wind-blown sporangia in high humidity.',
      mr: 'फायटोफ्थोरा इन्फेस्टॅन्स (Phytophthora Infestans) नावाच्या बुरशीमुळे होतो. दमट हवामानात हा अत्यंत संसर्गजन्य आहे.',
      gu: 'ફાયટોપ્થોરા ઈન્ફેસ્ટાન્સ (Phytophthora Infestans) નામની વોટર મોલ્ડને કારણે થાય છે. તે ભેજવાળા વાતાવરણમાં વધુ ફેલાય છે.',
      pa: 'ਫਾਈਟੋਫਥੋਰਾ ਇਨਫੈਸਟੈਨਸ (Phytophthora Infestans) ਨਾਮਕ ਉੱਲੀ ਦੇ ਕਾਰਨ ਹੁੰਦਾ ਹੈ।'
    },
    organic_remedies: {
      hi: [
        { step: 1, action: 'तांबे का सिक्का और छाछ घोल', recipe: 'तांबे के बर्तन या तांबे के तार को छाछ में 1 सप्ताह रखकर उसका 1:10 भाग पानी में मिलाकर छिड़काव करें। कॉपर प्राकृतिक रूप से लेट ब्लाइट को रोकता है।', ingredients_local: true, timing: 'दुकान बंद होने के समय (देर शाम)', frequency: '5 दिन में एक बार' },
        { step: 2, action: 'अग्निअस्त्र या काढ़ा छिड़काव', recipe: 'नीम के पत्ते, तंबाकू, तीखी मिर्च और लहसुन को गोमूत्र में उबालकर बनाया गया जैविक घोल (अग्निअस्त्र) 2% सांद्रता पर स्प्रे करें।', ingredients_local: true, timing: 'सुबह या शाम', frequency: 'सप्ताह में एक बार' }
      ],
      hl: [
        { step: 1, action: 'Tambe aur khatti chhaachh ka ghol', recipe: 'Copper wire ya coin ko 7 din chhaachh mein rakhein. Phir use 1:10 pani ke sath milakar spray karein.', ingredients_local: true, timing: 'Deer shaam ko', frequency: '5 din mein ek baar' },
        { step: 2, action: 'Agniastra ka chhidkaav', recipe: 'Neem, mirch, lahsun aur gomutra se bana Agniastra 20ml per liter pani mein gholkar spray karein.', ingredients_local: true, timing: 'Subah ke samay', frequency: 'Hafte mein ek baar' }
      ],
      en: [
        { step: 1, action: 'Copper-Infused Fermented Whey', recipe: 'Keep a copper sheet or wire inside fermented sour buttermilk for 7 days. Dilute with water (1:10) and spray. Copper ions act as a powerful natural fungicide.', ingredients_local: true, timing: 'Late afternoon', frequency: 'Once every 5 days' },
        { step: 2, action: 'Apply Agniastra Brew', recipe: 'Dilute 20ml of Agniastra organic decoction (neem, chili, garlic, cow urine) per liter of water. Spray thoroughly.', ingredients_local: true, timing: 'Early morning', frequency: 'Once a week' }
      ],
      mr: [
        { step: 1, action: 'तांबे आणि ताकाचे द्रावण', recipe: 'तांब्याचा तुकडा किंवा तार ताकात ७ दिवस भिजत ठेवावा. त्यानंतर १:१० प्रमाणात पाण्यात मिसळून फवारावा.', ingredients_local: true, timing: 'संध्याकाळी', frequency: '५ दिवसांतून एकदा' },
        { step: 2, action: 'अग्निअस्त्राची फवारणी', recipe: 'कडुनिंब, तंबाखू, मिरची, लसूण आणि गोमूत्रापासून बनवलेले अग्नीअस्त्र २० मिली प्रति लीटर पाण्यात मिसळून फवारावे.', ingredients_local: true, timing: 'सकाळी किंवा संध्याकाळी', frequency: 'आठवड्यातून एकदा' }
      ],
      gu: [
        { step: 1, action: 'તાંબા અને ખાટી છાશનું દ્રાવણ', recipe: 'તાંબાનો તાર અથવા સિક્કો છાશમાં ૭ દિવસ રાખી મૂકો. ત્યારબાદ ૧:૧૦ ના પ્રમાણમાં પાણી સાથે ભેળવી છંટકાવ કરો.', ingredients_local: true, timing: 'મોડી સાંજે', frequency: '૫ દિવસે એક વાર' },
        { step: 2, action: 'અગ્નિઅસ્ત્રનો છંટકાવ', recipe: 'લીમડો, મરચાં, લસણ અને ગૌમૂત્રમાંથી બનાવેલ અગ્નિઅસ્ત્ર ૨૦ મિલી પ્રતિ લીટર પાણીમાં મેળવી છાંટો.', ingredients_local: true, timing: 'સવારે', frequency: 'અઠવાડિયામાં એક વાર' }
      ],
      pa: [
        { step: 1, action: 'તાંਬੇ ਅਤੇ ਖੱਟੀ ਲੱਸੀ ਦਾ ਘੋਲ', recipe: 'ਤਾਂਬੇ ਦੀ ਤਾਰ ਜਾਂ ਸਿੱਕੇ ਨੂੰ ੭ ਦਿਨ ਲੱਸੀ ਵਿੱਚ ਰੱਖੋ। ਫਿਰ ੧:੧੦ ਦੇ ਅਨੁਪਾਤ ਵਿੱਚ ਪਾਣੀ ਨਾਲ ਮਿਲਾ ਕੇ ਛਿੜਕੋ।', ingredients_local: true, timing: 'ਦੇਰ ਸ਼ਾਮ', frequency: '੫ ਦਿਨਾਂ ਵਿੱਚ ਇੱਕ ਵਾਰ' },
        { step: 2, action: 'ਅਗਨੀਅਸਤਰ ਦਾ ਛਿੜਕਾਅ', recipe: 'ਨਿੰਮ, ਮਿਰਚ, ਲਸਣ ਅਤੇ ਗਊ-ਮੂਤਰ ਤੋਂ ਤਿਆਰ ਅਗਨੀਅਸਤਰ ੨੦ ਮਿਲੀ ਪ੍ਰਤੀ ਲੀਟਰ ਪਾਣੀ ਵਿੱਚ ਮਿਲਾ ਕੇ ਸਪ੍ਰੇਅ ਕਰੋ।', ingredients_local: true, timing: 'ਸਵੇਰੇ', frequency: 'ਹਫ਼ਤੇ ਵਿੱਚ ਇੱਕ ਵਾਰ' }
      ]
    },
    prevention: {
      hi: 'प्रमाणित रोग-मुक्त बीजों का प्रयोग करें। मौसम विभाग की चेतावनी पर नजर रखें; कोहरे और ठंडी बारिश के समय सिंचाई रोक दें। संक्रमित पौधों को तुरंत उखाड़कर जला दें।',
      hl: 'Disease-free seed use karein. Kohra aur thandi barish ke samay sinchai rokein. Infected plants ko ukhaad kar jala dein.',
      en: 'Use certified disease-resistant seed varieties. Avoid overhead irrigation during cool, humid forecasts. Immediately uproot and burn infected crops.',
      mr: 'रोगमुक्त बियाण्यांचा वापर करा. धुके आणि थंड पावसाच्या काळात पाणी देणे टाळा. बाधित झाडे मुळासकट उपटून नष्ट करा.',
      gu: 'રોગ-મુક્ત બિયારણનો ઉપયોગ કરો. ઝાકળ અને ઠંડીમાં પિયત આપવાનું ટાળો. સંક્રમિત છોડને ખેતરમાંથી ઉપાડીને બાળી નાખો.',
      pa: 'ਨਿਰੋਗ ਬੀਜਾਂ ਦੀ ਵਰਤੋਂ ਕਰੋ। ਕੋਹਰੇ ਅਤੇ ਠੰਢੀ ਬਾਰਸ਼ ਸਮੇਂ ਸਿੰਚਾਈ ਰੋਕ ਦਿਓ। ਸੰਕਰਮਿਤ ਪੌਦਿਆਂ ਨੂੰ ਪੁੱਟ ਕੇ ਸਾੜ ਦਿਓ।'
    },
    related_diseases: [
      { id: 'early-blight', name: 'Early Blight', name_local: 'Ageti Jhulsa', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDtVrfRjY46wsBoonXlQlpXTuoSWaCbY__peJjWJDPbJGsb9rsm_csRwzUcYRwOk0rP7HsQ3tfzHocGtmwYbdF7EUdunL3ngUEqGGCC3kAKKALzKPBaO8ZgptTgG580WKHC-U3BH2J_6ZDOJTuFi8Uuu71VMQHhg_suCJHhwcgMRqWI79Ljv-P30sMPhSMDWEE5GMojj_G127Qv5OnJS-y_RGsR_gM3f6W7FQ6pfSfpghT-X3UsKJgGmYyPQO4IrigfrFGgHpAd9FQ' },
      { id: 'tomato-leaf-curl', name: 'Tomato Leaf Curl', name_local: 'Patta Marod', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCkCfOVDF8A1DuTKqim_Wzw1PjA-a536qDNF47UbPzQVjaoNs8HjNIIhdUybkftX3-QI5BD2YPzcWMK2C5CqwBT4aTqYOIuUFo1YwbSa9KZrEOUR9pYcn1yw7TpM7EArOJxcaQeJF0-ePHWSE9PTAhzb--_oI-8QOxwF6RUkuNPLBnjfKE-5MGSSyPe7mm8hcwMEVTC2U64_GVD7kpG2_QVlYO9PukJgB-lU0ThK8MQstOdzLqhxm1gVif4V43dfFw8xggxxR9RZxs' }
    ],
    sources: ['ICAR Late Blight Warning System, 2024', 'TNAU Vegetable Pathology Manual']
  },
  'septoria-leaf-spot': {
    disease_name: 'Septoria Leaf Spot',
    disease_name_hindi: 'सेप्टोरिया पत्ता धब्बा (Septoria Leaf Spot)',
    scientific_name: 'Septoria Lycopersici',
    confidence: 90,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCkCfOVDF8A1DuTKqim_Wzw1PjA-a536qDNF47UbPzQVjaoNs8HjNIIhdUybkftX3-QI5BD2YPzcWMK2C5CqwBT4aTqYOIuUFo1YwbSa9KZrEOUR9pYcn1yw7TpM7EArOJxcaQeJF0-ePHWSE9PTAhzb--_oI-8QOxwF6RUkuNPLBnjfKE-5MGSSyPe7mm8hcwMEVTC2U64_GVD7kpG2_QVlYO9PukJgB-lU0ThK8MQstOdzLqhxm1gVif4V43dfFw8xggxxR9RZxs',
    temp_range: '20-25°C',
    humidity_range: '> 75%',
    severity: {
      hi: 'मध्यम', hl: 'Madhyam', en: 'Medium', mr: 'मध्यम', gu: 'મધ્યમ', pa: 'ਦਰਮਿਆਨਾ'
    },
    crops: {
      hi: 'टमाटर', hl: 'Tamatar', en: 'Tomato', mr: 'टोमॅटो', gu: 'ટમેટા', pa: 'ਟਮਾਟਰ'
    },
    climate: {
      hi: 'लगातार बारिश और नमी में ज्यादा', hl: 'Lagatar barish aur nami mein zyada', en: 'Persistent rain and high moisture', mr: 'सतत पाऊस आणि ओलसरीत जास्त', gu: 'વરસાદી અને ભેજવાળા વાતાવરણમાં વધુ', pa: 'ਲਗਾਤਾਰ ਬਾਰਸ਼ ਅਤੇ ਨਮੀ ਵਿੱਚ ਜ਼ਿਆਦਾ'
    },
    symptoms: {
      hi: [
        'पत्तियों पर छोटे, गोल, भूरे रंग के धब्बे बनना जिनका केंद्र सफेद-धूसर होता है।',
        'धब्बों के किनारों पर गहरा भूरा बॉर्डर होता है।',
        'बीमारी पुरानी निचली पत्तियों से ऊपर की नई पत्तियों की ओर फैलती है।',
        'यह फल को सीधे प्रभावित नहीं करता पर पत्तियां गिरने से फल धूप में झुलस जाते हैं।'
      ],
      hl: [
        'Pattiyon par chote, gol, bhoore dhabbe banna jiska center white-gray ho.',
        'Dhabbon ke border dark brown rang ke hote hain.',
        'Purani neeche ki patti se upar ki nayi pattiyon tak phailta hai.',
        'Fruits ko nuksan nahi karta par pattiyan girne se sun-scald ho jata hai.'
      ],
      en: [
        'Numerous small, circular spots with dark brown margins and greyish-white centers.',
        'Tiny black specks (pycnidia) visible inside the center of mature spots.',
        'Spreads upwards from the base of the plant, causing foliage drop.',
        'Does not infect fruit directly, but defoliation leads to sunscald on tomatoes.'
      ],
      mr: [
        'पानांवर लहान, गोल, तपकिरी रंगाचे ठिपके पडणे ज्यांचा मध्यभाग पांढरा-राखाडी असतो.',
        'ठिपक्यांच्या कडा गडद तपकिरी रंगाच्या असतात.',
        'हा रोग खालच्या पानांपासून वरच्या पानांपर्यंत पसरतो.',
        'फळांना थेट इजा होत नाही, पण पाने गळल्यामुळे फळांवर उन्हाचा फटका बसतो.'
      ],
      gu: [
        'પાંદડા પર નાના, ગોળાકાર, કથ્થઈ રંગના ડાઘા પડવા જેનો મધ્યભાગ સફેદ-રાખડી હોય.',
        'ડાઘાની કિનારીઓ ઘેરા કથ્थઈ રંગની હોય છે.',
        'રોગ જૂના પાંદડાથી શરૂ થઈ ઉપરના નવા પાંદડા તરફ ફેલાય છે.',
        'ફળોને સીધું નુકસાન થતું નથી પરંતુ પાંદડા ખરી જતાં ફળો સૂર્યતાપથી બળી જાય છે.'
      ],
      pa: [
        'ਪੱਤਿਆਂ \'ਤੇ ਛੋਟੇ, ਗੋਲ, ਭੂਰੇ ਰੰग ਦੇ ਧੱਬੇ ਬਣਨਾ ਜਿਨ੍ਹਾਂ ਦਾ ਕੇਂਦਰ ਚਿੱਟਾ-ਸਲੇਟੀ ਹੁੰਦਾ ਹੈ।',
        'ਧੱਬਿਆਂ ਦੇ ਕਿਨਾਰਿਆਂ \'ਤੇ ਗੂੜ੍ਹਾ ਭੂਰਾ ਬਾਰਡਰ ਹੁੰਦਾ ਹੈ।',
        'ਬਿਮਾਰੀ ਹੇਠਲੇ ਪੱਤਿਆਂ ਤੋਂ ਉੱਪਰਲੇ ਨਵੇਂ ਪੱਤਿਆਂ ਵੱਲ ਫੈਲਦੀ ਹੈ।'
      ]
    },
    cause: {
      hi: 'सेप्टोरिया लाइकोपर्सिकी (Septoria Lycopersici) नामक कवक (फंगस) के कारण होता है। इसके बीजाणु बारिश की बूंदों से फैलते हैं।',
      hl: 'Septoria Lycopersici naam ke fungus ke karan hota hai. Iske spores barish ki boondo se phailte hain.',
      en: 'Caused by the fungus Septoria lycopersici. Spores germinate in wet conditions and spread through splashing rain, wind, or overhead watering.',
      mr: 'सेप्टोरिया लायकोपर्सिकी (Septoria Lycopersici) नावाच्या बुरशीमुळे होतो. याचे बीजाणू पावसाच्या थेंबांद्वारे पसरतात.',
      gu: 'સેપ્ટોરિયા લાયકોપર્સિસી (Septoria Lycopersici) નામની ફૂગથી થાય છે. તેના બીજાણુઓ વરસાદના ટીપાંથી ફેલાય છે.',
      pa: 'ਸੈਪਟੋਰੀਆ ਲਾਈਕੋਪਰਸਿਕੀ (Septoria Lycopersici) ਨਾਮਕ ਉੱਲੀ ਦੇ ਕਾਰਨ ਹੁੰਦਾ ਹੈ।'
    },
    organic_remedies: {
      hi: [
        { step: 1, action: 'बेकिंग सोडा घोल', recipe: '1 लीटर पानी में 5 ग्राम बेकिंग सोडा (मीठा सोडा) और 2-3 बूंदें लिक्विड सोप मिलाकर छिड़कें। यह पत्तों की अम्लता को बदलता है और कवक को मारता है।', ingredients_local: true, timing: 'देर शाम', frequency: '8-10 दिन में एक बार' },
        { step: 2, action: 'दशपर्णी अर्क या नीम तेल', recipe: 'नीम तेल 5 मिली प्रति लीटर का छिड़काव करें या 10 पत्तों के काढ़े (दशपर्णी) का छिड़काव करें।', ingredients_local: true, timing: 'सुबह या शाम', frequency: 'सप्ताह में एक बार' }
      ],
      hl: [
        { step: 1, action: 'Baking soda ghol', recipe: '1L pani mein 5g baking soda aur 2-3 drops liquid soap milakar spray karein. Yeh fungus ko badhne se rokta hai.', ingredients_local: true, timing: 'Shaam ko', frequency: '8-10 din mein ek baar' },
        { step: 2, action: 'Neem tel ya Dashaparni ark', recipe: 'Neem oil 5ml per liter pani mein gholkar spray karein ya dashaparni ark ka chhidkaav karein.', ingredients_local: true, timing: 'Subah ke samay', frequency: 'Hafte mein ek baar' }
      ],
      en: [
        { step: 1, action: 'Baking Soda Spray', recipe: 'Mix 1 tablespoon of baking soda and 1 teaspoon of vegetable oil or liquid soap in 4 liters of water. Spray on foliage. It alters the pH to prevent fungal spore growth.', ingredients_local: true, timing: 'Evening', frequency: 'Every 8-10 days' },
        { step: 2, action: 'Neem and Garlic Oil Spray', recipe: 'Mix garlic extract and neem oil (5ml/L) in water. Spray on undersides and tops of leaves.', ingredients_local: true, timing: 'Early morning', frequency: 'Every 7 days' }
      ],
      mr: [
        { step: 1, action: 'बेकिंग सोडा द्रावण', recipe: '१ लीटर पाण्यात ५ ग्रॅम बेकिंग सोडा आणि २-३ थेंब लिक्विड सोप मिसळून फवारावा. हे पानांचे पीएच बदलून बुरशी नष्ट करते.', ingredients_local: true, timing: 'संध्याकाळी', frequency: '८-१० दिवसांतून एकदा' },
        { step: 2, action: 'कडुनिंब तेल किंवा दशपर्णी अर्क', recipe: '५ मिली कडुनिंब तेल प्रति लीटर पाण्यात मिसळून फवारावे किंवा दशपर्णी अर्काची फवारणी करावी.', ingredients_local: true, timing: 'सकाळी किंवा संध्याकाळी', frequency: 'आठवड्यातून एकदा' }
      ],
      gu: [
        { step: 1, action: 'બેકિંગ સોડાનું દ્રાવણ', recipe: '૧ લીટર પાણીમાં ૫ ગ્રામ બેકિંગ સોડા અને ૨-૩ ટીપાં પ્રવાહી સાબુ મેળવી છાંટો. તે પાંદડાની સપાટી બદલી ફૂગનો નાશ કરે છે.', ingredients_local: true, timing: 'મોડી સાંજે', frequency: '૮-૧૦ દિવસે એક વાર' },
        { step: 2, action: 'લીમડાનું તેલ અથવા દશપર્ણી અર્ક', recipe: '૫ મિલી લીમડાનું તેલ પ્રતિ લીટર પાણીમાં મેળવી છાંટો અથવા દશપર્ણી અર્કનો ઉપયોગ કરો.', ingredients_local: true, timing: 'સવારે', frequency: 'અઠવાડિયામાં એક વાર' }
      ],
      pa: [
        { step: 1, action: 'ਬੇਕਿੰਗ ਸੋਡਾ ਘੋਲ', recipe: '੧ ਲੀਟਰ ਪਾਣੀ ਵਿੱਚ ੫ ਗ੍ਰਾਮ ਬੇਕਿੰਗ ਸੋਡਾ ਅਤੇ ੨-੩ ਬੂੰਦਾਂ ਤਰਲ ਸਾਬਣ ਮਿਲਾ ਕੇ ਛਿੜਕੋ।', ingredients_local: true, timing: 'ਦੇਰ ਸ਼ਾਮ', frequency: '੮-੧੦ ਦਿਨਾਂ ਵਿੱਚ ਇੱਕ ਵਾਰ' },
        { step: 2, action: 'ਨਿੰਮ ਤੇਲ ਜਾਂ ਦਸ਼ਪਰਨੀ ਅਰਕ', recipe: 'ਨਿੰਮ ਦਾ ਤੇਲ ੫ ਮਿਲੀ ਪ੍ਰਤੀ ਲੀਟਰ ਪਾਣੀ ਵਿੱਚ ਮਿਲਾ ਕੇ ਸਪ੍ਰੇਅ ਕਰੋ।', ingredients_local: true, timing: 'ਸਵੇਰੇ', frequency: 'ਹਫ਼ਤੇ ਵਿੱਚ ਇੱਕ ਵਾਰ' }
      ]
    },
    prevention: {
      hi: 'खेत में मल्चिंग (Mulching) बिछाएं ताकि मिट्टी से फंगस के बीजाणु पत्तों पर न उछलें। ड्रिप सिंचाई का उपयोग करें, पत्तियों पर पानी न डालें। खरपतवारों को साफ रखें।',
      hl: 'Mulching sheeting lagayein taaki mitti ke spores patto par na udein. Drip sinchai use karein, patto par pani na dalein.',
      en: 'Apply mulch around the plant base to prevent soil spores from splashing onto leaves. Use drip irrigation instead of overhead watering to keep foliage dry.',
      mr: 'शेतात मल्चिंग (Mulching) करा जेणेकरून मातीतील बुरशी पानांवर उडणार नाही. ड्रिप सिंचनाचा वापर करा, पानांवर पाणी टाकू नका.',
      gu: 'ખેતરમાં મલ્ચિંગ કરો જેથી માટીમાંથી ફૂગ પાંદડા પર ન ઉડે. ટપક સિંચાઈનો ઉપયોગ કરો અને પાંદડા ભીના ન કરો.',
      pa: 'ਖੇਤ ਵਿੱਚ ਮਲਚਿੰਗ (Mulching) ਕਰੋ ਤਾਂ ਜੋ ਮਿੱਟੀ ਤੋਂ ਉੱਲੀ ਦੇ ਬੀਜਾਣੂ ਪੱਤਿਆਂ \'ਤੇ ਨਾ ਪੈਣ। ਤੁਪਕਾ ਸਿੰਚਾਈ ਦੀ ਵਰਤੋਂ ਕਰੋ।'
    },
    related_diseases: [
      { id: 'early-blight', name: 'Early Blight', name_local: 'Ageti Jhulsa', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDtVrfRjY46wsBoonXlQlpXTuoSWaCbY__peJjWJDPbJGsb9rsm_csRwzUcYRwOk0rP7HsQ3tfzHocGtmwYbdF7EUdunL3ngUEqGGCC3kAKKALzKPBaO8ZgptTgG580WKHC-U3BH2J_6ZDOJTuFi8Uuu71VMQHhg_suCJHhwcgMRqWI79Ljv-P30sMPhSMDWEE5GMojj_G127Qv5OnJS-y_RGsR_gM3f6W7FQ6pfSfpghT-X3UsKJgGmYyPQO4IrigfrFGgHpAd9FQ' },
      { id: 'late-blight', name: 'Late Blight', name_local: 'Pachheti Jhulsa', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDfM-M-ReTETYsXh6U3mrP9EC_4lNPs1UjQyeyINQJXZehSb0_5cQM4B3PROHKFcE4R9Bvo1jXY2Q_iEqTnNb5IB-cRDlo9aSMk7JY-ZKq_pXWU-RHSgG2UlYK5BaOg_FtFS3o0UNx3pR2-s5TuI2XHZo9kFeBfR3kI_Lh0lVyE-4Pl0cFlM2keGFJWdkIgIjEVejiBS3ex0YijfGIt84YKNmW7eKwXkH72PwV_6JhPure93b_rg6OWvw-k9LIdSCRQh5M8jnIk_5o' }
    ],
    sources: ['ICAR Vegetable Crops Bulletin, 2022', 'TNAU Pathology Manual']
  },
  'tomato-leaf-curl': {
    disease_name: 'Tomato Leaf Curl Virus',
    disease_name_hindi: 'पत्ता मरोड़ रोग (Leaf Curl Virus)',
    scientific_name: 'Begomovirus (TLCV)',
    confidence: 92,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCkCfOVDF8A1DuTKqim_Wzw1PjA-a536qDNF47UbPzQVjaoNs8HjNIIhdUybkftX3-QI5BD2YPzcWMK2C5CqwBT4aTqYOIuUFo1YwbSa9KZrEOUR9pYcn1yw7TpM7EArOJxcaQeJF0-ePHWSE9PTAhzb--_oI-8QOxwF6RUkuNPLBnjfKE-5MGSSyPe7mm8hcwMEVTC2U64_GVD7kpG2_QVlYO9PukJgB-lU0ThK8MQstOdzLqhxm1gVif4V43dfFw8xggxxR9RZxs',
    temp_range: '28-35°C',
    humidity_range: '< 60%',
    severity: {
      hi: 'उच्च', hl: 'Uchha', en: 'High', mr: 'उच्च', gu: 'તીવ્ર', pa: 'ਗੰਭੀਰ'
    },
    crops: {
      hi: 'टमाटर, मिर्च', hl: 'Tamatar, Mirch', en: 'Tomato, Chili', mr: 'टोमॅटो, मिरची', gu: 'ટમેટા, મરચી', pa: 'ਟਮਾਟਰ, ਮਿਰਚ'
    },
    climate: {
      hi: 'गर्म और सूखे मौसम में ज्यादा (सफेद मक्खी का प्रकोप)', hl: 'Garam aur sukhe mausam mein (whitefly attack)', en: 'Warm & dry weather with insects', mr: 'कोरड्या आणि उष्ण हवामानात जास्त', gu: 'ગરમ અને સૂકા હવામાનમાં વધુ', pa: 'ਗਰਮ ਅਤੇ ਖੁਸ਼ਕ ਮੌਸਮ ਵਿੱਚ ਜ਼ਿਆਦਾ'
    },
    symptoms: {
      hi: [
        'पत्तियां ऊपर की ओर कप के आकार में मुड़ जाती हैं और छोटी रह जाती हैं।',
        'पत्तियों की नसें पीली हो जाती हैं और नई पत्तियां सिकुड़ जाती हैं।',
        'पौधों का विकास पूरी तरह रुक जाता है (झाड़ीनुमा दिखना)।',
        'फूल और फल बहुत कम लगते हैं और झड़ जाते हैं।'
      ],
      hl: [
        'Pattiyan upar ki taraf cup ke aakar mein mud jati hain aur choti rehti hain.',
        'Pattiyon ki nasein peeli ho jati hain aur pattiya sikud jati hain.',
        'Plant ki growth ruk jati hai aur woh bush jaisa dikhta hai.',
        'Phool aur fruit bohot kam aate hain aur jhad jate hain.'
      ],
      en: [
        'Severe upward curling and puckering of leaves, forming cup-like shapes.',
        'Yellowing of leaf margins and veins, with young leaves remaining extremely small.',
        'Severe stunting of the plant, giving it a bushy, bunched appearance.',
        'Poor fruit set; flowers drop prematurely, resulting in negligible yield.'
      ],
      mr: [
        'पाने वरच्या बाजूला वाटीसारखी वळतात आणि लहान राहतात.',
        'पानांच्या शिरा पिवळ्या पडतात आणि कोवळी पाने आकसतात.',
        'झाडाची वाढ पूर्णपणे थांबते (झाड झुडपासारखे दिसते).',
        'फुले आणि फळे खूप कमी लागतात आणि गळून पडतात.'
      ],
      gu: [
        'પાંદડા ઉપરની તરફ કપના આકારમાં વળી જાય છે અને નાના રહે છે.',
        'પાંદડાની નસો પીળી પડી જાય છે અને નવા પાંદડા સંકોચાઈ જાય છે.',
        'છોડનો વિકાસ અટકી જાય છે (છોડ ઝાડી જેવો દેખાય છે).',
        'ફૂલો અને ફળો ખૂબ ઓછા બેસે છે અને ખરી પડે છે.'
      ],
      pa: [
        'ਪੱਤੇ ਉੱਪਰ ਵੱਲ ਕੱਪ ਵਰਗੇ ਆਕਾਰ ਵਿੱਚ ਮੁੜ ਜਾਂਦੇ ਹਨ ਅਤੇ ਛੋਟੇ ਰਹਿ ਜਾਂਦੇ ਹਨ।',
        'ਪੱਤਿਆਂ ਦੀਆਂ ਨਾੜਾਂ ਪੀਲੀਆਂ ਹੋ ਜਾਂਦੀਆਂ ਹਨ ਅਤੇ ਪੱਤੇ ਸੁੰਗੜ ਜਾਂਦੇ ਹਨ।',
        'ਪੌਦਿਆਂ ਦਾ ਵਿਕਾਸ ਰੁਕ ਜਾਂਦਾ ਹੈ।'
      ]
    },
    cause: {
      hi: 'यह वायरस जनित रोग है जो सफेद मक्खी (Whitefly / Bemisia tabaci) नामक कीट द्वारा एक पौधे से दूसरे पौधे में फैलता है।',
      hl: 'Yeh virus bimari hai jo safed makhi (Whitefly) ke dwara ek podhe se dusre podhe mein phailti hai.',
      en: 'Caused by the Tomato Leaf Curl Begomovirus. It is transmitted solely by the insect vector Silverleaf Whitefly (Bemisia tabaci).',
      mr: 'हा विषाणूजन्य रोग असून सफेद माशी (Whitefly) नावाच्या कीटकाद्वारे एका झाडावरून दुसऱ्या झाडावर पसरतो.',
      gu: 'આ વાયરસ જન્ય રોગ છે જે સફેદ માખી (Whitefly) નામના કીટક દ્વારા એક છોડથી બીજા છોડમાં ફેલાય છે.',
      pa: 'ਇਹ ਵਿਸ਼ਾਣੂ ਰੋਗ ਹੈ ਜੋ ਚਿੱਟੀ ਮੱਖੀ (Whitefly) ਦੁਆਰਾ ਫੈਲਦਾ ਹੈ।'
    },
    organic_remedies: {
      hi: [
        { step: 1, action: 'पीला चिपचिपा प्रपंच (Yellow Sticky Traps)', recipe: 'खेत में पीले रंग के कार्डबोर्ड पर ग्रीस या मोबिल ऑयल लगाकर टांगें। सफेद मक्खी पीली रोशनी की तरफ आकर्षित होकर चिपक जाती है।', ingredients_local: true, timing: 'फसल लगाने के पहले दिन से', frequency: '10-15 जाल प्रति एकड़' },
        { step: 2, action: 'नीम अर्क या नीमास्त्र का छिड़काव', recipe: '5% नीम बीज अर्क या गोमूत्र, गोबर और नीम से बना नीमास्त्र घोल 20 मिली प्रति लीटर मिलाकर छिड़कें ताकि मक्खियों का प्रकोप रुके।', ingredients_local: true, timing: 'सुबह या शाम', frequency: '7-10 दिन में एक बार' }
      ],
      hl: [
        { step: 1, action: 'Yellow Sticky Traps lagayein', recipe: 'Peele cardboard ya tin par grease lagakar plant ki height par khet mein tanghein taaki whiteflies chipak jayein.', ingredients_local: true, timing: 'Fasal ki shuruat se', frequency: '10-15 traps per acre' },
        { step: 2, action: 'Neemastra ka chhidkaav', recipe: 'Gomutra, neem aur gobar se bana Neemastra 20ml per liter pani mein milakar spray karein.', ingredients_local: true, timing: 'Shaam ke samay', frequency: 'Hafte mein ek baar' }
      ],
      en: [
        { step: 1, action: 'Install Yellow Sticky Traps', recipe: 'Hang yellow plastic boards coated with grease or castor oil just above the plant canopy to trap whiteflies and vector insects.', ingredients_local: true, timing: 'From nursery stage onwards', frequency: '15 traps per acre' },
        { step: 2, action: 'Spray Neemastra / Neem Decoction', recipe: 'Prepare Neemastra using cow urine, dung, and neem leaves. Spray 20ml per liter of water on both sides of foliage.', ingredients_local: true, timing: 'Cool hours of the day', frequency: 'Once in 7 days' }
      ],
      mr: [
        { step: 1, action: 'पिवळे चिकट सापळे लावणे', recipe: 'शेतात पिवळ्या रंगाच्या कार्डबोर्डवर ग्रीस किंवा ऑईल लावून टांगावे. पांढरी माशी या सापळ्यांवर चिकटून मरते.', ingredients_local: true, timing: 'लागवडीपासून', frequency: '१०-१५ सापळे प्रति एकर' },
        { step: 2, action: 'निमास्त्राची फवारणी', recipe: 'गोमूत्र, शेण आणि कडुनिंबापासून बनवलेले निमास्त्र २० मिली प्रति लीटर पाण्यात मिसळून फवारावे.', ingredients_local: true, timing: 'सकाळी किंवा संध्याकाळी', frequency: 'आठवड्यातून एकदा' }
      ],
      gu: [
        { step: 1, action: 'પીળા ચીકણા પિંજર (Yellow Sticky Traps)', recipe: 'ખેતરમાં પીળા કાર્ડબોર્ડ પર ગ્રીસ અથવા વેસેલિન લગાવીને લટકાવો. સફેદ માખી તેના તરફ આકર્ષાઈને ચોંટી જશે.', ingredients_local: true, timing: 'વાવેતરના પ્રથમ દિવસથી', frequency: '૧૦-૧૫ પિંજર પ્રતિ એકર' },
        { step: 2, action: 'નીમાસ્ત્રનો છંટકાવ', recipe: 'ગૌમૂત્ર, છાણ અને લીમડામાંથી બનાવેલ નીમાસ્त्र ૨૦ મિલી પ્રતિ લીટર પાણીમાં મેળવી છાંટો જેથી સફેદ માખી નિયંત્રિત થાય.', ingredients_local: true, timing: 'સવારે અથવા સાંજે', frequency: '૭-૧૦ દિવસે એક વાર' }
      ],
      pa: [
        { step: 1, action: 'ਪੀਲੇ ਚਿਪਚਿਪੇ ਪਿੰਜਰੇ (Yellow Sticky Traps)', recipe: 'ਖੇਤ ਵਿੱਚ ਪੀਲੇ ਰੰਗ ਦੇ ਕਾਰਡਬੋਰਡ \'ਤੇ ਗਰੀਸ ਲਗਾ ਕੇ ਟੰਗੋ। ਚਿੱਟੀ ਮੱਖੀ ਇਸ ਨਾਲ ਚਿਪਕ ਜਾਵੇਗੀ।', ingredients_local: true, timing: 'ਸ਼ੁਰੂਆਤੀ ਸਟੇਜ ਤੋਂ', frequency: '੧੦-੧੫ ਟ੍ਰੈਪ ਪ੍ਰਤੀ ਏਕੜ' },
        { step: 2, action: 'ਨੀਮਾਸਤਰ ਦਾ ਛਿੜਕਾਅ', recipe: 'ਗਊ-ਮੂਤਰ, ਗੋਬਰ ਅਤੇ ਨਿੰਮ ਤੋਂ ਤਿਆਰ ਨੀਮਾਸਤਰ ੨੦ ਮਿਲੀ ਪ੍ਰਤੀ ਲੀਟਰ ਪਾਣੀ ਵਿੱਚ ਮਿਲਾ ਕੇ ਛਿੜਕੋ।', ingredients_local: true, timing: 'ਸ਼ਾਮ ਦੇ ਸਮੇਂ', frequency: 'ਹਫ਼ਤੇ ਵਿੱਚ ਇੱਕ ਵਾਰ' }
      ]
    },
    prevention: {
      hi: 'मुख्य खेत के चारों ओर मक्का, ज्वार या बाजरा की 2-3 पंक्तियों की सुरक्षा पट्टी बोएं। नर्सरी को बारीक जाली (Nylon net) से ढककर रखें ताकि सफेद मक्खी न घुस सके।',
      hl: 'Khet ke chaaron taraf makka ya bajra ki boundary lagayein. Nursery ko white nylon net se dhak kar rakhein.',
      en: 'Sow barrier crops like maize, sorghum, or pearl millet (2-3 rows) around the field. Raise seedlings under insect-proof nylon nets to prevent whitefly contact.',
      mr: 'शेताच्या भोवती मका, ज्वारी किंवा बाजरीच्या २-३ ओळींची संरक्षक भिंत लावावी. रोपवाटिका नायलॉनच्या जाळीने झाकून ठेवावी.',
      gu: 'મુખ્ય ખેતરની ચારેય બાજુ મકાઈ કે જુવારની ૨-૩ લાઈનો વાવી સુરક્ષા પટ્ટી બનાવો. ધરૂવાડિયાને ઝીણી જાળીથી ઢાંકીને રાખો.',
      pa: 'ਖੇਤ ਦੇ ਚਾਰੇ ਪਾਸੇ ਮੱਕੀ ਜਾਂ ਬਾਜਰੇ ਦੀ ਸੁਰੱਖਿਆ ਪੱਟੀ ਬੀਜੋ। ਨਰਸਰੀ ਨੂੰ ਬਾਰੀਕ ਜਾਲੀ ਨਾਲ ਢੱਕ ਕੇ ਰੱਖੋ।'
    },
    related_diseases: [
      { id: 'early-blight', name: 'Early Blight', name_local: 'Ageti Jhulsa', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDtVrfRjY46wsBoonXlQlpXTuoSWaCbY__peJjWJDPbJGsb9rsm_csRwzUcYRwOk0rP7HsQ3tfzHocGtmwYbdF7EUdunL3ngUEqGGCC3kAKKALzKPBaO8ZgptTgG580WKHC-U3BH2J_6ZDOJTuFi8Uuu71VMQHhg_suCJHhwcgMRqWI79Ljv-P30sMPhSMDWEE5GMojj_G127Qv5OnJS-y_RGsR_gM3f6W7FQ6pfSfpghT-X3UsKJgGmYyPQO4IrigfrFGgHpAd9FQ' },
      { id: 'septoria-leaf-spot', name: 'Septoria Leaf Spot', name_local: 'Septoria Dhabba', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCkCfOVDF8A1DuTKqim_Wzw1PjA-a536qDNF47UbPzQVjaoNs8HjNIIhdUybkftX3-QI5BD2YPzcWMK2C5CqwBT4aTqYOIuUFo1YwbSa9KZrEOUR9pYcn1yw7TpM7EArOJxcaQeJF0-ePHWSE9PTAhzb--_oI-8QOxwF6RUkuNPLBnjfKE-5MGSSyPe7mm8hcwMEVTC2U64_GVD7kpG2_QVlYO9PukJgB-lU0ThK8MQstOdzLqhxm1gVif4V43dfFw8xggxxR9RZxs' }
    ],
    sources: ['ICAR Indian Institute of Horticultural Research Guide', 'TNAU Whitefly Control Advisory']
  }
};

const DiseaseDetail: React.FC = () => {
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const [activeTab, setActiveTab] = useState<'info' | 'treatment' | 'prevention'>('info');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (playbackAudioRef.current) {
        playbackAudioRef.current.pause();
      }
    };
  }, []);

  // Determine current disease data
  let disease: Partial<DiseaseData> = {};
  const isDynamic = location.state && location.state.diagnosis;

  if (isDynamic) {
    const diag = location.state.diagnosis;
    // Map to dynamic state details
    const diseaseNameLower = (diag.disease_name || '').toLowerCase();
    let staticMatch: DiseaseData | null = null;
    if (diseaseNameLower.includes('early blight')) {
      staticMatch = STATIC_DISEASES['early-blight'];
    } else if (diseaseNameLower.includes('late blight')) {
      staticMatch = STATIC_DISEASES['late-blight'];
    } else if (diseaseNameLower.includes('septoria')) {
      staticMatch = STATIC_DISEASES['septoria-leaf-spot'];
    } else if (diseaseNameLower.includes('curl') || diseaseNameLower.includes('marod')) {
      staticMatch = STATIC_DISEASES['tomato-leaf-curl'];
    }

    // Blend dynamic results with static details for full premium experience
    disease = {
      disease_name: diag.disease_name,
      disease_name_hindi: diag.disease_name_hindi || diag.disease_name,
      scientific_name: staticMatch ? staticMatch.scientific_name : 'Pathogen suspect',
      confidence: diag.confidence || 90,
      image_url: diag.image_url && diag.image_url.startsWith('/') 
        ? `${API_BASE_URL}${diag.image_url}` 
        : (staticMatch ? staticMatch.image_url : 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&q=80&w=400'),
      temp_range: staticMatch ? staticMatch.temp_range : '22-30°C',
      humidity_range: staticMatch ? staticMatch.humidity_range : '> 70%',
      severity: staticMatch ? staticMatch.severity : { hi: 'मध्यम', hl: 'Madhyam', en: 'Medium', mr: 'मध्यम', gu: 'મધ્યમ', pa: 'ਦਰਮਿਆਨਾ' },
      crops: staticMatch ? staticMatch.crops : { hi: 'टमाटर', hl: 'Tamatar', en: 'Tomato', mr: 'टोमॅटो', gu: 'ટમેટા', pa: 'ਟਮਾਟਰ' },
      climate: staticMatch ? staticMatch.climate : { hi: 'नमी में ज्यादा', hl: 'Nami mein zyada', en: 'High in humidity', mr: 'दमट हवामानात जास्त', gu: 'ભેજવાળા વાતાવરણમાં વધુ', pa: 'ਨਮੀ ਵਿੱਚ ਜ਼ਿਆਦਾ' },
      symptoms: {
        hi: diag.symptoms_observed,
        hl: diag.symptoms_observed,
        en: diag.symptoms_observed,
        mr: diag.symptoms_observed,
        gu: diag.symptoms_observed,
        pa: diag.symptoms_observed,
      },
      cause: {
        hi: staticMatch ? staticMatch.cause.hi : 'फंगस या जीवाणु जनित बीमारी।',
        hl: staticMatch ? staticMatch.cause.hl : 'Fungus ya bacterial disease ki aashanka.',
        en: staticMatch ? staticMatch.cause.en : 'Fungal or bacterial infection suspected.',
        mr: staticMatch ? staticMatch.cause.mr : 'बुरशीजन्य किंवा जिवाणूजन्य रोग.',
        gu: staticMatch ? staticMatch.cause.gu : 'ફૂગ અથવા બેક્ટેરિયા જન્ય રોગ.',
        pa: staticMatch ? staticMatch.cause.pa : 'ਉੱਲੀ ਜਾਂ ਜੀਵਾਣੂ ਜਨਿਤ ਬਿਮਾਰੀ।'
      },
      organic_remedies: {
        hi: diag.organic_remedies,
        hl: diag.organic_remedies,
        en: diag.organic_remedies,
        mr: diag.organic_remedies,
        gu: diag.organic_remedies,
        pa: diag.organic_remedies,
      },
      prevention: {
        hi: diag.prevention || 'फसल चक्र अपनाएं।',
        hl: diag.prevention || 'Crop rotation karein.',
        en: diag.prevention || 'Practice crop rotation and field sanitation.',
        mr: diag.prevention || 'पीक फेरपालट करा.',
        gu: diag.prevention || 'પાક ચક્ર અપનાવો.',
        pa: diag.prevention || 'ਫਸਲੀ ਚੱਕਰ ਅਪਣਾਓ।'
      },
      related_diseases: staticMatch ? staticMatch.related_diseases : [
        { id: 'early-blight', name: 'Early Blight', name_local: 'Ageti Jhulsa', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDtVrfRjY46wsBoonXlQlpXTuoSWaCbY__peJjWJDPbJGsb9rsm_csRwzUcYRwOk0rP7HsQ3tfzHocGtmwYbdF7EUdunL3ngUEqGGCC3kAKKALzKPBaO8ZgptTgG580WKHC-U3BH2J_6ZDOJTuFi8Uuu71VMQHhg_suCJHhwcgMRqWI79Ljv-P30sMPhSMDWEE5GMojj_G127Qv5OnJS-y_RGsR_gM3f6W7FQ6pfSfpghT-X3UsKJgGmYyPQO4IrigfrFGgHpAd9FQ' },
        { id: 'late-blight', name: 'Late Blight', name_local: 'Pachheti Jhulsa', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDfM-M-ReTETYsXh6U3mrP9EC_4lNPs1UjQyeyINQJXZehSb0_5cQM4B3PROHKFcE4R9Bvo1jXY2Q_iEqTnNb5IB-cRDlo9aSMk7JY-ZKq_pXWU-RHSgG2UlYK5BaOg_FtFS3o0UNx3pR2-s5TuI2XHZo9kFeBfR3kI_Lh0lVyE-4Pl0cFlM2keGFJWdkIgIjEVejiBS3ex0YijfGIt84YKNmW7eKwXkH72PwV_6JhPure93b_rg6OWvw-k9LIdSCRQh5M8jnIk_5o' }
      ],
      sources: diag.rag_sources || ['KisanMitra AI RAG Extension Service'],
    };
  } else {
    // Static route lookup by slug parameter
    const currentId = id || 'early-blight';
    const staticData = STATIC_DISEASES[currentId] || STATIC_DISEASES['early-blight'];
    disease = staticData;
  }

  // Get active language localized string helper
  const getLoc = (field: Record<string, any> | undefined): any => {
    if (!field) return '';
    const activeLang = lang || 'hi';
    return field[activeLang] || field['hi'] || '';
  };

  const displayDiseaseName = lang === 'hi' || lang === 'hl' ? disease.disease_name_hindi : disease.disease_name;
  const displayScientificName = disease.scientific_name || '';
  const displaySeverity = getLoc(disease.severity);
  const displayCrops = getLoc(disease.crops);
  const displayClimate = getLoc(disease.climate);
  const displaySymptomsList: string[] = getLoc(disease.symptoms) || [];
  const displayCause = getLoc(disease.cause);
  const displayOrganicList: OrganicRemedy[] = getLoc(disease.organic_remedies) || [];
  const displayPrevention = getLoc(disease.prevention);
  const displaySources = disease.sources || [];

  const handleSpeakDetails = async () => {
    if (isPlayingAudio) {
      if (playbackAudioRef.current) {
        playbackAudioRef.current.pause();
      }
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);

    try {
      let textToSpeak = '';
      const activeLang = lang || 'hi';
      const isEnglish = activeLang === 'en';

      if (activeTab === 'info') {
        const symptomsJoined = displaySymptomsList.join(', ');
        if (isEnglish) {
          textToSpeak = `Information for ${disease.disease_name}. Scientific cause is ${displayScientificName}. Severity is ${displaySeverity}. Symptoms are: ${symptomsJoined}. Optimal weather conditions include temperature ${disease.temp_range} and humidity ${disease.humidity_range}.`;
        } else {
          textToSpeak = `${displayDiseaseName} की जानकारी। इसका मुख्य कारण है: ${displayCause}। इसके लक्षणों में शामिल हैं: ${symptomsJoined}। यह रोग ${disease.temp_range} तापमान और ${disease.humidity_range} नमी में अधिक सक्रिय होता है।`;
        }
      } else if (activeTab === 'treatment') {
        const remediesJoined = displayOrganicList.map((rem, index) => `Step ${index + 1}: ${rem.action}. Recipe: ${rem.recipe || ''}`).join('. ');
        if (isEnglish) {
          textToSpeak = `Organic remedies treatment details. ${remediesJoined}`;
        } else {
          textToSpeak = `जैविक उपचार विधि। ${remediesJoined}`;
        }
      } else {
        if (isEnglish) {
          textToSpeak = `Prevention guide details: ${displayPrevention}`;
        } else {
          textToSpeak = `बीमारी से बचाव के तरीके: ${displayPrevention}`;
        }
      }

      const res = await fetch(`${API_BASE_URL}/api/voice/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSpeak, lang: activeLang })
      });
      
      if (!res.ok) throw new Error("Synthesis failed");
      
      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (playbackAudioRef.current) {
        playbackAudioRef.current.pause();
      }
      
      const audio = new Audio(audioUrl);
      playbackAudioRef.current = audio;
      
      audio.play()
        .then(() => {
          audio.onended = () => {
            setIsPlayingAudio(false);
          };
        })
        .catch((err) => {
          console.error(err);
          setIsPlayingAudio(false);
        });
    } catch (e) {
      console.error("Audio synthesise error:", e);
      setIsPlayingAudio(false);
    }
  };

  const getSeverityColor = (sev: string) => {
    const s = (sev || '').toLowerCase();
    if (s.includes('high') || s.includes('उच्च') || s.includes('गंभीर') || s.includes('તીવ્ર')) {
      return 'bg-[#ffdad6] border-[#ba1a1a] text-[#ba1a1a]';
    }
    return 'bg-[#fff4e0] border-[#ffcf97] text-[#643e00]';
  };

  return (
    <div className="flex flex-col bg-[#fbf9f3] min-h-screen pb-[100px] font-sans text-[#1b1c18] animate-[fadeIn_0.25s_ease-out]">
      
      {/* Top App Bar */}
      <header className="sticky top-0 w-full h-[56px] flex items-center justify-between px-4 bg-white z-30 border-b border-[#eae8e2] shadow-sm">
        <button 
          onClick={() => {
            if (playbackAudioRef.current) playbackAudioRef.current.pause();
            if (isDynamic) {
              navigate('/disease');
            } else {
              navigate(-1);
            }
          }}
          className="p-2 -ml-2 text-[#005129] hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-bold text-[16px] text-[#005129] flex-1 text-center truncate px-2">
          {displayDiseaseName}
        </h1>
        <button 
          onClick={handleSpeakDetails}
          className={`p-2 -mr-2 rounded-full transition-colors flex items-center justify-center ${
            isPlayingAudio ? 'bg-[#ffdad6] text-[#ba1a1a] animate-pulse' : 'text-[#005129] hover:bg-gray-100'
          }`}
        >
          {isPlayingAudio ? <VolumeX size={22} /> : <Volume2 size={22} />}
        </button>
      </header>

      {/* Main Content Scroll Container */}
      <main className="flex-1 w-full flex flex-col">
        
        {/* Hero Image Section */}
        <section className="relative w-full h-[200px] bg-gray-200 flex-shrink-0 overflow-hidden">
          <img 
            src={disease.image_url} 
            alt={displayDiseaseName}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&q=80&w=400';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/70"></div>
          
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border border-gray-100">
            <span className="font-semibold text-[#005129] text-[11px] flex items-center gap-1">
              <Sparkles size={11} className="text-[#e8960a]" />
              {displayScientificName}
            </span>
          </div>
          
          <div className="absolute bottom-4 left-4 bg-black/45 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20">
            <span className="font-bold text-white text-[13px] tracking-wide">
              {displayDiseaseName}
            </span>
          </div>
        </section>

        {/* Severity & Info Pills Row */}
        <section className="px-4 py-3.5 flex flex-wrap gap-2.5 bg-white border-b border-[#f0eee8] shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full border text-[11px] font-bold ${getSeverityColor(displaySeverity)}`}>
            <span>⚠️</span>
            <span>{displaySeverity}</span>
          </div>
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#edf7f1] border border-[#d5ecd9] text-[#005129] text-[11px] font-bold">
            <span>🌾</span>
            <span>{displayCrops}</span>
          </div>
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-bold">
            <span>🌦️</span>
            <span>{displayClimate}</span>
          </div>
        </section>

        {/* Segmented Tab Navigation Bar */}
        <section className="px-4 py-4 bg-white">
          <div className="bg-[#f0eee8] rounded-[24px] p-1.5 flex w-full relative">
            <button 
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-2 text-center rounded-[20px] font-bold text-[13px] transition-all duration-200 flex items-center justify-center gap-1.5 ${
                activeTab === 'info' 
                  ? 'bg-[#005129] text-white shadow-md' 
                  : 'text-[#404940] hover:bg-gray-200'
              }`}
            >
              <span>📋</span> {lang === 'hi' || lang === 'hl' ? 'जानकारी' : 'Info'}
            </button>
            <button 
              onClick={() => setActiveTab('treatment')}
              className={`flex-1 py-2 text-center rounded-[20px] font-bold text-[13px] transition-all duration-200 flex items-center justify-center gap-1.5 ${
                activeTab === 'treatment' 
                  ? 'bg-[#005129] text-white shadow-md' 
                  : 'text-[#404940] hover:bg-gray-200'
              }`}
            >
              <span>💊</span> {lang === 'hi' || lang === 'hl' ? 'इलाज' : 'Treatment'}
            </button>
            <button 
              onClick={() => setActiveTab('prevention')}
              className={`flex-1 py-2 text-center rounded-[20px] font-bold text-[13px] transition-all duration-200 flex items-center justify-center gap-1.5 ${
                activeTab === 'prevention' 
                  ? 'bg-[#005129] text-white shadow-md' 
                  : 'text-[#404940] hover:bg-gray-200'
              }`}
            >
              <span>🛡️</span> {lang === 'hi' || lang === 'hl' ? 'बचाव' : 'Prevention'}
            </button>
          </div>
        </section>

        {/* Dynamic Content Panels */}
        <section className="px-4 flex flex-col gap-4 pb-8 flex-grow">
          
          {/* 1. JAANKARI (INFO) TAB */}
          {activeTab === 'info' && (
            <div className="flex flex-col gap-4 animate-[fadeIn_0.2s_ease]">
              {/* Quick Remedy Callout */}
              {displayOrganicList.length > 0 && (
                <div 
                  onClick={() => setActiveTab('treatment')}
                  className="bg-[#fef3c7] border border-[#fcd34d] hover:bg-[#fef08a] cursor-pointer rounded-[16px] p-3.5 flex flex-col gap-1.5 shadow-sm active:scale-98 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🌿</span>
                    <h3 className="font-bold text-[14px] text-[#92400e]">
                      {lang === 'hi' || lang === 'hl' ? 'मुख्य उपचार: ' : 'Top Remedy: '}
                      {displayOrganicList[0].action}
                    </h3>
                  </div>
                  <span className="text-[#005129] font-bold text-[12px] flex items-center gap-0.5 pl-7">
                    {lang === 'hi' || lang === 'hl' ? 'बनाने की विधि: इलाज टैब में देखें ' : 'Full recipe: See Treatment tab '}
                    <span className="text-[12px] font-normal">➔</span>
                  </span>
                </div>
              )}

              {/* Kaise Pehchanen (Symptoms) Card */}
              <div className="bg-white rounded-[16px] p-4 shadow-sm border border-[#eae8e2]">
                <h2 className="font-bold text-[15px] text-[#1b1c18] border-b border-[#f0eee8] pb-2 mb-3">
                  {lang === 'hi' || lang === 'hl' ? 'लक्षण कैसे पहचानें?' : 'How to Identify Symptoms?'}
                </h2>
                <ul className="flex flex-col gap-3">
                  {displaySymptomsList.map((symp, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <div className="w-[7px] h-[7px] rounded-full bg-[#005129] mt-[6px] shrink-0"></div>
                      <p className="text-[13px] text-gray-700 leading-relaxed font-medium">{symp}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Yeh Kyon Hota Hai (Cause) Card */}
              <div className="bg-white rounded-[16px] p-4 shadow-sm border border-[#eae8e2] flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 text-[#005129]">
                  <Info size={18} />
                </div>
                <div>
                  <h2 className="font-bold text-[15px] text-[#1b1c18] mb-1">
                    {lang === 'hi' || lang === 'hl' ? 'यह बीमारी क्यों होती है?' : 'What causes this disease?'}
                  </h2>
                  <p className="text-[13px] text-gray-600 leading-relaxed font-medium">
                    {displayCause}
                  </p>
                </div>
              </div>

              {/* Kab Zyada Hota Hai (Weather Conditions) Card */}
              <div className="bg-white rounded-[16px] p-4 shadow-sm border border-[#eae8e2]">
                <h2 className="font-bold text-[15px] text-[#1b1c18] mb-3">
                  {lang === 'hi' || lang === 'hl' ? 'यह कब तेजी से फैलता है?' : 'Optimal Risk Environment'}
                </h2>
                <div className="grid grid-cols-2 gap-4 bg-[#fbf9f3] rounded-xl p-3.5 border border-[#f0eee8]">
                  <div className="flex flex-col items-center gap-1">
                    <Thermometer className="text-[#e8960a]" size={22} />
                    <span className="font-bold text-[15px] text-black mt-1">{disease.temp_range}</span>
                    <span className="text-[10px] text-gray-400 font-semibold">{lang === 'hi' || lang === 'hl' ? 'तापमान' : 'Temperature'}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 border-l border-[#eae8e2]">
                    <Droplets className="text-blue-500" size={22} />
                    <span className="font-bold text-[15px] text-black mt-1">{disease.humidity_range}</span>
                    <span className="text-[10px] text-gray-400 font-semibold">{lang === 'hi' || lang === 'hl' ? 'नमी (आर्द्रता)' : 'Humidity'}</span>
                  </div>
                </div>
              </div>

              {/* Related Diseases Horizontal Scroll */}
              {disease.related_diseases && disease.related_diseases.length > 0 && (
                <div className="w-full mt-2">
                  <h3 className="font-bold text-[14px] text-gray-800 uppercase tracking-wider mb-3 px-1">
                    {lang === 'hi' || lang === 'hl' ? 'इससे मिलते-जुलते रोग' : 'Related Crop Diseases'}
                  </h3>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-3">
                    {disease.related_diseases.map((rel) => (
                      <div 
                        key={rel.id} 
                        onClick={() => {
                          if (playbackAudioRef.current) playbackAudioRef.current.pause();
                          setIsPlayingAudio(false);
                          navigate(`/disease/${rel.id}`);
                        }}
                        className="flex items-center gap-2 bg-white border border-[#eae8e2] hover:border-[#005129] cursor-pointer rounded-full py-1.5 pl-2 pr-4 shadow-sm whitespace-nowrap active:scale-95 transition-all flex-shrink-0"
                      >
                        <div className="w-[26px] h-[26px] rounded-full overflow-hidden shrink-0 border border-gray-100">
                          <img src={rel.img} alt={rel.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="font-bold text-gray-800 text-[12px]">
                          {lang === 'hi' || lang === 'hl' ? rel.name_local : rel.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. ILAAJ (TREATMENT) TAB */}
          {activeTab === 'treatment' && (
            <div className="flex flex-col gap-4 animate-[fadeIn_0.2s_ease]">
              <div className="bg-[#edf7f1] border border-[#97f3b1] rounded-[16px] p-4 flex items-start gap-3">
                <ShieldCheck className="text-[#005129] shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-bold text-[#005129] text-[14px]">
                    {lang === 'hi' || lang === 'hl' ? 'शत-प्रतिशत जैविक समाधान' : '100% Organic Remedy Recipes'}
                  </h3>
                  <p className="text-[12px] text-[#00210d] mt-1 font-medium leading-relaxed">
                    {lang === 'hi' || lang === 'hl' 
                      ? 'रसायनों से बचें। ये घरेलू सामग्रियां फसल और स्वास्थ्य दोनों को सुरक्षित रखती हैं।' 
                      : 'Avoid chemicals. These bio-remedies keep your plants healthy and soil chemical-free.'}
                  </p>
                </div>
              </div>

              {displayOrganicList.map((rem, idx) => (
                <div key={idx} className="bg-white rounded-[16px] p-4 shadow-sm border border-[#eae8e2] flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2 border-b border-[#f0eee8] pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#005129] text-white font-bold text-[11px] flex items-center justify-center">
                        {rem.step || idx + 1}
                      </span>
                      <h4 className="font-bold text-[14px] text-black">{rem.action}</h4>
                    </div>
                    {rem.ingredients_local && (
                      <span className="text-[9px] text-[#005129] font-bold bg-[#edf7f1] border border-[#97f3b1] px-2 py-0.5 rounded-full shrink-0">
                        {lang === 'hi' || lang === 'hl' ? 'घर की सामग्री' : 'Local ingredients'}
                      </span>
                    )}
                  </div>

                  {rem.recipe && (
                    <div className="bg-[#fbf9f3] border border-[#f0eee8] rounded-xl p-3">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
                        {lang === 'hi' || lang === 'hl' ? 'बनाने और छिड़काव की विधि:' : 'Preparation & Application:'}
                      </span>
                      <p className="text-[12.5px] text-gray-700 leading-relaxed font-semibold italic">
                        {rem.recipe}
                      </p>
                    </div>
                  )}

                  {(rem.timing || rem.frequency) && (
                    <div className="flex gap-4 text-[11.5px] text-[#643e00] font-bold mt-1">
                      {rem.timing && <span>⏰ {rem.timing}</span>}
                      {rem.frequency && <span>🔁 {rem.frequency}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 3. BACHAO (PREVENTION) TAB */}
          {activeTab === 'prevention' && (
            <div className="flex flex-col gap-4 animate-[fadeIn_0.2s_ease]">
              <div className="bg-white rounded-[16px] p-4 shadow-sm border border-[#eae8e2]">
                <h2 className="font-bold text-[15px] text-[#1b1c18] border-b border-[#f0eee8] pb-2 mb-3">
                  {lang === 'hi' || lang === 'hl' ? 'अगली बार रोग से बचाव की सलाह' : 'Preventive Strategies for Future Crops'}
                </h2>
                <p className="text-[13.5px] text-gray-700 leading-relaxed font-medium bg-[#fcfbfa] p-3.5 rounded-xl border border-[#f0eee8]">
                  {displayPrevention}
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-[16px] p-4 flex gap-3">
                <span className="text-xl">💡</span>
                <p className="text-[12px] text-amber-900 leading-relaxed font-medium">
                  {lang === 'hi' || lang === 'hl' 
                    ? 'स्वस्थ मिट्टी ही मजबूत पौधों का आधार है। खेत तैयार करते समय 50 किलोग्राम प्रति एकड़ की दर से ट्राइकोडर्मा जैविक फफूंदनाशक गोबर खाद में मिलाकर जरूर डालें।'
                    : 'Healthy soil prevents soil-borne diseases. Always mix Trichoderma powder in compost during field preparation.'}
                </p>
              </div>
            </div>
          )}

          {/* Static Sources Citations Footer */}
          {displaySources.length > 0 && (
            <div className="text-center flex flex-col gap-1 border-t border-[#f0eee8] pt-5 mt-6 pb-2">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                {lang === 'hi' || lang === 'hl' ? 'प्रमाणित स्रोत संदर्भ' : 'Verified Reference Sources'}
              </span>
              {displaySources.map((src, i) => (
                <p key={i} className="text-[11px] font-medium text-gray-400 italic">
                  {src}
                </p>
              ))}
            </div>
          )}

          {/* Help Line Card */}
          <div className="w-full bg-[#fffcf5] border border-[#ffcf97] rounded-[16px] p-4 flex flex-col gap-3.5 shadow-sm mt-2">
            <div className="flex items-start gap-2.5 text-amber-800">
              <AlertCircle className="shrink-0 mt-0.5" size={18} />
              <p className="text-[12px] leading-relaxed font-medium italic">
                {lang === 'hi' || lang === 'hl'
                  ? 'यह AI आधारित प्राथमिक सलाह है। पुष्टि करने के लिए नीचे हेल्पलाइन पर कृषि विज्ञान केंद्र (KVK) विशेषज्ञ से तुरंत संपर्क करें।'
                  : 'Disclaimer: This is automated AI advice. For official confirmation, reach out directly to the Krishi Vigyan Kendra helpline.'}
              </p>
            </div>
            <a 
              href="tel:18001801551" 
              className="w-full h-[46px] bg-[#e8960a] hover:bg-[#c97f00] text-white rounded-[12px] font-bold text-[14px] flex items-center justify-center gap-2 active:scale-98 transition-all shadow-md"
            >
              📞 KVK Helpline: 1800-180-1551
            </a>
          </div>

        </section>

      </main>

    </div>
  );
};

export default DiseaseDetail;
