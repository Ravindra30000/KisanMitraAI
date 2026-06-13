import React from 'react';
import { Mic, Loader2, Volume2 } from 'lucide-react';
import { useLanguage } from '../../utils/i18n';

export type OrbState = 'idle' | 'listening' | 'processing' | 'speaking';

interface VoiceOrbProps {
  state: OrbState;
  onClick: () => void;
}

const VoiceOrb: React.FC<VoiceOrbProps> = ({ state, onClick }) => {
  const { t } = useLanguage();

  const getOrbStyles = () => {
    switch (state) {
      case 'listening':
        return 'bg-red-500 text-white border-red-200 scale-105 shadow-[0_0_30px_rgba(239,68,68,0.6)] animate-pulse';
      case 'processing':
        return 'bg-[#005129] text-white border-[#9ae9ae] scale-100 shadow-[0_0_20px_rgba(0,81,41,0.3)]';
      case 'speaking':
        return 'bg-[#e8960a] text-white border-[#ffcf97] scale-105 shadow-[0_0_25px_rgba(232,150,10,0.5)]';
      case 'idle':
      default:
        return 'bg-gradient-to-r from-[#005129] to-[#1a6b3c] text-white border-white shadow-lg hover:shadow-xl hover:scale-102';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-4 relative">
      {/* Outer Ripple Effect rings for active recording/listening */}
      {state === 'listening' && (
        <>
          <div className="absolute w-[110px] h-[110px] rounded-full bg-red-400/20 animate-ping duration-1000" />
          <div className="absolute w-[90px] h-[90px] rounded-full bg-red-400/30 animate-ping duration-1500" />
        </>
      )}

      {/* Ripple Effect for active speaking */}
      {state === 'speaking' && (
        <>
          <div className="absolute w-[110px] h-[110px] rounded-full bg-[#e8960a]/25 animate-pulse duration-1000" />
          <div className="absolute w-[90px] h-[90px] rounded-full bg-[#e8960a]/35 animate-ping duration-1500" />
        </>
      )}

      {/* Main Orb Button */}
      <button
        onClick={onClick}
        disabled={state === 'processing'}
        className={`w-[76px] h-[76px] rounded-full border-[3px] flex items-center justify-center transition-all duration-300 z-10 ${getOrbStyles()} active:scale-95`}
      >
        {state === 'listening' && <Mic size={32} className="animate-bounce" />}
        {state === 'processing' && <Loader2 size={32} className="animate-spin text-white" />}
        {state === 'speaking' && <Volume2 size={32} className="animate-pulse" />}
        {state === 'idle' && <Mic size={32} />}
      </button>

      {/* Label Text below the Orb */}
      <span className="text-[12px] font-bold text-gray-500 mt-3.5 transition-colors">
        {state === 'listening' && (
          <span className="text-red-500 flex items-center gap-1">
            🔴 {t('voice_orb_listening')}
          </span>
        )}
        {state === 'processing' && (
          <span className="text-[#005129] flex items-center gap-1">
            ✨ {t('voice_orb_processing')}
          </span>
        )}
        {state === 'speaking' && (
          <span className="text-[#e8960a] flex items-center gap-1">
            🔊 {t('voice_orb_speaking')}
          </span>
        )}
        {state === 'idle' && t('voice_orb_idle')}
      </span>

      {/* Visual audio wave-lines indicator for speaking/listening states */}
      {(state === 'speaking' || state === 'listening') && (
        <div className="flex items-center gap-1 mt-3.5 h-[16px] justify-center">
          <div className={`w-[3px] rounded-full wave-bar ${state === 'listening' ? 'bg-red-500' : 'bg-[#e8960a]'}`} style={{ height: '60%' }} />
          <div className={`w-[3px] rounded-full wave-bar ${state === 'listening' ? 'bg-red-500' : 'bg-[#e8960a]'}`} style={{ height: '100%', animationDelay: '0.15s' }} />
          <div className={`w-[3px] rounded-full wave-bar ${state === 'listening' ? 'bg-red-500' : 'bg-[#e8960a]'}`} style={{ height: '40%', animationDelay: '0.3s' }} />
          <div className={`w-[3px] rounded-full wave-bar ${state === 'listening' ? 'bg-red-500' : 'bg-[#e8960a]'}`} style={{ height: '80%', animationDelay: '0.45s' }} />
          <div className={`w-[3px] rounded-full wave-bar ${state === 'listening' ? 'bg-red-500' : 'bg-[#e8960a]'}`} style={{ height: '50%', animationDelay: '0.6s' }} />
        </div>
      )}
    </div>
  );
};

export default VoiceOrb;
