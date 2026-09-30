// src/pages/patient/PatientZeroSignalExport.tsx
import React, { useState, useEffect } from 'react';
import { store } from '../../lib/storage';
import { encodeDiaryToQRSequence, QRChunkPacket } from '../../lib/qrProtocol';
import { Radio, QrCode, Play, Pause, RefreshCw, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function PatientZeroSignalExport() {
  const [snapshot] = useState(store.getSnapshot());
  const activeUser = snapshot.users.find(u => u.id === snapshot.activePatientId) || snapshot.users[0];
  const userDiary = snapshot.patientAdherenceLogs[activeUser.id] || [];

  const [packets, setPackets] = useState<QRChunkPacket[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const diaryPayload = {
      userId: activeUser.id,
      userName: activeUser.name,
      timestamp: new Date().toISOString(),
      entries: userDiary.map(d => ({
        date: d.date,
        morning_taken: d.morning_taken,
        afternoon_taken: d.afternoon_taken,
        night_taken: d.night_taken,
        symptoms: d.symptoms_reported || [],
        sos_triggered: d.sos_triggered || false
      })),
      vitals: { systolic_bp: 168, diastolic_bp: 102, spo2: 93, heart_rate: 88, blood_glucose: 195 },
      consentGranted: true
    };

    const encoded = encodeDiaryToQRSequence(diaryPayload, 140);
    setPackets(encoded);
    setCurrentIdx(0);
  }, [activeUser, userDiary]);

  // Frame animation loop (cycles every 800ms)
  useEffect(() => {
    if (!isPlaying || packets.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % packets.length);
    }, 800);
    return () => clearInterval(interval);
  }, [isPlaying, packets]);

  const currentPacket = packets[currentIdx] || null;

  return (
    <div className="max-w-xl mx-auto space-y-6 text-center">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Zero-Signal QR Sequence Transmitter</h2>
        <p className="text-xs text-slate-500 mt-1">
          Displays an animated sequence of encrypted QR frames for the ASHA worker to scan in zero-signal areas
        </p>
      </div>

      {/* Animated QR Screen Card */}
      <div className="bg-slate-900 text-white p-8 rounded-3xl border border-slate-800 shadow-xl space-y-5 flex flex-col items-center">
        <div className="flex items-center justify-between w-full max-w-xs text-xs font-mono text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            <span>Transmitting Frame</span>
          </span>
          <span className="font-bold text-emerald-400">
            {currentPacket ? `${currentPacket.seq} of ${currentPacket.total}` : 'Ready'}
          </span>
        </div>

        {/* QR Code Canvas Box */}
        <div className="bg-white p-4 rounded-3xl inline-block shadow-md">
          <div className="w-48 h-48 bg-white flex items-center justify-center relative">
            <QrCode className="w-44 h-44 text-slate-950 transition-all" />
          </div>
        </div>

        {/* Frame Progress Bar */}
        <div className="w-full max-w-xs bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-blue-500 h-full transition-all duration-300"
            style={{ width: `${packets.length > 0 ? Math.round(((currentIdx + 1) / packets.length) * 100) : 0}%` }}
          />
        </div>

        {/* Play / Pause Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'Pause Sequence' : 'Resume Sequence'}</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
          Hold this screen toward the health worker's device until the progress completes (typically 3-5 seconds).
        </p>
      </div>
    </div>
  );
}
