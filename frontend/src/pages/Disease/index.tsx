import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Upload, AlertCircle, X, ZoomIn } from 'lucide-react';
import { useLanguage } from '../../utils/i18n';
import { getApiBase } from '../../utils/apiBase';

const API_BASE_URL = getApiBase();

interface OrganicRemedy {
  step: number;
  action: string;
  recipe?: string;
  ingredients_local: boolean;
  timing?: string;
  frequency?: string;
}

interface DiagnosisResult {
  disease_name: string;
  disease_name_hindi: string;
  confidence: number;
  symptoms_observed: string[];
  organic_remedies: OrganicRemedy[];
  chemical_remedies: string[];
  prevention: string;
  confidence_label: string;
  rag_sources?: string[];
  disclaimer: string;
  kvk_number: string;
  image_url?: string;
}

const Disease: React.FC = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [isScanning, setIsScanning]       = useState(false);
  const [showResult, setShowResult]       = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg]           = useState<string | null>(null);
  const [diagnosis, setDiagnosis]         = useState<DiagnosisResult | null>(null);
  const STORAGE_KEY = 'km_debug_logs';
  const [debugLogs, setDebugLogs] = useState<string[]>(() => {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
  });
  const [showDebug, setShowDebug] = useState(false);

  const addLog = (msg: string) => {
    const entry = `[${new Date().toLocaleTimeString()}] ${msg}`;
    console.log('[KisanMitra]', msg);
    setDebugLogs((prev) => {
      const next = [...prev, entry];
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const clearLogs = () => {
    setDebugLogs([]);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
  };

  // Detect when user returns from camera app — fires even if file delivery failed
  useEffect(() => {
    const onFocus = () => addLog('▶ Window regained focus (returned from camera/gallery)');
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        addLog(`▶ Page visible again. visibilityState=${document.visibilityState}`);
      }
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const logEnvironment = () => {
    addLog(`UA: ${navigator.userAgent.slice(0, 100)}`);
    addLog(`API: ${API_BASE_URL} | online: ${navigator.onLine}`);
    if ('permissions' in navigator) {
      (navigator.permissions.query({ name: 'camera' as PermissionName }))
        .then((p) => addLog(`Camera permission: ${p.state}`))
        .catch((e) => addLog(`Permission query error: ${e}`));
    }
  };

  // ── Shared file change handler ──────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, source: 'camera' | 'gallery') => {
    const fileCount = e.target.files?.length ?? 0;
    addLog(`✅ ${source} onChange fired! files.length=${fileCount}`);
    const file = e.target.files?.[0];
    if (file) {
      addLog(`File: "${file.name}" size=${(file.size / 1024).toFixed(1)}KB type=${file.type || 'unknown'}`);
      const reader = new FileReader();
      reader.onload = (ev) => {
        addLog('Preview image ready — displaying in viewfinder.');
        setSelectedImage(ev.target?.result as string);
      };
      reader.onerror = () => addLog('❌ FileReader error while loading preview.');
      reader.readAsDataURL(file);
      compressAndDiagnose(file);
    } else {
      addLog('⚠ onChange fired but file list is empty — user cancelled or low memory lost the file.');
    }
    e.target.value = '';
  };

  // ── Compress → upload ───────────────────────────────────────────────────────
  const compressAndDiagnose = (file: File) => {
    addLog(`Starting compression. Original: ${(file.size / 1024).toFixed(1)}KB`);
    setIsScanning(true);
    setShowResult(false);
    setDiagnosis(null);
    setErrorMsg(null);

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX = 1024;
      let w = img.width;
      let h = img.height;
      if (w > h) { if (w > MAX) { h = Math.round((h * MAX) / w); w = MAX; } }
      else        { if (h > MAX) { w = Math.round((w * MAX) / h); h = MAX; } }
      addLog(`Canvas: ${img.width}x${img.height} → ${w}x${h}`);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        addLog('No canvas 2D context — uploading original.');
        return uploadForDiagnosis(file);
      }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            addLog(`Compressed to ${(blob.size / 1024).toFixed(1)}KB`);
            uploadForDiagnosis(new File([blob], file.name || 'crop.jpg', { type: 'image/jpeg', lastModified: Date.now() }));
          } else {
            addLog('toBlob=null — uploading original.');
            uploadForDiagnosis(file);
          }
        },
        'image/jpeg',
        0.82,
      );
    };

    img.onerror = (err) => {
      addLog(`Image load error: ${err} — uploading original.`);
      URL.revokeObjectURL(objectUrl);
      uploadForDiagnosis(file);
    };
  };

  const uploadForDiagnosis = async (imageFile: File) => {
    const url = `${API_BASE_URL}/api/disease/diagnose`;
    addLog(`POST ${url} (${(imageFile.size / 1024).toFixed(1)}KB)`);
    try {
      const form = new FormData();
      form.append('file', imageFile);
      form.append('lang', lang);
      form.append('crop', 'tomato');
      form.append('region', 'Madhya Pradesh');
      form.append('season', 'Kharif');

      const res = await fetch(url, { method: 'POST', body: form });
      addLog(`Response: HTTP ${res.status} ${res.statusText}`);

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error((errBody as any).detail || `Server error ${res.status}`);
      }

      const data: DiagnosisResult = await res.json();
      addLog(`✅ SUCCESS — "${data.disease_name}" confidence=${data.confidence}%`);
      setDiagnosis(data);
      setShowResult(true);
    } catch (err: any) {
      addLog(`❌ UPLOAD ERROR: ${err.message}`);
      setErrorMsg(err.message || 'Error diagnosing crop image. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const resetDetector = () => {
    addLog('Resetting detector.');
    setSelectedImage(null);
    setShowResult(false);
    setDiagnosis(null);
    setErrorMsg(null);
  };

  const displayCropName    = 'Tamatar (Tomato)';
  const displayDiseaseName = diagnosis
    ? (lang === 'hi' || lang === 'hl' ? diagnosis.disease_name_hindi : diagnosis.disease_name)
    : '';
  const isHindi = lang === 'hi' || lang === 'hl';

  return (
    <div className="flex flex-col bg-[#fbf9f3] min-h-screen pb-[120px] font-sans text-[#1b1c18]">

      {/*
        Inputs are positioned OFF-SCREEN (not nested inside any overflow:hidden container).
        This is critical: Android Chrome cannot deliver a file back to an input that is
        clipped by overflow:hidden. We use htmlFor on labels to associate them.
      */}
      <input
        ref={cameraInputRef}
        id="km-camera-input"
        type="file"
        accept="image/*"
        capture="environment"
        disabled={isScanning}
        onChange={(e) => handleFileChange(e, 'camera')}
        style={{ position: 'fixed', left: '-9999px', top: 0, width: '1px', height: '1px', opacity: 0 }}
      />
      <input
        ref={galleryInputRef}
        id="km-gallery-input"
        type="file"
        accept="image/*"
        disabled={isScanning}
        onChange={(e) => handleFileChange(e, 'gallery')}
        style={{ position: 'fixed', left: '-9999px', top: 0, width: '1px', height: '1px', opacity: 0 }}
      />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="h-[56px] border-b border-[#eae8e2] bg-white px-4 flex items-center justify-between shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-black">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-[17px] font-bold text-black">{t('disease_title')}</h1>
        </div>
        {showResult && (
          <button onClick={resetDetector} className="text-[13px] text-[#005129] font-bold hover:underline">
            {t('disease_retry')}
          </button>
        )}
      </div>

      {/* ── Error Banner ────────────────────────────────────────────────────── */}
      {errorMsg && (
        <div className="bg-[#ffdad6] border-b border-[#ffb4ab] text-[#ba1a1a] px-4 py-2.5 flex items-start gap-2 text-[12px] font-bold">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <span className="flex-1">{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="ml-auto text-[#ba1a1a] hover:text-black">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Main content ────────────────────────────────────────────────────── */}
      {!showResult ? (
        <div className="p-5 flex flex-col items-center flex-grow mt-4 gap-6">

          <div className="text-center">
            <h2 className="text-[20px] font-bold text-black leading-tight">{t('disease_banner_title')}</h2>
            <p className="text-[12px] text-gray-500 mt-1">{t('disease_banner_sub')}</p>
          </div>

          {/* Viewfinder */}
          <div className="w-full max-w-[340px] aspect-[4/3] bg-black rounded-[20px] relative border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
            {selectedImage ? (
              <img src={selectedImage} alt="Crop to analyse" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center text-gray-500 gap-3 px-4 text-center">
                <Camera size={48} className="opacity-30 text-[#005129]" />
                <span className="text-[13px] font-medium text-gray-400">
                  {isHindi ? 'कैमरा बटन दबाकर फोटो खींचें या गैलरी से चुनें' : 'Tap Camera to take photo or choose from Gallery'}
                </span>
              </div>
            )}
            {isScanning && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4 z-20">
                <div className="w-[75%] h-[6px] bg-gray-700 rounded-full overflow-hidden relative">
                  <div className="absolute top-0 h-full bg-[#97f3b1] rounded-full w-1/3 animate-[scan-bar_1.5s_ease-in-out_infinite]" />
                </div>
                <span className="text-[14px] text-white font-bold animate-pulse">{t('disease_scanning')}</span>
              </div>
            )}
            {selectedImage && !isScanning && (
              <div className="absolute bottom-3 right-3 bg-black/40 rounded-full p-1.5 z-10">
                <ZoomIn size={16} className="text-white" />
              </div>
            )}
            <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-[#e8960a] rounded-tl-[4px] pointer-events-none" />
            <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-[#e8960a] rounded-tr-[4px] pointer-events-none" />
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-[#e8960a] rounded-bl-[4px] pointer-events-none" />
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-[#e8960a] rounded-br-[4px] pointer-events-none" />
          </div>

          {/* ── Action Buttons ── */}
          <div className="flex flex-col gap-3.5 w-full max-w-[340px]">

            {/*
              CAMERA — label uses htmlFor to activate the off-screen input.
              NOT overflow:hidden so Android can deliver the file back after capture.
            */}
            <label
              htmlFor="km-camera-input"
              className={`w-full h-[52px] bg-[#005129] hover:bg-[#1a6b3c] active:scale-[0.98] text-white rounded-[14px] font-bold flex items-center justify-center gap-2.5 transition-all shadow-md text-[15px] select-none ${isScanning ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
              onClick={() => {
                addLog('📷 Camera label tapped — activating input via htmlFor...');
                logEnvironment();
                if (cameraInputRef.current) cameraInputRef.current.value = '';
              }}
            >
              <Camera size={20} />
              {isHindi ? 'कैमरा से फोटो लें 📸' : 'Take Photo with Camera 📸'}
            </label>

            {/* GALLERY */}
            <label
              htmlFor="km-gallery-input"
              className={`w-full h-[48px] border-2 border-[#005129] bg-white hover:bg-[#f0faf4] active:scale-[0.98] text-[#005129] rounded-[14px] font-bold flex items-center justify-center gap-2.5 transition-all text-[14px] select-none ${isScanning ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
              onClick={() => {
                addLog('🖼 Gallery label tapped.');
                if (galleryInputRef.current) galleryInputRef.current.value = '';
              }}
            >
              <Upload size={17} />
              {isHindi ? 'गैलरी से चुनें' : 'Choose from Gallery'}
            </label>

            <p className="text-[11px] text-gray-400 text-center leading-relaxed">
              {isHindi
                ? '📸 कैमरा बटन दबाने पर सीधे आपके फोन का असली कैमरा खुलेगा'
                : "📸 Tapping Camera opens your phone's real native camera application"}
            </p>
          </div>
        </div>

      ) : (
        /* ── Results view ─────────────────────────────────────────────────── */
        <div className="p-5 flex flex-col items-center gap-5 w-full max-w-[380px] mx-auto animate-[fadeIn_0.25s_ease-out]">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[#edf7f1] border border-[#97f3b1] text-[#005129] flex items-center justify-center mx-auto mb-2 text-2xl font-bold">✓</div>
            <h2 className="text-[20px] font-bold text-black leading-tight">
              {isHindi ? 'बीमारी की पहचान हो गई!' : 'Disease Identified!'}
            </h2>
            <p className="text-[12px] text-gray-500 mt-1">
              {isHindi ? 'विश्लेषण सफलतापूर्वक पूरा हुआ' : 'Analysis completed successfully'}
            </p>
          </div>

          <div className="w-full bg-white rounded-[20px] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.05)] border border-[#eae8e2]">
            <div className="w-full h-[180px] relative">
              <img
                src={selectedImage || 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&q=80&w=400'}
                alt="Analysed crop"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-gray-100 shadow-sm text-[10px] font-bold text-[#005129]">
                📈 {diagnosis?.confidence ?? 90}% {t('disease_confidence')}
              </div>
            </div>

            <div className="p-4 flex flex-col gap-3">
              <div>
                <span className="text-[10px] text-[#e8960a] font-bold bg-[#fff9ed] px-2 py-0.5 rounded-full uppercase">{displayCropName}</span>
                <h3 className="text-[18px] font-bold text-black mt-1.5 leading-tight">{displayDiseaseName}</h3>
                {diagnosis && (
                  <p className="text-[12px] text-gray-500 font-semibold mt-0.5 italic">{diagnosis.disease_name}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 bg-[#fbf9f3] p-2.5 rounded-xl border border-[#f0eee8]">
                <div className="text-center border-r border-[#eae8e2]">
                  <span className="text-[10px] text-gray-400 font-bold block">{isHindi ? 'सुरक्षा स्तर' : 'Risk'}</span>
                  <span className="text-[12.5px] font-bold text-[#ba1a1a]">{t('disease_high_risk')}</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-gray-400 font-bold block">{isHindi ? 'उपचार विधि' : 'Remedy'}</span>
                  <span className="text-[12.5px] font-bold text-[#005129]">{isHindi ? 'जैविक' : 'Organic'}</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/disease-detail', { state: { diagnosis } })}
                className="w-full h-[50px] bg-[#005129] hover:bg-[#1a6b3c] active:scale-[0.98] text-white rounded-[14px] font-bold flex items-center justify-center gap-2 transition-all shadow-md text-[14px] mt-1"
              >
                🔍 {isHindi ? 'पूरा विवरण और इलाज देखें' : 'View Full Details & Remedies'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Debug Console ───────────────────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-[340px] px-5 mt-4">
        <div className="flex gap-2">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="flex-1 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 font-bold rounded-lg text-[12px] transition-colors"
          >
            {showDebug ? '🛠️ Hide Debug Logs' : '🛠️ Show Debug Logs'}
          </button>
          {showDebug && (
            <button
              onClick={clearLogs}
              className="px-3 py-2 bg-red-100 text-red-600 hover:bg-red-200 font-bold rounded-lg text-[12px] transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        {showDebug && (
          <div className="mt-2 p-3 bg-gray-900 text-green-400 font-mono text-[10px] rounded-lg h-[200px] overflow-y-auto border border-gray-700">
            {debugLogs.length === 0 ? (
              <span className="text-gray-500">No logs yet. Tap Camera or Gallery to start.</span>
            ) : (
              debugLogs.map((log, i) => (
                <div key={i} className="leading-tight py-0.5 border-b border-gray-800 last:border-0">{log}</div>
              ))
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default Disease;
