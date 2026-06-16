import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Search, Mic, MapPin, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../utils/i18n';
import { getApiBase } from '../../utils/apiBase';

const API_BASE_URL = getApiBase();

type Step = 1 | 2 | 3;

interface OnboardingData {
  language: string;
  crops: string[];
  state: string;
  district: string;
  farmSize: string;
  irrigation: string;
  farmingMethod: string;
  latitude?: number;
  longitude?: number;
}

const languages = [
  { id: 'hi', label: 'हिन्दी', subLabel: 'Hindi', flag: '🇮🇳' },
  { id: 'hl', label: 'हिंग्लिश', subLabel: 'Hinglish', flag: '🇮🇳' },
  { id: 'en', label: 'English', subLabel: 'English', flag: '🇬🇧' },
  { id: 'mr', label: 'मराठी', subLabel: 'Marathi', flag: '🇮🇳' },
  { id: 'gu', label: 'ગુજરાતી', subLabel: 'Gujarati', flag: '🇮🇳' },
  { id: 'pa', label: 'ਪੰਜਾਬੀ', subLabel: 'Punjabi', flag: '🇮🇳' },
];

const cropOptions = [
  { id: 'wheat', label: 'Gehu', subLabel: 'Wheat', emoji: '🌾' },
  { id: 'rice', label: 'Dhaan', subLabel: 'Rice', emoji: '🍚' },
  { id: 'onion', label: 'Pyaaz', subLabel: 'Onion', emoji: '🧅' },
  { id: 'tomato', label: 'Tamatar', subLabel: 'Tomato', emoji: '🍅' },
  { id: 'potato', label: 'Aloo', subLabel: 'Potato', emoji: '🥔' },
  { id: 'corn', label: 'Makka', subLabel: 'Corn', emoji: '🌽' },
  { id: 'sugarcane', label: 'Ganna', subLabel: 'Sugarcane', emoji: '🎋' },
  { id: 'cotton', label: 'Kapas', subLabel: 'Cotton', emoji: '🌱' },
];

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const { t } = useLanguage();
  const [locating, setLocating] = useState(false);
  
  const [formData, setFormData] = useState<OnboardingData>({
    language: 'hi',
    crops: ['wheat', 'onion', 'tomato'], // Pre-selected
    state: 'Madhya Pradesh',
    district: 'Bhopal',
    farmSize: '2.5',
    irrigation: 'Nahar (Canal)',
    farmingMethod: 'transitioning',
  });

  const [searchQuery, setSearchQuery] = useState('');

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      alert("GPS is not supported by your browser.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch(
            `${API_BASE_URL}/api/location/geocode?lat=${position.coords.latitude}&lon=${position.coords.longitude}`
          );
          if (!res.ok) throw new Error("Reverse geocoding failed.");
          const data = await res.json();
          if (data.state) {
            setFormData((prev) => ({
              ...prev,
              state: data.state,
              district: data.district || prev.district,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }));
            alert(`Location successfully tagged: ${data.district || ''}, ${data.state}.\n\n(Note: Desktop browsers resolve location via IP and may default to your ISP central hub. You can adjust the state and district dropdowns below if it is incorrect.)`);
          } else {
            alert("Could not identify Indian state/district for this location.");
          }
        } catch (err) {
          console.error(err);
          alert("Error connecting to location service. Please input manually.");
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        console.error(error);
        alert(`GPS access denied or unavailable: ${error.message}. Please select your location manually.`);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const toggleCrop = (cropId: string) => {
    setFormData((prev) => {
      const isSelected = prev.crops.includes(cropId);
      if (isSelected) {
        return { ...prev, crops: prev.crops.filter((id) => id !== cropId) };
      } else {
        if (prev.crops.length >= 5) return prev; // Max 5 crops limit
        return { ...prev, crops: [...prev.crops, cropId] };
      }
    });
  };

  const handleLanguageSelect = (langId: string) => {
    const updated = { ...formData, language: langId };
    setFormData(updated);
    // Store immediately so context updates UI instantly
    localStorage.setItem('kisanmitra_profile', JSON.stringify(updated));
    window.dispatchEvent(new Event('profile_updated'));
  };

  const handleComplete = async () => {
    let finalData = { ...formData };
    
    // If no coordinates are set, resolve them from the selected state and district
    if (!finalData.latitude || !finalData.longitude) {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/location/forward-geocode?state=${encodeURIComponent(finalData.state)}&district=${encodeURIComponent(finalData.district)}`
        );
        if (res.ok) {
          const coords = await res.json();
          finalData.latitude = coords.lat;
          finalData.longitude = coords.lon;
        }
      } catch (e) {
        console.error("Failed to forward-geocode onboarding location:", e);
      }
    }

    localStorage.setItem('kisanmitra_onboarded', 'true');
    localStorage.setItem('kisanmitra_profile', JSON.stringify(finalData));
    window.dispatchEvent(new Event('profile_updated'));
    navigate('/');
  };

  const renderLanguageSelection = () => (
    <div className="flex flex-col items-center flex-grow p-5 justify-between">
      <div className="flex flex-col items-center mt-6 w-full">
        {/* Leaf/logo icon container */}
        <div className="w-[80px] h-[80px] rounded-full bg-[#edf7f1] flex items-center justify-center mb-6">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#005129]">
            <path d="M2 22C2 22 6 18 12 18C18 18 22 22 22 22M12 2C6.48 2 2 6.48 2 12C2 15.31 3.61 18.24 6.1 20.09M22 12C22 6.48 17.52 2 12 2M17.9 20.09C20.39 18.24 22 15.31 22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M12 2V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <h1 className="text-[26px] font-bold text-black mb-1 text-center font-sans">{t('onboarding_welcome')}</h1>
        <p className="text-[14px] text-gray-500 text-center mb-6">{t('onboarding_sub')}</p>
        
        {/* Header container card */}
        <div className="w-full bg-white rounded-[16px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)] border border-[#eae8e2] mb-5">
          <h2 className="text-[20px] font-bold text-black flex items-center gap-2">
            {t('onboarding_namaste')} <span className="animate-bounce">👋</span>
          </h2>
          <p className="text-[15px] font-medium text-gray-700 mt-1">{t('onboarding_choose_lang')}</p>
          <p className="text-[12px] text-gray-400 mt-0.5">{t('onboarding_change_anytime')}</p>
        </div>

        {/* Language choices list */}
        <div className="grid grid-cols-1 gap-3 w-full max-h-[360px] overflow-y-auto pr-1">
          {languages.map((lang) => {
            const isSelected = formData.language === lang.id;
            return (
              <button
                key={lang.id}
                onClick={() => handleLanguageSelect(lang.id)}
                className={`flex items-center justify-between p-4 rounded-[12px] border transition-all duration-150 ${
                  isSelected
                    ? 'border-[#005129] bg-[#edf7f1]'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[20px]">{lang.flag}</span>
                  <div className="text-left">
                    <p className="text-[16px] font-semibold text-black">{lang.label}</p>
                    <p className="text-[12px] text-gray-500">{lang.subLabel}</p>
                  </div>
                </div>
                <div className={`w-[20px] h-[20px] rounded-full border-2 flex items-center justify-center ${
                  isSelected ? 'border-[#005129]' : 'border-gray-300'
                }`}>
                  {isSelected && <div className="w-[10px] h-[10px] bg-[#005129] rounded-full" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full mt-6">
        <button
          onClick={() => setStep(2)}
          className="w-full h-[48px] bg-[#005129] hover:bg-[#1a6b3c] active:scale-98 text-white rounded-[12px] font-semibold flex items-center justify-center gap-2 transition-all shadow-md"
        >
          {t('onboarding_next')} <ArrowRight size={18} />
        </button>
        <p className="text-[12px] text-gray-400 text-center mt-3">{t('onboarding_change_anytime')}</p>
      </div>
    </div>
  );

  const renderCropSelection = () => {
    const filteredCrops = cropOptions.filter((crop) =>
      crop.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crop.subLabel.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="flex flex-col flex-grow p-5 justify-between min-h-screen">
        <div className="flex flex-col mt-2 w-full">
          {/* Back & Step Counter */}
          <div className="flex items-center justify-between w-full mb-5">
            <button onClick={() => setStep(1)} className="text-gray-500 hover:text-black">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-1.5">
              <div className="w-[30px] h-[4px] bg-[#005129] rounded-full" />
              <div className="w-[30px] h-[4px] bg-[#005129] rounded-full" />
              <div className="w-[30px] h-[4px] bg-gray-200 rounded-full" />
              <span className="text-[13px] font-semibold text-gray-500 ml-2">2/3</span>
            </div>
          </div>

          <h2 className="text-[24px] font-bold text-black font-sans leading-tight">{t('onboarding_crop_title')}</h2>
          <p className="text-[14px] text-gray-500 mt-1">{t('onboarding_crop_sub')}</p>
          
          <div className="bg-[#fff9ed] border border-[#ffcf97] rounded-[8px] px-3 py-1.5 flex items-center gap-2 mt-4 mb-4 self-start">
            <span className="text-[#643e00] text-[12px] font-semibold">{t('onboarding_max_crops')}</span>
          </div>

          {/* Search Bar */}
          <div className="w-full relative mb-4">
            <span className="absolute left-3.5 top-[13px] text-gray-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder={t('onboarding_crop_search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-[44px] pl-10 pr-10 rounded-[12px] border border-gray-300 bg-white text-[15px] focus:outline-none focus:border-[#005129]"
            />
            <button className="absolute right-3 top-[10px] w-[24px] h-[24px] rounded-full bg-gray-100 flex items-center justify-center text-gray-500 active:bg-gray-200">
              <Mic size={14} />
            </button>
          </div>

          {/* Selected Pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {formData.crops.map((cropId) => {
              const crop = cropOptions.find((c) => c.id === cropId);
              if (!crop) return null;
              return (
                <button
                  key={cropId}
                  onClick={() => toggleCrop(cropId)}
                  className="flex items-center gap-1 px-3 py-1 bg-[#edf7f1] border border-[#005129] text-[#005129] rounded-full text-[13px] font-medium"
                >
                  {crop.label} <span className="text-[11px] font-semibold ml-0.5">✕</span>
                </button>
              );
            })}
          </div>

          {/* Crops Grid */}
          <div className="grid grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
            {filteredCrops.map((crop) => {
              const isSelected = formData.crops.includes(crop.id);
              return (
                <button
                  key={crop.id}
                  onClick={() => toggleCrop(crop.id)}
                  className={`flex items-center p-3 rounded-[16px] border transition-all relative ${
                    isSelected
                      ? 'border-[#005129] bg-[#edf7f1] shadow-[0_2px_8px_rgba(26,107,60,0.06)]'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <span className="text-[28px] mr-3">{crop.emoji}</span>
                  <div className="text-left">
                    <p className="text-[15px] font-bold text-black leading-tight">{crop.label}</p>
                    <p className="text-[11px] text-gray-500">{crop.subLabel}</p>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-[16px] h-[16px] rounded-full bg-[#005129] flex items-center justify-center text-white">
                      <Check size={10} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="w-full mt-6">
          <button
            onClick={() => setStep(3)}
            className="w-full h-[48px] bg-[#005129] hover:bg-[#1a6b3c] active:scale-98 text-white rounded-[12px] font-semibold flex items-center justify-center gap-2 transition-all shadow-md"
          >
            {t('onboarding_next')} <ArrowRight size={18} />
          </button>
          <button
            onClick={handleComplete}
            className="w-full text-center text-gray-500 font-semibold hover:text-black mt-3.5 text-[14px]"
          >
            {t('onboarding_skip')}
          </button>
        </div>
      </div>
    );
  };

  const renderLocationSetup = () => (
    <div className="flex flex-col flex-grow p-5 justify-between min-h-screen">
      <div className="flex flex-col mt-2 w-full">
        {/* Back & Step Counter */}
        <div className="flex items-center justify-between w-full mb-5">
          <button onClick={() => setStep(2)} className="text-gray-500 hover:text-black">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-1.5">
            <div className="w-[30px] h-[4px] bg-[#005129] rounded-full" />
            <div className="w-[30px] h-[4px] bg-[#005129] rounded-full" />
            <div className="w-[30px] h-[4px] bg-[#005129] rounded-full" />
            <span className="text-[13px] font-semibold text-gray-500 ml-2">3/3</span>
          </div>
        </div>

        <h2 className="text-[24px] font-bold text-black font-sans leading-tight">{t('onboarding_location_title')}</h2>
        <p className="text-[14px] text-gray-500 mt-1">{t('onboarding_location_sub')}</p>

        {/* Location access card */}
        <div className="w-full bg-white rounded-[16px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)] border border-[#eae8e2] my-5 flex flex-col items-center">
          <div className="w-[52px] h-[52px] rounded-full bg-[#edf7f1] flex items-center justify-center mb-4 text-[#005129]">
            <MapPin size={26} />
          </div>
          <h3 className="text-[16px] font-bold text-black mb-1">{t('onboarding_location_card_title')}</h3>
          <p className="text-[12px] text-gray-500 text-center leading-relaxed px-4">
            {t('onboarding_location_card_desc')}
          </p>
          <button
            onClick={handleUseGPS}
            disabled={locating}
            className={`mt-4 w-full h-[40px] border border-[#005129] text-[#005129] hover:bg-[#edf7f1] rounded-[10px] font-bold text-[14px] transition-colors flex items-center justify-center ${
              locating ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            {locating ? "LOCATING..." : t('onboarding_location_allow')}
          </button>
          <button className="text-[12px] text-gray-500 hover:text-black font-semibold mt-3 underline">
            {t('onboarding_location_manual')}
          </button>
        </div>

        {/* Dropdowns */}
        <div className="grid grid-cols-2 gap-3 w-full mb-5">
          <div className="flex flex-col">
            <label className="text-[12px] font-bold text-gray-500 mb-1">{t('onboarding_state')}</label>
            <select
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="h-[40px] px-3 border border-gray-300 rounded-[10px] bg-white text-[14px] font-medium text-black focus:outline-none"
            >
              {!['Madhya Pradesh', 'Uttar Pradesh', 'Maharashtra', 'Gujarat', 'Punjab'].includes(formData.state) && (
                <option value={formData.state}>{formData.state}</option>
              )}
              <option value="Madhya Pradesh">Madhya Pradesh</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Gujarat">Gujarat</option>
              <option value="Punjab">Punjab</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-[12px] font-bold text-gray-500 mb-1">{t('onboarding_district')}</label>
            <select
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              className="h-[40px] px-3 border border-gray-300 rounded-[10px] bg-white text-[14px] font-medium text-black focus:outline-none"
            >
              {!['Bhopal', 'Indore', 'Jabalpur', 'Pune', 'Ahmedabad'].includes(formData.district) && (
                <option value={formData.district}>{formData.district}</option>
              )}
              <option value="Bhopal">Bhopal</option>
              <option value="Indore">Indore</option>
              <option value="Jabalpur">Jabalpur</option>
              <option value="Pune">Pune</option>
              <option value="Ahmedabad">Ahmedabad</option>
            </select>
          </div>
        </div>

        {/* Optional Farm Details */}
        <div className="border-t border-[#eae8e2] pt-4 mb-4">
          <h4 className="text-[14px] font-bold text-black mb-3">{t('onboarding_farm_details')}</h4>
          
          <div className="grid grid-cols-2 gap-3 w-full mb-4">
            <div className="flex flex-col">
              <label className="text-[12px] font-bold text-gray-500 mb-1">{t('onboarding_farm_size')}</label>
              <div className="flex">
                <input
                  type="text"
                  placeholder="2.5"
                  value={formData.farmSize}
                  onChange={(e) => setFormData({ ...formData, farmSize: e.target.value })}
                  className="w-[60%] h-[38px] px-3 border border-gray-300 rounded-l-[10px] bg-white text-[14px] focus:outline-none"
                />
                <span className="w-[40%] h-[38px] bg-gray-100 border-y border-r border-gray-300 rounded-r-[10px] flex items-center justify-center text-[12px] font-bold text-gray-500">
                  Acre
                </span>
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-[12px] font-bold text-gray-500 mb-1">{t('onboarding_irrigation')}</label>
              <select
                value={formData.irrigation}
                onChange={(e) => setFormData({ ...formData, irrigation: e.target.value })}
                className="h-[38px] px-3 border border-gray-300 rounded-[10px] bg-white text-[13px] font-medium text-black focus:outline-none"
              >
                <option value="Nahar (Canal)">Nahar (Canal)</option>
                <option value="Tubewell">Tubewell</option>
                <option value="Rainfed">Rainfed (Baarish)</option>
              </select>
            </div>
          </div>

          {/* Farming Method */}
          <div className="flex flex-col">
            <label className="text-[12px] font-bold text-gray-500 mb-1.5">{t('onboarding_farming_method')}</label>
            <div className="grid grid-cols-2 gap-2 w-full">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, farmingMethod: 'chemical' })}
                className={`h-[38px] rounded-[10px] font-semibold text-[13px] border ${
                  formData.farmingMethod === 'chemical'
                    ? 'border-[#005129] bg-[#edf7f1] text-[#005129]'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('onboarding_method_chemical')}
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, farmingMethod: 'transitioning' })}
                className={`h-[38px] rounded-[10px] font-semibold text-[13px] border ${
                  formData.farmingMethod === 'transitioning'
                    ? 'border-[#005129] bg-[#edf7f1] text-[#005129]'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('onboarding_method_transitioning')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full mt-4">
        <button
          onClick={handleComplete}
          className="w-full h-[48px] bg-[#005129] hover:bg-[#1a6b3c] active:scale-98 text-white rounded-[12px] font-semibold flex items-center justify-center gap-2 transition-all shadow-md text-[15px]"
        >
          {t('onboarding_start')}
        </button>
        <p className="text-[10px] text-gray-400 text-center mt-3 leading-relaxed">
          {t('onboarding_terms')}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fbf9f3] flex flex-col w-full">
      {step === 1 && renderLanguageSelection()}
      {step === 2 && renderCropSelection()}
      {step === 3 && renderLocationSetup()}
    </div>
  );
};

export default Onboarding;
