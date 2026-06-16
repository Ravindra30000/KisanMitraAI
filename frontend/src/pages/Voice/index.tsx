import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Sparkles, User, AlertCircle } from 'lucide-react';
import VoiceOrb, { type OrbState } from '../../components/VoiceOrb';
import { useLanguage } from '../../utils/i18n';
import { getApiBase } from '../../utils/apiBase';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  isVoice?: boolean;
}

const API_BASE_URL = getApiBase();

const Voice: React.FC = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t, lang } = useLanguage();
  
  // Audio recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [inputText, setInputText] = useState('');
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Set localized welcome message when language loads or changes
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: t('voice_welcome'),
        isVoice: false
      }
    ]);
  }, [lang]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, orbState]);

  // Clean up media streams and audio playback on unmount
  useEffect(() => {
    return () => {
      stopMicrophone();
      if (playbackAudioRef.current) {
        playbackAudioRef.current.pause();
      }
    };
  }, []);

  const stopMicrophone = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // 1. STT + LLM + TTS Full Cycle Recording triggers
  const startRecording = async () => {
    setErrorMessage(null);
    audioChunksRef.current = [];
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleUploadAndProcess(audioBlob);
      };
      
      recorder.start();
      setOrbState('listening');
      
      if (playbackAudioRef.current) {
        playbackAudioRef.current.pause();
      }
    } catch (err: any) {
      console.error('Microphone error:', err);
      setErrorMessage(t('voice_mic_blocked'));
      setOrbState('idle');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    stopMicrophone();
  };

  const handleUploadAndProcess = async (audioBlob: Blob) => {
    setOrbState('processing');
    
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'query.webm');
      
      const response = await fetch(`${API_BASE_URL}/api/voice/process?lang=${lang}`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || t('voice_server_error'));
      }
      
      const data = await response.json();
      
      // Append User message (from transcription query)
      const userMsgId = 'u-' + Date.now();
      setMessages((prev) => [
        ...prev,
        {
          id: userMsgId,
          sender: 'user',
          text: data.query,
          isVoice: true
        }
      ]);
      
      // Append AI message
      const aiMsgId = 'ai-' + Date.now();
      setMessages((prev) => [
        ...prev,
        {
          id: aiMsgId,
          sender: 'ai',
          text: data.response,
          isVoice: false
        }
      ]);
      
      // Playback Synthesized Audio Response
      playResponseAudio(data.audio_url);
      
    } catch (err: any) {
      console.error('Processing error:', err);
      setErrorMessage(err.message || t('voice_server_error'));
      setOrbState('idle');
    }
  };

  const playResponseAudio = (relativeUrl: string) => {
    if (playbackAudioRef.current) {
      playbackAudioRef.current.pause();
    }
    
    const absoluteUrl = `${API_BASE_URL}${relativeUrl}`;
    const audio = new Audio(absoluteUrl);
    playbackAudioRef.current = audio;
    
    setOrbState('speaking');
    
    audio.play()
      .then(() => {
        audio.onended = () => {
          setOrbState('idle');
        };
      })
      .catch((err) => {
        console.error('Audio play error:', err);
        setOrbState('idle');
      });
  };

  const toggleOrbAction = () => {
    if (orbState === 'idle') {
      startRecording();
    } else if (orbState === 'listening') {
      stopRecording();
    } else if (orbState === 'speaking') {
      if (playbackAudioRef.current) {
        playbackAudioRef.current.pause();
      }
      setOrbState('idle');
    }
  };

  // 2. Keyboard Text Fallback
  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    const userText = inputText;
    setInputText('');
    setErrorMessage(null);
    setOrbState('processing');
    
    const userMsgId = 'u-' + Date.now();
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: 'user',
        text: userText,
        isVoice: false
      }
    ]);
    
    try {
      // 1. Get AI Text response with active language parameter
      const respondRes = await fetch(`${API_BASE_URL}/api/voice/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userText, lang: lang })
      });
      
      if (!respondRes.ok) throw new Error(t('voice_server_error'));
      const respondData = await respondRes.json();
      const aiResponseText = respondData.response;
      
      // 2. Request Audio synthesis with active language parameter
      const synthRes = await fetch(`${API_BASE_URL}/api/voice/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiResponseText, lang: lang })
      });
      
      if (!synthRes.ok) throw new Error(t('voice_server_error'));
      
      const audioBlob = await synthRes.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const aiMsgId = 'ai-' + Date.now();
      setMessages((prev) => [
        ...prev,
        {
          id: aiMsgId,
          sender: 'ai',
          text: aiResponseText,
          isVoice: false
        }
      ]);
      
      playResponseAudioFromBlob(audioUrl);
      
    } catch (err: any) {
      console.error(err);
      setErrorMessage(t('voice_server_error'));
      setOrbState('idle');
    }
  };

  const playResponseAudioFromBlob = (url: string) => {
    if (playbackAudioRef.current) {
      playbackAudioRef.current.pause();
    }
    const audio = new Audio(url);
    playbackAudioRef.current = audio;
    
    setOrbState('speaking');
    audio.play()
      .then(() => {
        audio.onended = () => {
          setOrbState('idle');
        };
      })
      .catch((err) => {
        console.error(err);
        setOrbState('idle');
      });
  };

  const forceReplay = async (msgText: string) => {
    setOrbState('processing');
    try {
      const res = await fetch(`${API_BASE_URL}/api/voice/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: msgText, lang: lang })
      });
      if (!res.ok) throw new Error();
      const audioBlob = await res.blob();
      playResponseAudioFromBlob(URL.createObjectURL(audioBlob));
    } catch (e) {
      setOrbState('idle');
    }
  };

  const getLanguageLabel = (langCode: string) => {
    const labels: Record<string, string> = {
      hi: 'हिन्दी',
      hl: 'हिंग्लिश',
      en: 'English',
      mr: 'मराठी',
      gu: 'ગુજરાતી',
      pa: 'ਪੰਜਾਬੀ'
    };
    return labels[langCode] || langCode;
  };

  return (
    <div className="flex flex-col bg-[#fbf9f3] h-screen font-sans text-[#1b1c18] pb-[68px]">
      
      {/* Header */}
      <div className="h-[56px] border-b border-[#eae8e2] bg-white px-4 flex items-center justify-between shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-black">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-[17px] font-bold text-black flex items-center gap-1">
            <Sparkles size={16} className="text-[#005129]" /> {t('voice_title')}
          </h1>
        </div>
        <span className="text-[11px] text-[#006d39] font-bold bg-[#edf7f1] px-2.5 py-0.5 rounded-full border border-[#9ae9ae]">
          {getLanguageLabel(lang)}
        </span>
      </div>

      {/* Error alert toast */}
      {errorMessage && (
        <div className="bg-[#ffdad6] border-b border-[#ffb4ab] text-[#ba1a1a] px-4 py-2 flex items-center gap-2 text-[12px] font-bold">
          <AlertCircle size={15} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-4">
        {messages.map((msg) => {
          const isAI = msg.sender === 'ai';
          return (
            <div 
              key={msg.id} 
              className={`flex items-start gap-2.5 max-w-[85%] ${
                isAI ? 'self-start' : 'self-end flex-row-reverse'
              }`}
            >
              {/* Avatar */}
              <div className={`w-[32px] h-[32px] rounded-full flex items-center justify-center shrink-0 ${
                isAI ? 'bg-[#edf7f1] text-[#005129] border border-[#9ae9ae]' : 'bg-[#fff4e0] text-[#643e00] border border-[#ffcf97]'
              }`}>
                {isAI ? <Sparkles size={14} /> : <User size={14} />}
              </div>

              {/* Message Bubble */}
              <div className={`flex flex-col gap-1.5 p-3 rounded-[16px] shadow-[0_1px_3px_rgba(0,0,0,0.03)] border ${
                isAI 
                  ? 'bg-white border-[#eae8e2] rounded-tl-none text-black' 
                  : 'bg-[#005129] border-[#005129] rounded-tr-none text-white'
              }`}>
                <p className="text-[14px] leading-relaxed whitespace-pre-line">{msg.text}</p>
                
                {/* Audio replay trigger */}
                {isAI && (
                  <button 
                    onClick={() => forceReplay(msg.text)}
                    className="self-start h-[26px] px-3 rounded-full font-bold text-[11px] flex items-center gap-1 mt-1 bg-[#edf7f1] text-[#005129] border border-[#9ae9ae] hover:bg-[#005129] hover:text-white"
                  >
                    {t('voice_suno')}
                  </button>
                )}
                
                {/* Spoken mode badge */}
                {!isAI && msg.isVoice && (
                  <span className="text-[10px] text-emerald-200 self-end">
                    🎤 {t('voice_mode_spoken')}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer Controls */}
      <div className="border-t border-[#eae8e2] bg-white p-4 shrink-0 flex flex-col gap-3 z-30">
        
        {/* Toggle Mode */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setShowKeyboard(!showKeyboard)}
            className="flex items-center gap-1.5 text-gray-500 font-bold text-[13px] hover:text-[#005129] transition-colors"
          >
            {showKeyboard ? (
              <span className="flex items-center gap-1">🎤 {t('voice_mode_spoken')}</span>
            ) : (
              <span className="flex items-center gap-1">⌨️ {t('voice_mode_keyboard')}</span>
            )}
          </button>
        </div>

        {showKeyboard ? (
          /* Keyboard Input Box */
          <form onSubmit={handleTextSubmit} className="flex gap-2 w-full">
            <input
              type="text"
              placeholder={t('voice_input_placeholder')}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-grow h-[42px] px-3.5 rounded-[12px] border border-gray-300 bg-white text-[14px] focus:outline-none focus:border-[#005129]"
              disabled={orbState === 'processing'}
            />
            <button 
              type="submit"
              disabled={orbState === 'processing'}
              className="w-[42px] h-[42px] bg-[#005129] hover:bg-[#1a6b3c] active:scale-95 rounded-[12px] text-white flex items-center justify-center transition-all shadow-md shrink-0 disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </form>
        ) : (
          /* Mic Orb Control Trigger */
          <VoiceOrb state={orbState} onClick={toggleOrbAction} />
        )}

      </div>

    </div>
  );
};

export default Voice;
