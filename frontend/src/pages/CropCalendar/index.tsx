import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, VolumeX, Calendar, CheckCircle2, ChevronRight, Award } from 'lucide-react';
import { useLanguage } from '../../utils/i18n';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface CalendarTask {
  crop: string;
  month: string;
  action: string;
  details: string;
  type: 'planting' | 'watering' | 'weeding' | 'harvest' | 'spray';
}

const CropCalendar: React.FC = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  
  const [profileCrops, setProfileCrops] = useState<string[]>(['wheat', 'tomato', 'onion']);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null);

  // Month labels matching languages
  const monthsList = [
    { id: 'January', label: { hi: 'जनवरी', hl: 'January', en: 'January', mr: 'जानेवारी', gu: 'જાન્યુઆરી', pa: 'ਜਨਵਰੀ' } },
    { id: 'February', label: { hi: 'फरवरी', hl: 'February', en: 'February', mr: 'फेब्रुवारी', gu: 'ફેબ્રુઆરી', pa: 'ਫਰਵਰੀ' } },
    { id: 'March', label: { hi: 'मार्च', hl: 'March', en: 'March', mr: 'मार्च', gu: 'માર્ચ', pa: 'ਮਾਰਚ' } },
    { id: 'April', label: { hi: 'अप्रैल', hl: 'April', en: 'April', mr: 'एप्रिल', gu: 'એપ્રિલ', pa: 'ਅਪ੍ਰੈਲ' } },
    { id: 'May', label: { hi: 'मई', hl: 'May', en: 'May', mr: 'मे', gu: 'મે', pa: 'ਮਈ' } },
    { id: 'June', label: { hi: 'जून', hl: 'June', en: 'June', mr: 'जून', gu: 'જૂન', pa: 'ਜੂਨ' } },
    { id: 'July', label: { hi: 'जुलाई', hl: 'July', en: 'July', mr: 'जुलै', gu: 'જુલાઈ', pa: 'ਜੁਲਾਈ' } },
    { id: 'August', label: { hi: 'अगस्त', hl: 'August', en: 'August', mr: 'ऑगस्ट', gu: 'ઓગસ્ટ', pa: 'ਅਗਸਤ' } },
    { id: 'September', label: { hi: 'सितंबर', hl: 'September', en: 'September', mr: 'सप्टेंबर', gu: 'સપ્ટેમ્બર', pa: 'ਸਤੰਬਰ' } },
    { id: 'October', label: { hi: 'अक्टूबर', hl: 'October', en: 'October', mr: 'ऑक्टोबर', gu: 'ઓક્ટોબર', pa: 'ਅਕਤੂਬਰ' } },
    { id: 'November', label: { hi: 'नवंबर', hl: 'November', en: 'November', mr: 'नोव्हेंबर', gu: 'નવેમ્બર', pa: 'ਨਵੰਬਰ' } },
    { id: 'December', label: { hi: 'दिसंबर', hl: 'December', en: 'December', mr: 'डिसेंबर', gu: 'ડિસેમ્બર', pa: 'ਦਸੰਬਰ' } }
  ];

  const localDict: Record<string, Record<string, string>> = {
    hi: {
      title: "फसल कैलेंडर",
      subtitle: "आपके खेत की समय-सीमा",
      current_month_title: "इस महीने के काम:",
      empty_crops: "कृपया प्रोफाइल सेटिंग्स में अपनी फसलें चुनें।",
      listen_tasks: "इस महीने के काम सुनें",
      stop_btn: "रुकें",
      completed_tag: "काम पूरा हुआ",
      subsidy_reminder: "योजना रिमाइंडर",
      subsidy_desc: "इस महीने पीएम-किसान सम्मान निधि और बीज सब्सिडी योजनाओं के आवेदन खुले हैं।",
      subsidy_btn: "पात्रता जाँचें"
    },
    hl: {
      title: "Fasal Calendar",
      subtitle: "Aapke khet ki timeline",
      current_month_title: "Is mahine ke kaam:",
      empty_crops: "Kripya profile settings mein crops select karein.",
      listen_tasks: "Is mahine ke kaam sunein",
      stop_btn: "Rokein",
      completed_tag: "Done",
      subsidy_reminder: "Scheme Reminder",
      subsidy_desc: "Is month PM-Kisan Samman Nidhi aur Seed Subsidy applications open hain.",
      subsidy_btn: "Check Eligibility"
    },
    en: {
      title: "Crop Calendar",
      subtitle: "Personalized farming timeline",
      current_month_title: "Tasks for this Month:",
      empty_crops: "Please choose your crops in Profile Settings.",
      listen_tasks: "Listen to this Month's Tasks",
      stop_btn: "Stop",
      completed_tag: "Completed",
      subsidy_reminder: "Government Scheme Nudge",
      subsidy_desc: "PM-Kisan instalment registry and Organic Seed subsidy applications are currently active.",
      subsidy_btn: "Check Subsidy Eligibility"
    },
    mr: {
      title: "पीक कॅलेंडर",
      subtitle: "तुमच्या शेतीचे वेळापत्रक",
      current_month_title: "या महिन्यातील कामे:",
      empty_crops: "कृपया प्रोफाइल सेटिंग्जमध्ये आपली पिके निवडा.",
      listen_tasks: "या महिन्यातील कामे ऐका",
      stop_btn: "थांबा",
      completed_tag: "पूर्ण झाले",
      subsidy_reminder: "योजना स्मरणपत्र",
      subsidy_desc: "या महिन्यात पीएम-किसान हप्ता आणि बियाणे अनुदानासाठी अर्ज सुरू आहेत.",
      subsidy_btn: "पात्रता तपासा"
    },
    gu: {
      title: "પાક કેલેન્ડર",
      subtitle: "તમારા ખેતનની સમયરેખા",
      current_month_title: "આ મહિનાનું કામ:",
      empty_crops: "કૃપા કરીને પ્રોફાઇલ સેટિંગ્સમાં તમારા પાક પસંદ કરો.",
      listen_tasks: "આ મહિનાનું કામ સાંભળો",
      stop_btn: "બંધ કરો",
      completed_tag: "કામ પૂર્ણ",
      subsidy_reminder: "યોજના રિમાઇન્ડર",
      subsidy_desc: "આ મહિને પીએમ-કિસાન સન્માન નિધિ અને બિયારણ સબસિડી માટે અરજીઓ ચાલુ છે.",
      subsidy_btn: "પાત્રતા તપાસો"
    },
    pa: {
      title: "ਫ਼ਸਲ ਕੈਲੰਡਰ",
      subtitle: "ਤੁਹਾਡੀ ਖੇਤੀ ਦੀ ਸਮਾਂ-ਸੀਮਾ",
      current_month_title: "ਇਸ ਮਹੀਨੇ ਦੇ ਕੰਮ:",
      empty_crops: "ਕਿਰਪਾ ਕਰਕੇ ਪ੍ਰੋਫਾਈਲ ਸੈਟਿੰਗਾਂ ਵਿੱਚ ਆਪਣੀਆਂ ਫ਼ਸਲਾਂ ਚੁਣੋ।",
      listen_tasks: "ਇਸ ਮਹੀਨੇ ਦੇ ਕੰਮ ਸੁਣੋ",
      stop_btn: "ਰੋਕੋ",
      completed_tag: "ਕੰਮ ਪੂਰਾ",
      subsidy_reminder: "ਯੋਜਨਾ ਰੀਮਾਈਂਡਰ",
      subsidy_desc: "ਇਸ ਮਹੀਨੇ ਪੀਐਮ-ਕਿਸਾਨ ਸਨਮਾਨ ਨਿਧੀ ਅਤੇ ਬੀਜ ਸਬਸਿਡੀ ਸਕੀਮਾਂ ਲਈ ਅਰਜ਼ੀਆਂ ਖੁੱਲ੍ਹੀਆਂ ਹਨ।",
      subsidy_btn: "ਪਾਤਰਤਾ ਚੈੱਕ ਕਰੋ"
    }
  };

  const tLocal = (key: string) => {
    const activeLang = lang || 'hi';
    const dict = localDict[activeLang] || localDict['hi'];
    return dict[key] || localDict['hi'][key] || key;
  };

  const getMonthLabel = (mId: string) => {
    const month = monthsList.find((m) => m.id === mId);
    if (!month) return mId;
    const activeLang = lang || 'hi';
    return month.label[activeLang as keyof typeof month.label] || month.label['hi'];
  };

  // Static Agricultural tasks calendar database
  const getTasksDatabase = (): CalendarTask[] => {
    return [
      // WHEAT (गेहूं)
      { crop: 'wheat', month: 'October', type: 'planting', action: 'खेत की तैयारी और गोबर खाद', details: 'Apply 10 tons of well-decomposed organic farmyard manure per acre. Plough fields to fine tilth.' },
      { crop: 'wheat', month: 'November', type: 'planting', action: 'बीज उपचार (Bijamrit) और बुवाई', details: 'Treat wheat seeds with Bijamrit to prevent root rot. Sow seeds with row spacing of 22.5cm.' },
      { crop: 'wheat', month: 'December', type: 'watering', action: 'पहली सिंचाई (CRI Stage)', details: 'Critical Root Initiation (CRI) stage. Irrigate 21 days after sowing. Spray 50L Jeevamrit mixed with water.' },
      { crop: 'wheat', month: 'January', type: 'weeding', action: 'खरपतवार नियंत्रण और निराई', details: 'Perform manual weeding. Spray diluted sour buttermilk to prevent early rust infections.' },
      { crop: 'wheat', month: 'February', type: 'spray', action: 'पीला रतुआ नियंत्रण (Neem / Buttermilk)', details: 'Monitor leaves for yellow stripes. Spray sour buttermilk and neem oil weekly to keep fungi at bay.' },
      { crop: 'wheat', month: 'March', type: 'watering', action: 'अंतिम सिंचाई (Milking Stage)', details: 'Ensure moisture during grain filling. Stop irrigation 15 days before expected harvest.' },
      { crop: 'wheat', month: 'April', type: 'harvest', action: 'कटाई और गहाई (Harvesting)', details: 'Harvest when grains become hard and straw turns golden yellow. Dry grains under sun to under 12% moisture.' },

      // TOMATO (टमाटर)
      { crop: 'tomato', month: 'June', type: 'planting', action: 'नर्सरी बेड और बीज बुवाई', details: 'Prepare raised beds. Mix coco-peat and compost. Sow organic seeds and cover with grass.' },
      { crop: 'tomato', month: 'July', type: 'planting', action: 'पौध रोपण (Transplanting)', details: 'Transplant 25-day old healthy seedlings in evening. Space plants 60cm apart. Drench roots with Jeevamrit.' },
      { crop: 'tomato', month: 'August', type: 'weeding', action: 'सहारा देना (Staking) और निराई', details: 'Stake tomato plants with bamboo sticks to prevent soil contact. Apply mulch to conserve water.' },
      { crop: 'tomato', month: 'September', type: 'spray', action: 'जीवामृत छिड़काव और कीट नियंत्रण', details: 'Spray 5% Neemastra solution to control whiteflies and leaf miners. Feed soil with solid Ghan-Jeevamrit.' },
      { crop: 'tomato', month: 'October', type: 'harvest', action: 'कटाई और फल तुड़ाई', details: 'Harvest tomatoes when they turn pinkish-red. Keep fruit in shade to preserve freshness.' },
      { crop: 'tomato', month: 'November', type: 'weeding', action: 'ठंड से बचाव और मल्चिंग', details: 'Apply thick straw mulch to keep roots warm. Spray light sour buttermilk to prevent damping off.' },
      
      // ONION (प्याज)
      { crop: 'onion', month: 'October', type: 'planting', action: 'प्याज नर्सरी बुवाई', details: 'Prepare nursery bed and mix cow dung manure. Treat seeds with trichoderma.' },
      { crop: 'onion', month: 'November', type: 'planting', action: 'खेत जुताई और तैयारी', details: 'Incorporate compost. Prepare flat beds of size 3m x 2m for easy irrigation.' },
      { crop: 'onion', month: 'December', type: 'planting', action: 'पौध रोपण (Transplanting)', details: 'Transplant 6-week old seedlings. Space 15cm between rows, 10cm between plants.' },
      { crop: 'onion', month: 'January', type: 'watering', action: 'सिंचाई और गोबर खाद', details: 'Irrigate regularly. Apply well-rotted vermicompost as top dressing.' },
      { crop: 'onion', month: 'February', type: 'weeding', action: 'निराई-गुड़ाई (Weeding)', details: 'Onion root systems are shallow, perform shallow hand weeding. Spray Neemastra if thrips are spotted.' },
      { crop: 'onion', month: 'March', type: 'watering', action: 'कंद विकास (Bulb Stage) सिंचाई', details: 'Maintain regular watering. Do not dry soil during bulb swelling.' },
      { crop: 'onion', month: 'April', type: 'harvest', action: 'खुदाई और सुखाई (Harvesting)', details: 'Harvest when 50% of plant tops fall over. Cure bulbs in dry, shaded place for 10 days before storage.' },

      // RICE (धान)
      { crop: 'rice', month: 'June', type: 'planting', action: 'नर्सरी बुवाई और गीली जुताई', details: 'Puddle the main field. Raise nurseries using organic seeds treated with saltwater.' },
      { crop: 'rice', month: 'July', type: 'planting', action: 'रोपणी (Transplanting)', details: 'Transplant 20-day old seedlings in standing water. Maintain 2-3 seedlings per hill.' },
      { crop: 'rice', month: 'August', type: 'watering', action: 'जल प्रबंधन और खरपतवार नियंत्रण', details: 'Keep water depth at 5cm. Perform hand weeding or use rotary weeder.' },
      { crop: 'rice', month: 'September', type: 'spray', action: 'तना छेदक नियंत्रण (Agniastra)', details: 'Monitor for stem borer. Spray Agniastra or Neem oil mix if damage exceeds 5%.' },
      { crop: 'rice', month: 'October', type: 'watering', action: 'पानी सुखाना और गहाई पूर्व तैयारी', details: 'Drain out water from field 10 days before harvest to hasten maturity.' },
      { crop: 'rice', month: 'November', type: 'harvest', action: 'कटाई और अनाज सुखाई', details: 'Harvest when panicles turn golden yellow. Thresh immediately and dry grains to 14% moisture.' }
    ];
  };

  useEffect(() => {
    // Load farmer crops from profile
    const saved = localStorage.getItem('kisanmitra_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.crops && parsed.crops.length > 0) {
          setProfileCrops(parsed.crops);
        }
      } catch (e) {
        console.error("Calendar fail to load profile:", e);
      }
    }

    // Set default month to current month
    const curMonthName = new Date().toLocaleString('en-US', { month: 'long' });
    setSelectedMonth(curMonthName);

    // Load completed tasks
    const savedTasks = localStorage.getItem('kisanmitra_completed_tasks');
    if (savedTasks) {
      try { setCompletedTasks(JSON.parse(savedTasks)); } catch (e) {}
    }
  }, []);

  // Filter tasks based on selected month and farmer's profile crops
  const filteredTasks = getTasksDatabase().filter(
    (t) => t.month === selectedMonth && profileCrops.includes(t.crop)
  );

  const toggleTaskCompleted = (taskKey: string) => {
    let updated = [...completedTasks];
    if (updated.includes(taskKey)) {
      updated = updated.filter((k) => k !== taskKey);
    } else {
      updated.push(taskKey);
    }
    setCompletedTasks(updated);
    localStorage.setItem('kisanmitra_completed_tasks', JSON.stringify(updated));
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'planting': return '🌱';
      case 'watering': return '💧';
      case 'weeding': return '🧹';
      case 'spray': return '🌿';
      case 'harvest': return '🌾';
      default: return '📋';
    }
  };

  const getCropLabel = (cropId: string) => {
    const cropLabels: Record<string, Record<string, string>> = {
      hi: { wheat: 'गेहूं', rice: 'धान', onion: 'प्याज', tomato: 'टमाटर', potato: 'आलू', corn: 'मक्का', sugarcane: 'गन्ना', cotton: 'कपास' },
      hl: { wheat: 'Gehu', rice: 'Dhaan', onion: 'Pyaaz', tomato: 'Tamatar', potato: 'Aloo', corn: 'Makka', sugarcane: 'Ganna', cotton: 'Kapas' },
      en: { wheat: 'Wheat', rice: 'Rice', onion: 'Onion', tomato: 'Tomato', potato: 'Potato', corn: 'Corn', sugarcane: 'Sugarcane', cotton: 'Cotton' },
      mr: { wheat: 'गहू', rice: 'धान / भात', onion: 'कांदा', tomato: 'टोमॅटो', potato: 'बटाटा', corn: 'मका', sugarcane: 'ऊस', cotton: 'कापूस' },
      gu: { wheat: 'ઘઉં', rice: 'ડાંગર', onion: 'ડુંગળી', tomato: 'ટમેટા', potato: 'બટાકા', corn: 'મકાઈ', sugarcane: 'શેરડી', cotton: 'કપાસ' },
      pa: { wheat: 'ਕਣਕ', rice: 'ਝੋਨਾ', onion: 'ਪਿਆਜ਼', tomato: 'ਟਮਾਟਰ', potato: 'ਆਲੂ', corn: 'ਮੱਕੀ', sugarcane: 'ਗੰਨਾ', cotton: 'ਕਪਾਹ' }
    };
    const activeLang = lang || 'hi';
    const langMap = cropLabels[activeLang] || cropLabels['hi'];
    return langMap[cropId] || cropId;
  };

  const handleSynthesizeTasks = async () => {
    if (isPlayingAudio) {
      if (playbackAudioRef.current) {
        playbackAudioRef.current.pause();
      }
      setIsPlayingAudio(false);
      return;
    }

    if (filteredTasks.length === 0) return;
    setIsPlayingAudio(true);

    try {
      const isEnglish = lang === 'en';
      let textToSpeak = isEnglish 
        ? `Here are your agricultural tasks for the month of ${selectedMonth}. ` 
        : `${getMonthLabel(selectedMonth)} महीने के लिए कृषि कार्य सूची। `;

      filteredTasks.forEach((task) => {
        const cropLabel = getCropLabel(task.crop);
        if (isEnglish) {
          textToSpeak += `For ${cropLabel}, task is: ${task.action}. Details: ${task.details}. `;
        } else {
          // If translation is needed, convert details roughly or speak simply
          textToSpeak += `${cropLabel} के लिए: ${task.action}। विवरण: ${task.details}। `;
        }
      });

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
            setIsPlayingAudio(false);
          };
        })
        .catch(() => {
          setIsPlayingAudio(false);
        });
    } catch (e) {
      console.error(e);
      setIsPlayingAudio(false);
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
      <div className="h-[56px] border-b border-[#eae8e2] bg-white px-4 flex items-center justify-between shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-gray-600 hover:text-black">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-[17px] font-bold text-black">{tLocal('title')}</h1>
            <p className="text-[11px] text-gray-500 font-semibold">{tLocal('subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Horizontal Month Slider */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto bg-white border-b border-[#eae8e2] shrink-0 scrollbar-none">
        {monthsList.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setSelectedMonth(m.id);
              if (playbackAudioRef.current) {
                playbackAudioRef.current.pause();
              }
              setIsPlayingAudio(false);
            }}
            className={`px-4 py-1.5 rounded-full text-[12px] font-bold transition-all shrink-0 active:scale-95 ${
              selectedMonth === m.id
                ? 'bg-[#005129] text-white shadow-sm'
                : 'bg-[#fcfbf7] border border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {getMonthLabel(m.id)}
          </button>
        ))}
      </div>

      <div className="p-4 flex flex-col gap-4">

        {/* Audio Broadcast Bar */}
        {filteredTasks.length > 0 && (
          <div className="w-full bg-[#edf7f1] border border-[#97f3b1] rounded-[16px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-[#005129]" />
              <span className="text-[13px] font-bold text-[#005129]">
                {getMonthLabel(selectedMonth)} {tLocal('current_month_title')}
              </span>
            </div>
            <button
              onClick={handleSynthesizeTasks}
              className={`h-[32px] px-4 rounded-full font-bold text-[12px] flex items-center gap-1.5 transition-all ${
                isPlayingAudio 
                  ? 'bg-[#ba1a1a] text-white' 
                  : 'bg-[#005129] text-white hover:bg-[#1a6b3c]'
              }`}
            >
              {isPlayingAudio ? <VolumeX size={13} /> : <Volume2 size={13} />}
              {isPlayingAudio ? tLocal('stop_btn') : 'Suno'}
            </button>
          </div>
        )}

        {/* Task Cards List */}
        <div className="flex flex-col gap-3">
          {filteredTasks.length === 0 ? (
            <div className="bg-white rounded-[16px] p-8 border border-[#eae8e2] text-center flex flex-col items-center justify-center gap-3">
              <span className="text-[36px]">🌾</span>
              <p className="text-[13px] text-gray-500 font-semibold">{tLocal('empty_crops')}</p>
              <button
                onClick={() => navigate('/profile')}
                className="text-[12px] text-[#005129] font-bold hover:underline"
              >
                Profile settings change karein →
              </button>
            </div>
          ) : (
            filteredTasks.map((task, idx) => {
              const taskKey = `${task.crop}_${task.month}_${idx}`;
              const isDone = completedTasks.includes(taskKey);
              
              return (
                <div 
                  key={taskKey} 
                  className={`w-full rounded-[16px] p-4 border transition-all flex flex-col gap-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] ${
                    isDone 
                      ? 'bg-gray-50 border-gray-200 opacity-75' 
                      : 'bg-white border-[#eae8e2]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[20px]">{getTaskIcon(task.type)}</span>
                      <div>
                        <span className="text-[10px] text-[#e8960a] font-bold bg-[#fff9ed] px-2 py-0.5 rounded-full uppercase border border-[#ffcf97]">
                          {getCropLabel(task.crop)}
                        </span>
                        <h4 className={`text-[14px] font-bold mt-1 leading-snug ${isDone ? 'line-through text-gray-500' : 'text-black'}`}>
                          {task.action}
                        </h4>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleTaskCompleted(taskKey)}
                      className={`w-[26px] h-[26px] rounded-full flex items-center justify-center border transition-all ${
                        isDone 
                          ? 'bg-[#005129] border-[#005129] text-white' 
                          : 'border-gray-300 hover:border-gray-400 text-transparent'
                      }`}
                    >
                      <CheckCircle2 size={16} className={isDone ? 'block' : 'opacity-0'} />
                    </button>
                  </div>

                  <p className={`text-[12.5px] leading-relaxed pl-1 ${isDone ? 'text-gray-400' : 'text-gray-600'}`}>
                    {task.details}
                  </p>

                  <div className="flex items-center justify-between border-t border-gray-100 pt-2.5 mt-0.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Type: {task.type}
                    </span>
                    {isDone && (
                      <span className="text-[10px] font-bold text-[#005129] flex items-center gap-0.5">
                        ✓ {tLocal('completed_tag')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Government Schemes / Subsidies Reminder Card */}
        <div className="w-full bg-[#fff9ed] border border-[#ffcf97] rounded-[16px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-[#e8960a]">
            <Award size={18} />
            <h4 className="text-[13px] font-bold">{tLocal('subsidy_reminder')}</h4>
          </div>
          <p className="text-[12px] text-gray-600 leading-relaxed">
            {tLocal('subsidy_desc')}
          </p>
          <button
            onClick={() => navigate('/schemes')}
            className="w-full h-[40px] bg-[#e8960a] hover:bg-[#c97f00] text-white rounded-[12px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm text-[13px]"
          >
            {tLocal('subsidy_btn')} <ChevronRight size={14} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default CropCalendar;
