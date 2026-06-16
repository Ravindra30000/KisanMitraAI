import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, User, MapPin, Sprout, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../utils/i18n';
import { getApiBase } from '../../utils/apiBase';

const API_BASE_URL = getApiBase();

interface ProfileData {
  name: string;
  crops: string[];
  state: string;
  district: string;
  farmSize: string;
  irrigation: string;
  farmingMethod: string;
  language: string;
  latitude?: number;
  longitude?: number;
}

const languages = [
  { id: 'hi', label: 'हिन्दी (Hindi)' },
  { id: 'hl', label: 'हिंग्लिश (Hinglish)' },
  { id: 'en', label: 'English' },
  { id: 'mr', label: 'मराठी (Marathi)' },
  { id: 'gu', label: 'ગુજરાતી (Gujarati)' },
  { id: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)' },
];

const cropOptions = [
  { id: 'wheat', label: 'Gehu (Wheat)' },
  { id: 'rice', label: 'Dhaan (Rice)' },
  { id: 'onion', label: 'Pyaaz (Onion)' },
  { id: 'tomato', label: 'Tamatar (Tomato)' },
  { id: 'potato', label: 'Aloo (Potato)' },
  { id: 'corn', label: 'Makka (Corn)' },
  { id: 'sugarcane', label: 'Ganna (Sugarcane)' },
  { id: 'cotton', label: 'Kapas (Cotton)' },
];

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<ProfileData>({
    name: 'Ravindra ji',
    crops: ['wheat', 'onion', 'tomato'],
    state: 'Madhya Pradesh',
    district: 'Bhopal',
    farmSize: '2.5',
    irrigation: 'Nahar (Canal)',
    farmingMethod: 'transitioning',
    language: 'hi'
  });

  const [isSaved, setIsSaved] = useState(false);
  const [locating, setLocating] = useState(false);


  const handleProfileUseGPS = () => {
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
            setProfile((prev) => ({
              ...prev,
              state: data.state,
              district: data.district || prev.district,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }));
            alert(`Location resolved: ${data.district || ''}, ${data.state}.\n\n(Note: Desktop browsers resolve location via IP and may default to your ISP central hub. You can change this manually using the dropdowns below if it is incorrect.)`);
          } else {
            alert("Could not identify Indian state/district for this location.");
          }
        } catch (err) {
          console.error(err);
          alert("Error connecting to location service.");
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        console.error(error);
        alert(`GPS access denied or unavailable: ${error.message}.`);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    const saved = localStorage.getItem('kisanmitra_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProfile({
          name: parsed.name || 'Ravindra ji',
          crops: parsed.crops || ['wheat', 'onion', 'tomato'],
          state: parsed.state || 'Madhya Pradesh',
          district: parsed.district || 'Bhopal',
          farmSize: parsed.farmSize || '2.5',
          irrigation: parsed.irrigation || 'Nahar (Canal)',
          farmingMethod: parsed.farmingMethod || 'transitioning',
          language: parsed.language || 'hi',
          latitude: parsed.latitude,
          longitude: parsed.longitude
        });
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSave = async () => {
    let updatedProfile = { ...profile };
    
    // Resolve coordinates if missing or if state/district changed
    try {
      const savedObj = localStorage.getItem('kisanmitra_profile');
      const savedParsed = savedObj ? JSON.parse(savedObj) : null;
      
      if (!profile.latitude || !profile.longitude || 
          !savedParsed || savedParsed.state !== profile.state || savedParsed.district !== profile.district) {
        
        const res = await fetch(
          `${API_BASE_URL}/api/location/forward-geocode?state=${encodeURIComponent(profile.state)}&district=${encodeURIComponent(profile.district)}`
        );
        if (res.ok) {
          const coords = await res.json();
          updatedProfile.latitude = coords.lat;
          updatedProfile.longitude = coords.lon;
        }
      }
    } catch (e) {
      console.error("Failed to forward-geocode profile location:", e);
    }

    localStorage.setItem('kisanmitra_profile', JSON.stringify(updatedProfile));
    localStorage.setItem('kisanmitra_onboarded', 'true');
    window.dispatchEvent(new Event('profile_updated'));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleReset = () => {
    if (window.confirm(t('profile_reset_confirm'))) {
      localStorage.clear();
      window.dispatchEvent(new Event('profile_updated'));
      navigate('/onboarding');
    }
  };

  const handleCropToggle = (cropId: string) => {
    setProfile((prev) => {
      const isSelected = prev.crops.includes(cropId);
      if (isSelected) {
        return { ...prev, crops: prev.crops.filter((id) => id !== cropId) };
      } else {
        if (prev.crops.length >= 5) return prev;
        return { ...prev, crops: [...prev.crops, cropId] };
      }
    });
  };

  return (
    <div className="flex flex-col bg-[#fbf9f3] min-h-screen pb-[88px] font-sans text-[#1b1c18]">
      {/* Header */}
      <div className="h-[56px] border-b border-[#eae8e2] bg-white px-4 flex items-center justify-between shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-black">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-[17px] font-bold text-black">{t('profile_title')}</h1>
        </div>
        <button 
          onClick={handleSave}
          className="h-[34px] px-3 bg-[#005129] text-white hover:bg-[#1a6b3c] rounded-[8px] flex items-center gap-1 text-[13px] font-semibold transition-colors shadow-sm"
        >
          <Save size={14} /> {t('profile_save')}
        </button>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Saved Toast */}
        {isSaved && (
          <div className="bg-[#edf7f1] border border-[#005129] text-[#005129] px-4 py-3 rounded-[12px] flex items-center gap-2 text-[14px] font-semibold transition-all shadow-sm">
            <CheckCircle size={16} /> {t('profile_updated_toast')}
          </div>
        )}

        {/* Farmer Personal Card */}
        <div className="w-full bg-white rounded-[16px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)] border border-[#eae8e2] flex flex-col gap-3">
          <h3 className="text-[14px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <User size={16} /> {t('profile_personal_title')}
          </h3>
          <div className="flex flex-col">
            <label className="text-[12px] font-bold text-gray-500 mb-1">{t('profile_name_label')}</label>
            <input 
              type="text" 
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="h-[40px] px-3 rounded-[10px] border border-gray-300 bg-white text-[14px] focus:outline-none focus:border-[#005129]"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-[12px] font-bold text-gray-500 mb-1">{t('profile_lang_label')}</label>
            <div className="grid grid-cols-2 gap-2">
              {languages.map((lang) => {
                const isSelected = profile.language === lang.id;
                return (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => setProfile({ ...profile, language: lang.id })}
                    className={`h-[36px] rounded-[8px] font-semibold text-[13px] border ${
                      isSelected
                        ? 'border-[#005129] bg-[#edf7f1] text-[#005129]'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {lang.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Location & Farming details */}
        <div className="w-full bg-white rounded-[16px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)] border border-[#eae8e2] flex flex-col gap-3">
          <h3 className="text-[14px] font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between w-full">
            <span className="flex items-center gap-1.5"><MapPin size={16} /> {t('profile_location_title')}</span>
            <button
              type="button"
              onClick={handleProfileUseGPS}
              disabled={locating}
              className={`bg-[#edf7f1] border border-[#9ae9ae] hover:bg-[#d5ecd9] active:scale-95 text-[#005129] text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 transition-all ${
                locating ? 'animate-pulse' : ''
              }`}
            >
              📍 {locating ? "LOCATING..." : "GPS"}
            </button>
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col">
              <label className="text-[12px] font-bold text-gray-500 mb-1">{t('onboarding_state')}</label>
              <select
                value={profile.state}
                onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                className="h-[38px] px-3 border border-gray-300 rounded-[10px] bg-white text-[13px] font-medium text-black focus:outline-none"
              >
                {!['Madhya Pradesh', 'Uttar Pradesh', 'Maharashtra', 'Gujarat', 'Punjab'].includes(profile.state) && (
                  <option value={profile.state}>{profile.state}</option>
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
                value={profile.district}
                onChange={(e) => setProfile({ ...profile, district: e.target.value })}
                className="h-[38px] px-3 border border-gray-300 rounded-[10px] bg-white text-[13px] font-medium text-black focus:outline-none"
              >
                {!['Bhopal', 'Indore', 'Pune', 'Ahmedabad'].includes(profile.district) && (
                  <option value={profile.district}>{profile.district}</option>
                )}
                <option value="Bhopal">Bhopal</option>
                <option value="Indore">Indore</option>
                <option value="Pune">Pune</option>
                <option value="Ahmedabad">Ahmedabad</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col">
              <label className="text-[12px] font-bold text-gray-500 mb-1">{t('profile_farm_size')}</label>
              <div className="flex">
                <input
                  type="text"
                  value={profile.farmSize}
                  onChange={(e) => setProfile({ ...profile, farmSize: e.target.value })}
                  className="w-[60%] h-[38px] px-3 border border-gray-300 rounded-l-[10px] bg-white text-[14px] focus:outline-none"
                />
                <span className="w-[40%] h-[38px] bg-gray-100 border-y border-r border-gray-300 rounded-r-[10px] flex items-center justify-center text-[12px] font-bold text-gray-500">
                  Acre
                </span>
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-[12px] font-bold text-gray-500 mb-1">{t('profile_irrigation')}</label>
              <select
                value={profile.irrigation}
                onChange={(e) => setProfile({ ...profile, irrigation: e.target.value })}
                className="h-[38px] px-3 border border-gray-300 rounded-[10px] bg-white text-[13px] font-medium text-black focus:outline-none"
              >
                <option value="Nahar (Canal)">Nahar (Canal)</option>
                <option value="Tubewell">Tubewell</option>
                <option value="Rainfed">Rainfed (Baarish)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-[12px] font-bold text-gray-500 mb-1.5">{t('profile_farming_method')}</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProfile({ ...profile, farmingMethod: 'chemical' })}
                className={`h-[36px] rounded-[8px] font-semibold text-[13px] border ${
                  profile.farmingMethod === 'chemical'
                    ? 'border-[#005129] bg-[#edf7f1] text-[#005129]'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('onboarding_method_chemical')}
              </button>
              <button
                type="button"
                onClick={() => setProfile({ ...profile, farmingMethod: 'transitioning' })}
                className={`h-[36px] rounded-[8px] font-semibold text-[13px] border ${
                  profile.farmingMethod === 'transitioning'
                    ? 'border-[#005129] bg-[#edf7f1] text-[#005129]'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('onboarding_method_transitioning')}
              </button>
            </div>
          </div>
        </div>

        {/* Crops Management */}
        <div className="w-full bg-white rounded-[16px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)] border border-[#eae8e2] flex flex-col gap-3">
          <h3 className="text-[14px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Sprout size={16} /> {t('profile_crops_title')}
          </h3>
          <p className="text-[11px] text-gray-500">{t('profile_crops_desc')}</p>
          <div className="grid grid-cols-2 gap-2">
            {cropOptions.map((crop) => {
              const isSelected = profile.crops.includes(crop.id);
              return (
                <button
                  key={crop.id}
                  type="button"
                  onClick={() => handleCropToggle(crop.id)}
                  className={`h-[38px] px-3 rounded-[10px] text-[13px] font-semibold border flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'border-[#005129] bg-[#edf7f1] text-[#005129]'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{crop.label}</span>
                  {isSelected && <span className="text-[10px] bg-[#005129] text-white w-[16px] h-[16px] rounded-full flex items-center justify-center font-bold">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Danger zone / Reset */}
        <div className="w-full bg-white rounded-[16px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)] border border-[#eae8e2] flex flex-col gap-3">
          <h3 className="text-[14px] font-bold text-red-600 uppercase tracking-wider">{t('profile_danger_zone')}</h3>
          <p className="text-[12px] text-gray-500">{t('profile_danger_desc')}</p>
          <button
            onClick={handleReset}
            className="w-full h-[40px] border border-red-500 text-red-500 rounded-[10px] font-bold text-[14px] flex items-center justify-center gap-1.5 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={16} /> {t('profile_reset_btn')}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Profile;
