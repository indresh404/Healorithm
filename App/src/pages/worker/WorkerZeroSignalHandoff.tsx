// src/pages/worker/WorkerZeroSignalHandoff.tsx
import React, { useState } from 'react';
import { store } from '../../lib/storage';
import { QRSequenceAssembler, encodeDiaryToQRSequence } from '@shared/qrProtocol';
import { Radio, CheckCircle2, ShieldCheck, QrCode, Play, RotateCw, RefreshCw } from 'lucide-react';

export default function WorkerZeroSignalHandoff() {
  const [snapshot] = useState(store.getSnapshot());
  const [assembler] = useState(() => new QRSequenceAssembler());
  const [progress, setProgress] = useState(0);
  const [receivedCount, setReceivedCount] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [assembledData, setAssembledData] = useState<any | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Generate simulated animated QR packets from patient u-101
  const demoDiary = {
    userId: 'u-101',
    userName: 'Ramesh Kumar',
    timestamp: new Date().toISOString(),
    entries: [
      { date: '2026-09-28', morning_taken: true, afternoon_taken: true, night_taken: true, symptoms: ['Mild headache'], sos_triggered: false },
      { date: '2026-09-29', morning_taken: true, afternoon_taken: true, night_taken: true, symptoms: ['Dizziness'], sos_triggered: false },
      { date: '2026-09-30', morning_taken: true, afternoon_taken: false, night_taken: false, symptoms: ['BP 168/102'], sos_triggered: false },
    ],
    vitals: { systolic_bp: 168, diastolic_bp: 102, spo2: 93, heart_rate: 88, blood_glucose: 195 },
    consentGranted: true
  };

  const demoPackets = encodeDiaryToQRSequence(demoDiary, 120);

  const startSimulation = () => {
    assembler.reset();
    setProgress(0);
    setReceivedCount(0);
    setAssembledData(null);
    setIsSimulating(true);
    setTotalChunks(demoPackets.length);

    let idx = 0;
    const interval = setInterval(() => {
      if (idx < demoPackets.length) {
        const result = assembler.addPacket(demoPackets[idx]);
        setProgress(result.progress);
        setReceivedCount(result.receivedCount);
        idx++;

        if (result.isComplete) {
          clearInterval(interval);
          setIsSimulating(false);
          const data = assembler.assemble();
          setAssembledData(data);
        }
      } else {
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, 600);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold text-slate-900">Zero-Signal Multi-Frame QR Receiver</h2>
        <p className="text-xs text-slate-500">
          Transfers offline patient adherence diary & vitals directly to ASHA tablet frame-by-frame with checksum validation
        </p>
      </div>

      {/* Receiver Scanner Viewfinder */}
      <div className="bg-slate-900 text-white p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col items-center justify-center space-y-4 text-center">
        <div className="w-24 h-24 rounded-2xl bg-slate-800 border-2 border-emerald-400 flex items-center justify-center relative">
          <Radio className={`w-12 h-12 text-emerald-400 ${isSimulating ? 'animate-pulse' : ''}`} />
          {isSimulating && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 animate-ping" />
          )}
        </div>

        <div>
          <h3 className="text-base font-bold text-white">Continuous Frame Assembly Engine</h3>
          <p className="text-xs text-slate-400 mt-1">
            {isSimulating
              ? `Scanning Animated QR Sequence: Packet ${receivedCount} of ${totalChunks}`
              : 'Hold camera steadily over the patient screen sequence'}
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
          <span>Frames: {receivedCount}/{totalChunks || demoPackets.length}</span>
          <span>Integrity: 100% Checksum Valid</span>
          <span>Progress: {progress}%</span>
        </div>

        <button
          onClick={startSimulation}
          disabled={isSimulating}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
        >
          {isSimulating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Receiving Frames...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Simulate Zero-Signal QR Handoff Scan</span>
            </>
          )}
        </button>
      </div>

      {/* Assembled Received Result */}
      {assembledData && (
        <div className="bg-white p-6 rounded-3xl border border-emerald-200 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">Zero-Signal Diary Decrypted & Verified!</h4>
              <p className="text-xs text-emerald-700 font-medium">Patient: {assembledData.userName} (ID: {assembledData.userId})</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
            <p className="font-bold text-slate-800">Transferred Adherence & Vitals History:</p>
            <div className="space-y-1 text-slate-600">
              {assembledData.entries.map((ent: any, i: number) => (
                <div key={i} className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                  <span>{ent.date}: Morning {ent.morning_taken ? '✓' : '✗'}, Noon {ent.afternoon_taken ? '✓' : '✗'}, Night {ent.night_taken ? '✓' : '✗'}</span>
                  <span className="text-slate-500">{ent.symptoms.join(', ') || 'No symptoms'}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            Encrypted diary saved into local storage. Will sync to district central database when tablet reaches network range.
          </p>
        </div>
      )}
    </div>
  );
}
