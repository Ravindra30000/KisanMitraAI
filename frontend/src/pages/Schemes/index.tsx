import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Volume2, ExternalLink, Sparkles, MapPin } from 'lucide-react';
import { useLanguage } from '../../utils/i18n';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface Scheme {
  id: string;
  category: string;
  state: string;
  title: string;
  department: string;
  benefits: string;
  eligibility: string;
  linkText: string;
}

const Schemes: React.FC = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [advisory, setAdvisory] = useState<string>('');
  const [advisoryLoading, setAdvisoryLoading] = useState(true);
  const [isPlayingAdvisory, setIsPlayingAdvisory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Profile state to show context
  const [farmerProfile, setFarmerProfile] = useState<{
    name: string;
    state: string;
    district: string;
    farmSize: string;
    crops: string[];
  } | null>(null);

  const playbackAudioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch schemes and advisory based on farmer profile
  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      setAdvisoryLoading(true);

      const saved = localStorage.getItem('kisanmitra_profile');
      let profile = {
        name: 'Ravindra ji',
        state: 'Madhya Pradesh',
        district: 'Bhopal',
        farmSize: '2.5',
        crops: ['wheat', 'onion', 'tomato']
      };

      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          profile = {
            name: parsed.name || profile.name,
            state: parsed.state || profile.state,
            district: parsed.district || profile.district,
            farmSize: parsed.farmSize || profile.farmSize,
            crops: parsed.crops || profile.crops
          };
        } catch (e) {
          console.error("Failed to parse local profile:", e);
        }
      }

      if (active) {
        setFarmerProfile(profile);
      }

      try {
        // 1. Fetch Schemes list
        const schemesRes = await fetch(
          `${API_BASE_URL}/api/schemes?lang=${lang}&state=${encodeURIComponent(profile.state)}`
        );
        if (!schemesRes.ok) throw new Error("Failed to load schemes.");
        const schemesData = await schemesRes.json();

        if (active) {
          setSchemes(schemesData.schemes || []);
          setLoading(false);
        }

        // 2. Fetch AI eligibility advisory
        const advisoryRes = await fetch(`${API_BASE_URL}/api/schemes/advisory`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profile: {
              name: profile.name,
              state: profile.state,
              district: profile.district,
              land_area_acres: parseFloat(profile.farmSize) || 2.5,
              crops: profile.crops
            },
            lang: lang
          })
        });

        if (!advisoryRes.ok) throw new Error("Failed to generate advisory.");
        const advisoryData = await advisoryRes.json();

        if (active) {
          setAdvisory(advisoryData.advisory || '');
          setAdvisoryLoading(false);
        }
      } catch (err: any) {
        console.error("Schemes API error:", err);
        if (active) {
          setError(err.message || "Something went wrong");
          setLoading(false);
          setAdvisoryLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
      if (playbackAudioRef.current) {
        playbackAudioRef.current.pause();
      }
    };
  }, [lang]);

  const categoryOptions = [
    { id: 'all', label: t('schemes_cat_all') },
    { id: 'direct-benefit', label: t('schemes_cat_direct') },
    { id: 'insurance', label: t('schemes_cat_insurance') },
    { id: 'irrigation', label: t('schemes_cat_irrigation') },
  ];

  const getCategoryBadgeLabel = (cat: string) => {
    switch (cat) {
      case 'direct-benefit': return t('schemes_cat_direct');
      case 'insurance': return t('schemes_cat_insurance');
      case 'irrigation': return t('schemes_cat_irrigation');
      default: return cat;
    }
  };

  const filteredSchemes = schemes.filter((s) => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.benefits.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.eligibility.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleSpeech = async () => {
    if (isPlayingAdvisory) {
      if (playbackAudioRef.current) {
        playbackAudioRef.current.pause();
      }
      setIsPlayingAdvisory(false);
      return;
    }

    if (!advisory) return;

    setIsPlayingAdvisory(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/voice/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: advisory, lang: lang })
      });
      
      if (!res.ok) throw new Error("Voice synthesis failed");
      
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
          console.error("Playback error:", err);
          setIsPlayingAdvisory(false);
        });
    } catch (e) {
      console.error("Voice synthesis request failed:", e);
      setIsPlayingAdvisory(false);
      
      // Local SpeechSynthesis fallback
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const localeMap: Record<string, string> = {
          hi: 'hi-IN', hl: 'hi-IN', en: 'en-IN', mr: 'mr-IN', gu: 'gu-IN', pa: 'pa-IN'
        };
        const utterance = new SpeechSynthesisUtterance(advisory);
        utterance.lang = localeMap[lang] || 'hi-IN';
        utterance.onend = () => setIsPlayingAdvisory(false);
        window.speechSynthesis.speak(utterance);
        setIsPlayingAdvisory(true);
      }
    }
  };

  const handleApply = (schemeTitle: string) => {
    alert(t('schemes_redirect_message') || `Redirecting to official portal for: ${schemeTitle}`);
  };

  return (
    <div className="flex flex-col bg-[#fbf9f3] min-h-screen pb-[88px] font-sans text-[#1b1c18]">
      
      {/* Header */}
      <div className="h-[56px] border-b border-[#eae8e2] bg-white px-4 flex items-center justify-between shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-black">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-[17px] font-bold text-black">{t('schemes_title')}</h1>
        </div>
        
        {farmerProfile && (
          <div className="flex items-center gap-1 bg-[#edf7f1] text-[#005129] px-2.5 py-1 rounded-full text-[11px] font-bold border border-[#b2ebd5] shadow-sm max-w-[180px] truncate">
            <MapPin size={11} className="shrink-0" />
            <span className="truncate">{farmerProfile.state} ({farmerProfile.farmSize} Ac)</span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-4">
        
        {/* Search */}
        <div className="w-full relative">
          <span className="absolute left-3.5 top-[12px] text-gray-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder={t('schemes_search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-[42px] pl-10 pr-4 rounded-[12px] border border-gray-300 bg-white text-[14px] focus:outline-none focus:border-[#005129]"
          />
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categoryOptions.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`h-[32px] px-4 rounded-full text-[12px] font-bold whitespace-nowrap transition-colors border ${
                selectedCategory === cat.id
                  ? 'bg-[#005129] text-white border-[#005129]'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* AI Eligibility Advisory Card */}
        <div className="w-full bg-gradient-to-br from-[#edf7f1] to-[#e1f3e8] border border-[#97f3b1] rounded-[16px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[14px] font-bold text-[#005129] flex items-center gap-1.5">
              <Sparkles size={16} className="text-[#e8960a]" /> {t('schemes_guide_title')}
            </h3>
            
            {!advisoryLoading && advisory && (
              <button
                onClick={toggleSpeech}
                className={`h-[28px] px-3.5 rounded-full font-bold text-[12px] flex items-center gap-1 transition-all ${
                  isPlayingAdvisory 
                    ? 'bg-[#ba1a1a] text-white' 
                    : 'bg-[#005129] text-white hover:bg-[#1a6b3c]'
                }`}
              >
                <Volume2 size={13} />
                {isPlayingAdvisory ? 'ROKEIN' : t('voice_suno').replace('🔊', '').trim()}
              </button>
            )}
          </div>
          
          {advisoryLoading ? (
            <div className="flex flex-col gap-2 py-1.5 animate-pulse">
              <div className="h-4 bg-[#c8edd4] rounded w-full"></div>
              <div className="h-4 bg-[#c8edd4] rounded w-[90%]"></div>
              <div className="h-4 bg-[#c8edd4] rounded w-[75%]"></div>
            </div>
          ) : (
            <p className="text-[13px] text-gray-800 leading-relaxed font-medium">
              "{advisory}"
            </p>
          )}
        </div>

        {/* Schemes List */}
        <div className="flex flex-col gap-3.5">
          {loading ? (
            // Shimmer Skeletal Loaders
            [1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-[16px] p-4 border border-[#eae8e2] flex flex-col gap-3 shadow-sm animate-pulse">
                <div>
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-5 bg-gray-200 rounded w-[60%] mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-[40%]"></div>
                </div>
                <div className="border-t border-[#f0eee8] pt-2 flex flex-col gap-2">
                  <div>
                    <div className="h-3 bg-gray-200 rounded w-16 mb-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-[85%]"></div>
                  </div>
                  <div>
                    <div className="h-3 bg-gray-200 rounded w-20 mb-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-[70%]"></div>
                  </div>
                </div>
                <div className="h-10 bg-gray-200 rounded-[10px] w-full mt-2"></div>
              </div>
            ))
          ) : error ? (
            <div className="text-center py-8 text-red-500 font-medium">
              {error}
            </div>
          ) : filteredSchemes.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              {t('schemes_not_found')}
            </div>
          ) : (
            filteredSchemes.map((scheme) => (
              <div 
                key={scheme.id} 
                className="bg-white rounded-[16px] p-4 border border-[#eae8e2] flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div>
                  <span className="text-[10px] font-bold text-[#006d39] bg-[#edf7f1] px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {getCategoryBadgeLabel(scheme.category)}
                  </span>
                  <h4 className="text-[16px] font-bold text-black mt-2 leading-tight">{scheme.title}</h4>
                  <p className="text-[11px] text-gray-400 mt-1">{scheme.department}</p>
                </div>

                <div className="border-t border-[#f0eee8] pt-2 flex flex-col gap-1.5">
                  <div>
                    <span className="text-[11px] font-bold text-gray-400">{t('schemes_benefits')}</span>
                    <p className="text-[13px] font-medium text-gray-800 mt-0.5">{scheme.benefits}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-gray-400">{t('schemes_eligibility')}</span>
                    <p className="text-[13px] text-gray-600 mt-0.5 leading-relaxed">{scheme.eligibility}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleApply(scheme.title)}
                  className="mt-2 w-full h-[40px] bg-[#005129] text-white hover:bg-[#1a6b3c] active:scale-98 rounded-[10px] text-[13px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                >
                  {scheme.linkText} <ExternalLink size={13} />
                </button>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default Schemes;
