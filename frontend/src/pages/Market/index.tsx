import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, TrendingUp, TrendingDown, Volume2, Sparkles, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../utils/i18n';
import { getApiBase } from '../../utils/apiBase';

const API_BASE_URL = getApiBase();

interface MandiPrice {
  commodityId: string;
  emoji: string;
  mandi: string;
  state: string;
  price: number;
  change: number; // positive = up, negative = down
  date: 'today' | 'yesterday';
}

interface MarketData {
  state: string;
  district: string;
  prices: MandiPrice[];
  advisory: string;
}

const Market: React.FC = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [isPlayingAdvisory, setIsPlayingAdvisory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch market data based on user profile settings
  useEffect(() => {
    let active = true;

    const fetchMarket = async () => {
      setLoading(true);
      setError(null);

      const saved = localStorage.getItem('kisanmitra_profile');
      let userState = "Madhya Pradesh";
      let userDistrict = "Bhopal";
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          userState = parsed.state || "Madhya Pradesh";
          userDistrict = parsed.district || "Bhopal";
        } catch (e) {
          console.error("Failed to load profile settings:", e);
        }
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/market?state=${encodeURIComponent(userState)}&district=${encodeURIComponent(userDistrict)}&lang=${lang}`);
        if (!res.ok) throw new Error("Failed to fetch market data");
        const data = await res.json();
        if (active) {
          setMarketData(data);
        }
      } catch (err: any) {
        console.error(err);
        if (active) {
          setError(t('market_not_found') || "Mandi bhav load nahi ho paye. (Unable to load mandi rates)");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchMarket();

    return () => {
      active = false;
      if (playbackAudioRef.current) {
        playbackAudioRef.current.pause();
      }
    };
  }, [lang]);

  const getCommodityLabel = (commodityId: string) => {
    const labels: Record<string, Record<string, string>> = {
      hi: { wheat: 'गेहूं (Wheat)', onion: 'प्याज (Onion)', tomato: 'टमाटर (Tomato)', potato: 'आलू (Potato)', paddy: 'धान (Paddy)', cotton: 'कपास (Cotton)', corn: 'मक्का (Corn)', sugarcane: 'गन्ना (Sugarcane)' },
      hl: { wheat: 'Gehu (Wheat)', onion: 'Pyaaz (Onion)', tomato: 'Tamatar (Tomato)', potato: 'Aloo (Potato)', paddy: 'Dhaan (Paddy)', cotton: 'Kapas (Cotton)', corn: 'Makka (Corn)', sugarcane: 'Ganna (Sugarcane)' },
      en: { wheat: 'Wheat', onion: 'Onion', tomato: 'Tomato', potato: 'Potato', paddy: 'Paddy', cotton: 'Cotton', corn: 'Corn', sugarcane: 'Sugarcane' },
      mr: { wheat: 'गहू (Wheat)', onion: 'कांदा (Onion)', tomato: 'टोमॅटो (Tomato)', potato: 'बटाटा (Potato)', paddy: 'धान (Paddy)', cotton: 'कापूस (Cotton)', corn: 'मका (Corn)', sugarcane: 'ऊस (Sugarcane)' },
      gu: { wheat: 'ઘઉં (Wheat)', onion: 'ડુંગળી (Onion)', tomato: 'ટમેટા (Tomato)', potato: 'બટાકા (Potato)', paddy: 'ડાંગર (Paddy)', cotton: 'કપાસ (Cotton)', corn: 'મકાઈ (Corn)', sugarcane: 'શેરડી (Sugarcane)' },
      pa: { wheat: 'ਕਣਕ (Wheat)', onion: 'ਪਿਆਜ਼ (Onion)', tomato: 'ਟਮਾਟਰ (Tomato)', potato: 'ਆਲੂ (Potato)', paddy: 'ਝੋਨਾ (Paddy)', cotton: 'ਕਪਾਹ (Cotton)', corn: 'ਮੱਕੀ (Corn)', sugarcane: 'ਗੰਨਾ (Sugarcane)' }
    };
    const langMap = labels[lang] || labels['hi'];
    return langMap[commodityId] || commodityId;
  };

  const getUnitLabel = () => {
    const labels: Record<string, string> = {
      hi: 'क्विंटल',
      hl: 'Quintal',
      en: 'Quintal',
      mr: 'क्विंटल',
      gu: 'ક્વિન્ટલ',
      pa: 'ਕੁਇੰਟਲ'
    };
    return labels[lang] || 'Quintal';
  };

  const getRelativeDateLabel = (rel: string) => {
    const labels: Record<string, Record<string, string>> = {
      hi: { today: 'आज', yesterday: 'कल' },
      hl: { today: 'Today', yesterday: 'Yesterday' },
      en: { today: 'Today', yesterday: 'Yesterday' },
      mr: { today: 'आज', yesterday: 'काल' },
      gu: { today: 'આજે', yesterday: 'ગઈકાલે' },
      pa: { today: 'ਅੱਜ', yesterday: 'ਕੱਲ੍ਹ' }
    };
    const langMap = labels[lang] || labels['hi'];
    return langMap[rel] || rel;
  };

  const getMandiLabel = (mandiStr: string) => {
    // Translate standard suffixes
    let label = mandiStr;
    const langSuffixes: Record<string, string> = {
      hi: 'मंडी',
      hl: 'Mandi',
      en: 'Mandi',
      mr: 'मंडी',
      gu: 'મંડી',
      pa: 'ਮੰਡੀ'
    };
    const suffix = langSuffixes[lang] || 'Mandi';
    label = label.replace('Mandi', suffix).replace('Subji', lang === 'hi' ? 'सब्जी' : 'Subji');
    return label;
  };

  const filteredPrices = (marketData?.prices || []).filter((p) =>
    getCommodityLabel(p.commodityId).toLowerCase().includes(searchQuery.toLowerCase()) ||
    getMandiLabel(p.mandi).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSpeech = async () => {
    if (isPlayingAdvisory) {
      if (playbackAudioRef.current) {
        playbackAudioRef.current.pause();
      }
      setIsPlayingAdvisory(false);
      return;
    }

    if (!marketData || !marketData.advisory) return;

    setIsPlayingAdvisory(true);

    try {
      const textToSpeak = marketData.advisory;
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
          console.error("Playback error:", err);
          setIsPlayingAdvisory(false);
        });
    } catch (e) {
      console.error("Voice synthesis request failed:", e);
      setIsPlayingAdvisory(false);
    }
  };

  return (
    <div className="flex flex-col bg-[#fbf9f3] min-h-screen pb-[88px] font-sans text-[#1b1c18]">
      
      {/* Header */}
      <div className="h-[56px] border-b border-[#eae8e2] bg-white px-4 flex items-center gap-3 shrink-0 sticky top-0 z-40">
        <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-black">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-[17px] font-bold text-black">{t('market_title')}</h1>
      </div>

      {loading ? (
        <div className="flex-grow flex flex-col items-center justify-center p-6 gap-3">
          <div className="w-10 h-10 border-4 border-[#005129] border-t-transparent rounded-full animate-spin" />
          <span className="text-[14px] text-gray-500 font-semibold">Mandi bhav load ho rahe hain...</span>
        </div>
      ) : error || !marketData ? (
        <div className="p-4 flex flex-col items-center justify-center flex-grow text-center gap-3 animate-[fadeIn_0.3s_ease]">
          <AlertTriangle size={48} className="text-[#ba1a1a]" />
          <p className="text-[14px] text-gray-600 font-bold max-w-[280px]">{error || "Failed to load market rates"}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-[#005129] text-white rounded-xl text-[13px] font-bold shadow-md active:scale-95 transition-transform"
          >
            Dobaara Koshish Karein
          </button>
        </div>
      ) : (
        <div className="p-4 flex flex-col gap-4 animate-[fadeIn_0.3s_ease]">
          
          {/* Search */}
          <div className="w-full relative">
            <span className="absolute left-3.5 top-[12px] text-gray-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder={t('market_search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-[42px] pl-10 pr-4 rounded-[12px] border border-gray-300 bg-white text-[14px] focus:outline-none focus:border-[#005129]"
            />
          </div>

          {/* AI Market Advisory Audio Card */}
          <div className="w-full bg-[#fff4e0] border border-[#ffcf97] rounded-[16px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[14px] font-bold text-[#643e00] flex items-center gap-1.5">
                <Sparkles size={16} /> {t('market_analyst_title')}
              </h3>
              <button
                onClick={toggleSpeech}
                className={`h-[28px] px-3.5 rounded-full font-bold text-[12px] flex items-center gap-1 transition-all ${
                  isPlayingAdvisory 
                    ? 'bg-[#ba1a1a] text-white' 
                    : 'bg-[#643e00] text-white hover:bg-[#845300]'
                }`}
              >
                <Volume2 size={13} />
                {isPlayingAdvisory ? t('voice_orb_speaking').split('...')[0].replace('🔊', '').trim() : t('voice_suno').replace('🔊', '').trim()}
              </button>
            </div>
            <p className="text-[13px] text-gray-800 leading-relaxed font-medium">
              "{marketData.advisory}"
            </p>
          </div>

          {/* Mandi Rates List */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">{t('market_today')}</h3>
              <span className="text-[11px] text-gray-400 font-semibold">{t('market_base_unit').replace('प्रति क्विंटल', getUnitLabel()).replace('per Quintal', getUnitLabel())}</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {filteredPrices.map((item, idx) => {
                const isChangePositive = item.change > 0;
                const isChangeZero = item.change === 0;
                return (
                  <div 
                    key={idx} 
                    className="bg-white rounded-[16px] p-4 border border-[#eae8e2] flex items-center justify-between shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[28px]">{item.emoji}</span>
                      <div>
                        <h4 className="text-[15px] font-bold text-black leading-tight">{getCommodityLabel(item.commodityId)}</h4>
                        <p className="text-[11px] text-gray-500 font-semibold mt-1">
                          {getMandiLabel(item.mandi)}, {item.state} • {getRelativeDateLabel(item.date)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[18px] font-bold text-black">₹{item.price.toLocaleString('en-IN')}</span>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        {isChangeZero ? (
                          <span className="text-[11px] text-gray-400 font-bold">{lang === 'hi' ? 'कोई बदलाव नहीं' : 'No change'}</span>
                        ) : isChangePositive ? (
                          <>
                            <TrendingUp size={12} className="text-[#006d39]" />
                            <span className="text-[11px] text-[#006d39] font-bold">+₹{item.change}</span>
                          </>
                        ) : (
                          <>
                            <TrendingDown size={12} className="text-[#ba1a1a]" />
                            <span className="text-[11px] text-[#ba1a1a] font-bold">-₹{Math.abs(item.change)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredPrices.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  {t('market_not_found')}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default Market;
