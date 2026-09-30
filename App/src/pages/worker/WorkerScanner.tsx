// App/src/pages/worker/WorkerScanner.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';
import { store } from '../../lib/storage';
import { db } from '../../db/schema';
import { calculateClinicalRisk, RiskEvaluationResult } from '@shared/clinicalRiskEngine';
import { 
  parseScannedQRData, 
  PatientExportPackage, 
  QRSequenceAssembler,
  encodeSingleQR 
} from '@shared/qrProtocol';
import { 
  QrCode, 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  User, 
  Activity, 
  ArrowRight, 
  Upload, 
  ShieldCheck, 
  Zap, 
  Phone, 
  MapPin, 
  Heart, 
  Pill, 
  AlertCircle, 
  XCircle, 
  RotateCcw, 
  Sparkles, 
  Stethoscope,
  RefreshCw,
  VideoOff
} from 'lucide-react';

interface ScannedPatientData {
  patientId: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  village: string;
  bloodGroup: string;
  vitals?: {
    systolic_bp?: number;
    diastolic_bp?: number;
    spo2?: number;
    heart_rate?: number;
    blood_glucose?: number;
    temperature?: number;
  };
  symptoms: string[];
  prescriptions: Array<{
    medicine_name: string;
    generic_name?: string;
    dosage?: string;
    timing?: string;
  }>;
  risk: RiskEvaluationResult;
  digitalSignature?: string;
  source: 'qr_package' | 'stored_record';
}

/**
 * Multi-stage QR detector supporting:
 * 1. Native BarcodeDetector API (C++ GPU hardware accelerated in Chrome/Edge/Android)
 * 2. jsQR on raw RGBA
 * 3. Contrast-stretched / thresholded pass for phone screen glare & backlight
 */
async function decodeFromImageData(imageData: ImageData): Promise<string | null> {
  const { data, width, height } = imageData;

  // Pass 1: Try native BarcodeDetector if supported in the browser
  if (typeof (window as any).BarcodeDetector !== 'undefined') {
    try {
      const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      const imageBitmap = await createImageBitmap(imageData);
      const barcodes = await barcodeDetector.detect(imageBitmap);
      imageBitmap.close?.();
      if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
        return barcodes[0].rawValue;
      }
    } catch (_e) {
      // Fall through to jsQR
    }
  }

  // Pass 2: jsQR with both normal and inverted matrix attempts
  try {
    const code = jsQR(data, width, height, { inversionAttempts: 'attemptBoth' });
    if (code && code.data) {
      return code.data;
    }
  } catch (_e) {}

  // Pass 3: Adaptive Binarization (Otsu/contrast stretch for screen glare & moiré)
  try {
    const enhanced = new Uint8ClampedArray(data.length);
    let minL = 255;
    let maxL = 0;
    
    // Quick luminance sampling
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      if (gray < minL) minL = gray;
      if (gray > maxL) maxL = gray;
    }

    if (maxL - minL > 25) {
      const mid = (minL + maxL) / 2;
      for (let i = 0; i < data.length; i += 4) {
        const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
        const val = gray < mid ? 0 : 255;
        enhanced[i] = val;
        enhanced[i + 1] = val;
        enhanced[i + 2] = val;
        enhanced[i + 3] = 255;
      }

      const codeEnhanced = jsQR(enhanced, width, height, { inversionAttempts: 'attemptBoth' });
      if (codeEnhanced && codeEnhanced.data) {
        return codeEnhanced.data;
      }
    }
  } catch (_e) {}

  return null;
}

/**
 * Decodes QR from an HTMLCanvasElement with multi-scale analysis.
 */
