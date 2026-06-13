import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, VolumeX, ShieldCheck, Sprout, Compass, HelpCircle, Loader2, Sparkles } from 'lucide-react';
import { useLanguage } from '../../utils/i18n';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface Topic {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  description: string;
  benefits: string[];
  recipe?: string[];
  tips?: string[];
}

const NaturalFarming: React.FC = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  
  const [activeTab, setActiveTab] = useState<'education' | 'recipes' | 'consult'>('education');
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);
  const [customQuery, setCustomQuery] = useState('');
  const [consultResponse, setConsultResponse] = useState<string | null>(null);
  const [isConsultLoading, setIsConsultLoading] = useState(false);
  const [isPlayingConsult, setIsPlayingConsult] = useState(false);
  
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null);

  // Translations object tailored to agricultural dialects
  const localDict: Record<string, Record<string, any>> = {
    hi: {
      title: "प्राकृतिक खेती शिक्षा",
      subtitle: "मल्टी-लेवल फार्मिंग और जैविक तरीके",
      tab_edu: "मल्टी-लेवल क्रॉपिंग",
      tab_recipes: "जैविक खाद/कीटनाशक",
      tab_consult: "एआई जैविक सलाहकार",
      listen_btn: "आवाज़ में सुनें",
      stop_btn: "रुकें",
      back_home: "मुख्य पृष्ठ पर जाएं",
      ingredients_title: "सामग्री की सूची:",
      steps_title: "बनाने की विधि:",
      benefits_title: "मुख्य फायदे:",
      ask_consultant_title: "एआई जैविक सलाहकार से पूछें",
      ask_placeholder: "जैसे: जीवामृत के फायदे या टमाटर में कीट नियंत्रण...",
      ask_btn: "सलाह लें ✨",
      preset_q1: "जीवामृत बनाने की सही विधि क्या है?",
      preset_q2: "टमाटर के साथ सह-फसल (Companion Crops) कौन सी लगाएं?",
      preset_q3: "पंच-स्तरीय खेती (5-Layer Cropping) कैसे शुरू करें?",
      consult_warning: "यह सलाह आपके स्थान और फसलों के लिए अनुकूलित है।",
      kvk_cite: "किसी भी आपातकालीन सहायता के लिए केवीके हेल्पलाइन 1800-180-1551 पर कॉल करें।"
    },
    hl: {
      title: "Natural Farming Education",
      subtitle: "Multi-level farming aur organic tarike",
      tab_edu: "Multi-Level Cropping",
      tab_recipes: "Organic Recipes",
      tab_consult: "AI Organic Consultant",
      listen_btn: "Voice mein sunein",
      stop_btn: "Rokein",
      back_home: "Home par jayein",
      ingredients_title: "Ingredietns ki list:",
      steps_title: "Banane ki vidhi:",
      benefits_title: "Mukhy fayde:",
      ask_consultant_title: "AI Organic Advisor se puchein",
      ask_placeholder: "Jaise: Jeevamrit ke fayde ya tamatar ke keet...",
      ask_btn: "Sujhav lein ✨",
      preset_q1: "Jeevamrit banane ki sahi vidhi kya hai?",
      preset_q2: "Tamatar ke sath companion crop kaunsi lagayein?",
      preset_q3: "5-Layer Cropping kaise shuru karein?",
      consult_warning: "Yeh sujhav aapki crops aur state ke hisab se hai.",
      kvk_cite: "Emergency help ke liye KVK helpline 1800-180-1551 par call karein."
    },
    en: {
      title: "Natural Farming Education",
      subtitle: "Multi-level farming & organic inputs",
      tab_edu: "Multi-Level Cropping",
      tab_recipes: "Organic Formulations",
      tab_consult: "AI Organic Expert",
      listen_btn: "Listen Out Loud",
      stop_btn: "Stop",
      back_home: "Go to Home",
      ingredients_title: "Required Ingredients:",
      steps_title: "Preparation Steps:",
      benefits_title: "Key Benefits:",
      ask_consultant_title: "Ask AI Organic Advisor",
      ask_placeholder: "E.g., How to prepare Jeevamrit or companion crop for Onion...",
      ask_btn: "Get Advice ✨",
      preset_q1: "How to prepare Jeevamrit step-by-step?",
      preset_q2: "What are the best companion crops for Tomato?",
      preset_q3: "Explain the 5-Layer Cropping Model.",
      consult_warning: "This recommendation is grounded in organic manuals.",
      kvk_cite: "For detailed support, call Krishi Vigyan Kendra (KVK) at 1800-180-1551."
    },
    mr: {
      title: "नैसर्गिक शेती शिक्षण",
      subtitle: "बहुस्तरीय शेती आणि सेंद्रिय पद्धती",
      tab_edu: "बहुस्तरीय पीक पद्धत",
      tab_recipes: "सेंद्रिय खत व कीटकनाशके",
      tab_consult: "एआय सेंद्रिय सल्लागार",
      listen_btn: "आवाजात ऐका",
      stop_btn: "थांबा",
      back_home: "मुख्य पानावर जा",
      ingredients_title: "लागणारे साहित्य:",
      steps_title: "बनवण्याची कृती:",
      benefits_title: "मुख्य फायदे:",
      ask_consultant_title: "एआय सेंद्रिय सल्लागाराला विचारा",
      ask_placeholder: "जसे: जीवामृत बनवण्याची पद्धत किंवा कीड नियंत्रण...",
      ask_btn: "सल्ला मिळवा ✨",
      preset_q1: "जीवामृत बनवण्याची अचूक पद्धत कोणती?",
      preset_q2: "टोमॅटो सोबत कोणती आंतरपिके घ्यावीत?",
      preset_q3: "५-स्तरीय शेती कशी सुरू करावी?",
      consult_warning: "हा सल्ला सेंद्रिय नियमावलीवर आधारित आहे.",
      kvk_cite: "अधिक माहितीसाठी केव्हीके (KVK) हेल्पलाईन १८००-१८०-१५५१ वर संपर्क साधा."
    },
    gu: {
      title: "પ્રાકૃતિક ખેતી શિક્ષણ",
      subtitle: "મલ્ટી-લેવલ ફાર્મિંગ અને ઓર્ગેનિક પદ્ધતિ",
      tab_edu: "મલ્ટી-લેવલ ક્રોપિંગ",
      tab_recipes: "સેન્દ્રિય ખાતર અને દવાઓ",
      tab_consult: "એઆઈ ઓર્ગેનિક સલાહકાર",
      listen_btn: "અવાજ સાંભળો",
      stop_btn: "બંધ કરો",
      back_home: "મુખ્ય પૃષ્ઠ પર જાઓ",
      ingredients_title: "જરૂરી સામગ્રી:",
      steps_title: "બનાવવાની રીત:",
      benefits_title: "મુખ્ય ફાયદાઓ:",
      ask_consultant_title: "એઆઈ ઓર્ગેનિક સલાહકારને પૂછો",
      ask_placeholder: "જેમ કે: જીવામૃતના ફાયદા અથવા ટમેટાની જીવાત...",
      ask_btn: "સલાહ મેળવો ✨",
      preset_q1: "જીવામૃત બનાવવાની સાચી રીત કઈ છે?",
      preset_q2: "ટમેટા સાથે કયો સહ-પાક (Companion Crop) વાવવો?",
      preset_q3: "પંચ-સ્તરીય ખેતી કેવી રીતે શરૂ કરવી?",
      consult_warning: "આ સલાહ સ્થાનિક ઓર્ગેનિક પદ્ધતિઓ પર આધારિત છે.",
      kvk_cite: "કોઈપણ સહાય માટે KVK હેલ્પલાઈન 1800-180-1551 પર સંપર્ક કરો."
    },
    pa: {
      title: "ਕੁਦਰਤੀ ਖੇਤੀ ਸਿੱਖਿਆ",
      subtitle: "ਮਲਟੀ-ਲੈਵਲ ਫਾਰਮਿੰਗ ਅਤੇ ਜੈਵਿਕ ਤਰੀਕੇ",
      tab_edu: "ਮਲਟੀ-ਲੈਵਲ ਕ੍ਰੌਪਿੰਗ",
      tab_recipes: "ਜੈਵਿਕ ਖਾਦ ਅਤੇ ਕੀਟਨਾਸ਼ਕ",
      tab_consult: "ਏਆਈ ਜੈਵਿਕ ਸਲਾਹਕਾਰ",
      listen_btn: "ਆਵਾਜ਼ ਵਿੱਚ ਸੁਣੋ",
      stop_btn: "ਰੋਕੋ",
      back_home: "ਮੁੱਖ ਪੰਨੇ 'ਤੇ ਜਾਓ",
      ingredients_title: "ਲੋੜੀਂਦੀ ਸਮੱਗਰੀ:",
      steps_title: "ਬਣਾਉਣ ਦੀ ਵਿਧੀ:",
      benefits_title: "ਮੁੱਖ ਫਾਇਦੇ:",
      ask_consultant_title: "ਏਆਈ ਜੈਵਿਕ ਸਲਾਹਕਾਰ ਤੋਂ ਪੁੱਛੋ",
      ask_placeholder: "ਜਿਵੇਂ: ਜੀਵਾਮ੍ਰਿਤ ਬਣਾਉਣ ਦੀ ਵਿਧੀ ਜਾਂ ਕੀੜੇ ਦੀ ਰੋਕਥਾਮ...",
      ask_btn: "ਸਲਾਹ ਲਓ ✨",
      preset_q1: "ਜੀਵਾਮ੍ਰਿਤ ਬਣਾਉਣ ਦਾ ਸਹੀ ਤਰੀਕਾ ਕੀ ਹੈ?",
      preset_q2: "ਟਮਾਟਰ ਦੇ ਨਾਲ ਕਿਹੜੀ ਸਹਿ-ਫ਼ਸਲ ਬੀਜੀਏ?",
      preset_q3: "ਪੰਜ-ਪੱਧਰੀ ਖੇਤੀ ਕਿਵੇਂ ਸ਼ੁਰੂ ਕਰੀਏ?",
      consult_warning: "ਇਹ ਸਲਾਹ ਜੈਵਿਕ ਖੇਤੀ ਮੈਨੂਅਲ 'ਤੇ ਅਧਾਰਤ ਹੈ।",
      kvk_cite: "ਕਿਸੇ ਵੀ ਮਦਦ ਲਈ KVK ਹੈਲਪਲਾਈਨ 1800-180-1551 'ਤੇ ਕਾਲ ਕਰੋ।"
    }
  };

  const tLocal = (key: string) => {
    const activeLang = lang || 'hi';
    const dict = localDict[activeLang] || localDict['hi'];
    return dict[key] || localDict['hi'][key] || key;
  };

  // Content databases based on selected language
  const getEducationTopics = (): Topic[] => {
    if (lang === 'hi' || lang === 'hl') {
      return [
        {
          id: 'multilevel',
          title: 'पंच-स्तरीय खेती (5-Layer Cropping)',
          subtitle: 'सीमित जमीन से 5 गुना मुनाफा और प्राकृतिक सुरक्षा',
          icon: '🌳',
          description: 'इस विधि में जमीन के एक ही टुकड़े पर अलग-अलग ऊंचाई वाले पौधे एक साथ उगाए जाते हैं। यह सूर्य की रोशनी और जमीन के पोषण का सर्वोत्तम उपयोग करता है।',
          benefits: [
            'स्तर १: बड़े पेड़ (जैसे नारियल, आम) जो ऊपरी छाया देते हैं।',
            'स्तर २: मध्यम पेड़ (जैसे केला, पपीता) जो आंशिक धूप पसंद करते हैं।',
            'स्तर ३: झाड़ीदार पौधे (जैसे नींबू, अरहर) जो कम ऊंचाई पर फैलते हैं।',
            'स्तर ४: शाकीय फसलें (जैसे टमाटर, मिर्च, अदरक) जो निचली जमीन को ढकती हैं।',
            'स्तर ५: कंद फसलें (जैसे हल्दी, आलू, मूली) जो जमीन के नीचे बढ़ती हैं।'
          ]
        },
        {
          id: 'companion',
          title: 'सह-फसली चक्र (Companion Planting)',
          subtitle: 'मित्र फसलों के साथ प्राकृतिक कीट नियंत्रण',
          icon: '🌾',
          description: 'ऐसी फसलों का चुनाव जो एक-दूसरे की वृद्धि में मदद करती हैं, नाइट्रोजन का स्थिरीकरण करती हैं, और हानिकारक कीटों को दूर रखती हैं।',
          benefits: [
            'गेंदा और टमाटर: गेंदा की गंध टमाटर के हानिकारक कीटों (Nematodes) को दूर रखती है।',
            'मक्का और बीन्स: मक्का बीन्स की बेलों को सहारा देता है, और बीन्स हवा से नाइट्रोजन खींचकर मक्का को देता है।',
            'प्याज और गाजर: प्याज की महक गाजर की मक्खियों को दूर भगाती है।'
          ]
        }
      ];
    } else if (lang === 'mr') {
      return [
        {
          id: 'multilevel',
          title: '५-स्तरीय बहुस्तरीय पीक पद्धत (5-Layer Cropping)',
          subtitle: 'कमी जागेत ५ पट अधिक नफा आणि नैसर्गिक संरक्षण',
          icon: '🌳',
          description: 'या पद्धतीमध्ये जमिनीच्या एकाच तुकड्यावर वेगवेगळ्या उंचीची झाडे आणि पिके एकाच वेळी लावली जातात, ज्यामुळे ऊर्जेचा आणि सूर्यप्रकाशाचा उत्तम वापर होतो.',
          benefits: [
            'स्तर १: मोठे वृक्ष (उदा. नारळ, आंबा) जे वरून सावली देतात.',
            'स्तर २: मध्यम झाडे (उदा. केळी, पपई) जे अर्ध-सावलीत वाढतात.',
            'स्तर ३: लहान झुडपे (उदा. लिंबू, तूर) जी जमिनीच्या जवळ पसरतात.',
            'स्तर ४: लहान पिके (उदा. टोमॅटो, वांगी, आले) जी जमीन झाकून घेतात.',
            'स्तर ५: कंदपिके (उदा. हळद, बटाटा, गाजर) जी जमिनीच्या खाली वाढतात.'
          ]
        },
        {
          id: 'companion',
          title: 'सह-पीक पद्धत (Companion Planting)',
          subtitle: 'मित्र पिकांच्या मदतीने नैसर्गिक कीड नियंत्रण',
          icon: '🌾',
          description: 'एकमेकांच्या वाढीला पूरक असणारी पिके सोबत लावल्यास जमिनीचा पोत सुधारतो आणि रासायनिक फवारणीशिवाय कीड नियंत्रण होते.',
          benefits: [
            'झेंडू आणि टोमॅटो: झेंडूच्या मुळांमुळे टोमॅटोवरील हानिकारक सुत्रकृमी (Nematodes) नष्ट होतात.',
            'मका आणि घेवडा: मका घेवड्याच्या वेलीला आधार देतो आणि घेवडा जमिनीला नत्र (Nitrogen) पुरवतो.',
            'कांदा आणि गाजर: कांद्याच्या वासामुळे गाजरावरील माश्या पळून जातात.'
          ]
        }
      ];
    } else if (lang === 'gu') {
      return [
        {
          id: 'multilevel',
          title: 'પંચ-સ્તરીય ખેતી મોડલ (5-Layer Cropping)',
          subtitle: 'મર્યાદિત જમીનમાંથી 5 ગણો નફો અને કુદરતી રક્ષણ',
          icon: '🌳',
          description: 'આ પદ્ધતિમાં જમીનના એક જ ટુકડા પર જુદી જુદી ઊંચાઈ ધરાવતા પાકો એકસાથે વાવવામાં આવે છે, જેથી સૂર્યપ્રકાશ અને જમીનના પોષક તત્વોનો શ્રેષ્ઠ ઉપયોગ થાય છે.',
          benefits: [
            'સ્તર ૧: ઊંચા વૃક્ષો (જેમ કે નાળિયેરી, આંબો) જે ઉપરથી છાયડો આપે છે.',
            'સ્તર ૨: મધ્યમ કદના વૃક્ષો (જેમ કે કેળા, પપૈયા) જે અંશતઃ છાયામાં વધે છે.',
            'સ્તર ૩: ઝાડીવાળા છોડ (જેમ કે લીંબુ, તુવેર) જે નાની ઊંચાઈ પર ફેલાય છે.',
            'સ્તર ૪: શાકભાજી પાકો (જેમ કે ટમેટા, મરચાં, આદુ) જે જમીનને ઢાંકે છે.',
            'સ્તર ૫: કંદમૂળ પાકો (જેમ કે હળદર, બટાકા, ડુંગળી) જે જમીનની નીચે વધે છે.'
          ]
        },
        {
          id: 'companion',
          title: 'સહ-પાક પદ્ધતિ (Companion Planting)',
          subtitle: 'મિત્ર પાકો સાથે કુદરતી જીવાત નિયંત્રણ',
          icon: '🌾',
          description: 'એવા પાકોની પસંદગી જે એકબીજાના વિકાસમાં મદદ કરે છે, નાઇટ્રોજનનું ઉત્પાદન વધારે છે, અને રાસાયણિક દવા વિના જીવાત અટકાવે છે.',
          benefits: [
            'ગલગોટા અને ટમેટા: ગલગોટાની સુગંધ ટમેટામાં જીવાતોને અટકાવે છે.',
            'મકાઈ અને કઠોળ: મકાઈ કઠોળના વેલાને ટેકો આપે છે, અને કઠોળ જમીનમાં નાઇટ્રોજન ઉમેરે છે.',
            'ડુંગળી અને ગાજર: ડુંગળીની ગંધ ગાજરની જીવાતોને દૂર રાખે છે.'
          ]
        }
      ];
    } else if (lang === 'pa') {
      return [
        {
          id: 'multilevel',
          title: 'ਪੰਜ-ਪੱਧਰੀ ਖੇਤੀ (5-Layer Cropping)',
          subtitle: 'ਸੀਮਤ ਜ਼ਮੀਨ ਤੋਂ 5 ਗੁਣਾ ਵੱਧ ਮੁਨਾਫ਼ਾ ਅਤੇ ਕੁਦਰਤੀ ਸੁਰੱਖਿਆ',
          icon: '🌳',
          description: "ਇਸ ਵਿਧੀ ਰਾਹੀਂ ਜ਼ਮੀਨ ਦੇ ਇੱਕੋ ਟੁਕੜੇ 'ਤੇ ਵੱਖ-ਵੱਖ ਉਚਾਈ ਵਾਲੇ ਬੂਟੇ ਇਕੱਠੇ ਉਗਾਏ ਜਾਂਦੇ ਹਨ। ਇਹ ਧੁੱਪ ਅਤੇ ਜ਼ਮੀਨ ਦੇ ਪੋਸ਼ਕ ਤੱਤਾਂ ਦੀ ਸਭ ਤੋਂ ਵਧੀਆ ਵਰਤੋਂ ਕਰਦਾ ਹੈ।",
          benefits: [
            'ਪੱਧਰ ૧: ਵੱਡੇ ਦਰੱਖਤ (ਜਿਵੇਂ ਨਾਰੀਅਲ, ਅੰਬ) ਜੋ ਉੱਪਰੋਂ ਛਾਂ ਦਿੰਦੇ ਹਨ।',
            'ਪੱਧਰ ૨: ਦਰਮਿਆਨੇ ਬੂਟੇ (ਜਿਵੇਂ ਕੇਲਾ, ਪਪੀਤਾ) ਜੋ ਘੱਟ ਧੁੱਪ ਪਸੰਦ ਕਰਦੇ ਹਨ।',
            'ਪੱਧਰ ૩: ਝਾੜੀਦਾਰ ਬੂਟੇ (ਜਿਵੇਂ ਨਿੰਬੂ, ਅਰਹਰ) ਜੋ ਹੇਠਲੇ ਹਿੱਸੇ ਵਿੱਚ ਫੈਲਦੇ ਹਨ।',
            'ਪੱਧਰ ੪: ਹਰੀਆਂ ਫ਼ਸਲਾਂ (ਜਿਵੇਂ ਟਮਾਟਰ, ਮਿਰਚ, ਅਦਰਕ) ਜੋ ਜ਼ਮੀਨ ਨੂੰ ਢੱਕਦੀਆਂ ਹਨ।',
            'ਪੱਧਰ ੫: ਕੰਦ ਫ਼ਸਲਾਂ (ਜਿਵੇਂ ਹਲਦੀ, ਆਲੂ, ਮੂਲੀ) ਜੋ ਜ਼ਮੀਨ ਦੇ ਹੇਠਾਂ ਵਧਦੀਆਂ ਹਨ।'
          ]
        },
        {
          id: 'companion',
          title: 'ਸਹਿ-ਫ਼ਸਲੀ ਚੱਕਰ (Companion Planting)',
          subtitle: 'ਮਿੱਤਰ ਫ਼ਸਲਾਂ ਨਾਲ ਕੁਦਰਤੀ ਕੀਟ ਰੋਕਥਾਮ',
          icon: '🌾',
          description: 'ਅਜਿਹੀਆਂ ਫ਼ਸਲਾਂ ਦੀ ਚੋਣ ਜੋ ਇੱਕ ਦੂਜੇ ਦੇ ਵਾਧੇ ਵਿੱਚ ਮਦਦ ਕਰਦੀਆਂ ਹਨ, ਨਾਈਟ੍ਰੋਜਨ ਨੂੰ ਵਧਾਉਂਦੀਆਂ ਹਨ, ਅਤੇ ਨੁਕਸਾਨਦੇਹ ਕੀੜਿਆਂ ਨੂੰ ਦੂਰ ਰੱਖਦੀਆਂ ਹਨ।',
          benefits: [
            'ਗੇਂਦਾ ਅਤੇ ਟਮਾਟਰ: ਗੇਂਦੇ ਦੀ ਖੁਸ਼ਬੂ ਟਮਾਟਰ ਦੇ ਨੁਕਸਾਨਦੇਹ ਕੀੜਿਆਂ (Nematodes) ਨੂੰ ਦੂਰ ਰੱਖਦੀ ਹੈ।',
            'ਮੱਕੀ ਅਤੇ ਫ਼ਲੀਆਂ: ਮੱਕੀ ਫ਼ਲੀਆਂ ਦੀ ਵੇਲ ਨੂੰ ਸਹਾਰਾ ਦਿੰਦੀ ਹੈ ਅਤੇ ਫ਼ਲੀਆਂ ਹਵਾ ਤੋਂ ਨਾਈਟ੍ਰੋਜਨ ਖਿੱਚ ਕੇ ਮੱਕੀ ਨੂੰ ਦਿੰਦੀਆਂ ਹਨ।',
            'ਪਿਆਜ਼ ਅਤੇ ਗਾਜਰ: ਪਿਆਜ਼ ਦੀ ਤੇਜ਼ ਮਹਿਕ ਗਾਜਰ ਦੀਆਂ ਮੱਖੀਆਂ ਨੂੰ ਦੂਰ ਰੱਖਦੀ ਹੈ।'
          ]
        }
      ];
    } else {
      // English
      return [
        {
          id: 'multilevel',
          title: '5-Layer Cropping Model',
          subtitle: 'Maximize returns and biodiversity per acre',
          icon: '🌳',
          description: 'An agroforestry model where plants of different heights and root depths are grown together to make 100% usage of sunlight, space, and soil nutrition.',
          benefits: [
            'Layer 1: Canopy Trees (e.g. Coconut, Mango) providing tall shade.',
            'Layer 2: Understory Trees (e.g. Banana, Papaya) utilizing partial sunlight.',
            'Layer 3: Shrub Layer (e.g. Lemon, Pigeon pea) occupying intermediate height.',
            'Layer 4: Herbaceous Layer (e.g. Tomato, Chilli, Ginger) covering the ground.',
            'Layer 5: Rhizosphere Layer (e.g. Turmeric, Potato, Radish) harvesting underground space.'
          ]
        },
        {
          id: 'companion',
          title: 'Companion Planting Matrix',
          subtitle: 'Natural pest defense and nitrogen fixing',
          icon: '🌾',
          description: 'Growing complementary crops side-by-side to improve soil structure, repel pests naturally, and stimulate root development.',
          benefits: [
            'Marigold & Tomato: Marigold roots secrete nematicides that protect tomato plants from nematodes.',
            'Maize & Beans: Maize provides physical structural support; beans fix atmospheric nitrogen for maize.',
            'Onion & Carrot: Strong onion scent acts as a natural mask repelling carrot rust flies.'
          ]
        }
      ];
    }
  };

  const getRecipeTopics = (): Topic[] => {
    if (lang === 'hi' || lang === 'hl') {
      return [
        {
          id: 'jeevamrit',
          title: 'जीवामृत (Jeevamrut)',
          subtitle: 'मिट्टी के जीवाणुओं को बढ़ाने वाला अमृत टॉनिक',
          icon: '🧪',
          description: 'मिट्टी में उपयोगी जीवाणुओं की संख्या को कई गुना करने वाला प्राकृतिक तरल घोल जो पौधों की रोग प्रतिरोधक क्षमता को बढ़ाता है।',
          benefits: [
            'यह रासायनिक उर्वरक (Urea/DAP) का सबसे शक्तिशाली और सुरक्षित जैविक विकल्प है।',
            'यह मिट्टी के केंचुओं और सूक्ष्मजीवों को सक्रिय करता है।'
          ],
          recipe: [
            'देशी गाय का गोबर: १० किलो',
            'देशी गाय का मूत्र: ५ से १० लीटर',
            'गुड़ (पुराना): २ किलो',
            'बेसन (चने का आटा): २ किलो',
            'सजीव मिट्टी (बरगद के पेड़ के नीचे की): मुट्ठी भर',
            'पानी: २०० लीटर'
          ],
          tips: [
            'इन सभी सामग्रियों को एक बड़े प्लास्टिक ड्रम में डालकर लकड़ी के डंडे से अच्छी तरह मिला लें।',
            'ड्रम को जूट की बोरी से ढकें और दिन में दो बार हिलाएं।',
            '७ दिनों में जीवामृत तैयार हो जाता है। इसे पानी के साथ सिंचाई में इस्तेमाल करें।'
          ]
        },
        {
          id: 'neemastra',
          title: 'नीमास्त्र (Neemastra)',
          subtitle: 'चूसने वाले कीटों और रेंगने वाले कीड़ों के लिए जैविक नियंत्रण',
          icon: '🌿',
          description: 'पत्तियों का रस चूसने वाले कीटों, सफेद मक्खी, और हल्के कीटों को प्राकृतिक रूप से नियंत्रित करने के लिए ब्रह्मास्त्र।',
          benefits: [
            'चूसने वाले कीटों और छोटे कैटरपिलर का १००% जैविक नियंत्रण।',
            'फसल के पत्तों को जहरीला नहीं बनाता और मित्र कीटों को नहीं मारता।'
          ],
          recipe: [
            'देशी गाय का मूत्र: ५ लीटर',
            'देशी गाय का गोबर: १ किलो',
            'नीम की पत्तियां और टहनियां (कुचली हुई): ५ किलो',
            'पानी: १०० लीटर'
          ],
          tips: [
            'सभी को ड्रम में मिलाकर डंडे से चलाएं।',
            '४८ घंटे (२ दिन) के लिए छांव में रखें। दिन में दो बार चलाएं।',
            'कपड़े से छानकर सीधे छिड़काव करें। (पानी मिलाने की जरूरत नहीं है)।'
          ]
        },
        {
          id: 'buttermilk',
          title: 'खट्टी छाछ स्प्रे (Sour Buttermilk)',
          subtitle: 'फफूंदजन्य रोगों (Fungal Diseases) की अचूक दवा',
          icon: '🥛',
          description: 'अगेती/पछेती झुलसा, पीला रतुआ और फफूंद (Fungus) की रोकथाम के लिए तांबे के संपर्क में रखी छाछ का छिड़काव।',
          benefits: [
            'यह फफूंदनाशक (Fungicide) रसायनों का सर्वोत्तम जैविक विकल्प है।',
            'फसल को हरा-भरा और स्वस्थ रखता है।'
          ],
          recipe: [
            'देशी गाय की छाछ (ताजा/खट्टी): ५ लीटर',
            'तांबे का टुकड़ा (जैसे तांबे का तार या बर्तन): १ नग',
            'पानी: १०० लीटर'
          ],
          tips: [
            'छाछ को मिट्टी के बर्तन या ड्रम में रखें और तांबे का टुकड़ा उसमें डाल दें।',
            'बर्तन को बंद करके १० से १५ दिन के लिए रख दें। जब छाछ हरी हो जाए तो तांबा निकाल लें।',
            '१ लीटर तैयार खट्टी छाछ को १५ लीटर पानी में मिलाकर फसल पर छिड़काव करें।'
          ]
        }
      ];
    } else if (lang === 'mr') {
      return [
        {
          id: 'jeevamrit',
          title: 'जीवामृत (Jeevamrut)',
          subtitle: 'जमिनीतील जिवाणू वाढवणारे नैसर्गिक अमृत',
          icon: '🧪',
          description: 'जमिनीतील सूक्ष्मजीव आणि गांडुळांची संख्या वाढवण्यासाठी अत्यंत प्रभावी सेंद्रिय मिश्रण, जे पिकांची वाढ वेगाने करते.',
          benefits: [
            'युरिया आणि डीएपी या रासायनिक खतांना सर्वोत्तम पर्याय.',
            'मातीची सुपीकता आणि पाणी धरून ठेवण्याची क्षमता वाढते.'
          ],
          recipe: [
            'देशी गायीचे शेण: १० किलो',
            'देशी गायीचे गोमूत्र: ५ ते १० लीटर',
            'गूळ (सेंद्रिय/जुना): २ किलो',
            'बेसन (हरभरा डाळीचे पीठ): २ किलो',
            'वड किंवा पिंपळाच्या झाडाखालची माती: मूठभर',
            'पाणी: २०० लीटर'
          ],
          tips: [
            'सर्व साहित्य एका प्लास्टिक ड्रममध्ये एकत्र करून लाकडी काठीने उजवीकडून डावीकडे ढवळावे.',
            'ड्रम गोणपाटाने झाकून ठेवावा आणि दिवसातून दोनदा हलवावा.',
            '७ दिवसांत जीवामृत तयार होते. बागायती पिकांना पाण्यासोबत द्यावे.'
          ]
        },
        {
          id: 'neemastra',
          title: 'नीमास्त्र (Neemastra)',
          subtitle: 'रस शोषणाऱ्या किडींवर आणि अळ्यांवर मात करणारे नैसर्गिक अस्त्र',
          icon: '🌿',
          description: 'पांढरी माशी, मावा, तुडतुडे आणि छोट्या अळ्यांचे नियंत्रण करण्यासाठी अत्यंत प्रभावी घरगुती औषध.',
          benefits: [
            'रस शोषणाऱ्या किडींचे १००% सेंद्रिय नियंत्रण.',
            'मित्रा किटकांना इजा न करता पिकांचे रक्षण करते.'
          ],
          recipe: [
            'देशी गायीचे गोमूत्र: ५ लीटर',
            'देशी गायीचे शेण: १ किलो',
            'कडुलिंबाचा पाला (बारीक कुटलेला): ५ किलो',
            'पाणी: १०० लीटर'
          ],
          tips: [
            'सर्व साहित्य ड्रममध्ये टाकून काठीने व्यवस्थित ढवळावे.',
            '४८ तास (२ दिवस) सावलीत ठेवावे आणि दिवसातून दोनदा ढवळावे.',
            'कपड्याने गाळून घेऊन पिकांवर थेट फवारावे.'
          ]
        },
        {
          id: 'buttermilk',
          title: 'ताक व तांब्याचे द्रावण (Sour Buttermilk)',
          subtitle: 'बुरशीजन्य रोगांवर (Fungal Diseases) रामबाण उपाय',
          icon: '🥛',
          description: 'करपा, तांबेरा आणि भुरी यांसारख्या बुरशीजन्य रोगांना रोखण्यासाठी जुन्या ताकाचा वापर.',
          benefits: [
            'केमिकल बुरशीनाशकांना (Fungicides) सेंद्रिय पर्याय.',
            'पिकांना ताकद देते व पाने हिरवीगार ठेवते.'
          ],
          recipe: [
            'देशी गायीचे ताक: ५ लीटर',
            'तांब्याची पट्टी किंवा जुने तांब्याचे भांडे: १ नग',
            'पाणी: १०० लीटर'
          ],
          tips: [
            'ताक मातीच्या भांड्यात ठेवून त्यात तांब्याची पट्टी टाकावी.',
            '१० ते १५ दिवस भांडे बंद ठेवावे. ताक हिरवट रंगाचे झाल्यावर तांबे काढून घ्यावे.',
            '१ लीटर ताक १५ लीटर पाण्यात मिळवून फवारणी करावी.'
          ]
        }
      ];
    } else {
      // English
      return [
        {
          id: 'jeevamrit',
          title: 'Jeevamrut',
          subtitle: 'The microbial culture for soil health restoration',
          icon: '🧪',
          description: 'A rich liquid organic formulation containing millions of beneficial bacteria which stimulates earthworms and improves soil structure.',
          benefits: [
            'Replaces chemical Urea & DAP fertilizers completely.',
            'Acts as a biological agent to release locked-up phosphate and potassium in soil.'
          ],
          recipe: [
            'Fresh Cow Dung: 10 kg',
            'Cow Urine: 5 to 10 liters',
            'Jaggery (old, chemical-free): 2 kg',
            'Pulse Flour (besan): 2 kg',
            'Fertile soil (from under a Banyan tree): A handful',
            'Water: 200 liters'
          ],
          tips: [
            'Mix all ingredients in a 200L plastic drum with a wooden stick.',
            'Cover with a wet gunny bag and stir clockwise twice a day.',
            'Ready in 7 days. Apply during watering/irrigation close to the roots.'
          ]
        },
        {
          id: 'neemastra',
          title: 'Neemastra',
          subtitle: 'Organic bio-pesticide for sucking pests',
          icon: '🌿',
          description: 'A powerful bio-formulation using neem leaves and cow urine to control leaf miners, whiteflies, thrips, and aphids.',
          benefits: [
            'Excellent preventative organic cover for sucking pests.',
            'Harmless to honeybees, ladybirds, and other farmer-friendly predators.'
          ],
          recipe: [
            'Cow Urine: 5 liters',
            'Cow Dung: 1 kg',
            'Crushed Neem Leaves: 5 kg',
            'Water: 100 liters'
          ],
          tips: [
            'Mix all items in a container and stir.',
            'Keep in shade for 48 hours. Stir twice daily.',
            'Filter with a clean muslin cloth and spray directly on infected foliage.'
          ]
        },
        {
          id: 'buttermilk',
          title: 'Sour Buttermilk Spray',
          subtitle: 'Traditional fungicide against blights and rusts',
          icon: '🥛',
          description: 'A fermented copper-treated buttermilk mixture used to prevent downy mildew, leaf curl, and rust diseases.',
          benefits: [
            'Cheap, highly effective replacement for toxic copper oxychloride fungicides.',
            'Increases plant vigor and helps leaf chlorophyll development.'
          ],
          recipe: [
            'Sour Buttermilk: 5 liters',
            'A copper piece or wire: 1 piece',
            'Water: 100 liters'
          ],
          tips: [
            'Store buttermilk in a clay pot, drop the copper piece inside.',
            'Seal the pot and ferment for 10-15 days until the liquid turns greenish.',
            'Dilute 1 liter of this mixture in 15 liters of water and spray.'
          ]
        }
      ];
    }
  };

  const handleSynthesizeTopic = async (topic: Topic) => {
    const speechKey = `recipe_readout_${topic.id}`;
    if (isPlayingAudio === speechKey) {
      if (playbackAudioRef.current) {
        playbackAudioRef.current.pause();
      }
      setIsPlayingAudio(null);
      return;
    }

    setIsPlayingAudio(speechKey);

    try {
      const isEnglish = lang === 'en';
      let textToSpeak = '';
      if (isEnglish) {
        textToSpeak = `${topic.title}. ${topic.subtitle}. Description: ${topic.description}. Benefits: ${topic.benefits.join('. ')}`;
        if (topic.recipe) {
          textToSpeak += `. Ingredients needed: ${topic.recipe.join(', ')}. Steps to prepare: ${topic.tips?.join(', ')}`;
        }
      } else {
        textToSpeak = `${topic.title}। ${topic.subtitle}। विवरण: ${topic.description}। मुख्य फायदे: ${topic.benefits.join('। ')}`;
        if (topic.recipe) {
          textToSpeak += `। सामग्री सूची: ${topic.recipe.join('। ')}। बनाने की विधि: ${topic.tips?.join('। ')}`;
        }
      }

      const res = await fetch(`${API_BASE_URL}/api/voice/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSpeak, lang: lang })
      });
      
      if (!res.ok) throw new Error();
      
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
            setIsPlayingAudio(null);
          };
        })
        .catch(() => {
          setIsPlayingAudio(null);
        });
    } catch (e) {
      console.error(e);
      setIsPlayingAudio(null);
    }
  };

  const handleAskConsultant = async (queryText: string) => {
    if (!queryText.trim()) return;
    setIsConsultLoading(true);
    setConsultResponse(null);
    setIsPlayingConsult(false);

    if (playbackAudioRef.current) {
      playbackAudioRef.current.pause();
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/voice/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: queryText + " (Please keep response grounded and organic. State KVK helpline: 1800-180-1551. Answer should be under 120 words.)",
          lang: lang
        })
      });

      if (!res.ok) throw new Error("Consultant service failed.");

      const data = await res.json();
      setConsultResponse(data.response);
    } catch (e) {
      console.error(e);
      setConsultResponse(lang === 'hi' || lang === 'hl' ? "क्षमा करें, सर्वर प्रतिक्रिया देने में असमर्थ है। कृपया पुनः प्रयास करें।" : "Sorry, could not fetch response. Please try again.");
    } finally {
      setIsConsultLoading(false);
    }
  };

  const toggleSpeakConsult = async () => {
    if (isPlayingConsult) {
      if (playbackAudioRef.current) {
        playbackAudioRef.current.pause();
      }
      setIsPlayingConsult(false);
      return;
    }

    if (!consultResponse) return;
    setIsPlayingConsult(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/voice/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: consultResponse, lang: lang })
      });

      if (!res.ok) throw new Error();

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
            setIsPlayingConsult(false);
          };
        })
        .catch(() => {
          setIsPlayingConsult(false);
        });
    } catch (e) {
      console.error(e);
      setIsPlayingConsult(false);
    }
  };

  useEffect(() => {
    return () => {
      if (playbackAudioRef.current) {
        playbackAudioRef.current.pause();
      }
    };
  }, []);

  return (
    <div className="flex flex-col bg-[#fbf9f3] min-h-screen pb-[88px] font-sans text-[#1b1c18]">
      
      {/* Header */}
      <div className="h-[56px] border-b border-[#eae8e2] bg-white px-4 flex items-center gap-3 shrink-0 sticky top-0 z-40">
        <button onClick={() => navigate('/')} className="text-gray-600 hover:text-black">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-[17px] font-bold text-black">{tLocal('title')}</h1>
          <p className="text-[11px] text-gray-500 font-semibold">{tLocal('subtitle')}</p>
        </div>
      </div>

      {/* Tabs Selector Navigation */}
      <div className="flex bg-white border-b border-[#eae8e2] sticky top-[56px] z-35 shrink-0">
        <button
          onClick={() => setActiveTab('education')}
          className={`flex-1 py-3 text-center text-[12px] font-bold border-b-2 transition-all ${
            activeTab === 'education' ? 'border-[#005129] text-[#005129]' : 'border-transparent text-gray-500'
          }`}
        >
          {tLocal('tab_edu')}
        </button>
        <button
          onClick={() => setActiveTab('recipes')}
          className={`flex-1 py-3 text-center text-[12px] font-bold border-b-2 transition-all ${
            activeTab === 'recipes' ? 'border-[#005129] text-[#005129]' : 'border-transparent text-gray-500'
          }`}
        >
          {tLocal('tab_recipes')}
        </button>
        <button
          onClick={() => setActiveTab('consult')}
          className={`flex-1 py-3 text-center text-[12px] font-bold border-b-2 transition-all ${
            activeTab === 'consult' ? 'border-[#005129] text-[#005129]' : 'border-transparent text-gray-500'
          }`}
        >
          {tLocal('tab_consult')}
        </button>
      </div>

      <div className="p-4 flex flex-col gap-4">

        {/* Tab 1: Multi-Level & Companion Cropping */}
        {activeTab === 'education' && (
          <div className="flex flex-col gap-4 animate-[fadeIn_0.2s_ease]">
            {getEducationTopics().map((topic) => (
              <div key={topic.id} className="w-full bg-white rounded-[16px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)] border border-[#eae8e2] flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex gap-2.5 items-center">
                    <span className="text-[24px]">{topic.icon}</span>
                    <div>
                      <h3 className="text-[15px] font-bold text-black leading-snug">{topic.title}</h3>
                      <p className="text-[11px] text-[#e8960a] font-bold">{topic.subtitle}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSynthesizeTopic(topic)}
                    className={`h-[28px] px-3.5 rounded-full font-bold text-[10px] flex items-center gap-1 transition-all ${
                      isPlayingAudio === `recipe_readout_${topic.id}`
                        ? 'bg-[#ba1a1a] text-white'
                        : 'bg-[#edf7f1] text-[#005129] border border-[#9ae9ae] hover:bg-[#d5ecd9]'
                    }`}
                  >
                    {isPlayingAudio === `recipe_readout_${topic.id}` ? <VolumeX size={11} /> : <Volume2 size={11} />}
                    {isPlayingAudio === `recipe_readout_${topic.id}` ? tLocal('stop_btn') : tLocal('listen_btn')}
                  </button>
                </div>

                <p className="text-[12.5px] text-gray-600 leading-relaxed bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  {topic.description}
                </p>

                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{tLocal('benefits_title')}</span>
                  <ul className="flex flex-col gap-2">
                    {topic.benefits.map((benefit, idx) => (
                      <li key={idx} className="text-[12.5px] text-gray-700 leading-relaxed flex items-start gap-2 bg-[#fcfbf7] p-2 rounded-lg border border-[#f0eee8]">
                        <Sprout size={15} className="text-[#005129] shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Organic Preparation Recipes */}
        {activeTab === 'recipes' && (
          <div className="flex flex-col gap-4 animate-[fadeIn_0.2s_ease]">
            {getRecipeTopics().map((recipe) => (
              <div key={recipe.id} className="w-full bg-white rounded-[16px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)] border border-[#eae8e2] flex flex-col gap-3.5">
                <div className="flex items-start justify-between">
                  <div className="flex gap-2.5 items-center">
                    <span className="text-[24px]">{recipe.icon}</span>
                    <div>
                      <h3 className="text-[15px] font-bold text-black leading-snug">{recipe.title}</h3>
                      <p className="text-[11px] text-[#005129] font-bold">{recipe.subtitle}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSynthesizeTopic(recipe)}
                    className={`h-[28px] px-3.5 rounded-full font-bold text-[10px] flex items-center gap-1 transition-all ${
                      isPlayingAudio === `recipe_readout_${recipe.id}`
                        ? 'bg-[#ba1a1a] text-white'
                        : 'bg-[#edf7f1] text-[#005129] border border-[#9ae9ae] hover:bg-[#d5ecd9]'
                    }`}
                  >
                    {isPlayingAudio === `recipe_readout_${recipe.id}` ? <VolumeX size={11} /> : <Volume2 size={11} />}
                    {isPlayingAudio === `recipe_readout_${recipe.id}` ? tLocal('stop_btn') : tLocal('listen_btn')}
                  </button>
                </div>

                <p className="text-[12.5px] text-gray-600 leading-relaxed border-l-4 border-[#005129] pl-2.5 italic">
                  {recipe.description}
                </p>

                {/* Ingredients */}
                {recipe.recipe && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold text-[#e8960a] uppercase tracking-wider">{tLocal('ingredients_title')}</span>
                    <div className="grid grid-cols-1 gap-1.5">
                      {recipe.recipe.map((ing, idx) => (
                        <div key={idx} className="bg-[#fffcf5] border border-[#ffeed4] px-3 py-1.5 rounded-lg text-[12px] font-semibold text-gray-700 flex items-center gap-2">
                          <Compass size={14} className="text-[#e8960a]" />
                          <span>{ing}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Steps */}
                {recipe.tips && (
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] font-bold text-[#005129] uppercase tracking-wider">{tLocal('steps_title')}</span>
                    <ol className="flex flex-col gap-2">
                      {recipe.tips.map((step, idx) => (
                        <li key={idx} className="text-[12.5px] text-gray-700 leading-relaxed flex items-start gap-2 bg-[#edf7f1] p-2 rounded-lg border border-[#d5ecd9]">
                          <span className="text-[#005129] font-bold mt-0.5">{idx + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Interactive RAG Advisor */}
        {activeTab === 'consult' && (
          <div className="flex flex-col gap-4 animate-[fadeIn_0.2s_ease]">
            <div className="w-full bg-white rounded-[16px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)] border border-[#eae8e2] flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Sparkles className="text-[#e8960a]" size={20} />
                <h3 className="text-[15px] font-bold text-black">{tLocal('ask_consultant_title')}</h3>
              </div>

              {/* Form Input */}
              <div className="flex flex-col gap-2">
                <textarea
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  placeholder={tLocal('ask_placeholder')}
                  className="w-full h-[88px] border border-[#eae8e2] rounded-[12px] p-3 text-[13px] text-black focus:outline-none focus:border-[#005129] bg-[#fbf9f3] resize-none"
                  disabled={isConsultLoading}
                />
                <button
                  onClick={() => handleAskConsultant(customQuery)}
                  disabled={isConsultLoading || !customQuery.trim()}
                  className="w-full h-[44px] bg-[#005129] hover:bg-[#1a6b3c] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-[12px] font-bold flex items-center justify-center gap-2 transition-all shadow-sm text-[13px]"
                >
                  {isConsultLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <span>{tLocal('ask_btn')}</span>
                  )}
                </button>
              </div>

              {/* Preset Quick Questions */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <HelpCircle size={12} /> Quick Suggestions
                </span>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setCustomQuery(tLocal('preset_q1'));
                      handleAskConsultant(tLocal('preset_q1'));
                    }}
                    className="w-full text-left bg-gray-50 hover:bg-[#fbf9f3] text-[12.5px] text-gray-700 font-semibold p-2.5 rounded-lg border border-gray-200 active:scale-99 transition-all truncate"
                  >
                    💡 {tLocal('preset_q1')}
                  </button>
                  <button
                    onClick={() => {
                      setCustomQuery(tLocal('preset_q2'));
                      handleAskConsultant(tLocal('preset_q2'));
                    }}
                    className="w-full text-left bg-gray-50 hover:bg-[#fbf9f3] text-[12.5px] text-gray-700 font-semibold p-2.5 rounded-lg border border-gray-200 active:scale-99 transition-all truncate"
                  >
                    💡 {tLocal('preset_q2')}
                  </button>
                  <button
                    onClick={() => {
                      setCustomQuery(tLocal('preset_q3'));
                      handleAskConsultant(tLocal('preset_q3'));
                    }}
                    className="w-full text-left bg-gray-50 hover:bg-[#fbf9f3] text-[12.5px] text-gray-700 font-semibold p-2.5 rounded-lg border border-gray-200 active:scale-99 transition-all truncate"
                  >
                    💡 {tLocal('preset_q3')}
                  </button>
                </div>
              </div>
            </div>

            {/* AI Advisor Response Box */}
            {(isConsultLoading || consultResponse) && (
              <div className="w-full bg-[#edf7f1] border border-[#9ae9ae] rounded-[16px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col gap-3 animate-[fadeIn_0.3s_ease]">
                <div className="flex items-center justify-between border-b border-[#d5ecd9] pb-2">
                  <span className="text-[12px] font-bold text-[#005129] flex items-center gap-1.5">
                    <ShieldCheck size={16} /> Organic Recommendation
                  </span>
                  {consultResponse && (
                    <button
                      onClick={toggleSpeakConsult}
                      className={`h-[26px] px-3 rounded-full font-bold text-[10px] flex items-center gap-1 transition-all ${
                        isPlayingConsult 
                          ? 'bg-[#ba1a1a] text-white' 
                          : 'bg-[#005129] text-white hover:bg-[#1a6b3c]'
                      }`}
                    >
                      {isPlayingConsult ? <VolumeX size={10} /> : <Volume2 size={10} />}
                      {isPlayingConsult ? 'Rokein' : 'Suno'}
                    </button>
                  )}
                </div>

                {isConsultLoading ? (
                  <div className="flex flex-col items-center justify-center py-6 gap-2 text-gray-500">
                    <Loader2 size={24} className="animate-spin text-[#005129]" />
                    <span className="text-[12px] font-semibold">Consulting agricultural RAG database...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-[13px] text-gray-800 leading-relaxed font-medium whitespace-pre-line">
                      {consultResponse}
                    </p>
                    <div className="text-[10px] text-gray-500 border-t border-[#d5ecd9] pt-2 flex flex-col gap-1 italic">
                      <span>✓ {tLocal('consult_warning')}</span>
                      <span>📞 {tLocal('kvk_cite')}</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default NaturalFarming;
