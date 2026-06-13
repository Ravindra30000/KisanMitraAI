import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sun, CloudRain, Cloud, Wind, Droplets, Volume2, Calendar, ShieldAlert, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../utils/i18n';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface ForecastDay {
  dayIndex: number;
  tempMin: number;
  tempMax: number;
  condition: 'sunny' | 'rainy' | 'cloudy';
  rainChance: number;
}

interface WeatherData {
  latitude: number;
  longitude: number;
  current: {
    temp: number;
    condition: 'sunny' | 'rainy' | 'cloudy';
    wind_speed: number;
    humidity: number;
    rain_chance: number;
  };
  forecast: ForecastDay[];
  advisory: string;
}

interface Profile {
  name: string;
  crops: string[];
  state: string;
  district: string;
  language: string;
}

const Weather: React.FC = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isPlayingAdvisory, setIsPlayingAdvisory] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    name: 'Ravindra ji',
    crops: ['wheat', 'onion', 'tomato'],
    state: 'Madhya Pradesh',
    district: 'Bhopal',
    language: 'hi'
  });

  const playbackAudioRef = useRef<HTMLAudioElement | null>(null);

  // Load user profile
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
          language: parsed.language || 'hi'
        });
      } catch (e) {
        console.error("Failed to parse user profile:", e);
      }
    }
  }, []);

  // Fetch weather data based on geolocation or default coordinates
  useEffect(() => {
    let active = true;

    const fetchWeather = async (lat: number, lon: number) => {
      if (!active) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/weather?lat=${lat}&lon=${lon}&lang=${lang}`);
        if (!res.ok) throw new Error("Failed to load weather data");
        const data = await res.json();
        if (active) {
          setWeatherData(data);
        }
      } catch (err: any) {
        console.error(err);
        if (active) {
          setError(t('weather_error') || "Mausam ka data load nahi ho paya. (Unable to load weather data)");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    const saved = localStorage.getItem('kisanmitra_profile');
    let hasCoords = false;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.latitude && parsed.longitude) {
          fetchWeather(parsed.latitude, parsed.longitude);
          hasCoords = true;
        }
      } catch (e) {}
    }

    if (!hasCoords) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            fetchWeather(position.coords.latitude, position.coords.longitude);
          },
          (err) => {
            console.log("Geolocation error, using defaults (Bhopal):", err);
            fetchWeather(23.2599, 77.4126);
          },
          { timeout: 8000 }
        );
      } else {
        fetchWeather(23.2599, 77.4126);
      }
    }

    return () => {
      active = false;
      if (playbackAudioRef.current) {
        playbackAudioRef.current.pause();
      }
    };
  }, [lang]);

  const weekdayNames: Record<string, string[]> = {
    hi: ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'],
    hl: ['Ravivar', 'Somvar', 'Mangalvar', 'Budhvar', 'Guruvar', 'Shukravar', 'Shanivar'],
    en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    mr: ['रविवार', 'सोमवार', 'मंगळवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'],
    gu: ['રવિવાર', 'સોમવાર', 'મંગળવાર', 'બુધવાર', 'ગુરૂવાર', 'શુક્રવાર', 'શનિવાર'],
    pa: ['ਐਤਵਾਰ', 'ਸੋਮਵਾਰ', 'ਮੰਗਲਵਾਰ', 'ਬੁੱਧਵਾਰ', 'ਵੀਰਵਾਰ', 'ਸ਼ੁੱੱਕਰਵਾਰ', 'ਸ਼ਨਿੱਚਰਵਾਰ']
  };

  const getDayName = (dayIdx: number) => {
    const list = weekdayNames[lang] || weekdayNames['hi'];
    const today = new Date().getDay();
    const targetDay = (today + dayIdx) % 7;
    
    // Add (Today) or (Aaj) suffix
    if (dayIdx === 0) {
      return lang === 'hi' ? `${list[targetDay]} (आज)` : lang === 'hl' ? `${list[targetDay]} (Today)` : `${list[targetDay]} (Today)`;
    }
    return list[targetDay] || '';
  };

  const getWeatherIcon = (cond: 'sunny' | 'rainy' | 'cloudy', size = 20) => {
    switch (cond) {
      case 'sunny': return <Sun size={size} className="text-[#e8960a]" />;
      case 'rainy': return <CloudRain size={size} className="text-[#4a90d9]" />;
      case 'cloudy': return <Cloud size={size} className="text-gray-400" />;
      default: return <Sun size={size} className="text-[#e8960a]" />;
    }
  };

  const getWeatherLabel = (cond: 'sunny' | 'rainy' | 'cloudy') => {
    const labels: Record<string, Record<string, string>> = {
      hi: { sunny: 'खुला मौसम (Sunny)', rainy: 'बारिश (Rainy)', cloudy: 'बादल छाए (Cloudy)' },
      hl: { sunny: 'Khula Mausam (Sunny)', rainy: 'Baarish (Rainy)', cloudy: 'Badal Chhaye (Cloudy)' },
      en: { sunny: 'Sunny', rainy: 'Rainy', cloudy: 'Cloudy' },
      mr: { sunny: 'स्वच्छ हवामान (Sunny)', rainy: 'पाऊस (Rainy)', cloudy: 'ढगाळ हवामान (Cloudy)' },
      gu: { sunny: 'ખુલ્લું હવામાન (Sunny)', rainy: 'વરસાદ (Rainy)', cloudy: 'વાદળછાયું (Cloudy)' },
      pa: { sunny: 'ਸਾਫ਼ ਮੌਸਮ (Sunny)', rainy: 'ਮੀਂਹ (Rainy)', cloudy: 'ਬੱਦਲਵਾਈ (Cloudy)' }
    };
    const langMap = labels[lang] || labels['hi'];
    return langMap[cond] || cond;
  };

  const toggleSpeech = async () => {
    if (isPlayingAdvisory) {
      if (playbackAudioRef.current) {
        playbackAudioRef.current.pause();
      }
      setIsPlayingAdvisory(false);
      return;
    }

    if (!weatherData) return;

    setIsPlayingAdvisory(true);

    try {
      const textToSpeak = weatherData.advisory;
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
            setIsPlayingAdvisory(false);
          };
        })
        .catch((err) => {
          console.error(err);
          setIsPlayingAdvisory(false);
        });
    } catch (e) {
      console.error("Synthesize error:", e);
      setIsPlayingAdvisory(false);
    }
  };

  const getLocalDateString = () => {
    const localeMap: Record<string, string> = {
      hi: 'hi-IN',
      hl: 'en-IN',
      en: 'en-IN',
      mr: 'mr-IN',
      gu: 'gu-IN',
      pa: 'pa-IN'
    };
    return new Date().toLocaleDateString(localeMap[lang] || 'hi-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Dynamically estimate soil moisture based on temperature and humidity
  const estimatedMoisture = weatherData
    ? Math.min(95, Math.max(15, Math.round(weatherData.current.humidity * 0.7 - (weatherData.current.temp - 20) * 0.6)))
    : 34;

  const getSoilMoistureAdvice = () => {
    const isEnglish = lang === 'en';
    if (estimatedMoisture > 70) {
      return isEnglish
        ? `ℹ️ High soil moisture (${estimatedMoisture}%). Postpone irrigation to avoid root rot.`
        : `ℹ️ मिट्टी में नमी अधिक (${estimatedMoisture}%) है। फसलों में अगली सिंचाई अभी रोक दें।`;
    } else if (estimatedMoisture < 30) {
      return isEnglish
        ? `ℹ️ Soil is dry (${estimatedMoisture}%). Plan irrigation for evening to maintain root health.`
        : `ℹ️ मिट्टी सूखी (${estimatedMoisture}%) हो रही है। कृपया शाम को सिंचाई का प्रबंध करें।`;
    } else {
      return isEnglish
        ? `ℹ️ Soil moisture level is optimal (${estimatedMoisture}%). Normal irrigation cycles can be maintained.`
        : `ℹ️ मिट्टी में नमी बिल्कुल सही (${estimatedMoisture}%) है। सामान्य सिंचाई जारी रखें।`;
    }
  };

  return (
    <div className="flex flex-col bg-[#fbf9f3] min-h-screen pb-[88px] font-sans text-[#1b1c18]">
      
      {/* Header */}
      <div className="h-[56px] border-b border-[#eae8e2] bg-white px-4 flex items-center gap-3 shrink-0 sticky top-0 z-40">
        <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-black">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-[17px] font-bold text-black">{t('weather_title')}</h1>
      </div>

      {loading ? (
        <div className="flex-grow flex flex-col items-center justify-center p-6 gap-3">
          <div className="w-10 h-10 border-4 border-[#005129] border-t-transparent rounded-full animate-spin" />
          <span className="text-[14px] text-gray-500 font-semibold">Mausam ki jankari load ho rahi hai...</span>
        </div>
      ) : error || !weatherData ? (
        <div className="p-4 flex flex-col items-center justify-center flex-grow text-center gap-3">
          <AlertTriangle size={48} className="text-[#ba1a1a]" />
          <p className="text-[14px] text-gray-600 font-bold max-w-[280px]">{error || "Failed to load weather"}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#005129] text-white rounded-lg text-[13px] font-bold"
          >
            Dobaara Koshish Karein
          </button>
        </div>
      ) : (
        <div className="p-4 flex flex-col gap-4 animate-[fadeIn_0.3s_ease]">
          
          {/* Main Weather Card */}
          <div className="w-full bg-white rounded-[16px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)] border border-[#eae8e2]">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-[12px] font-bold text-[#005129]">{t('weather_season')}</p>
                <h2 className="text-[20px] font-bold text-black mt-0.5">{profile.district}, {profile.state}</h2>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[11px] text-gray-400 font-semibold">{getLocalDateString()}</span>
                <span className="text-[11px] text-[#e8960a] font-bold mt-1 bg-[#fff9ed] px-2 py-0.5 rounded-full">{t('home_weather_updated')}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 my-4">
              <div className="w-[64px] h-[64px] rounded-full bg-[#fff9ed] flex items-center justify-center">
                {getWeatherIcon(weatherData.current.condition, 38)}
              </div>
              <div>
                <div className="flex items-baseline">
                  <span className="text-[36px] font-bold text-black leading-none">{weatherData.current.temp}</span>
                  <span className="text-[20px] font-bold text-black">°C</span>
                </div>
                <p className="text-[13px] font-bold text-gray-600 mt-1">{getWeatherLabel(weatherData.current.condition)}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 border-t border-[#f0eee8] pt-4 mt-2">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 text-gray-700">
                  <Wind size={15} />
                  <span className="text-[13px] font-bold">{weatherData.current.wind_speed} km/h</span>
                </div>
                <span className="text-[10px] text-gray-400 mt-0.5">{t('home_weather_wind')}</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 text-gray-700">
                  <Droplets size={15} className="text-[#4a90d9]" />
                  <span className="text-[13px] font-bold">{weatherData.current.humidity}%</span>
                </div>
                <span className="text-[10px] text-gray-400 mt-0.5">{t('home_weather_humidity')}</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 text-gray-700">
                  <CloudRain size={15} className="text-[#4a90d9]" />
                  <span className="text-[13px] font-bold">{weatherData.current.rain_chance}%</span>
                </div>
                <span className="text-[10px] text-gray-400 mt-0.5">{t('home_weather_rain')}</span>
              </div>
            </div>
          </div>

          {/* Dynamic Soil Moisture Card */}
          <div className="w-full bg-white rounded-[16px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)] border border-[#eae8e2]">
            <h3 className="text-[14px] font-bold text-black mb-3">{t('weather_moisture')}</h3>
            <div className="flex justify-between text-[12px] font-bold mb-1.5">
              <span className="text-gray-500">{t('weather_moisture_dry')}</span>
              <span className="text-[#005129]">{estimatedMoisture}% ({estimatedMoisture > 70 ? 'High' : estimatedMoisture < 30 ? 'Low' : t('weather_moisture_good')})</span>
              <span className="text-gray-500">{t('weather_moisture_wet')}</span>
            </div>
            <div className="w-full h-[8px] bg-gray-100 rounded-full relative overflow-hidden">
              <div className="absolute top-0 left-0 h-full bg-[#005129] rounded-full transition-all duration-500" style={{ width: `${estimatedMoisture}%` }} />
            </div>
            <p className="text-[11px] text-gray-500 leading-normal mt-2">
              {getSoilMoistureAdvice()}
            </p>
          </div>

          {/* AI Agri-Advisory Audio Playback Card */}
          <div className="w-full bg-[#edf7f1] border border-[#97f3b1] rounded-[16px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[14px] font-bold text-[#005129] flex items-center gap-1.5">
                <ShieldAlert size={16} /> {t('weather_advisory_title')}
              </h3>
              <button
                onClick={toggleSpeech}
                className={`h-[28px] px-3.5 rounded-full font-bold text-[12px] flex items-center gap-1 transition-all ${
                  isPlayingAdvisory 
                    ? 'bg-[#ba1a1a] text-white' 
                    : 'bg-[#005129] text-white hover:bg-[#1a6b3c]'
                }`}
              >
                <Volume2 size={13} />
                {isPlayingAdvisory ? 'Rokein' : t('voice_suno').replace('🔊', '').trim()}
              </button>
            </div>
            <p className="text-[13px] text-gray-800 leading-relaxed font-medium">
              "{weatherData.advisory}"
            </p>
          </div>

          {/* 7-Day Forecast */}
          <div className="w-full bg-white rounded-[16px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)] border border-[#eae8e2]">
            <h3 className="text-[14px] font-bold text-black mb-3 flex items-center gap-1.5">
              <Calendar size={16} className="text-gray-500" /> {t('weather_7day')}
            </h3>
            <div className="flex flex-col gap-2.5">
              {weatherData.forecast.map((day, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between py-2 border-b border-[#f0eee8] last:border-0"
                >
                  <span className="text-[13px] font-bold text-gray-700 w-[120px]">{getDayName(day.dayIndex)}</span>
                  <div className="flex items-center gap-1.5 w-[100px]">
                    {getWeatherIcon(day.condition)}
                    <span className="text-[11px] text-gray-500 font-semibold">{day.rainChance}%</span>
                  </div>
                  <div className="text-[13px] font-bold text-black text-right">
                    <span>{day.tempMax}°</span>
                    <span className="text-gray-400 font-normal ml-1.5">/{day.tempMin}°</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default Weather;
