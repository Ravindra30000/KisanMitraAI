import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Upload, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../utils/i18n';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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
  
  const [isScanning, setIsScanning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // Clean up camera streams on unmount
  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setErrorMsg(null);
    setSelectedImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Request rear-facing camera on mobile
        audio: false
      });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error("Camera access error:", err);
      setErrorMsg("Camera access denied or unavailable. Please use the gallery option instead.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureImage = () => {
    if (videoRef.current && cameraStreamRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      
      // Use video stream dimensions
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], 'camera_capture.jpg', {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              
              const imageUrl = URL.createObjectURL(blob);
              setSelectedImage(imageUrl);
              
              // Stop live stream immediately
              stopCamera();
              
              // Proceed with diagnosis pipeline
              compressAndDiagnose(file);
            }
          },
          'image/jpeg',
          0.85
        );
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Stop camera if running
      stopCamera();

      // Show preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Compress and analyze
      compressAndDiagnose(file);
    }
  };

  const compressAndDiagnose = (file: File) => {
    setIsScanning(true);
    setErrorMsg(null);

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      
      const MAX_WIDTH = 800;
      const MAX_HEIGHT = 800;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width = Math.round((width * MAX_HEIGHT) / height);
          height = MAX_HEIGHT;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name || 'compressed_image.jpg', {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              uploadImageForDiagnosis(compressedFile);
            } else {
              uploadImageForDiagnosis(file);
            }
          },
          'image/jpeg',
          0.8
        );
      } else {
        uploadImageForDiagnosis(file);
      }
    };
    img.onerror = () => {
      uploadImageForDiagnosis(file);
    };
  };

  const uploadImageForDiagnosis = async (imageFile: File) => {
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('lang', lang);
      formData.append('crop', 'tomato');
      formData.append('region', 'Madhya Pradesh');
      formData.append('season', 'Kharif');
      
      const response = await fetch(`${API_BASE_URL}/api/disease/diagnose`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || t('disease_server_error') || 'Diagnosis failed');
      }
      
      const data = await response.json();
      setDiagnosis(data);
      setShowResult(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error diagnosing crop image. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const resetDetector = () => {
    stopCamera();
    setSelectedImage(null);
    setShowResult(false);
    setDiagnosis(null);
    setErrorMsg(null);
  };

  const displayCropName = diagnosis ? "Tamatar (Tomato)" : t('disease_input_ready');
  const displayDiseaseName = diagnosis 
    ? (lang === 'hi' || lang === 'hl' ? diagnosis.disease_name_hindi : diagnosis.disease_name)
    : '';

  return (
    <div className="flex flex-col bg-[#fbf9f3] min-h-screen pb-[88px] font-sans text-[#1b1c18]">
      
      {/* Header */}
      <div className="h-[56px] border-b border-[#eae8e2] bg-white px-4 flex items-center justify-between shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              stopCamera();
              navigate(-1);
            }} 
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

      {/* Error alert toast */}
      {errorMsg && (
        <div className="bg-[#ffdad6] border-b border-[#ffb4ab] text-[#ba1a1a] px-4 py-2.5 flex items-center gap-2 text-[12px] font-bold">
          <AlertCircle size={15} />
          <span>{errorMsg}</span>
        </div>
      )}

      {!showResult ? (
        /* Camera capture mode & upload selector */
        <div className="p-5 flex flex-col items-center justify-center flex-grow mt-4 gap-6">
          <div className="text-center">
            <h2 className="text-[20px] font-bold text-black leading-tight">
              {isCameraActive ? "Fasal ki photo khinchein" : t('disease_banner_title')}
            </h2>
            <p className="text-[12px] text-gray-500 mt-1">
              {isCameraActive ? "Leaf ko frame ke andar laakar click karein" : t('disease_banner_sub')}
            </p>
          </div>

          {/* Camera View Finder Box */}
          <div className="w-full max-w-[340px] aspect-[4/3] bg-black rounded-[20px] relative border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
            {isCameraActive ? (
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            ) : selectedImage ? (
              <img src={selectedImage} alt="Crop to analyze" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center text-gray-500 gap-2">
                <Camera size={44} className="opacity-40" />
                <span className="text-[12px]">{t('disease_input_ready')}</span>
              </div>
            )}

            {/* Scanning Overlay Animation */}
            {isScanning && (
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-4">
                <div className="w-[80%] h-[6px] bg-gray-600 rounded-full overflow-hidden relative">
                  <div className="absolute top-0 h-full bg-[#97f3b1] animate-[voice-wave_2s_infinite] w-1/3 rounded-full" />
                </div>
                <span className="text-[14px] text-white font-bold animate-pulse">
                  {t('disease_scanning')}
                </span>
              </div>
            )}

            {/* Corner border crop markers */}
            <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-[#e8960a] rounded-tl-[4px]" />
            <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-[#e8960a] rounded-tr-[4px]" />
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-[#e8960a] rounded-bl-[4px]" />
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-[#e8960a] rounded-br-[4px]" />
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3.5 w-full max-w-[340px] mt-2">
            {isCameraActive ? (
              <>
                <button
                  onClick={captureImage}
                  className="w-full h-[48px] bg-[#e8960a] hover:bg-[#c97f00] active:scale-98 text-white rounded-[12px] font-bold flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <Camera size={18} /> फोटो खींचें (Capture)
                </button>
                <button
                  onClick={stopCamera}
                  className="w-full h-[48px] border border-gray-300 hover:bg-white bg-gray-50 rounded-[12px] font-bold flex items-center justify-center gap-2 transition-all text-[14px] text-gray-700 active:scale-98"
                >
                  रद्द करें (Cancel)
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={startCamera}
                  disabled={isScanning}
                  className="w-full h-[48px] bg-[#005129] hover:bg-[#1a6b3c] active:scale-98 text-white rounded-[12px] font-bold flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <Camera size={18} /> कैमरा खोलें (Open Camera)
                </button>

                <div className="relative w-full">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    id="file-upload"
                    className="hidden"
                    disabled={isScanning}
                  />
                  <label
                    htmlFor="file-upload"
                    className="w-full h-[48px] border border-gray-300 hover:bg-white bg-gray-50 rounded-[12px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer text-[14px] text-gray-700 active:scale-98"
                  >
                    <Upload size={16} /> गैलरी से चुनें (Gallery)
                  </label>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Diagnosis results display */
        <div className="p-5 flex flex-col items-center gap-5 animate-[fadeIn_0.3s_ease] w-full max-w-[340px] mx-auto">
          
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-[#edf7f1] border border-[#97f3b1] text-[#005129] flex items-center justify-center mx-auto mb-2 text-2xl font-bold">
              ✓
            </div>
            <h2 className="text-[20px] font-bold text-black leading-tight">
              {lang === 'hi' || lang === 'hl' ? "बीमारी की पहचान हो गई है!" : "Disease Identified!"}
            </h2>
            <p className="text-[12px] text-gray-500 mt-1">
              {lang === 'hi' || lang === 'hl' ? "सफलतापूर्वक विश्लेषण पूरा हुआ" : "Analysis completed successfully"}
            </p>
          </div>

          <div className="w-full bg-white rounded-[20px] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-[#eae8e2]">
            {/* Image Preview */}
            <div className="w-full h-[160px] relative">
              <img 
                src={selectedImage || 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&q=80&w=400'} 
                alt="Analyzed crop" 
                className="w-full h-full object-cover" 
              />
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-gray-100 shadow-sm text-[10px] font-bold text-[#005129]">
                📈 {diagnosis?.confidence || 90}% {t('disease_confidence')}
              </div>
            </div>

            <div className="p-4 flex flex-col gap-3">
              <div>
                <span className="text-[10px] text-[#e8960a] font-bold bg-[#fff9ed] px-2 py-0.5 rounded-full uppercase">
                  {displayCropName}
                </span>
                <h3 className="text-[18px] font-bold text-black mt-1.5 leading-tight">{displayDiseaseName}</h3>
                {diagnosis && (
                  <p className="text-[12px] text-gray-500 font-semibold mt-0.5 italic">{diagnosis.disease_name}</p>
                )}
              </div>

              {/* Quick stats grid */}
              <div className="grid grid-cols-2 gap-2 bg-[#fbf9f3] p-2.5 rounded-xl border border-[#f0eee8] mt-1">
                <div className="text-center border-r border-[#eae8e2]">
                  <span className="text-[10px] text-gray-400 font-bold block">{lang === 'hi' || lang === 'hl' ? 'सुरक्षा स्तर' : 'Risk'}</span>
                  <span className="text-[12.5px] font-bold text-[#ba1a1a]">{t('disease_high_risk')}</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-gray-400 font-bold block">{lang === 'hi' || lang === 'hl' ? 'उपचार विधि' : 'Remedy'}</span>
                  <span className="text-[12.5px] font-bold text-[#005129]">{lang === 'hi' || lang === 'hl' ? 'जैविक' : 'Organic'}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  navigate('/disease-detail', { state: { diagnosis } });
                }}
                className="w-full h-[48px] bg-[#005129] hover:bg-[#1a6b3c] active:scale-98 text-white rounded-[12px] font-bold flex items-center justify-center gap-2 transition-all shadow-md text-[14px] mt-2"
              >
                🔍 {lang === 'hi' || lang === 'hl' ? "पूरा विवरण और इलाज देखें" : "View Full Details & Remedies"}
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default Disease;
