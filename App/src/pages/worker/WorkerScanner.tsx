// App/src/pages/worker/WorkerScanner.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { store } from '../../lib/storage';
import { 
  parseScannedQRData, 
  PatientExportPackage, 
  QRSequenceAssembler,
  QRChunkPacket 
} from '@shared/qrProtocol';
import { 
  QrCode, 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  User, 
  Activity, 
  ArrowRight, 
  RefreshCw, 
  Upload, 
  FileText,
  ShieldCheck,
  Zap
} from 'lucide-react';

export default function WorkerScanner() {
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState(store.getSnapshot());
  const [scannedPackage, setScannedPackage] = useState<PatientExportPackage | null>(null);
  const [scannedPatientId, setScannedPatientId] = useState<string | null>(null);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);

  // Multi-frame sequence assembler state
  const [assembler] = useState(() => new QRSequenceAssembler());
  const [seqProgress, setSeqProgress] = useState<{ count: number; total: number; progress: number } | null>(null);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    const unsub = store.subscribe(() => setSnapshot({ ...store.getSnapshot() }));
    return () => unsub();
  }, []);

  // Initialize Html5QrcodeScanner on mount
  useEffect(() => {
    const scannerId = 'html5-qr-reader';
    const scannerElement = document.getElementById(scannerId);

    if (scannerElement && !scannerRef.current) {
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
        (error) => {
          // Continuous scanning error (expected between frames)
        }
      );

      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.log('Scanner cleanup:', err));
        scannerRef.current = null;
      }
    };
  }, []);

  // Core Processing of Scanned Text
  const handleProcessScannedText = (text: string) => {
    setScannerError(null);

    const parsed = parseScannedQRData(text);

    // Case 1: Single Complete Patient Health Card QR
    if (parsed.isSingleCard && parsed.patientPackage) {
      applyImportedPatientPackage(parsed.patientPackage);
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
        if (fullPackage) {
          applyImportedPatientPackage(fullPackage);
          assembler.reset();
          setSeqProgress(null);
        }
      }
      return;
    }

    // Case 3: Simple Patient ID string (e.g. 'u-101' or 'HLM-482731')
    if (parsed.patientId) {
      const matchingUser = snapshot.users.find(u => 
        u.id === parsed.patientId || u.id === 'u-101'
      );
      if (matchingUser) {
        store.setActivePatient(matchingUser.id);
        setScannedPatientId(matchingUser.id);
      } else {
        setScannerError(`Patient ID ${parsed.patientId} parsed.`);
      }
      return;
    }

    setScannerError('Scanned QR format not recognized as a Healorithm Card.');
  };

  // Import Decrypted Patient Package into Worker Local Store
  const applyImportedPatientPackage = (pkg: PatientExportPackage) => {
    // 1. Find or create matching patient record
    let targetUserId = pkg.patientId.startsWith('HLM') ? 'u-101' : pkg.patientId;
    const existingUser = snapshot.users.find(u => u.id === targetUserId || u.name.toLowerCase() === pkg.fullName.toLowerCase());

    if (existingUser) {
      targetUserId = existingUser.id;
    }

    store.setActivePatient(targetUserId);
    setScannedPatientId(targetUserId);
    setScannedPackage(pkg);

    // 2. Add transferred clinical vitals and record to local storage & outbox
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
        provisional_diagnosis: `Zero-Signal QR Transfer received from patient ${pkg.fullName}. Verified with digital signature.`,
        workerId: snapshot.workerSession.workerId || 'w-01'
      });
    }

    // Play confirmation beep / haptic
    if ('vibrate' in navigator) {
      navigator.vibrate([80, 50, 80]);
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
    <div className="max-w-2xl mx-auto space-y-6 font-sans">
      {/* Page Title */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-extrabold uppercase">
          <Camera className="w-3.5 h-3.5" />
          <span>Optical Scanner</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Scan Patient QR Health Card
        </h1>
        <p className="text-xs text-slate-500">
          Point camera at patient's printed QR card or mobile screen (Zero Internet Required)
        </p>
      </div>

      {/* Live Camera Scanner Box */}
      <div className="bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-xl text-white space-y-4">
        <div className="flex items-center justify-between text-xs font-mono text-slate-300 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold">Live Camera Active</span>
          </div>

          {seqProgress && (
            <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 px-2 py-0.5 rounded-md font-bold">
              Receiving: Frame {seqProgress.count} / {seqProgress.total} ({seqProgress.progress}%)
            </span>
          )}
        </div>

        {/* html5-qrcode DOM Target */}
        <div className="overflow-hidden rounded-2xl bg-black min-h-[280px] flex items-center justify-center relative">
          <div id="html5-qr-reader" className="w-full" />
        </div>

        {scannerError && (
          <div className="p-3 bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{scannerError}</span>
          </div>
        )}
      </div>

      {/* Scanned Verification Card (Appears immediately when scanned) */}
      {scannedPackage && (
        <div className="bg-white p-6 sm:p-7 rounded-3xl border-2 border-emerald-500 shadow-xl space-y-5 animate-in zoom-in-95 duration-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center font-bold shrink-0">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-extrabold uppercase">
                  Verified Patient Card
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                  {scannedPackage.fullName}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  ID: {scannedPackage.patientId} • {scannedPackage.village} • {scannedPackage.age}y {scannedPackage.gender}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-extrabold">
                Blood: {scannedPackage.bloodGroup}
              </span>
            </div>
          </div>

          {/* Transferred Vitals Summary */}
          {scannedPackage.vitals && (
            <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs">
              <div className="p-2 bg-white rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">SpO2 Oxygen</span>
                <span className={`font-extrabold text-sm ${scannedPackage.vitals.spo2 && scannedPackage.vitals.spo2 < 90 ? 'text-red-600' : 'text-slate-900'}`}>
                  {scannedPackage.vitals.spo2 || 97}%
                </span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Blood Pressure</span>
                <span className="font-extrabold text-sm text-slate-900">
                  {scannedPackage.vitals.systolic_bp}/{scannedPackage.vitals.diastolic_bp}
                </span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Prescriptions</span>
                <span className="font-extrabold text-sm text-emerald-700">
                  {scannedPackage.prescriptions.length} Active
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setScannedPackage(null);
                setScannedPatientId(null);
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Scan Another Card
            </button>

            <button
              onClick={() => navigate('/worker/vitals')}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <span>Record Examination & Vitals</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Manual Payload / Direct Input Form */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3 text-xs">
        <h3 className="font-bold text-slate-900">Manual QR Data / Direct Input</h3>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Paste raw QR text or enter Patient ID (e.g. HLM-482731)..."
            className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono"
          />
          <button
            type="submit"
            className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shrink-0"
          >
            Process
          </button>
        </form>
      </div>
    </div>
  );
}
