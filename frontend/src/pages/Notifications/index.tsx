import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, AlertTriangle, CloudRain, Trash2, Sprout, TrendingUp, ArrowRight, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../../utils/i18n';
import { getApiBase } from '../../utils/apiBase';

const API_BASE_URL = getApiBase();

interface KMNotification {
  id: string;
  type: 'disease' | 'weather' | 'market' | 'scheme';
  title: string;
  content: string;
  time: string;
  unread: boolean;
  actionRoute?: string;
  actionText?: string;
}

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const [notifications, setNotifications] = useState<KMNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Settings toggles state
  const [settings, setSettings] = useState({
    disease: true,
    market: true,
    weather: true,
    scheme: true
  });



  // Multi-lingual UI Strings
  const localUIDict: Record<string, Record<string, string>> = {
    hi: {
      title: "सूचनाएं",
      sab_padhein: "सब पढ़ें",
      aaj: "आज",
      pehle: "पहले",
      settings_title: "अलर्ट सेटिंग्स",
      nayi_suchna: "नयी सूचनाएं",
      no_notifications: "कोई सूचना नहीं है",
      disease_toggle: "रोग अलर्ट",
      price_toggle: "मंडी दाम अलर्ट",
      weather_toggle: "मौसम चेतावनी",
      scheme_toggle: "योजना समय-सीमा"
    },
    hl: {
      title: "Suchnayen",
      sab_padhein: "Sab padhein",
      aaj: "Aaj",
      pehle: "Pehle",
      settings_title: "Alert Settings",
      nayi_suchna: "nayi suchnayen",
      no_notifications: "Koi suchna nahi hai",
      disease_toggle: "Disease Alerts",
      price_toggle: "Price Changes",
      weather_toggle: "Weather Warnings",
      scheme_toggle: "Scheme Deadlines"
    },
    en: {
      title: "Notifications",
      sab_padhein: "Read all",
      aaj: "Today",
      pehle: "Earlier",
      settings_title: "Alert Settings",
      nayi_suchna: "new notifications",
      no_notifications: "No notifications found",
      disease_toggle: "Disease Alerts",
      price_toggle: "Price Changes",
      weather_toggle: "Weather Warnings",
      scheme_toggle: "Scheme Deadlines"
    },
    mr: {
      title: "सूचना",
      sab_padhein: "सर्व वाचा",
      aaj: "आज",
      pehle: "पूर्वी",
      settings_title: "अलर्ट सेटिंग्ज",
      nayi_suchna: "नवीन सूचना",
      no_notifications: "कोणतीही सूचना नाही",
      disease_toggle: "रोग अलर्ट",
      price_toggle: "बाजार भाव अलर्ट",
      weather_toggle: "हवामान चेतावणी",
      scheme_toggle: "योजना मुदत"
    },
    gu: {
      title: "સૂચનાઓ",
      sab_padhein: "બધી વાંચો",
      aaj: "આજે",
      pehle: "પહેલાં",
      settings_title: "એલર્ટ સેટિંગ્સ",
      nayi_suchna: "નવી સૂચનાઓ",
      no_notifications: "કોઈ સૂચના મળી નથી",
      disease_toggle: "રોગ એલર્ટ",
      price_toggle: "બજાર ભાવ એલર્ટ",
      weather_toggle: "હવામાન ચેતવણી",
      scheme_toggle: "યોજના સમયમર્યાદા"
    },
    pa: {
      title: "ਸੂਚਨਾਵਾਂ",
      sab_padhein: "ਸਾਰੀਆਂ ਪੜ੍ਹੋ",
      aaj: "ਅੱਜ",
      pehle: "ਪਹਿਲਾਂ",
      settings_title: "ਅਲਰਟ ਸੈਟਿੰਗਜ਼",
      nayi_suchna: "ਨਵੀਆਂ ਸੂਚਨਾਵਾਂ",
      no_notifications: "ਕੋਈ ਸੂਚਨਾ ਨਹੀਂ ਲੱਭੀ",
      disease_toggle: "ਬੀਮਾਰੀ ਅਲਰਟ",
      price_toggle: "ਮੰਡੀ ਭਾਅ ਅਲਰਟ",
      weather_toggle: "ਮੌਸਮ ਚੇਤਾਵਨੀ",
      scheme_toggle: "ਯੋਜਨਾ ਆਖਰੀ ਤਾਰੀਖ"
    }
  };

  const activeLang = lang || 'hi';
  const ui = localUIDict[activeLang] || localUIDict['hi'];

  // Load state and fetch from API
  useEffect(() => {
    // 1. Load persisted read and deleted ids from localStorage
    const savedRead = localStorage.getItem('kisanmitra_read_notification_ids');
    if (savedRead) {
      try { setReadIds(JSON.parse(savedRead)); } catch(e){}
    }

    const savedDeleted = localStorage.getItem('kisanmitra_deleted_notification_ids');
    if (savedDeleted) {
      try { setDeletedIds(JSON.parse(savedDeleted)); } catch(e){}
    }

    const savedSettings = localStorage.getItem('kisanmitra_notification_settings');
    if (savedSettings) {
      try { setSettings(JSON.parse(savedSettings)); } catch(e){}
    }

    // 2. Fetch live data
    const fetchAlerts = async () => {
      // Load location/crops from user profile
      const savedProfile = localStorage.getItem('kisanmitra_profile');
      let profile = {
        latitude: 23.2599,
        longitude: 77.4126,
        state: 'Madhya Pradesh',
        district: 'Bhopal',
        crops: ['wheat', 'onion', 'tomato'],
        language: activeLang
      };
      
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          profile = { ...profile, ...parsed };
        } catch (e) {}
      }

      const queryParams = new URLSearchParams({
        lat: profile.latitude.toString(),
        lon: profile.longitude.toString(),
        state: profile.state,
        district: profile.district,
        lang: activeLang,
        crops: profile.crops.join(',')
      });

      try {
        const response = await fetch(`${API_BASE_URL}/api/notifications?${queryParams.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications || []);
        }
      } catch (err) {
        console.error("Failed to load notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [activeLang]);

  // Persist read status changes
  const updateReadStorage = (newReadIds: string[]) => {
    setReadIds(newReadIds);
    localStorage.setItem('kisanmitra_read_notification_ids', JSON.stringify(newReadIds));
  };

  // Persist deleted status changes
  const updateDeletedStorage = (newDeletedIds: string[]) => {
    setDeletedIds(newDeletedIds);
    localStorage.setItem('kisanmitra_deleted_notification_ids', JSON.stringify(newDeletedIds));
  };

  // Persist toggled settings changes
  const updateSettingsStorage = (key: keyof typeof settings, val: boolean) => {
    const next = { ...settings, [key]: val };
    setSettings(next);
    localStorage.setItem('kisanmitra_notification_settings', JSON.stringify(next));
  };

  const markAllRead = () => {
    const allActiveIds = notifications.map(n => n.id);
    updateReadStorage(Array.from(new Set([...readIds, ...allActiveIds])));
  };

  const toggleRead = (id: string) => {
    if (readIds.includes(id)) {
      updateReadStorage(readIds.filter(x => x !== id));
    } else {
      updateReadStorage([...readIds, id]);
    }
  };

  const deleteNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    updateDeletedStorage([...deletedIds, id]);
  };

  const getAlertStyles = (type: KMNotification['type'], isUnread: boolean) => {
    if (!isUnread) {
      return 'bg-[#fcfcfa] border-gray-200 border-l-4 border-l-gray-300 opacity-60';
    }
    switch (type) {
      case 'disease':
        return 'bg-[#ffdad6]/20 border-[#ba1a1a] border-l-4 text-[#ba1a1a]';
      case 'weather':
        return 'bg-blue-50/50 border-blue-500 border-l-4 text-blue-800';
      case 'market':
        return 'bg-[#edf7f1]/55 border-[#005129] border-l-4 text-[#005129]';
      case 'scheme':
        return 'bg-[#ffddb7]/20 border-[#643e00] border-l-4 text-[#643e00]';
    }
  };

  const getAlertIcon = (type: KMNotification['type']) => {
    switch (type) {
      case 'disease':
        return <AlertTriangle size={18} className="text-[#ba1a1a]" />;
      case 'weather':
        return <CloudRain size={18} className="text-blue-500" />;
      case 'market':
        return <TrendingUp size={18} className="text-[#005129]" />;
      case 'scheme':
        return <Sprout size={18} className="text-[#643e00]" />;
    }
  };

  const handleActionClick = (e: React.MouseEvent, item: KMNotification) => {
    e.stopPropagation();
    // Mark as read
    if (!readIds.includes(item.id)) {
      updateReadStorage([...readIds, item.id]);
    }
    // Navigate
    if (item.actionRoute) {
      navigate(item.actionRoute);
    }
  };

  // Filter notifications based on toggle settings and deleted ids
  const activeNotifications = notifications
    .filter(n => !deletedIds.includes(n.id))
    .filter(n => {
      if (n.type === 'disease') return settings.disease;
      if (n.type === 'market') return settings.market;
      if (n.type === 'weather') return settings.weather;
      if (n.type === 'scheme') return settings.scheme;
      return true;
    });

  // Calculate unread count among active notifications
  const unreadCount = activeNotifications.filter(n => !readIds.includes(n.id)).length;

  // Grouping notifications: Aaj (unread or weather/disease) vs Pehle (read ones)
  const todayNotifications = activeNotifications.filter(n => !readIds.includes(n.id) || n.type === 'weather' || n.type === 'disease');
  const earlierNotifications = activeNotifications.filter(n => readIds.includes(n.id) && n.type !== 'weather' && n.type !== 'disease');

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
          <h1 className="text-[17px] font-bold text-black flex items-center gap-1.5">
            <Bell size={18} className="text-primary" /> {ui.title}
          </h1>
        </div>
        <button 
          onClick={markAllRead}
          className="text-[13px] text-[#005129] font-bold hover:bg-[#005129]/5 px-3 py-1.5 rounded-lg transition-colors"
        >
          {ui.sab_padhein}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="p-4 flex flex-col gap-4 max-w-[480px] mx-auto w-full">
        
        {/* Unread Count Banner */}
        {unreadCount > 0 && (
          <div className="bg-[#ffddb7] text-[#2a1700] rounded-full py-2 px-5 flex items-center justify-center gap-2 shadow-sm font-bold text-[13px] border border-[#ffb95d]/30 transition-all duration-300">
            <span>⚡</span>
            <span>{unreadCount} {ui.nayi_suchna}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-[#005129] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Date Group: Aaj (Today) */}
            {todayNotifications.length > 0 && (
              <section className="flex flex-col gap-3">
                <h2 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider pl-1">{ui.aaj}</h2>
                {todayNotifications.map((item) => {
                  const isUnread = !readIds.includes(item.id);
                  return (
                    <div 
                      key={item.id} 
                      onClick={() => toggleRead(item.id)}
                      className={`rounded-xl border p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] active:scale-98 transition-all duration-200 cursor-pointer relative ${getAlertStyles(item.type, isUnread)}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 border border-gray-100">
                          {getAlertIcon(item.type)}
                        </span>
                        <div className="flex-grow flex flex-col gap-1 pr-6">
                          <h3 className="text-[14px] font-bold text-black leading-tight">{item.title}</h3>
                          <p className="text-[12.5px] text-gray-600 leading-snug font-semibold">{item.content}</p>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5">
                            <span className="text-[11px] text-gray-400 font-bold">{item.time}</span>
                            {item.actionRoute && (
                              <button 
                                onClick={(e) => handleActionClick(e, item)}
                                className="text-[12px] font-bold text-[#005129] hover:underline flex items-center gap-1 focus:outline-none"
                              >
                                {item.actionText} <ArrowRight size={13} strokeWidth={2.5} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Delete Button */}
                      <button 
                        onClick={(e) => deleteNotification(e, item.id)}
                        className="absolute top-3 right-3 text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-black/5 transition-colors focus:outline-none"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </section>
            )}

            {/* Date Group: Pehle (Earlier) */}
            {earlierNotifications.length > 0 && (
              <section className="flex flex-col gap-3 mt-2">
                <h2 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider pl-1">{ui.pehle}</h2>
                {earlierNotifications.map((item) => {
                  const isUnread = !readIds.includes(item.id);
                  return (
                    <div 
                      key={item.id} 
                      onClick={() => toggleRead(item.id)}
                      className={`rounded-xl border p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] active:scale-98 transition-all duration-200 cursor-pointer relative ${getAlertStyles(item.type, isUnread)}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 border border-gray-100">
                          {getAlertIcon(item.type)}
                        </span>
                        <div className="flex-grow flex flex-col gap-1 pr-6">
                          <h3 className="text-[14px] font-bold text-black leading-tight">{item.title}</h3>
                          <p className="text-[12.5px] text-gray-600 leading-snug font-semibold">{item.content}</p>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5">
                            <span className="text-[11px] text-gray-400 font-bold">{item.time}</span>
                            {item.actionRoute && (
                              <button 
                                onClick={(e) => handleActionClick(e, item)}
                                className="text-[12px] font-bold text-[#005129] hover:underline flex items-center gap-1 focus:outline-none"
                              >
                                {item.actionText} <ArrowRight size={13} strokeWidth={2.5} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Delete Button */}
                      <button 
                        onClick={(e) => deleteNotification(e, item.id)}
                        className="absolute top-3 right-3 text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-black/5 transition-colors focus:outline-none"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </section>
            )}

            {/* Empty State */}
            {activeNotifications.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3 bg-white border border-[#eae8e2] rounded-[24px]">
                <Bell size={44} className="text-gray-300 animate-pulse" />
                <p className="text-[14px] font-bold text-gray-500">{ui.no_notifications}</p>
              </div>
            )}

            {/* Alert Settings Collapsible Card */}
            <section className="bg-white rounded-[20px] border border-[#eae8e2] overflow-hidden mt-4 shadow-sm">
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors focus:outline-none"
              >
                <span className="font-bold text-[14px] text-black flex items-center gap-2">
                  <Settings size={18} className="text-primary" />
                  {ui.settings_title}
                </span>
                {showSettings ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </button>
              
              {showSettings && (
                <div className="p-4 border-t border-[#eae8e2] flex flex-col gap-4 bg-[#fcfcfa]">
                  {/* Disease Alerts Switch */}
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-gray-700">{ui.disease_toggle}</span>
                    <button
                      onClick={() => updateSettingsStorage('disease', !settings.disease)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settings.disease ? 'bg-[#005129]' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          settings.disease ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Price Alerts Switch */}
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-gray-700">{ui.price_toggle}</span>
                    <button
                      onClick={() => updateSettingsStorage('market', !settings.market)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settings.market ? 'bg-[#005129]' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          settings.market ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Weather Alerts Switch */}
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-gray-700">{ui.weather_toggle}</span>
                    <button
                      onClick={() => updateSettingsStorage('weather', !settings.weather)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settings.weather ? 'bg-[#005129]' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          settings.weather ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Schemes Alerts Switch */}
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-gray-700">{ui.scheme_toggle}</span>
                    <button
                      onClick={() => updateSettingsStorage('scheme', !settings.scheme)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settings.scheme ? 'bg-[#005129]' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          settings.scheme ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default Notifications;
