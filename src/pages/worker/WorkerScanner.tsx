// src/pages/worker/WorkerScanner.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { store } from '../../lib/storage';
import { QrCode, Camera, CheckCircle2, User, Search, Sparkles } from 'lucide-react';

export default function WorkerScanner() {
  const navigate = useNavigate();
  const [snapshot] = useState(store.getSnapshot());
  const [scannedPatientId, setScannedPatientId] = useState<string | null>(null);

  const handleSelectPatient = (id: string) => {
    store.setActivePatient(id);
    setScannedPatientId(id);
    setTimeout(() => {
      navigate('/worker/vitals');
    }, 600);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold text-slate-900">Scan Patient QR Health Card</h2>
        <p className="text-xs text-slate-500">Instant lookup in ~2 seconds with zero internet signal required</p>
      </div>

      {/* Simulated High-Tech Camera Viewfinder Card */}
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-lg text-white flex flex-col items-center justify-center relative overflow-hidden h-72">
        <div className="w-48 h-48 border-2 border-emerald-400 border-dashed rounded-2xl flex items-center justify-center relative animate-pulse">
          <QrCode className="w-24 h-24 text-emerald-400/60" />
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-emerald-300 font-mono">
          <Camera className="w-4 h-4" />
          <span>Point camera at printed or digital QR card</span>
        </div>
      </div>

      {/* Instant Demo Presets to Simulate Physical QR Card Scans */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Select Sample Patient QR Card</h3>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">Instant QR Lookup</span>
        </div>

        <div className="space-y-2">
          {snapshot.users.map((u) => {
            const an = snapshot.analytics.find(a => a.user_id === u.id);

            return (
              <button
                key={u.id}
                onClick={() => handleSelectPatient(u.id)}
                className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  scannedPatientId === u.id
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 hover:bg-emerald-50/50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                    scannedPatientId === u.id ? 'bg-emerald-700 text-white' : 'bg-white text-emerald-700 border border-slate-200'
                  }`}>
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">{u.name}</h4>
                    <p className={`text-[11px] ${scannedPatientId === u.id ? 'text-emerald-100' : 'text-slate-500'}`}>
                      {u.age} yrs • {u.village} • {u.phone}
                    </p>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  scannedPatientId === u.id
                    ? 'bg-emerald-800 text-white'
                    : an?.risk_level === 'Critical' ? 'bg-red-100 text-red-700' :
                      an?.risk_level === 'High' ? 'bg-orange-100 text-orange-700' :
                      'bg-emerald-100 text-emerald-700'
                }`}>
                  {an?.risk_level || 'Low'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