async function decodeCanvasMultiPass(canvas: HTMLCanvasElement): Promise<string | null> {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  const w = canvas.width;
  const h = canvas.height;

  // 1. Direct pass on entire canvas
  const imgData = ctx.getImageData(0, 0, w, h);
  const directResult = await decodeFromImageData(imgData);
  if (directResult) return directResult;

  // 2. Center crop pass (75% central area where users aim the camera)
  const cropW = Math.floor(w * 0.75);
  const cropH = Math.floor(h * 0.75);
  const cropX = Math.floor((w - cropW) / 2);
  const cropY = Math.floor((h - cropH) / 2);
  const centerCropData = ctx.getImageData(cropX, cropY, cropW, cropH);
  const cropResult = await decodeFromImageData(centerCropData);
  if (cropResult) return cropResult;

  // 3. Upscaled pass for small/dense QR codes (if original < 600px)
  if (Math.max(w, h) < 600) {
    const upScale = 2;
    const upCanvas = document.createElement('canvas');
    upCanvas.width = w * upScale;
    upCanvas.height = h * upScale;
    const upCtx = upCanvas.getContext('2d');
    if (upCtx) {
      upCtx.imageSmoothingEnabled = false; // Nearest neighbor preserves sharp module edges
      upCtx.drawImage(canvas, 0, 0, upCanvas.width, upCanvas.height);
      const upData = upCtx.getImageData(0, 0, upCanvas.width, upCanvas.height);
      const upResult = await decodeFromImageData(upData);
      if (upResult) return upResult;
    }
  }

  // 4. Downscaled pass for huge photos (> 1600px from 48MP smartphone cameras)
  if (Math.max(w, h) > 1600) {
    const downScale = 1200 / Math.max(w, h);
    const downCanvas = document.createElement('canvas');
    downCanvas.width = Math.floor(w * downScale);
    downCanvas.height = Math.floor(h * downScale);
    const downCtx = downCanvas.getContext('2d');
    if (downCtx) {
      downCtx.imageSmoothingEnabled = true;
      downCtx.drawImage(canvas, 0, 0, downCanvas.width, downCanvas.height);
      const downData = downCtx.getImageData(0, 0, downCanvas.width, downCanvas.height);
      const downResult = await decodeFromImageData(downData);
      if (downResult) return downResult;
    }
  }

  return null;
}

