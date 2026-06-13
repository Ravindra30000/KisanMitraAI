import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic } from 'lucide-react';
import { useLanguage } from '../../utils/i18n';

const NoResults: React.FC = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();

  // Self-contained dictionary for localized screen content
  const localDict: Record<string, Record<string, string>> = {
    hi: {
      title: "खोज के परिणाम",
      no_results_title: "कुछ नहीं मिला",
      no_results_desc: "अपना सवाल दोबारा लिखें या\nvoice में पूछें",
      search_suggestions: "इनके बारे में खोजें:",
      chip_disease: "गेहूं रोग",
      chip_market: "प्याज भाव",
      chip_recipe: "जीवामृत",
      chip_scheme: "PM-Kisan",
      voice_cta: "Voice में पूछें — कुछ भी!",
      voice_sub: "हिंदी या Hinglish में बात करें",
      need_help: "मदद चाहिए? हमसे बात करें",
      back_home: "मुख्य पृष्ठ पर जाएं"
    },
    hl: {
      title: "Khoj ke Parinaam",
      no_results_title: "Kuch nahi mila",
      no_results_desc: "Apna sawaal dobara likhein ya\nvoice mein poochhen",
      search_suggestions: "Inke baare mein khojein:",
      chip_disease: "Gehu Rog",
      chip_market: "Pyaz bhaav",
      chip_recipe: "Jeevamrut",
      chip_scheme: "PM-Kisan",
      voice_cta: "Voice mein poochhen — Kuch bhi!",
      voice_sub: "Hindi ya Hinglish mein baat karein",
      need_help: "Madad chahiye? Humse baat karein",
      back_home: "Go back to Home"
    },
    en: {
      title: "Search Results",
      no_results_title: "No Results Found",
      no_results_desc: "Try rephrasing your search or\nask our AI Voice assistant",
      search_suggestions: "Suggested Topics:",
      chip_disease: "Wheat disease",
      chip_market: "Onion rates",
      chip_recipe: "Organic Recipe",
      chip_scheme: "PM-Kisan",
      voice_cta: "Ask Voice Saathi — Anything!",
      voice_sub: "Talk in Hindi, English, or regional tongues",
      need_help: "Need help? Chat with us",
      back_home: "Go back to Home"
    },
    mr: {
      title: "शोध परिणाम",
      no_results_title: "काहीही सापडले नाही",
      no_results_desc: "तुमचा प्रश्न पुन्हा लिहा किंवा\nआवाज साथीला विचारा",
      search_suggestions: "यांच्याबद्दल शोधा:",
      chip_disease: "गहू रोग",
      chip_market: "कांदा बाजार भाव",
      chip_recipe: "जीवामृत",
      chip_scheme: "PM-Kisan",
      voice_cta: "आवाज साथीला विचारा — काहीही!",
      voice_sub: "मराठी किंवा हिंदीत बोला",
      need_help: "मदत हवी आहे? आमच्याशी संपर्क साधा",
      back_home: "मुख्यपृष्ठावर जा"
    },
    gu: {
      title: "શોધ પરિણામો",
      no_results_title: "કંઈ મળ્યું નથી",
      no_results_desc: "આપનો પ્રશ્ન ફરીથી લખો અથવા\nઅવાજ સાથીને પૂછો",
      search_suggestions: "આના વિશે શોધો:",
      chip_disease: "ઘઉં રોગ",
      chip_market: "ડુંગળી ભાવ",
      chip_recipe: "જીવામૃત",
      chip_scheme: "PM-Kisan",
      voice_cta: "અવાજ સાથીને પૂછો — કંઈ પણ!",
      voice_sub: "ગુજરાતી અથવા હિન્દીમાં બોલો",
      need_help: "મદદ જોઈએ છે? અમારો સંપર્ક કરો",
      back_home: "મુખ્ય પૃષ્ઠ પર જાઓ"
    },
    pa: {
      title: "ਖੋਜ ਦੇ ਨਤੀਜੇ",
      no_results_title: "ਕੁਝ ਨਹੀਂ ਲੱਭਿਆ",
      no_results_desc: "ਆਪਣਾ ਸਵਾਲ ਦੁਬਾਰਾ ਲਿਖੋ ਜਾਂ\nਆਵਾਜ਼ ਸਾਥੀ ਤੋਂ ਪੁੱਛੋ",
      search_suggestions: "ਇਨ੍ਹਾਂ ਬਾਰੇ ਖੋਜੋ:",
      chip_disease: "ਕਣਕ ਰੋਗ",
      chip_market: "ਪਿਆਜ਼ ਭਾਅ",
      chip_recipe: "ਜੀਵਾਮ੍ਰਿਤ",
      chip_scheme: "PM-Kisan",
      voice_cta: "ਆਵਾਜ਼ ਸਾਥੀ ਤੋਂ ਪੁੱਛੋ — ਕੁਝ ਵੀ!",
      voice_sub: "ਪੰਜਾਬੀ ਜਾਂ ਹਿੰਦੀ ਵਿੱਚ ਗੱਲ ਕਰੋ",
      need_help: "ਮਦਦ ਚਾਹੀਦੀ ਹੈ? ਸਾਡੇ ਨਾਲ ਗੱਲ ਕਰੋ",
      back_home: "ਮੁੱਖ ਪੰਨੇ 'ਤੇ ਜਾਓ"
    }
  };

  const activeLang = lang || 'hi';
  const dict = localDict[activeLang] || localDict['hi'];

  return (
    <div className="flex flex-col bg-[#fbf9f3] min-h-screen pb-[88px] font-sans text-[#1b1c18]">
      
      {/* Header */}
      <div className="h-[56px] border-b border-[#eae8e2] bg-white px-4 flex items-center justify-between shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="text-gray-600 hover:text-black flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-[17px] font-bold text-black">{dict.title}</h1>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col items-center justify-center px-5 py-6 max-w-[360px] mx-auto w-full gap-6">
        
        {/* Illustration */}
        <div className="w-full aspect-square max-w-[240px] bg-white rounded-[24px] overflow-hidden border border-[#eae8e2] shadow-[0_4px_16px_rgba(0,0,0,0.04)] flex items-center justify-center p-3">
          <img 
            alt="Empty State Illustration" 
            className="w-full h-full object-cover rounded-[16px]"
            src="/empty_state.png"
          />
        </div>

        {/* Messaging */}
        <div className="text-center">
          <h2 className="text-[20px] font-bold text-black leading-tight mb-2">
            {dict.no_results_title}
          </h2>
          <p className="text-[14px] text-gray-500 font-semibold leading-snug whitespace-pre-line">
            {dict.no_results_desc}
          </p>
        </div>

        {/* Suggestion Chips */}
        <div className="w-full">
          <h3 className="text-[12px] font-bold uppercase text-gray-400 mb-2 px-1 tracking-wider">
            {dict.search_suggestions}
          </h3>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => navigate('/disease')}
              className="bg-white border border-[#005129]/30 text-black hover:border-[#005129] active:scale-95 text-[13px] px-3.5 py-2 rounded-[12px] font-bold shadow-sm transition-all flex items-center gap-1"
            >
              🔍 {dict.chip_disease}
            </button>
            <button 
              onClick={() => navigate('/market')}
              className="bg-white border border-[#005129]/30 text-black hover:border-[#005129] active:scale-95 text-[13px] px-3.5 py-2 rounded-[12px] font-bold shadow-sm transition-all flex items-center gap-1"
            >
              📈 {dict.chip_market}
            </button>
            <button 
              onClick={() => navigate('/natural-farming')}
              className="bg-white border border-[#005129]/30 text-black hover:border-[#005129] active:scale-95 text-[13px] px-3.5 py-2 rounded-[12px] font-bold shadow-sm transition-all flex items-center gap-1"
            >
              🌿 {dict.chip_recipe}
            </button>
            <button 
              onClick={() => navigate('/schemes')}
              className="bg-white border border-[#005129]/30 text-black hover:border-[#005129] active:scale-95 text-[13px] px-3.5 py-2 rounded-[12px] font-bold shadow-sm transition-all flex items-center gap-1"
            >
              📋 {dict.chip_scheme}
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="w-full flex flex-col gap-4 mt-2">
          <button 
            onClick={() => navigate('/voice')}
            className="w-full bg-[#e8960a] hover:bg-[#c97f00] text-white rounded-[16px] flex flex-col items-center justify-center py-3 px-4 shadow-md hover:shadow-lg active:scale-98 transition-all"
          >
            <div className="flex items-center gap-2 mb-0.5">
              <Mic size={18} fill="currentColor" />
              <span className="text-[15px] font-bold">{dict.voice_cta}</span>
            </div>
            <span className="text-[11px] font-semibold opacity-90">{dict.voice_sub}</span>
          </button>
          
          <button 
            onClick={() => navigate('/')} 
            className="text-[#005129] text-[13px] font-bold text-center hover:underline focus:outline-none"
          >
            {dict.back_home}
          </button>
        </div>

      </main>
    </div>
  );
};

export default NoResults;
