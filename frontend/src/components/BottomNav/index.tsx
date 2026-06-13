import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Mic, Sprout, Sun, Store } from 'lucide-react';
import { useLanguage } from '../../utils/i18n';

const BottomNav: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { t } = useLanguage();

  const navItems = [
    { label: t('nav_home'), path: '/', icon: Home },
    { label: t('nav_voice'), path: '/voice', icon: Mic, isVoice: true },
    { label: t('nav_disease'), path: '/disease', icon: Sprout },
    { label: t('nav_weather'), path: '/weather', icon: Sun },
    { label: t('nav_market'), path: '/market', icon: Store },
  ];

  // Hide BottomNav during onboarding
  if (currentPath.startsWith('/onboarding')) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] h-[68px] bg-white border-t border-x border-[#eae8e2] flex items-center justify-around z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPath === item.path;
        
        return (
          <Link
            key={item.path}
            to={item.path}
            className="flex flex-col items-center justify-center flex-1 h-full relative"
          >
            {item.isVoice ? (
              /* Centered voice action button */
              <div className={`flex flex-col items-center justify-center w-[44px] h-[44px] rounded-full border-2 transition-all duration-200 active:scale-90 ${
                isActive 
                  ? 'bg-[#e8960a] text-white border-[#005129] shadow-lg' 
                  : 'bg-[#005129] text-white border-white shadow-md'
              }`}>
                <Icon size={24} />
              </div>
            ) : (
              <div className={`flex flex-col items-center justify-center transition-colors duration-200 ${
                isActive ? 'text-[#005129]' : 'text-[#404940]'
              }`}>
                <Icon size={20} className="mb-1" />
                <span className={`text-[11px] leading-none ${
                  isActive ? 'font-semibold' : 'font-normal'
                }`}>
                  {item.label}
                </span>
              </div>
            )}
            
            {/* Underline dot indicator for active normal tabs */}
            {!item.isVoice && isActive && (
              <div className="absolute bottom-[6px] w-[5px] h-[5px] bg-[#005129] rounded-full" />
            )}
          </Link>
        );
      })}
    </div>
  );
};

export default BottomNav;
