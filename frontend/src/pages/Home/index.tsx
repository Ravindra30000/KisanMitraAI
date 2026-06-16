import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, MapPin, Sun, Calendar, ShieldAlert, TrendingUp, Camera, Mic, Plus, ArrowRight, User, CloudRain, Cloud, Sprout } from 'lucide-react';
import { useLanguage } from '../../utils/i18n';
import { getApiBase } from '../../utils/apiBase';

const API_BASE_URL = getApiBase();

interface Profile {
  name: string;
  crops: string[];
  state: string;
  district: string;
  language: string;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const [profile, setProfile] = useState<Profile>({
    name: 'Ravindra ji',
    crops: ['wheat', 'onion', 'tomato'],
    state: 'Madhya Pradesh',
    district: 'Bhopal',
    language: 'hi'
  });

  const [currentDate, setCurrentDate] = useState('');
  const [weather, setWeather] = useState<{
    temp: number;
    condition: 'sunny' | 'rainy' | 'cloudy';
    rain_chance: number;
    humidity: number;
    wind_speed: number;
  }>({
    temp: 28,
    condition: 'sunny',
    rain_chance: 10,
    humidity: 65,
    wind_speed: 12
  });

  const [locating, setLocating] = useState(false);

  const fetchHomeWeather = async (lat: number, lon: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/weather?lat=${lat}&lon=${lon}`);
      if (res.ok) {
        const data = await res.json();
        setWeather({
          temp: data.current.temp,
          condition: data.current.condition,
          rain_chance: data.current.rain_chance,
          humidity: data.current.humidity,
          wind_speed: data.current.wind_speed
        });
      }
    } catch (err) {
      console.error("Home weather load error:", err);
    }
  };

  const handleUpdateGPS = () => {
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
            // Retrieve current profile
            const saved = localStorage.getItem('kisanmitra_profile');
            let profileObj: any = {
              name: 'Ravindra ji',
              crops: ['wheat', 'onion', 'tomato'],
              state: 'Madhya Pradesh',
              district: 'Bhopal',
              language: 'hi'
            };
            if (saved) {
              try { profileObj = JSON.parse(saved); } catch(e){}
            }
            
            profileObj.state = data.state;
            profileObj.district = data.district || profileObj.district;
            profileObj.latitude = position.coords.latitude;
            profileObj.longitude = position.coords.longitude;
            
            // Save & notify
            localStorage.setItem('kisanmitra_profile', JSON.stringify(profileObj));
            setProfile(profileObj);
            
            // Instantly fetch weather for the actual GPS coordinates
            fetchHomeWeather(position.coords.latitude, position.coords.longitude);
            
            window.dispatchEvent(new Event('profile_updated'));
            
            alert(`Location successfully updated to: ${data.district || ''}, ${data.state}.\n\n(Note: Desktop browsers resolve location via IP and may default to your ISP central hub. If this is incorrect, please select your state/district manually in Profile settings.)`);
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
    const loadProfile = () => {
      const saved = localStorage.getItem('kisanmitra_profile');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const lang = parsed.language || 'hi';
          setProfile({
            name: parsed.name || 'Ravindra ji',
            crops: parsed.crops || ['wheat', 'onion', 'tomato'],
            state: parsed.state || 'Madhya Pradesh',
            district: parsed.district || 'Bhopal',
            language: lang
          });

          // Set localized current date
          const localeMap: Record<string, string> = {
            hi: 'hi-IN',
            hl: 'en-IN',
            en: 'en-IN',
            mr: 'mr-IN',
            gu: 'gu-IN',
            pa: 'pa-IN'
          };
          const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', weekday: 'long' };
          const dateStr = new Date().toLocaleDateString(localeMap[lang] || 'hi-IN', options);
          setCurrentDate(dateStr);
        } catch (e) {
          console.error(e);
        }
      } else {
        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', weekday: 'long' };
        const dateStr = new Date().toLocaleDateString('hi-IN', options);
        setCurrentDate(dateStr);
      }
    };

    loadProfile();
    window.addEventListener('profile_updated', loadProfile);
    return () => {
      window.removeEventListener('profile_updated', loadProfile);
    };
  }, []);

  // Fetch current weather dynamically when profile updates or on mount
  useEffect(() => {
    const fetchWeatherForProfile = () => {
      const saved = localStorage.getItem('kisanmitra_profile');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.latitude && parsed.longitude) {
            fetchHomeWeather(parsed.latitude, parsed.longitude);
            return;
          }
        } catch (e) {}
      }

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            fetchHomeWeather(position.coords.latitude, position.coords.longitude);
          },
          () => {
            fetchHomeWeather(23.2599, 77.4126);
          }
        );
      } else {
        fetchHomeWeather(23.2599, 77.4126);
      }
    };

    fetchWeatherForProfile();
    window.addEventListener('profile_updated', fetchWeatherForProfile);
    return () => {
      window.removeEventListener('profile_updated', fetchWeatherForProfile);
    };
  }, [API_BASE_URL]);

  const getCropEmoji = (cropId: string) => {
    switch (cropId) {
      case 'wheat': return '🌾';
      case 'rice': return '🍚';
      case 'onion': return '🧅';
      case 'tomato': return '🍅';
      case 'potato': return '🥔';
      case 'corn': return '🌽';
      case 'sugarcane': return '🎋';
      case 'cotton': return '🌱';
      default: return '🌱';
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

  const getWeatherIcon = (cond: 'sunny' | 'rainy' | 'cloudy', size = 28) => {
    switch (cond) {
      case 'sunny': return <Sun size={size} className="text-[#e8960a]" />;
      case 'rainy': return <CloudRain size={size} className="text-[#4a90d9]" />;
      case 'cloudy': return <Cloud size={size} className="text-gray-400" />;
      default: return <Sun size={size} className="text-[#e8960a]" />;
    }
  };

  return (
    <div className="flex flex-col bg-[#fbf9f3] min-h-screen pb-[88px] px-4 pt-4 font-sans text-[#1b1c18]">
      
      {/* Top Profile & Header Bar */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[20px] font-bold text-black flex items-center gap-1.5 leading-tight">
            {t('home_greeting').replace('{name}', profile.name)}
          </h2>
          <p className="text-[12px] text-gray-500 font-semibold">{currentDate}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Notifications Trigger */}
          <Link to="/notifications" className="w-[42px] h-[42px] rounded-full bg-white border border-[#eae8e2] flex items-center justify-center relative text-gray-700 active:scale-95 transition-transform">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-[18px] h-[18px] rounded-full bg-[#d63b3b] text-white text-[10px] font-bold flex items-center justify-center">
              3
            </span>
          </Link>
          {/* Settings / Profile Trigger */}
          <Link to="/profile" className="w-[42px] h-[42px] rounded-full bg-white border border-[#eae8e2] flex items-center justify-center text-gray-700 active:scale-95 transition-transform">
            <User size={20} />
          </Link>
        </div>
      </div>

      {/* Weather Strip Card */}
      <Link to="/weather" className="w-full bg-white rounded-[16px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)] border border-[#eae8e2] mb-4 block hover:border-[#1a6b3c] transition-colors">
        <div className="flex items-center justify-between border-b border-[#f0eee8] pb-2 mb-2">
          <div className="flex items-center gap-1.5 text-[#005129] font-bold text-[14px] w-full">
            <MapPin size={16} className="shrink-0" />
            <span className="truncate">{profile.district}, {profile.state}</span>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleUpdateGPS();
              }}
              disabled={locating}
              className={`ml-auto bg-[#edf7f1] border border-[#9ae9ae] hover:bg-[#d5ecd9] active:scale-95 text-[#005129] text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 shrink-0 ${
                locating ? 'animate-pulse' : ''
              }`}
            >
              📍 {locating ? "LOCATING..." : "GPS"}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getWeatherIcon(weather.condition)}
            <div>
              <span className="text-[22px] font-bold text-black leading-none">{weather.temp}°C</span>
              <p className="text-[11px] text-gray-500 font-semibold mt-0.5">{t('home_weather_updated')}</p>
            </div>
          </div>
          <div className="flex gap-4 text-right">
            <div>
              <span className="text-[12px] font-bold text-gray-800">{weather.rain_chance}%</span>
              <p className="text-[10px] text-gray-400">{t('home_weather_rain')}</p>
            </div>
            <div>
              <span className="text-[12px] font-bold text-gray-800">{weather.humidity}%</span>
              <p className="text-[10px] text-gray-400">{t('home_weather_humidity')}</p>
            </div>
            <div>
              <span className="text-[12px] font-bold text-gray-800">{weather.wind_speed} km/h</span>
              <p className="text-[10px] text-gray-400">{t('home_weather_wind')}</p>
            </div>
          </div>
        </div>
      </Link>

      {/* Seasonal Alert Banner */}
      <div className="w-full bg-[#ffdad6] border-l-4 border-[#ba1a1a] rounded-r-[12px] p-3 shadow-sm flex items-start gap-2.5 mb-4">
        <span className="text-[18px] mt-0.5">🚨</span>
        <div className="flex-grow">
          <p className="text-[13px] font-bold text-[#ba1a1a]">{t('home_alert_title')}</p>
          <p className="text-[12px] text-gray-700 leading-normal mt-0.5">
            {t('home_alert_desc')}
          </p>
          <button 
            onClick={() => navigate('/disease')}
            className="text-[12px] font-bold text-[#93000a] mt-2 flex items-center gap-0.5 hover:underline"
          >
            {t('home_alert_btn')} <ArrowRight size={12} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* 2x2 Feature Quick Action Tiles */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Voice Saathi Card */}
        <Link 
          to="/voice" 
          className="bg-[#fff4e0] border border-[#ffcf97] rounded-[16px] p-4 flex flex-col justify-between h-[120px] shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="w-[36px] h-[36px] rounded-full bg-[#e8960a] text-white flex items-center justify-center">
            <Mic size={18} />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-[#643e00]">{t('home_voice_title')}</h3>
            <p className="text-[11px] text-gray-500 font-semibold leading-tight mt-0.5">{t('home_voice_desc')}</p>
          </div>
        </Link>

        {/* Fasal Jaanch Card */}
        <Link 
          to="/disease" 
          className="bg-[#edf7f1] border border-[#97f3b1] rounded-[16px] p-4 flex flex-col justify-between h-[120px] shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="w-[36px] h-[36px] rounded-full bg-[#005129] text-white flex items-center justify-center">
            <Camera size={18} />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-[#005129]">{t('home_disease_title')}</h3>
            <p className="text-[11px] text-gray-500 font-semibold leading-tight mt-0.5">{t('home_disease_desc')}</p>
          </div>
        </Link>

        {/* Fasal Calendar Card */}
        <Link 
          to="/calendar"
          className="bg-white border border-[#eae8e2] rounded-[16px] p-4 flex flex-col justify-between h-[120px] shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="w-[36px] h-[36px] rounded-full bg-[#edf7f1] text-[#005129] flex items-center justify-center border border-[#9ae9ae]">
            <Calendar size={18} />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-black">{t('home_calendar_title')}</h3>
            <p className="text-[11px] text-gray-500 font-semibold leading-tight mt-0.5">{t('home_calendar_desc')}</p>
          </div>
        </Link>

        {/* Mandi Bhav Card */}
        <Link 
          to="/market" 
          className="bg-white border border-[#eae8e2] rounded-[16px] p-4 flex flex-col justify-between h-[120px] shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="w-[36px] h-[36px] rounded-full bg-[#edf7f1] text-[#005129] flex items-center justify-center border border-[#9ae9ae]">
            <TrendingUp size={18} />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-black">{t('home_market_title')}</h3>
            <p className="text-[11px] text-gray-500 font-semibold leading-tight mt-0.5">{t('home_market_desc')}</p>
          </div>
        </Link>
      </div>

      {/* Natural Farming Quick Link Banner */}
      <Link 
        to="/natural-farming" 
        className="w-full bg-[#fbfbf9] border border-[#d5ecd9] hover:border-[#005129] rounded-[16px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center justify-between mb-4 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-[40px] h-[40px] rounded-full bg-[#edf7f1] text-[#005129] border border-[#9ae9ae] flex items-center justify-center shrink-0">
            <Sprout size={20} />
          </div>
          <div>
            <h4 className="text-[14px] font-bold text-[#005129]">
              {lang === 'hi' || lang === 'hl' ? '🌿 जैविक व प्राकृतिक खेती शिक्षा' : '🌿 Natural Farming Advisor'}
            </h4>
            <p className="text-[12px] text-gray-500 font-semibold mt-0.5">
              {lang === 'hi' || lang === 'hl' ? 'मल्टी-लेवल खेती विधि, जीवामृत, नीमास्त्र रेसिपी' : 'Learn multi-level cropping, organic recipes'}
            </p>
          </div>
        </div>
        <ArrowRight size={18} className="text-[#005129]" />
      </Link>

      {/* Crop Pills Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[14px] font-bold text-gray-800 uppercase tracking-wider">{t('home_my_crops')}</h3>
          <button 
            onClick={() => navigate('/onboarding')} 
            className="w-[24px] h-[24px] rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-600 active:bg-gray-100"
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {profile.crops.map((cropId) => (
            <div 
              key={cropId} 
              className="bg-white border border-[#eae8e2] rounded-[12px] px-3.5 py-1.5 flex items-center gap-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
            >
              <span className="text-[16px]">{getCropEmoji(cropId)}</span>
              <span className="text-[13px] font-semibold text-black">{getCropLabel(cropId)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Queries / Chat History */}
      <div className="mb-4">
        <h3 className="text-[14px] font-bold text-gray-800 uppercase tracking-wider mb-2.5">{t('home_recent_queries')}</h3>
        <div className="flex flex-col gap-2.5">
          <Link to="/voice" className="bg-white rounded-[12px] border border-[#eae8e2] p-3 flex items-start justify-between shadow-sm active:bg-gray-50 transition-colors">
            <div>
              <p className="text-[13px] font-semibold text-black">{t('home_query_1')}</p>
              <p className="text-[11px] text-gray-500 mt-1">{t('home_query_1_diag')}</p>
            </div>
            <span className="text-[10px] text-gray-400 font-bold">{t('home_query_1_time')}</span>
          </Link>
          <Link to="/voice" className="bg-white rounded-[12px] border border-[#eae8e2] p-3 flex items-start justify-between shadow-sm active:bg-gray-50 transition-colors">
            <div>
              <p className="text-[13px] font-semibold text-black">{t('home_query_2')}</p>
              <p className="text-[11px] text-gray-500 mt-1">{t('home_query_2_diag')}</p>
            </div>
            <span className="text-[10px] text-gray-400 font-bold">{t('home_query_2_time')}</span>
          </Link>
        </div>
      </div>

      {/* Government Schemes Nudge Card */}
      <Link to="/schemes" className="w-full bg-[#edf7f1] rounded-[16px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#9ae9ae] block hover:border-[#1a6b3c] transition-colors">
        <div className="flex items-start gap-3">
          <div className="w-[40px] h-[40px] rounded-full bg-[#005129] text-white flex items-center justify-center shrink-0">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h4 className="text-[14px] font-bold text-[#005129]">{t('home_pm_kisan_title')}</h4>
            <p className="text-[12px] text-gray-700 mt-1 leading-relaxed">
              {t('home_pm_kisan_desc')}
            </p>
            <span className="text-[12px] font-bold text-[#005129] mt-2.5 flex items-center gap-0.5 hover:underline">
              {t('home_pm_kisan_btn')} <ArrowRight size={12} strokeWidth={2.5} />
            </span>
          </div>
        </div>
      </Link>

    </div>
  );
};

export default Home;
