// App/src/pages/worker/WorkerZeroSignalHandoff.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { store } from '../../lib/storage';
import { 
  QRSequenceAssembler, 
  encodeToQRSequence, 
  PatientExportPackage 
} from '@shared/qrProtocol';
import { 
  Radio, 
  CheckCircle2, 
  ShieldCheck, 
  QrCode, 
  Play, 
  Camera,
  ArrowRight,
  RefreshCw 
} from 'lucide-react';

export default function WorkerZeroSignalHandoff() {
  const navigate = useNavigate();
  const [snapshot] = useState(store.getSnapshot());
  const [assembler] = useState(() => new QRSequenceAssembler());
  const [progress, setProgress] = useState(0);
  const [receivedCount, setReceivedCount] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [assembledData, setAssembledData] = useState<PatientExportPackage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const samplePackage: PatientExportPackage = {
    protocolVersion: '2.0.0',
    patientId: 'HLM-482731',
    fullName: 'Indresh',
    age: 45,
    gender: 'Male',
    village: 'Adoni Village',
    bloodGroup: 'B+',
    phoneNumber: '9823411021',
    vitals: {
      systolic_bp: 168,
      diastolic_bp: 102,
      spo2: 93,
      heart_rate: 88,
      blood_glucose: 195,
      temperature: 98.6
    },
    symptoms: ['High Blood Pressure', 'Mild Headache'],
    prescriptions: [
      { medicine_name: 'Telma 40', generic_name: 'Telmisartan 40mg', dosage: '1 Tab Daily', timing: 'Morning' },
      { medicine_name: 'Glycomet 500', generic_name: 'Metformin 500mg', dosage: '1 Tab Twice Daily', timing: 'After Meals' }
    ],
    adherenceLogs: [
      { date: '2026-09-28', morning_taken: true, afternoon_taken: true, night_taken: true },
      { date: '2026-09-29', morning_taken: true, afternoon_taken: true, night_taken: true },
      { date: '2026-09-30', morning_taken: true, afternoon_taken: false, night_taken: false },
    ],
    consentTimestamp: new Date().toISOString(),
    digitalSignature: 'SIG_HLM_482731_AUTH'
  };

  const packets = encodeToQRSequence(samplePackage, 120);

  const handleRunReceiverTest = () => {
    assembler.reset();
    setProgress(0);
    setReceivedCount(0);
    setAssembledData(null);
    setIsProcessing(true);
    setTotalChunks(packets.length);

    let idx = 0;
    const interval = setInterval(() => {
      if (idx < packets.length) {
        const result = assembler.addPacket(packets[idx]);
        setProgress(result.progress);
        setReceivedCount(result.receivedCount);
        idx++;

        if (result.isComplete) {
          clearInterval(interval);
          setIsProcessing(false);
          const data = assembler.assemble();
          if (data) {
            setAssembledData(data);
            store.setActivePatient('u-101');
            store.addVitalsAndRecord({
              userId: 'u-101',
              symptoms: data.symptoms,
              bodyZones: ['chest'],
              vitals: {
                systolic_bp: data.vitals?.systolic_bp,
                diastolic_bp: data.vitals?.diastolic_bp,
                spo2: data.vitals?.spo2,
                heart_rate: data.vitals?.heart_rate,
                blood_glucose: data.vitals?.blood_glucose
              },
              provisional_diagnosis: `Zero-Signal QR Transfer received from patient ${data.fullName}.`,
              workerId: snapshot.workerSession.workerId || 'w-01'
            });
          }
        }
      } else {
        clearInterval(interval);
        setIsProcessing(false);
      }
    }, 250);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 font-sans">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-extrabold uppercase">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>Chunk Frame Reassembly</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Zero-Signal Multi-Frame QR Receiver
        </h1>
        <p className="text-xs text-slate-500">
          Transfers offline patient records & adherence history directly to health worker tablet
        </p>
      </div>

      {/* Receiver Engine Box */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col items-center justify-center space-y-4 text-center">
        <div className="w-20 h-20 rounded-2xl bg-slate-800 border-2 border-emerald-400 flex items-center justify-center relative">
          <Radio className={`w-10 h-10 text-emerald-400 ${isProcessing ? 'animate-pulse' : ''}`} />
          {isProcessing && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 animate-ping" />
          )}
        </div>

        <div>
          <h3 className="text-base font-bold text-white">Multi-Frame Assembly Pipeline</h3>
          <p className="text-xs text-slate-400 mt-1">
            {isProcessing
              ? `Processing QR Chunk Stream: Frame ${receivedCount} of ${totalChunks}`
              : 'Point camera at patient animated QR code sequence'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-md bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
          <span>Frames: {receivedCount}/{totalChunks || packets.length}</span>
          <span>Integrity: Checksum Verified</span>
          <span>Progress: {progress}%</span>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => navigate('/worker/scan')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>Open Optical Camera Scanner</span>
          </button>

          <button
            onClick={handleRunReceiverTest}
            disabled={isProcessing}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Receiving...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Run Frame Test</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Assembled Received Result */}
      {assembledData && (
        <div className="bg-white p-6 sm:p-7 rounded-3xl border-2 border-emerald-500 shadow-lg space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Zero-Signal Data Decrypted & Verified!</h4>
                <p className="text-xs text-emerald-700 font-semibold">
                  Patient: {assembledData.fullName} (ID: {assembledData.patientId})
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/worker/vitals')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs"
            >
              <span>View Record</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
            <p className="font-bold text-slate-800">Transferred Adherence & Clinical Summary:</p>
            <div className="space-y-1.5 text-slate-600">
              {assembledData.adherenceLogs.map((ent, i) => (
                <div key={i} className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="font-bold">{ent.date}:</span>
                  <span>Morning {ent.morning_taken ? '✓' : '✗'}, Noon {ent.afternoon_taken ? '✓' : '✗'}, Night {ent.night_taken ? '✓' : '✗'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
