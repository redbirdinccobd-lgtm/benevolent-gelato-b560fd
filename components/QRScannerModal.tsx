import React, { useState, useEffect, useRef } from 'react';
import { 
  X, QrCode, Camera, Upload, AlertCircle, CheckCircle2, 
  RefreshCw, ShieldCheck, ExternalLink, SwitchCamera, Search
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess?: (decodedText: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess
}) => {
  const [activeMode, setActiveMode] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = "qr-code-interactive-viewport";

  useEffect(() => {
    if (!isOpen) {
      stopCameraScanner();
      setScannedResult(null);
      setCameraError(null);
      return;
    }

    if (activeMode === 'camera') {
      startCameraScanner();
    }

    return () => {
      stopCameraScanner();
    };
  }, [isOpen, activeMode, selectedCameraId]);

  const handleDecodedData = (decodedText: string) => {
    stopCameraScanner();
    setScannedResult(decodedText);

    // Parse URL if it's a verification or tracking link
    let extractedId = decodedText;
    try {
      if (decodedText.includes('doc=')) {
        const match = decodedText.match(/doc=([^&]+)/);
        if (match) extractedId = decodeURIComponent(match[1]);
      } else if (decodedText.includes('id=')) {
        const match = decodedText.match(/id=([^&]+)/);
        if (match) extractedId = decodeURIComponent(match[1]);
      } else if (decodedText.includes('#verify/')) {
        extractedId = decodedText.split('#verify/')[1];
      } else if (decodedText.includes('#track/')) {
        extractedId = decodedText.split('#track/')[1];
      }
    } catch (e) {
      console.warn("Could not parse decoded text URL:", e);
    }

    if (onScanSuccess) {
      onScanSuccess(extractedId);
    }
  };

  const startCameraScanner = async () => {
    setCameraError(null);
    setIsScanning(true);

    try {
      // Ensure element exists in DOM
      await new Promise(r => setTimeout(r, 150));
      const el = document.getElementById(readerElementId);
      if (!el) {
        throw new Error("Scanner viewport element not mounted.");
      }

      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(readerElementId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false
        });
      }

      // Check available cameras
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setCameras(devices);
          if (!selectedCameraId) {
            // Prefer back/environment camera on mobile
            const backCam = devices.find(d => 
              d.label.toLowerCase().includes('back') || 
              d.label.toLowerCase().includes('rear') ||
              d.label.toLowerCase().includes('environment')
            );
            setSelectedCameraId(backCam ? backCam.id : devices[0].id);
          }
        }
      } catch (camErr) {
        console.warn("Could not enumerate camera devices:", camErr);
      }

      const cameraConfig = selectedCameraId ? { deviceId: { exact: selectedCameraId } } : { facingMode: "environment" };

      await html5QrCodeRef.current.start(
        cameraConfig,
        {
          fps: 12,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          handleDecodedData(decodedText);
        },
        () => {
          // Frame error (silently ignore while scanning)
        }
      );
    } catch (err: any) {
      console.error("Camera startup error:", err);
      setCameraError(err.message || "Could not access device camera. Please check permissions or switch to file upload.");
      setIsScanning(false);
    }
  };

  const stopCameraScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn("Error stopping QR scanner:", err);
      }
      html5QrCodeRef.current = null;
    }
    setIsScanning(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setCameraError(null);

    try {
      let scanner = html5QrCodeRef.current;
      if (!scanner) {
        scanner = new Html5Qrcode(readerElementId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false
        });
        html5QrCodeRef.current = scanner;
      }

      const decodedText = await scanner.scanFile(file, true);
      handleDecodedData(decodedText);
    } catch (err: any) {
      console.error("File QR Scan Error:", err);
      setCameraError("No valid Red Bird QR code detected in this image. Please try a clearer picture or enter the Control Number manually.");
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleDecodedData(manualInput.trim());
  };

  const navigateToVerification = (code: string) => {
    onClose();
    window.location.hash = `#verify?id=${encodeURIComponent(code)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[95vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600 rounded-xl text-white shadow-md shadow-red-600/30">
              <QrCode size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                  Instant QR Verification
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5">
                Red Bird QR Code Scanner
              </h3>
              <p className="text-[11px] text-slate-400">
                Scan any exported letterhead, invoice, packing list, or carton label
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* View Mode Tabs */}
        <div className="p-4 bg-slate-100 flex items-center justify-center gap-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveMode('camera')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeMode === 'camera' 
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20' 
                : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Camera size={14} />
            <span>Camera Scan</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopCameraScanner();
              setActiveMode('upload');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeMode === 'upload' 
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20' 
                : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Upload size={14} />
            <span>Snap / Image</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopCameraScanner();
              setActiveMode('manual');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeMode === 'manual' 
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20' 
                : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Search size={14} />
            <span>Manual ID</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* CAMERA SCANNER VIEWPORT */}
          {activeMode === 'camera' && (
            <div className="space-y-3">
              <div className="relative w-full aspect-square max-w-sm mx-auto bg-slate-900 rounded-3xl overflow-hidden border-2 border-slate-800 shadow-inner flex items-center justify-center">
                <div id={readerElementId} className="w-full h-full" />

                {/* Overlaid Animated Scanner Target Reticle */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-56 h-56 border-2 border-red-500 rounded-2xl relative shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-red-600 rounded-tl-xl -mt-1 -ml-1"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-red-600 rounded-tr-xl -mt-1 -mr-1"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-red-600 rounded-bl-xl -mb-1 -ml-1"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-red-600 rounded-br-xl -mb-1 -mr-1"></div>
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse absolute top-1/2"></div>
                  </div>
                </div>
              </div>

              {/* Camera Switcher on Mobile */}
              {cameras.length > 1 && (
                <div className="flex items-center justify-center gap-2 pt-1">
                  <SwitchCamera size={14} className="text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-500">Camera:</span>
                  <select
                    value={selectedCameraId || ''}
                    onChange={(e) => setSelectedCameraId(e.target.value)}
                    className="bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-bold rounded-lg px-2 py-1 outline-none"
                  >
                    {cameras.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label || `Camera ${c.id.slice(0, 5)}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* UPLOAD / IMAGE SCANNER */}
          {activeMode === 'upload' && (
            <div className="space-y-4">
              <label 
                className="border-2 border-dashed border-slate-300 hover:border-red-500 bg-slate-50/70 hover:bg-red-50/30 transition-all rounded-3xl p-8 text-center cursor-pointer flex flex-col items-center justify-center space-y-3 group"
              >
                <div className="p-4 bg-white rounded-2xl shadow-md group-hover:scale-110 transition-all border border-slate-200">
                  <Upload className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    Snap a photo or choose an image
                  </h4>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Select a photo of any document's QR code (PNG, JPG, WEBP)
                  </p>
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
              </label>

              {isProcessingFile && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center gap-2 text-red-900 text-xs font-bold animate-pulse">
                  <RefreshCw size={16} className="animate-spin text-red-600" />
                  <span>Decoding QR code from image...</span>
                </div>
              )}
            </div>
          )}

          {/* MANUAL ID INPUT */}
          {activeMode === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Enter Control Number, Document ID, or Tracking ID:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="e.g. RBI-INV-2026-9921 or SH-01"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-mono font-bold text-slate-900 text-xs uppercase focus:bg-white focus:border-red-500 outline-none"
                    required
                  />
                  <button
                    type="submit"
                    className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md"
                  >
                    Verify
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Camera Error Message */}
          {cameraError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-start gap-2">
              <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p>{cameraError}</p>
                <p className="text-[11px] text-rose-600 font-normal mt-0.5">
                  Tip: You can use the "Snap / Image" tab to upload a photo of the QR code instead.
                </p>
              </div>
            </div>
          )}

          {/* Successful Scan View */}
          {scannedResult && (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-3xl space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-900">
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                <h4 className="text-sm font-black uppercase tracking-tight">QR Code Successfully Decoded</h4>
              </div>
              <div className="p-3 bg-white rounded-xl border border-emerald-200 font-mono text-xs text-slate-900 break-all font-bold">
                {scannedResult}
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => navigateToVerification(scannedResult)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={16} />
                  <span>Open Verification Certificate</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
