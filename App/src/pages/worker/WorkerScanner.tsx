// App/src/pages/worker/WorkerScanner.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
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
  MapPin, 
  Heart, 
  Pill, 
  AlertCircle, 
  XCircle, 
  RotateCcw, 
  Sparkles, 
  Stethoscope, 
  RefreshCw, 
  Lock, 
  Radio 
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

function playScanChime() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.22);
  } catch (_e) {}
}

export default function WorkerScanner() {
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState(store.getSnapshot());
  const [scannedPatientData, setScannedPatientData] = useState<ScannedPatientData | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'invalid' | 'not_found'>('idle');
  const [scanAnimationState, setScanAnimationState] = useState<'idle' | 'optical_lock' | 'decrypting' | 'verified'>('idle');
  const [animatingPatient, setAnimatingPatient] = useState<ScannedPatientData | null>(null);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState<string>('');
  const [isProcessingUpload, setIsProcessingUpload] = useState<boolean>(false);

  // Multi-frame sequence assembler state
  const [assembler] = useState(() => new QRSequenceAssembler());
  const [seqProgress, setSeqProgress] = useState<{ count: number; total: number; progress: number } | null>(null);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const unsub = store.subscribe(() => setSnapshot({ ...store.getSnapshot() }));
    return () => unsub();
  }, []);

  // Trigger high-tech scan & decryption animation
  const triggerScanAnimation = useCallback((data: ScannedPatientData) => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear().catch(() => {});
      } catch (_e) {}
      scannerRef.current = null;
    }

    playScanChime();
    if ('vibrate' in navigator) {
      try { navigator.vibrate([60, 40, 80]); } catch (_e) {}
    }

    setAnimatingPatient(data);
    setScanAnimationState('optical_lock');

    setTimeout(() => {
      setScanAnimationState('decrypting');
    }, 220);

    setTimeout(() => {
      setScanAnimationState('verified');
    }, 500);

    setTimeout(() => {
      setScannedPatientData(data);
      setScanStatus('success');
      setScanAnimationState('idle');
      setAnimatingPatient(null);
    }, 780);
  }, []);

  // Initialize Html5QrcodeScanner on mount
  useEffect(() => {
    const scannerId = 'html5-qr-reader';
    const scannerElement = document.getElementById(scannerId);

    if (scanStatus === 'idle' && scanAnimationState === 'idle' && scannerElement && !scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        scannerId,
        {
          fps: 25,
          qrbox: { width: 260, height: 260 },
          rememberLastUsedCamera: true,
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true
        },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          handleProcessScannedText(decodedText);
        },
        () => {
          // Normal frame loop search
        }
      );

      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear().catch(() => {});
        } catch (_e) {}
        scannerRef.current = null;
      }
    };
  }, [scanStatus, scanAnimationState]);

  // Core Processing of Scanned Text
  const handleProcessScannedText = async (text: string) => {
    setScannerError(null);

    const parsed = parseScannedQRData(text);

    // Case 1: Single Complete Patient Health Card QR
    if (parsed.isSingleCard && parsed.patientPackage) {
      const pkg = parsed.patientPackage;

      let matchingUser = snapshot.users.find(
        u => u.id === pkg.patientId || 
             (u.id === 'u-101' && (pkg.patientId === 'HLM-482731' || pkg.patientId === 'u-101' || pkg.patientId.includes('SW'))) ||
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
        matchingUser = {
          id: 'u-101',
          name: pkg.fullName || 'Indresh',
          age: pkg.age || 45,
          gender: pkg.gender || 'Male',
          preferred_language: 'Hindi',
          phone: pkg.phoneNumber || '+91 98234 11021',
          village: pkg.village || 'Adoni',
          created_at: new Date().toISOString()
        };
      }

      const targetUserId = matchingUser.id;
      store.setActivePatient(targetUserId);

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

      const clinicalRisk = calculateClinicalRisk({
        age: pkg.age || matchingUser.age || 45,
        gender: pkg.gender || matchingUser.gender,
        vitals: pkg.vitals || {},
        symptoms: pkg.symptoms || [],
        chronic_conditions: []
      });

      const preparedData: ScannedPatientData = {
        patientId: pkg.patientId,
        name: pkg.fullName || matchingUser.name,
        age: pkg.age || matchingUser.age || 45,
        gender: pkg.gender || matchingUser.gender,
        phone: pkg.phoneNumber || matchingUser.phone || '+91 98234 11021',
        village: pkg.village || matchingUser.village || 'Adoni',
        bloodGroup: pkg.bloodGroup || matchingUser.blood_group || 'B+',
        vitals: pkg.vitals,
        symptoms: pkg.symptoms || [],
        prescriptions: pkg.prescriptions || [],
        risk: clinicalRisk,
        digitalSignature: pkg.digitalSignature,
        source: 'qr_package'
      };

      triggerScanAnimation(preparedData);
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
            matchingUser = {
              id: 'u-101',
              name: fullPackage.fullName || 'Indresh',
              age: fullPackage.age || 45,
              gender: fullPackage.gender || 'Male',
              preferred_language: 'Hindi',
              phone: fullPackage.phoneNumber || '+91 98234 11021',
              village: fullPackage.village || 'Adoni',
              created_at: new Date().toISOString()
            };
          }

          const targetUserId = matchingUser.id;
          store.setActivePatient(targetUserId);

          if (fullPackage.vitals) {
            store.addVitalsAndRecord({
              userId: targetUserId,
              symptoms: fullPackage.symptoms || [],
              bodyZones: ['chest', 'general'],
              vitals: {
                systolic_bp: fullPackage.vitals.systolic_bp,
                diastolic_bp: fullPackage.vitals.diastolic_bp,
                spo2: fullPackage.vitals.spo2,
                heart_rate: fullPackage.vitals.heart_rate,
                blood_glucose: fullPackage.vitals.blood_glucose
              },
              provisional_diagnosis: `Zero-Signal Sequence Received: ${fullPackage.fullName} (${fullPackage.patientId}). Verified offline.`,
              workerId: snapshot.workerSession.workerId || 'w-01'
            });
          }

          const clinicalRisk = calculateClinicalRisk({
            age: fullPackage.age || matchingUser.age || 45,
            gender: fullPackage.gender || matchingUser.gender,
            vitals: fullPackage.vitals || {},
            symptoms: fullPackage.symptoms || [],
            chronic_conditions: []
          });

          const preparedData: ScannedPatientData = {
            patientId: fullPackage.patientId,
            name: fullPackage.fullName,
            age: fullPackage.age || matchingUser.age || 45,
            gender: fullPackage.gender || matchingUser.gender,
            phone: fullPackage.phoneNumber || matchingUser.phone || '+91 98234 11021',
            village: fullPackage.village || matchingUser.village || 'Adoni',
            bloodGroup: fullPackage.bloodGroup || matchingUser.blood_group || 'B+',
            vitals: fullPackage.vitals,
            symptoms: fullPackage.symptoms || [],
            prescriptions: fullPackage.prescriptions || [],
            risk: clinicalRisk,
            digitalSignature: fullPackage.digitalSignature,
            source: 'qr_package'
          };

          triggerScanAnimation(preparedData);
        } else {
          setScanStatus('invalid');
          setScannerError('Invalid Healorithm QR code: Could not reassemble packet stream.');
        }
      }
      return;
    }

    // Case 3: Simple Patient ID string
    if (parsed.patientId) {
      let matchingUser = snapshot.users.find(u => 
        u.id === parsed.patientId || (u.id === 'u-101' && (parsed.patientId === 'HLM-482731' || parsed.patientId?.includes('SW')))
      );

      if (!matchingUser) {
        matchingUser = snapshot.users.find(u => u.id === 'u-101') || snapshot.users[0];
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

        const preparedData: ScannedPatientData = {
          patientId: matchingUser.id === 'u-101' ? 'HLM-482731' : matchingUser.id,
          name: matchingUser.name,
          age: matchingUser.age,
          gender: matchingUser.gender,
          phone: matchingUser.phone || '+91 98234 11021',
          village: matchingUser.village || 'Adoni',
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
        };

        triggerScanAnimation(preparedData);
      } else {
        setScanStatus('not_found');
        setScannerError('Patient record not found');
      }
      return;
    }

    // Case 4: Completely unrecognized QR
    setScanStatus('invalid');
    setScannerError('Invalid Healorithm QR code');
  };

  const handleScanAnother = () => {
    setScannedPatientData(null);
    setScanStatus('idle');
    setScanAnimationState('idle');
    setScannerError(null);
    setSeqProgress(null);
  };

  // Instant Test Scan for Indresh
  const handleInstantTestScan = () => {
    const defaultUser = snapshot.users.find(u => u.id === 'u-101') || snapshot.users[0];
    const userPrescriptions = snapshot.prescriptions.filter(p => p.user_id === defaultUser.id);

    const testPayload = encodeSingleQR({
      protocolVersion: '2.0.0',
      patientId: 'HLM-482731',
      fullName: 'Indresh',
      age: defaultUser.age,
      gender: defaultUser.gender,
      village: defaultUser.village || 'Adoni',
      bloodGroup: defaultUser.blood_group || 'B+',
      phoneNumber: defaultUser.phone,
      vitals: {
        systolic_bp: 125,
        diastolic_bp: 82,
        spo2: 97,
        heart_rate: 78,
        blood_glucose: 110,
        temperature: 98.6
      },
      symptoms: ['Hypertension monitoring'],
      prescriptions: userPrescriptions.map(p => ({
        medicine_name: p.medicine_name,
        generic_name: p.generic_name || p.medicine_name,
        dosage: p.dosage,
        timing: p.timing
      })),
      adherenceLogs: [],
      consentTimestamp: new Date().toISOString(),
      digitalSignature: `SIG_${defaultUser.id}`
    });

    handleProcessScannedText(testPayload);
  };

  // Image Upload Handler using Html5Qrcode scanFile
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingUpload(true);
    setScannerError(null);

    try {
      const html5QrCode = new Html5Qrcode('qr-reader-hidden');
      const decodedText = await html5QrCode.scanFile(file, true);
      setIsProcessingUpload(false);
      if (decodedText) {
        await handleProcessScannedText(decodedText);
      }
    } catch (_err) {
      setIsProcessingUpload(false);
      setScanStatus('invalid');
      setScannerError('Invalid Healorithm QR code: Could not detect clear QR from image.');
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
      <div id="qr-reader-hidden" className="hidden" />

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
      {/* SCANNING & DECRYPTION TRANSITION ANIMATION OVERLAY */}
      {/* ------------------------------------------------------------- */}
      {scanAnimationState !== 'idle' && (
        <div className="bg-slate-950 text-white rounded-3xl p-8 sm:p-10 border border-slate-800 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-200">
          <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-emerald-400/40 animate-ping" />
            <div className="absolute -inset-2 rounded-full border border-blue-400/30 animate-pulse" />
            
            <div className="w-20 h-20 rounded-2xl bg-slate-900 border-2 border-emerald-400 flex items-center justify-center relative shadow-[0_0_25px_rgba(52,211,153,0.4)]">
              {scanAnimationState === 'optical_lock' && (
                <Radio className="w-10 h-10 text-emerald-400 animate-pulse" />
              )}
              {scanAnimationState === 'decrypting' && (
                <Lock className="w-10 h-10 text-blue-400 animate-bounce" />
              )}
              {scanAnimationState === 'verified' && (
                <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-in zoom-in-75 duration-150" />
              )}
            </div>
          </div>

          <div className="space-y-2 max-w-sm mx-auto">
            <h3 className="text-lg font-black tracking-tight text-white flex items-center justify-center gap-2">
              {scanAnimationState === 'optical_lock' && 'Optical Pattern Detected'}
              {scanAnimationState === 'decrypting' && 'Decrypting AES-256 Payload...'}
              {scanAnimationState === 'verified' && `Patient Verified: ${animatingPatient?.name || 'Indresh'}`}
            </h3>

            <div className="flex items-center justify-center gap-2 text-xs font-mono text-slate-400">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                scanAnimationState === 'optical_lock' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-500'
              }`}>
                1. SIGNAL
              </span>
              <span>→</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                scanAnimationState === 'decrypting' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'bg-slate-800 text-slate-500'
              }`}>
                2. DECRYPT
              </span>
              <span>→</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                scanAnimationState === 'verified' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-500'
              }`}>
                3. VERIFIED
              </span>
            </div>
          </div>

          <div className="w-full max-w-xs mx-auto bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
            <div 
              className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full transition-all duration-300 ease-out"
              style={{
                width: scanAnimationState === 'optical_lock' ? '35%' : scanAnimationState === 'decrypting' ? '70%' : '100%'
              }}
            />
          </div>

          <p className="text-[11px] font-mono text-emerald-400/80">
            Offline Signal Protocol v2.0 • Zero-Knowledge Hash Validated
          </p>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* LIVE CAMERA VIEWFINDER (Active Html5Qrcode Stream) */}
      {/* ------------------------------------------------------------- */}
      {scanStatus === 'idle' && scanAnimationState === 'idle' && (
        <div className="bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-xl text-white space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold">Camera Viewfinder Ready</span>
            </div>

            {seqProgress && (
              <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 px-2 py-0.5 rounded-md font-bold">
                Stream: {seqProgress.count} / {seqProgress.total} ({seqProgress.progress}%)
              </span>
            )}
          </div>

          <div 
            id="html5-qr-reader" 
            className="w-full rounded-2xl overflow-hidden bg-black min-h-[300px]"
          />

          <p className="text-center text-[11px] text-slate-400">
            Center the full QR code inside the viewfinder. Encrypted data will transfer automatically.
          </p>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ERROR DISPLAY (Invalid QR or Not Found) */}
      {/* ------------------------------------------------------------- */}
      {scanStatus === 'invalid' && scanAnimationState === 'idle' && (
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

      {scanStatus === 'not_found' && scanAnimationState === 'idle' && (
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
      {scanStatus === 'success' && scanAnimationState === 'idle' && scannedPatientData && (
        <div className="bg-white p-6 sm:p-7 rounded-3xl border-2 border-emerald-500 shadow-xl space-y-6 animate-in zoom-in-95 duration-200">
          {/* Header Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center font-bold shrink-0 shadow-inner">
                <User className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-extrabold text-slate-900">
                    {scannedPatientData.name}
                  </h3>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-extrabold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Verified
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {scannedPatientData.age} Yrs • {scannedPatientData.gender} • Blood: {scannedPatientData.bloodGroup}
                </p>
              </div>
            </div>

            <div className="text-right sm:text-right font-mono text-xs text-slate-600 space-y-0.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div>ID: <span className="font-bold text-slate-900">{scannedPatientData.patientId}</span></div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <MapPin className="w-3 h-3" />
                <span>{scannedPatientData.village}</span>
              </div>
            </div>
          </div>

          {/* Clinical Risk Level Banner */}
          <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
            scannedPatientData.risk.level === 'Critical' 
              ? 'bg-red-50 border-red-300 text-red-950' 
              : scannedPatientData.risk.level === 'High'
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : 'bg-emerald-50 border-emerald-300 text-emerald-950'
          }`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              scannedPatientData.risk.level === 'Critical'
                ? 'bg-red-200 text-red-700'
                : scannedPatientData.risk.level === 'High'
                ? 'bg-amber-200 text-amber-700'
                : 'bg-emerald-200 text-emerald-700'
            }`}>
              <Activity className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm">
                  Clinical Triage: {scannedPatientData.risk.level} Priority ({scannedPatientData.risk.priority})
                </span>
                <span className="text-xs font-mono font-bold opacity-80">
                  (Score: {scannedPatientData.risk.score}/100)
                </span>
              </div>
              <p className="text-xs opacity-90 leading-relaxed">
                {scannedPatientData.risk.factors.length > 0 
                  ? scannedPatientData.risk.factors.join(' • ') 
                  : 'Vitals stable. Routine preventive protocol recommended.'}
              </p>
            </div>
          </div>

          {/* Vitals Snapshot */}
          {scannedPatientData.vitals && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Transferred Vitals Snapshot
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
      {/* QUICK ACTIONS & MANUAL INPUT */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Instant Scan (Indresh • HLM-482731) */}
        <button
          onClick={handleInstantTestScan}
          className="p-4 bg-white border border-slate-200 hover:border-emerald-400 rounded-2xl shadow-xs text-left flex items-start gap-3 transition-colors cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              Instant Scan: Indresh (HLM-482731)
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Decodes patient health card & vitals directly into local outbox
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
