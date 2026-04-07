import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { QrCode, AlertCircle, Camera, Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Scanner() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedRef = useRef<string | null>(null);
  const isTransitioningRef = useRef(false);

  const startScanner = async () => {
    if (isTransitioningRef.current) return;
    
    try {
      isTransitioningRef.current = true;
      setIsInitializing(true);
      setError(null);
      
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("reader");
      }

      if (scannerRef.current.isScanning) {
        setIsScanning(true);
        setIsInitializing(false);
        isTransitioningRef.current = false;
        return;
      }

      // Use facingMode: "environment" directly for better mobile support
      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          if (decodedText === lastScannedRef.current) return;
          handleScanSuccess(decodedText);
        },
        () => {}
      );
      setIsScanning(true);
    } catch (err: any) {
      console.error("Scanner Error:", err);
      // If environment camera fails, try any available camera
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          await scannerRef.current?.start(
            cameras[0].id,
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
              if (decodedText === lastScannedRef.current) return;
              handleScanSuccess(decodedText);
            },
            () => {}
          );
          setIsScanning(true);
        } else {
          setError("No cameras found on this device.");
        }
      } catch (fallbackErr) {
        if (!err?.message?.includes("already under transition")) {
          setError("Camera access denied or failed to initialize. Please check permissions.");
        }
      }
    } finally {
      setIsInitializing(false);
      isTransitioningRef.current = false;
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    if (isTransitioningRef.current) return;
    
    console.log(`Scan result: ${decodedText}`);
    lastScannedRef.current = decodedText;
    
    if (decodedText.startsWith('healorithm://user/')) {
      try {
        isTransitioningRef.current = true;
        if (scannerRef.current && scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        setIsScanning(false);
        isTransitioningRef.current = false;
        
        const urlPart = decodedText.split('healorithm://user/')[1];
        const userId = urlPart.split('?')[0];
        
        if (userId) {
          navigate(`/user/${userId}`);
        } else {
          setError("Invalid User ID in QR Code");
          lastScannedRef.current = null;
          setTimeout(startScanner, 3000);
        }
      } catch (err) {
        console.error("Error stopping scanner:", err);
        isTransitioningRef.current = false;
        setError("Failed to process QR code");
        lastScannedRef.current = null;
      }
    } else {
      setError("Invalid QR Code format. Please scan a Healorithm patient QR.");
      lastScannedRef.current = null;
      setTimeout(() => setError(null), 3000);
    }
  };

  useEffect(() => {
    startScanner();

    return () => {
      const stopScanner = async () => {
        if (scannerRef.current && scannerRef.current.isScanning && !isTransitioningRef.current) {
          try {
            isTransitioningRef.current = true;
            await scannerRef.current.stop();
          } catch (err) {
            console.error("Failed to stop scanner on unmount", err);
          } finally {
            isTransitioningRef.current = false;
          }
        }
      };
      stopScanner();
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Patient QR Scanner</h2>
        <p className="text-slate-500">Position the patient's QR code within the frame to automatically view their profile.</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>
        
        <div className="relative aspect-square max-w-[400px] mx-auto overflow-hidden rounded-2xl border-2 border-slate-100 bg-slate-900">
          <div id="reader" className="w-full h-full"></div>
          
          {isInitializing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              <p className="text-sm font-medium">Initializing Camera...</p>
            </div>
          )}

          {!isScanning && !isInitializing && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 text-white gap-4 backdrop-blur-sm">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
              <p className="text-sm font-medium">Redirecting to Patient Profile...</p>
            </div>
          )}
        </div>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">{error}</p>
                <button 
                  onClick={startScanner}
                  className="text-xs font-bold underline mt-1 hover:text-red-700"
                >
                  Try Again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-slate-50 rounded-2xl">
            <Camera className="w-5 h-5 text-slate-400 mx-auto mb-2" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Feed</p>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-2xl">
            <QrCode className="w-5 h-5 text-slate-400 mx-auto mb-2" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Auto Detect</p>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-2xl">
            <div className="w-5 h-5 border-2 border-slate-400 border-dashed rounded-md mx-auto mb-2"></div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Focus Frame</p>
          </div>
        </div>
      </motion.div>

      <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
        <h4 className="text-blue-900 font-bold mb-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Scanner Instructions
        </h4>
        <ul className="text-sm text-blue-700 space-y-2 list-disc list-inside">
          <li>Ensure the QR code is well-lit and clearly visible.</li>
          <li>The system will automatically redirect once a valid patient ID is found.</li>
          <li>If the scanner seems stuck, try refreshing the page.</li>
        </ul>
      </div>
    </div>
  );
}