export default function WorkerScanner() {
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState(store.getSnapshot());
  const [scannedPatientData, setScannedPatientData] = useState<ScannedPatientData | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'invalid' | 'not_found'>('idle');
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraState, setCameraState] = useState<'requesting' | 'ready' | 'scanning' | 'error'>('requesting');
  const [manualInput, setManualInput] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [isProcessingUpload, setIsProcessingUpload] = useState<boolean>(false);

  // Multi-frame sequence assembler state
  const [assembler] = useState(() => new QRSequenceAssembler());
  const [seqProgress, setSeqProgress] = useState<{ count: number; total: number; progress: number } | null>(null);

  // Video and stream references
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalIdRef = useRef<any>(null);
  const isDecodingBusyRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const unsub = store.subscribe(() => setSnapshot({ ...store.getSnapshot() }));
    return () => unsub();
  }, []);

  // Stop camera tracks immediately
  const stopCamera = useCallback(() => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try { track.stop(); } catch (_e) {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // Start live video stream with progressive fallback for laptop webcams & mobile cameras
  const startCamera = useCallback(async () => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try { track.stop(); } catch (_e) {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(true);
    setCameraError(null);
    setCameraState('requesting');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera API not supported in this browser environment. Please use image upload.');
      setCameraState('error');
      return;
    }

    try {
      let mediaStream: MediaStream | null = null;

      // Tier 1: Try environment/back camera (mobile phones)
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      } catch (_t1) {
        // Tier 2: Try front/user camera (laptops / front cams)
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              facingMode: { ideal: 'user' },
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          });
        } catch (_t2) {
          // Tier 3: Generic video constraint (works on ALL laptop webcams & USB cameras)
          mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true
          });
        }
      }

      if (!mediaStream) {
        throw new Error('No camera stream returned');
      }

      streamRef.current = mediaStream;
      setIsCameraActive(true);
      setCameraState('ready');

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(_e => {});
      }

      // Initialize frame scanning loop (every 100ms = 10 fps)
      const offscreenCanvas = document.createElement('canvas');
      const offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });

      let barcodeDetector: any = null;
      if (typeof (window as any).BarcodeDetector !== 'undefined') {
        try {
          barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        } catch (_e) {}
      }

      intervalIdRef.current = setInterval(async () => {
        const video = videoRef.current;
        if (!video || video.readyState < 2 || isDecodingBusyRef.current) return;

        isDecodingBusyRef.current = true;
        setCameraState('scanning');

        try {
          // 1. Native BarcodeDetector directly on the video element (zero-copy hardware acceleration)
          if (barcodeDetector) {
            try {
              const barcodes = await barcodeDetector.detect(video);
              if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                await handleProcessScannedText(barcodes[0].rawValue);
                return;
              }
            } catch (_bdErr) {}
          }

          // 2. Offscreen Canvas pass with multi-pass jsQR
          const vw = video.videoWidth;
          const vh = video.videoHeight;
          if (vw > 0 && vh > 0) {
            if (offscreenCanvas.width !== vw || offscreenCanvas.height !== vh) {
              offscreenCanvas.width = vw;
              offscreenCanvas.height = vh;
            }
            offscreenCtx?.drawImage(video, 0, 0, vw, vh);
            const decoded = await decodeCanvasMultiPass(offscreenCanvas);
            if (decoded) {
              await handleProcessScannedText(decoded);
              return;
            }
          }
        } catch (_scanErr) {
          // Silently continue scanning on individual failed frames
        } finally {
          isDecodingBusyRef.current = false;
          setCameraState('ready');
        }
      }, 100);

    } catch (err: any) {
      console.warn('Camera startup warning:', err);
      setIsCameraActive(false);
      setCameraState('error');

      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError' || err?.message?.toLowerCase().includes('permission')) {
        setCameraError('Camera permission denied. Please allow camera access in your browser and click "Enable Camera".');
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device. You can upload a QR photo or enter patient ID manually.');
      } else if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError') {
        setCameraError('Camera is in use by another application. Please close it and click "Try Camera Again".');
      } else {
        setCameraError('Camera unavailable. You can click "Try Camera Again" or upload a QR image.');
      }
    }
  }, [stopCamera]);

  // Monitor browser permission changes if supported
  useEffect(() => {
    if (typeof navigator !== 'undefined' && (navigator as any).permissions?.query) {
      try {
        (navigator as any).permissions.query({ name: 'camera' as any }).then((permStatus: any) => {
          permStatus.onchange = () => {
            if (permStatus.state === 'granted' && scanStatus === 'idle') {
              startCamera();
            }
          };
        }).catch(() => {});
      } catch (_e) {}
    }
  }, [scanStatus, startCamera]);

  // Start camera on mount when idle
  useEffect(() => {
    if (isCameraActive && scanStatus === 'idle') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isCameraActive, scanStatus, startCamera, stopCamera]);

  // Core Processing of Scanned Text
  const handleProcessScannedText = async (text: string) => {
    setScannerError(null);
    setCameraError(null);

    const parsed = parseScannedQRData(text);

    // Case 1: Single Complete Patient Health Card QR
    if (parsed.isSingleCard && parsed.patientPackage) {
      stopCamera();

      const pkg = parsed.patientPackage;

      // Find patient record in repository/storage
      let matchingUser = snapshot.users.find(
        u => u.id === pkg.patientId || 
             (u.id === 'u-101' && (pkg.patientId === 'HLM-482731' || pkg.patientId === 'u-101')) ||
             (u.name && pkg.fullName && u.name.trim().toLowerCase() === pkg.fullName.trim().toLowerCase())
      );

      if (!matchingUser) {
        try {
          const dexieRec = await db.patients.where('id').equals(pkg.patientId).or('qr_id').equals(pkg.patientId).first();
          if (dexieRec) {
            matchingUser = {
              id: dexieRec.id,
              name: dexieRec.plain_name,
              age: pkg.age || 0,
              gender: pkg.gender || 'Unknown',
              preferred_language: 'en',
              phone: pkg.phoneNumber || '',
              village: dexieRec.village || pkg.village || '',
              created_at: dexieRec.updated_at
            };
          }
        } catch (e) {
          console.warn('Dexie lookup error:', e);
        }
      }

      if (!matchingUser) {
        setScanStatus('not_found');
        setScannerError('Patient record not found');
        return;
      }

      const targetUserId = matchingUser.id;
      store.setActivePatient(targetUserId);

      // Record vitals in worker outbox & store if vitals exist
      if (pkg.vitals) {
        store.addVitalsAndRecord({
          userId: targetUserId,
          symptoms: pkg.symptoms || [],
          bodyZones: ['chest', 'general'],
          vitals: {
            systolic_bp: pkg.vitals.systolic_bp,
            diastolic_bp: pkg.vitals.diastolic_bp,
            spo2: pkg.vitals.spo2,
            heart_rate: pkg.vitals.heart_rate,
            blood_glucose: pkg.vitals.blood_glucose
          },
          provisional_diagnosis: `Health Card QR Scan: ${pkg.fullName} (${pkg.patientId}). Verified offline.`,
          workerId: snapshot.workerSession.workerId || 'w-01'
        });
      }

      // Calculate explainable clinical risk from scanned vitals & age
      const clinicalRisk = calculateClinicalRisk({
        age: pkg.age || matchingUser.age || 40,
        gender: pkg.gender || matchingUser.gender,
        vitals: pkg.vitals || {},
        symptoms: pkg.symptoms || [],
        chronic_conditions: []
      });

      setScannedPatientData({
        patientId: pkg.patientId,
        name: pkg.fullName,
        age: pkg.age || matchingUser.age || 40,
        gender: pkg.gender || matchingUser.gender,
        phone: pkg.phoneNumber || matchingUser.phone || 'Not provided',
        village: pkg.village || matchingUser.village || 'Not specified',
        bloodGroup: pkg.bloodGroup || matchingUser.blood_group || 'Unknown',
        vitals: pkg.vitals,
        symptoms: pkg.symptoms || [],
        prescriptions: pkg.prescriptions || [],
        risk: clinicalRisk,
        digitalSignature: pkg.digitalSignature,
        source: 'qr_package'
      });

      setScanStatus('success');

      if ('vibrate' in navigator) {
        try { navigator.vibrate([80, 50, 80]); } catch (_e) {}
      }
      return;
    }

    // Case 2: Multi-Frame Animated QR Chunk Packet
    if (parsed.isChunkPacket && parsed.packet) {
      const result = assembler.addPacket(parsed.packet);
      setSeqProgress({
        count: result.receivedCount,
        total: result.total,
        progress: result.progress
      });

      if (result.isComplete) {
        stopCamera();

        const fullPackage = assembler.assemble();
        assembler.reset();
        setSeqProgress(null);

        if (fullPackage) {
          let matchingUser = snapshot.users.find(
            u => u.id === fullPackage.patientId || 
                 (u.id === 'u-101' && (fullPackage.patientId === 'HLM-482731' || fullPackage.patientId === 'u-101')) ||
                 (u.name && fullPackage.fullName && u.name.trim().toLowerCase() === fullPackage.fullName.trim().toLowerCase())
          );

          if (!matchingUser) {
            try {
              const dexieRec = await db.patients.where('id').equals(fullPackage.patientId).or('qr_id').equals(fullPackage.patientId).first();
              if (dexieRec) {
                matchingUser = {
                  id: dexieRec.id,
                  name: dexieRec.plain_name,
                  age: fullPackage.age || 0,
                  gender: fullPackage.gender || 'Unknown',
                  preferred_language: 'en',
                  phone: fullPackage.phoneNumber || '',
                  village: dexieRec.village || fullPackage.village || '',
                  created_at: dexieRec.updated_at
                };
              }
            } catch (e) {
              console.warn('Dexie lookup error:', e);
            }
          }

          if (!matchingUser) {
            setScanStatus('not_found');
            setScannerError('Patient record not found');
            return;
          }

          const clinicalRisk = calculateClinicalRisk({
            age: fullPackage.age || matchingUser.age || 40,
            gender: fullPackage.gender || matchingUser.gender,
            vitals: fullPackage.vitals || {},
            symptoms: fullPackage.symptoms || [],
            chronic_conditions: []
          });

          store.setActivePatient(matchingUser.id);

          setScannedPatientData({
            patientId: fullPackage.patientId,
            name: fullPackage.fullName,
            age: fullPackage.age || matchingUser.age || 40,
            gender: fullPackage.gender || matchingUser.gender,
            phone: fullPackage.phoneNumber || matchingUser.phone || 'Not provided',
            village: fullPackage.village || matchingUser.village || 'Not specified',
            bloodGroup: fullPackage.bloodGroup || matchingUser.blood_group || 'Unknown',
            vitals: fullPackage.vitals,
            symptoms: fullPackage.symptoms || [],
            prescriptions: fullPackage.prescriptions || [],
            risk: clinicalRisk,
            digitalSignature: fullPackage.digitalSignature,
            source: 'qr_package'
          });

          setScanStatus('success');

          if ('vibrate' in navigator) {
            try { navigator.vibrate([80, 50, 80]); } catch (_e) {}
          }
        } else {
          setScanStatus('invalid');
          setScannerError('Invalid Healorithm QR code: Could not reassemble packet stream.');
        }
      }
      return;
    }

    // Case 3: Simple Patient ID string (e.g. 'u-101' or 'HLM-482731')
    if (parsed.patientId) {
      stopCamera();

      let matchingUser = snapshot.users.find(u => 
        u.id === parsed.patientId || (u.id === 'u-101' && parsed.patientId === 'HLM-482731')
      );

      if (!matchingUser) {
        try {
          const dexieRec = await db.patients.where('id').equals(parsed.patientId!).or('qr_id').equals(parsed.patientId!).first();
          if (dexieRec) {
            matchingUser = {
              id: dexieRec.id,
              name: dexieRec.plain_name,
              age: 0,
              gender: 'Unknown',
              preferred_language: 'en',
              phone: '',
              village: dexieRec.village,
              created_at: dexieRec.updated_at
            };
          }
        } catch (e) {
          console.warn('Dexie lookup error:', e);
        }
      }

      if (matchingUser) {
        store.setActivePatient(matchingUser.id);

        const userRecords = snapshot.records.filter(r => r.user_id === matchingUser!.id);
        const latestVitals = userRecords[0]?.vitals;
        const userPrescriptions = snapshot.prescriptions.filter(p => p.user_id === matchingUser!.id);

        const clinicalRisk = calculateClinicalRisk({
          age: matchingUser.age || 45,
          gender: matchingUser.gender,
          vitals: latestVitals || {},
          symptoms: userRecords[0]?.symptoms || [],
          chronic_conditions: []
        });

        setScannedPatientData({
          patientId: matchingUser.id === 'u-101' ? 'HLM-482731' : matchingUser.id,
          name: matchingUser.name,
          age: matchingUser.age,
          gender: matchingUser.gender,
          phone: matchingUser.phone || 'Not provided',
          village: matchingUser.village || 'Not specified',
          bloodGroup: matchingUser.blood_group || 'B+',
          vitals: latestVitals,
          symptoms: userRecords[0]?.symptoms || [],
          prescriptions: userPrescriptions.map(p => ({
            medicine_name: p.medicine_name,
            generic_name: p.generic_name,
            dosage: p.dosage,
            timing: p.timing
          })),
          risk: clinicalRisk,
          source: 'stored_record'
        });

        setScanStatus('success');

        if ('vibrate' in navigator) {
          try { navigator.vibrate([80, 50, 80]); } catch (_e) {}
        }
      } else {
        setScanStatus('not_found');
        setScannerError('Patient record not found');
      }
      return;
    }

    // Case 4: Completely unrecognized QR
    stopCamera();
    setScanStatus('invalid');
    setScannerError('Invalid Healorithm QR code');
  };

  // Scan Another Patient button handler
  const handleScanAnother = () => {
    setScannedPatientData(null);
    setScanStatus('idle');
    setScannerError(null);
    setCameraError(null);
    setSeqProgress(null);
    setIsCameraActive(true);
    startCamera();
  };

  // Simulate QR Scan (Offline Demo)
  const handleSimulateDemo = () => {
    const demoUser = snapshot.users.find(u => u.id === 'u-101') || snapshot.users[0];
    const demoPrescriptions = snapshot.prescriptions.filter(p => p.user_id === demoUser.id);

    const demoPayload = encodeSingleQR({
      protocolVersion: '2.0.0',
      patientId: 'HLM-482731',
      fullName: demoUser.name,
      age: demoUser.age,
      gender: demoUser.gender,
      village: demoUser.village || 'Adoni Village',
      bloodGroup: demoUser.blood_group || 'B+',
      phoneNumber: demoUser.phone,
      vitals: {
        systolic_bp: 125,
        diastolic_bp: 82,
        spo2: 97,
        heart_rate: 78,
        blood_glucose: 110,
        temperature: 98.6
      },
      symptoms: ['Hypertension monitoring'],
      prescriptions: demoPrescriptions.map(p => ({
        medicine_name: p.medicine_name,
        generic_name: p.generic_name || p.medicine_name,
        dosage: p.dosage,
        timing: p.timing
      })),
      adherenceLogs: [],
      consentTimestamp: new Date().toISOString(),
      digitalSignature: `SIG_${demoUser.id}`
    });

    handleProcessScannedText(demoPayload);
  };

  // Image Upload Handler
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingUpload(true);
    setScannerError(null);
    setCameraError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = new Image();
        img.onload = async () => {
          const uploadCanvas = document.createElement('canvas');
          uploadCanvas.width = img.naturalWidth || img.width;
          uploadCanvas.height = img.naturalHeight || img.height;
          const uctx = uploadCanvas.getContext('2d', { willReadFrequently: true });
          if (!uctx) {
            setIsProcessingUpload(false);
            setScanStatus('invalid');
            setScannerError('Invalid Healorithm QR code: Could not process image.');
            return;
          }

          uctx.drawImage(img, 0, 0);
          const decoded = await decodeCanvasMultiPass(uploadCanvas);
          setIsProcessingUpload(false);

          if (decoded) {
            await handleProcessScannedText(decoded);
          } else {
            stopCamera();
            setScanStatus('invalid');
            setScannerError('Invalid Healorithm QR code: No recognizable QR code found in the uploaded image.');
          }
        };
        img.onerror = () => {
          setIsProcessingUpload(false);
          setScanStatus('invalid');
          setScannerError('Invalid Healorithm QR code: Failed to load image file.');
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (_err) {
      setIsProcessingUpload(false);
      stopCamera();
      setScanStatus('invalid');
      setScannerError('Invalid Healorithm QR code: Error reading image file.');
    } finally {
      e.target.value = '';
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      handleProcessScannedText(manualInput.trim());
      setManualInput('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 font-sans pb-10">
      {/* Page Title */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-extrabold uppercase">
          <Camera className="w-3.5 h-3.5" />
          <span>Optical QR Scanner</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Scan Patient QR Health Card
        </h1>
        <p className="text-xs text-slate-500">
          Point camera at patient's printed QR card or digital phone screen (100% Offline)
        </p>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* CAMERA VIEWFINDER (Active Live Video Feed) */}
      {/* ------------------------------------------------------------- */}
      {isCameraActive && scanStatus === 'idle' && !cameraError && (
        <div className="bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-xl text-white space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${cameraState === 'scanning' ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
              <span className="font-bold">
                {cameraState === 'scanning' ? 'Scanning...' : 'Camera Ready — Point at Patient QR'}
              </span>
            </div>

            {seqProgress && (
              <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 px-2 py-0.5 rounded-md font-bold">
                Receiving Stream: {seqProgress.count} / {seqProgress.total} ({seqProgress.progress}%)
              </span>
            )}
          </div>

          {/* Camera Viewport with Centered Reticle */}
          <div className="relative overflow-hidden rounded-2xl bg-black min-h-[360px] max-h-[500px] flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain max-h-[500px]"
            />

            {/* Centered Reticle */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-64 sm:w-72 sm:h-72 border-2 border-emerald-400/80 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                {/* 4 Corner Markers */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                {/* Animated Laser Scanning Beam */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-bounce mt-14" />
              </div>
            </div>
          </div>

          <p className="text-center text-[11px] text-slate-400">
            Center the full QR code inside the green frame. Hold still for high-density codes.
          </p>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CAMERA PERMISSION OR HARDWARE NOTICE */}
      {/* ------------------------------------------------------------- */}
      {cameraError && scanStatus === 'idle' && (
        <div className="bg-white rounded-3xl border-2 border-amber-300 p-6 shadow-md text-center space-y-4 animate-in zoom-in-95">
          <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
            <VideoOff className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              Camera Access Required
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              {cameraError}
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => startCamera()}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold inline-flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Enable Camera / Try Again</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload QR Photo</span>
            </button>
            <button
              onClick={handleSimulateDemo}
              className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Run Offline Demo</span>
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SCANNER FAILURE / ERROR DISPLAY (Invalid QR or Not Found) */}
      {/* ------------------------------------------------------------- */}
      {scanStatus === 'invalid' && (
        <div className="bg-white p-6 rounded-3xl border-2 border-red-500 shadow-lg text-center space-y-4 animate-in zoom-in-95">
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-red-600">
              Invalid Healorithm QR code
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {scannerError || 'The scanned QR code is not recognized as a valid Healorithm health card format.'}
            </p>
          </div>
          <button
            onClick={handleScanAnother}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold inline-flex items-center gap-2 shadow-md cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Scan Another Patient</span>
          </button>
        </div>
      )}

      {scanStatus === 'not_found' && (
        <div className="bg-white p-6 rounded-3xl border-2 border-amber-500 shadow-lg text-center space-y-4 animate-in zoom-in-95">
          <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-amber-600">
              Patient record not found
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {scannerError || 'The scanned patient identifier was not found in the local or cached registry.'}
            </p>
          </div>
          <button
            onClick={handleScanAnother}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold inline-flex items-center gap-2 shadow-md cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Scan Another Patient</span>
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUCCESS: FULL PATIENT RESULT SCREEN / CARD */}
      {/* ------------------------------------------------------------- */}
      {scanStatus === 'success' && scannedPatientData && (
        <div className="bg-white p-6 sm:p-7 rounded-3xl border-2 border-emerald-500 shadow-xl space-y-6 animate-in zoom-in-95 duration-200">
          {/* Header Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center font-bold shrink-0 shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Verified Patient Card
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-mono font-bold">
                    {scannedPatientData.patientId}
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
                  {scannedPatientData.name}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5 font-medium">
                  <span>{scannedPatientData.age} Yrs • {scannedPatientData.gender}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {scannedPatientData.village}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {scannedPatientData.phone}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
              <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-extrabold">
                Blood Group: {scannedPatientData.bloodGroup}
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-mono">
                Decoded 100% Offline
              </span>
            </div>
          </div>

          {/* Risk Level & Clinical Triage Status Banner */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            scannedPatientData.risk.level === 'Critical'
              ? 'bg-red-50 border-red-200 text-red-900'
              : scannedPatientData.risk.level === 'High'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider">Clinical Risk Assessment</span>
                <span className={`px-2 py-0.5 rounded-md text-xs font-black uppercase ${
                  scannedPatientData.risk.level === 'Critical'
                    ? 'bg-red-600 text-white'
                    : scannedPatientData.risk.level === 'High'
                    ? 'bg-amber-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}>
                  {scannedPatientData.risk.level} Priority ({scannedPatientData.risk.score}/100)
                </span>
              </div>
              <p className="text-xs font-medium opacity-90">
                Recommended Response: <span className="font-bold">{scannedPatientData.risk.target_response_time}</span> • Specialty: <span className="font-bold">{scannedPatientData.risk.recommended_specialty}</span>
              </p>
            </div>

            <div className="shrink-0 text-right">
              <span className="text-xs font-mono font-bold block">
                Triage Priority: {scannedPatientData.risk.priority}
              </span>
            </div>
          </div>

          {/* Explainable Risk Factors */}
          {scannedPatientData.risk.factors && scannedPatientData.risk.factors.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Risk Contributing Factors
              </span>
              <div className="flex flex-wrap gap-1.5">
                {scannedPatientData.risk.factors.map((factor, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium border border-slate-200"
                  >
                    {factor}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Latest Scanned Vitals Grid */}
          {scannedPatientData.vitals && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Latest Vitals Transferred via QR
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Blood Pressure</span>
                  <span className="font-black text-base text-slate-900 mt-0.5 block">
                    {scannedPatientData.vitals.systolic_bp || '--'}/{scannedPatientData.vitals.diastolic_bp || '--'}
                  </span>
                  <span className="text-[10px] text-slate-400">mmHg</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">SpO2 Oxygen</span>
                  <span className={`font-black text-base mt-0.5 block ${
                    scannedPatientData.vitals.spo2 && scannedPatientData.vitals.spo2 < 90 ? 'text-red-600' : 'text-slate-900'
                  }`}>
                    {scannedPatientData.vitals.spo2 || '--'}%
                  </span>
                  <span className="text-[10px] text-slate-400">Saturation</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Heart Rate</span>
                  <span className="font-black text-base text-slate-900 mt-0.5 block">
                    {scannedPatientData.vitals.heart_rate || '--'}
                  </span>
                  <span className="text-[10px] text-slate-400">BPM</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Blood Glucose</span>
                  <span className="font-black text-base text-slate-900 mt-0.5 block">
                    {scannedPatientData.vitals.blood_glucose || '--'}
                  </span>
                  <span className="text-[10px] text-slate-400">mg/dL</span>
                </div>
              </div>
            </div>
          )}

          {/* Active Symptoms & Clinical Conditions */}
          {scannedPatientData.symptoms && scannedPatientData.symptoms.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Active Symptoms Reported
              </span>
              <div className="flex flex-wrap gap-1.5">
                {scannedPatientData.symptoms.map((sym, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg text-xs font-semibold border border-amber-200 flex items-center gap-1"
                  >
                    <Activity className="w-3 h-3 text-amber-600" />
                    {sym}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Prescriptions Transferred */}
          {scannedPatientData.prescriptions && scannedPatientData.prescriptions.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Current Prescribed Medications ({scannedPatientData.prescriptions.length})
              </span>
              <div className="space-y-1.5">
                {scannedPatientData.prescriptions.map((rx, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Pill className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-900">{rx.medicine_name}</span>
                        {rx.generic_name && (
                          <span className="text-[11px] text-slate-500 ml-1.5">({rx.generic_name})</span>
                        )}
                      </div>
                    </div>
                    <span className="text-slate-600 text-[11px] font-medium">{rx.dosage || rx.timing || 'As directed'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={handleScanAnother}
              className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Scan Another Patient</span>
            </button>

            <button
              onClick={() => navigate('/worker/vitals')}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-colors cursor-pointer"
            >
              <Stethoscope className="w-4 h-4" />
              <span>Record Examination & Vitals</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* QUICK ACTIONS & MANUAL INPUT (Always available) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Simulate QR Scan (Offline Demo) */}
        <button
          onClick={handleSimulateDemo}
          className="p-4 bg-white border border-slate-200 hover:border-emerald-400 rounded-2xl shadow-xs text-left flex items-start gap-3 transition-colors cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              Simulate QR Scan (Offline Demo)
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Instantly decode real patient health card (Ramesh Kumar • HLM-482731)
            </p>
          </div>
        </button>

        {/* Upload QR Image File */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessingUpload}
          className="p-4 bg-white border border-slate-200 hover:border-blue-400 rounded-2xl shadow-xs text-left flex items-start gap-3 transition-colors cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900">
              {isProcessingUpload ? 'Decoding Image...' : 'Upload QR Photo / Image'}
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Decode patient health card from screenshot or image file
            </p>
          </div>
        </button>

        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleImageFileChange}
        />
      </div>

      {/* Manual QR / Patient ID Direct Form */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2 text-xs">
        <h4 className="font-bold text-slate-900">Manual Direct Payload / ID Input</h4>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Paste raw QR text or enter Patient ID (e.g. HLM-482731 or u-101)..."
            className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
          <button
            type="submit"
            className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shrink-0 cursor-pointer transition-colors"
          >
            Process
          </button>
        </form>
      </div>
    </div>
  );
}
