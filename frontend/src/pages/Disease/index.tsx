import React, { useState, useEffect, useRef } from 'react';
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

  // ── Refs for Native DOM events ─────────────────────────────────────────────
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // ── State ──────────────────────────────────────────────────────────────────
  const [isScanning, setIsScanning]     = useState(false);
  const [showResult, setShowResult]     = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg]         = useState<string | null>(null);
  const [diagnosis, setDiagnosis]       = useState<DiagnosisResult | null>(null);

  // ── Debug Logs State ───────────────────────────────────────────────────────
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  const addLog = (msg: string) => {
    console.log(msg);
    setDebugLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Native Event Binding for DOM inputs
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    addLog("Disease page mounted. Initializing native listeners...");

    const camInput = cameraInputRef.current;
    const galInput = galleryInputRef.current;

    const handleCamChange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      addLog(`Camera change event. Files detected: ${target.files?.length}`);
      const file = target.files?.[0];
      if (file) {
        addLog(`File received: ${file.name} (size: ${(file.size / 1024).toFixed(1)} KB), type: ${file.type}`);
        
        // Show local preview immediately
        const reader = new FileReader();
        reader.onload = (ev) => {
          addLog("FileReader successfully converted file to data URL preview.");
          setSelectedImage(ev.target?.result as string);
        };
        reader.onerror = (err) => {
          addLog(`FileReader error: ${err}`);
        };
        reader.readAsDataURL(file);

        // Compress and upload
        compressAndDiagnose(file);
      } else {
        addLog("Change event fired but no file was returned.");
      }
    };

    const handleGalChange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      addLog(`Gallery change event. Files detected: ${target.files?.length}`);
      const file = target.files?.[0];
      if (file) {
        addLog(`File received: ${file.name} (size: ${(file.size / 1024).toFixed(1)} KB), type: ${file.type}`);
        
        const reader = new FileReader();
        reader.onload = (ev) => {
          addLog("FileReader successfully converted file to data URL preview.");
          setSelectedImage(ev.target?.result as string);
        };
        reader.onerror = (err) => {
          addLog(`FileReader error: ${err}`);
        };
        reader.readAsDataURL(file);

        compressAndDiagnose(file);
      } else {
        addLog("Change event fired but no file was returned.");
      }
    };

    const handleInputClick = (e: Event) => {
      const target = e.target as HTMLInputElement;
      addLog(`Input clicked. Resetting value to empty string to ensure change event fires...`);
      target.value = "";
    };

    if (camInput) {
      camInput.addEventListener('change', handleCamChange);
      camInput.addEventListener('click', handleInputClick);
      addLog("Attached listeners to camera input.");
    }
    if (galInput) {
      galInput.addEventListener('change', handleGalChange);
      galInput.addEventListener('click', handleInputClick);
      addLog("Attached listeners to gallery input.");
    }

    return () => {
      addLog("Removing native listeners on unmount...");
      if (camInput) {
        camInput.removeEventListener('change', handleCamChange);
        camInput.removeEventListener('click', handleInputClick);
      }
      if (galInput) {
        galInput.removeEventListener('change', handleGalChange);
        galInput.removeEventListener('click', handleInputClick);
      }
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Image compression → backend diagnosis
  // ─────────────────────────────────────────────────────────────────────────
  const compressAndDiagnose = (file: File) => {
    addLog(`Starting compression workflow for: ${file.name}`);
    setIsScanning(true);
    setShowResult(false);
    setDiagnosis(null);
    setErrorMsg(null);

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    img.onload = () => {
      addLog(`Image loaded successfully in canvas. Original resolution: ${img.width}x${img.height}`);
      URL.revokeObjectURL(objectUrl);

      const MAX = 1024;
      let w = img.width;
      let h = img.height;
      if (w > h) {
        if (w > MAX) { h = Math.round((h * MAX) / w); w = MAX; }
      } else {
        if (h > MAX) { w = Math.round((w * MAX) / h); h = MAX; }
      }

      addLog(`Compression target resolution: ${w}x${h}`);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              addLog(`Compression successful. New blob size: ${(blob.size / 1024).toFixed(1)} KB`);
              const compressed = new File([blob], file.name || 'image.jpg', {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              uploadForDiagnosis(compressed);
            } else {
              addLog("toBlob returned null. Fallback to original file size.");
              uploadForDiagnosis(file);
            }
          },
          'image/jpeg',
          0.82
        );
      } else {
        addLog("Could not create 2D canvas context. Uploading original file.");
        uploadForDiagnosis(file);
      }
    };

    img.onerror = (err) => {
      addLog(`Image render failed in memory. Direct upload fallback. Error: ${err}`);
      URL.revokeObjectURL(objectUrl);
      uploadForDiagnosis(file);
    };
  };

  const uploadForDiagnosis = async (imageFile: File) => {
    addLog(`Uploading file to API. Size: ${(imageFile.size / 1024).toFixed(1)} KB`);
    try {
      const form = new FormData();
      form.append('file', imageFile);
      form.append('lang', lang);
      form.append('crop', 'tomato');
      form.append('region', 'Madhya Pradesh');
      form.append('season', 'Kharif');

      const url = `${API_BASE_URL}/api/disease/diagnose`;
      addLog(`Sending POST request to: ${url}`);
      
      const res = await fetch(url, {
        method: 'POST',
        body: form,
      });

      addLog(`API Response Status: ${res.status}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error (Status: ${res.status})`);
      }

      const data: DiagnosisResult = await res.json();
      addLog(`Diagnosis results parsed successfully! Disease: ${data.disease_name}`);
      setDiagnosis(data);
      setShowResult(true);
    } catch (err: any) {
      addLog(`Upload error caught: ${err.message}`);
      setErrorMsg(err.message || 'Error diagnosing crop image. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Reset
  // ─────────────────────────────────────────────────────────────────────────
  const resetDetector = () => {
    addLog("Resetting detector interface...");
    setSelectedImage(null);
    setShowResult(false);
    setDiagnosis(null);
    setErrorMsg(null);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Derived display values
  // ─────────────────────────────────────────────────────────────────────────
  const displayCropName    = 'Tamatar (Tomato)';
  const displayDiseaseName = diagnosis
    ? (lang === 'hi' || lang === 'hl' ? diagnosis.disease_name_hindi : diagnosis.disease_name)
    : '';

  return (
    <div className="flex flex-col bg-[#fbf9f3] min-h-screen pb-[120px] font-sans text-[#1b1c18]">

      {/* ── Hidden HTML5 File Inputs with Native Listener Refs ─────────────── */}
      <input
        id="native-camera-input"
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="absolute w-0 h-0 opacity-0 pointer-events-none"
        tabIndex={-1}
      />
      <input
        id="gallery-input"
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="absolute w-0 h-0 opacity-0 pointer-events-none"
        tabIndex={-1}
      />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="h-[56px] border-b border-[#eae8e2] bg-white px-4 flex items-center justify-between shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-black"
          >
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

      {/* ── Error Banner ───────────────────────────────────────────────── */}
      {errorMsg && (
        <div className="bg-[#ffdad6] border-b border-[#ffb4ab] text-[#ba1a1a] px-4 py-2.5 flex items-start gap-2 text-[12px] font-bold animate-[fadeIn_0.2s_ease]">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <span className="flex-1">{errorMsg}</span>
          <button
            onClick={() => setErrorMsg(null)}
            className="ml-auto text-[#ba1a1a] hover:text-black"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Main content ───────────────────────────────────────────────── */}
      {!showResult ? (
        <div className="p-5 flex flex-col items-center flex-grow mt-4 gap-6">

          {/* Title Instructions */}
          <div className="text-center">
            <h2 className="text-[20px] font-bold text-black leading-tight">
              {t('disease_banner_title')}
            </h2>
            <p className="text-[12px] text-gray-500 mt-1">
              {t('disease_banner_sub')}
            </p>
          </div>

          {/* ── Viewfinder / Preview Box ──────────────────────────────────── */}
          <div className="w-full max-w-[340px] aspect-[4/3] bg-black rounded-[20px] relative border-4 border-white shadow-md overflow-hidden flex items-center justify-center">

            {/* Selected Image Preview */}
            {selectedImage ? (
              <img src={selectedImage} alt="Crop to analyse" className="w-full h-full object-cover" />
            ) : (
              /* Idle Placeholder */
              <div className="flex flex-col items-center text-gray-500 gap-3 px-4 text-center">
                <Camera size={48} className="opacity-30 text-[#005129]" />
                <span className="text-[13px] font-medium text-gray-400">
                  {lang === 'hi' || lang === 'hl'
                    ? 'कैमरा बटन दबाकर फोटो खींचें या गैलरी से चुनें'
                    : 'Tap Camera to take photo or choose from Gallery'}
                </span>
              </div>
            )}

            {/* Scanning Overlay */}
            {isScanning && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4 z-20">
                <div className="w-[75%] h-[6px] bg-gray-700 rounded-full overflow-hidden relative">
                  <div className="absolute top-0 h-full bg-[#97f3b1] rounded-full w-1/3 animate-[scan-bar_1.5s_ease-in-out_infinite]" />
                </div>
                <span className="text-[14px] text-white font-bold animate-pulse">
                  {t('disease_scanning')}
                </span>
              </div>
            )}

            {/* Selected image zoom hint */}
            {selectedImage && !isScanning && (
              <div className="absolute bottom-3 right-3 bg-black/40 rounded-full p-1.5 z-10">
                <ZoomIn size={16} className="text-white" />
              </div>
            )}

            {/* Corner Crop Markers */}
            <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-[#e8960a] rounded-tl-[4px] pointer-events-none" />
            <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-[#e8960a] rounded-tr-[4px] pointer-events-none" />
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-[#e8960a] rounded-bl-[4px] pointer-events-none" />
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-[#e8960a] rounded-br-[4px] pointer-events-none" />
          </div>

          {/* ── Action Buttons ───────────────────────────────────────────── */}
          <div className="flex flex-col gap-3.5 w-full max-w-[340px]">

            {/* ── Primary: Native Camera Button ── */}
            <label
              htmlFor="native-camera-input"
              className={`w-full h-[52px] bg-[#005129] hover:bg-[#1a6b3c] active:scale-[0.98] ${
                isScanning ? 'opacity-50 pointer-events-none' : 'cursor-pointer'
              } text-white rounded-[14px] font-bold flex items-center justify-center gap-2.5 transition-all shadow-md text-[15px]`}
            >
              <Camera size={20} />
              {lang === 'hi' || lang === 'hl'
                ? 'कैमरा से फोटो लें 📸'
                : 'Take Photo with Camera 📸'}
            </label>

            {/* ── Secondary: Gallery Button ── */}
            <label
              htmlFor="gallery-input"
              className={`w-full h-[48px] border-2 border-[#005129] bg-white hover:bg-[#f0faf4] active:scale-[0.98] ${
                isScanning ? 'opacity-50 pointer-events-none' : 'cursor-pointer'
              } text-[#005129] rounded-[14px] font-bold flex items-center justify-center gap-2.5 transition-all text-[14px]`}
            >
              <Upload size={17} />
              {lang === 'hi' || lang === 'hl' ? 'गैलरी से चुनें' : 'Choose from Gallery'}
            </label>

            {/* Info Tip */}
            <p className="text-[11px] text-gray-400 text-center leading-relaxed">
              {lang === 'hi' || lang === 'hl'
                ? '📸 कैमरा बटन दबाने पर सीधे आपके फोन का असली कैमरा खुलेगा'
                : '📸 Tapping Camera opens your phone\'s real native camera application'}
            </p>
          </div>
        </div>

      ) : (
        /* ── Results view ───────────────────────────────────────────────── */
        <div className="p-5 flex flex-col items-center gap-5 w-full max-w-[380px] mx-auto animate-[fadeIn_0.25s_ease-out]">

          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[#edf7f1] border border-[#97f3b1] text-[#005129] flex items-center justify-center mx-auto mb-2 text-2xl font-bold">
              ✓
            </div>
            <h2 className="text-[20px] font-bold text-black leading-tight">
              {lang === 'hi' || lang === 'hl' ? 'बीमारी की पहचान हो गई!' : 'Disease Identified!'}
            </h2>
            <p className="text-[12px] text-gray-500 mt-1">
              {lang === 'hi' || lang === 'hl' ? 'विश्लेषण सफलतापूर्वक पूरा हुआ' : 'Analysis completed successfully'}
            </p>
          </div>

          <div className="w-full bg-white rounded-[20px] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.05)] border border-[#eae8e2]">

            {/* Image */}
            <div className="w-full h-[180px] relative">
              <img
                src={
                  selectedImage ||
                  'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&q=80&w=400'
                }
                alt="Analysed crop"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-gray-100 shadow-sm text-[10px] font-bold text-[#005129]">
                📈 {diagnosis?.confidence ?? 90}% {t('disease_confidence')}
              </div>
            </div>

            <div className="p-4 flex flex-col gap-3">
              <div>
                <span className="text-[10px] text-[#e8960a] font-bold bg-[#fff9ed] px-2 py-0.5 rounded-full uppercase">
                  {displayCropName}
                </span>
                <h3 className="text-[18px] font-bold text-black mt-1.5 leading-tight">
                  {displayDiseaseName}
                </h3>
                {diagnosis && (
                  <p className="text-[12px] text-gray-500 font-semibold mt-0.5 italic">
                     {diagnosis.disease_name}
                  </p>
                )}
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-2 bg-[#fbf9f3] p-2.5 rounded-xl border border-[#f0eee8]">
                <div className="text-center border-r border-[#eae8e2]">
                  <span className="text-[10px] text-gray-400 font-bold block">
                    {lang === 'hi' || lang === 'hl' ? 'सुरक्षा स्तर' : 'Risk'}
                  </span>
                  <span className="text-[12.5px] font-bold text-[#ba1a1a]">
                    {t('disease_high_risk')}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-gray-400 font-bold block">
                    {lang === 'hi' || lang === 'hl' ? 'उपचार विधि' : 'Remedy'}
                  </span>
                  <span className="text-[12.5px] font-bold text-[#005129]">
                    {lang === 'hi' || lang === 'hl' ? 'जैविक' : 'Organic'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate('/disease-detail', { state: { diagnosis } })}
                className="w-full h-[50px] bg-[#005129] hover:bg-[#1a6b3c] active:scale-[0.98] text-white rounded-[14px] font-bold flex items-center justify-center gap-2 transition-all shadow-md text-[14px] mt-1"
              >
                🔍 {lang === 'hi' || lang === 'hl' ? 'पूरा विवरण और इलाज देखें' : 'View Full Details & Remedies'}
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ── Collapsible Debug Console ────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-[340px] px-5 mt-4">
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="w-full py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 font-bold rounded-lg text-[12px] transition-colors"
        >
          {showDebug ? '🛠️ Hide Debug Logs' : '🛠️ Show Debug Logs'}
        </button>
        {showDebug && (
          <div className="mt-2 p-3 bg-gray-900 text-green-400 font-mono text-[10px] rounded-lg h-[150px] overflow-y-auto border border-gray-700">
            {debugLogs.length === 0 ? (
              <span className="text-gray-500">No logs captured yet. Tapping buttons will trigger logs.</span>
            ) : (
              debugLogs.map((log, index) => (
                <div key={index} className="leading-tight py-0.5 border-b border-gray-800 last:border-0">
                  {log}
                </div>
              ))
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default Disease;
