// src/pages/worker/WorkerDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { store } from '../../lib/storage';
import { 
  Users, 
  QrCode, 
  Activity, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  PhoneCall, 
  ChevronRight, 
  Plus, 
  ShieldAlert,
  Radio,
  Volume2
} from 'lucide-react';
import { playVoicePrompt } from '@shared/translations';

export default function WorkerDashboard() {
  const [snapshot, setSnapshot] = useState(store.getSnapshot());

  useEffect(() => {
    return store.subscribe(() => {
      setSnapshot({ ...store.getSnapshot() });
    });
  }, []);

  const tLang = snapshot.selectedLanguage;

  // Filter patients for current worker's village, sorted high-risk first
  const villagePatients = snapshot.users.filter(u => u.village === snapshot.workerSession.assignedVillage || !u.village);
  
  const sortedQueue = [...villagePatients].sort((a, b) => {
    const aAn = snapshot.analytics.find(an => an.user_id === a.id);
    const bAn = snapshot.analytics.find(an => an.user_id === b.id);
    return (bAn?.risk_score || 0) - (aAn?.risk_score || 0);
  });

  const highRiskCount = villagePatients.filter(u => {
    const an = snapshot.analytics.find(a => a.user_id === u.id);
    return an?.risk_level === 'High' || an?.risk_level === 'Critical';
  }).length;

  const handleReadPatient = (name: string, score: number, risks: string[]) => {
    const text = tLang === 'hi' 
      ? `मरीज़ ${name}, जोखिम स्कोर ${score}। मुख्य कारण: ${risks.slice(0, 2).join(' और ')}`
      : tLang === 'mr'
      ? `रुग्ण ${name}, धोका गुण ${score}। मुख्य कारण: ${risks.slice(0, 2).join(' आणि ')}`
      : `Patient ${name}, risk score ${score}. Contributing factors: ${risks.slice(0, 2).join(' and ')}`;
    playVoicePrompt(text, tLang);
  };

  return (
    <div className="space-y-6">
      {/* Worker Quick Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Today's Visits</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{villagePatients.length}</p>
          <span className="text-[11px] text-emerald-600 font-bold">In {snapshot.workerSession.assignedVillage}</span>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-red-200 shadow-xs">
          <span className="text-[11px] font-bold text-red-500 uppercase">High Risk Priority</span>
          <p className="text-2xl font-bold text-red-600 mt-1">{highRiskCount}</p>
          <span className="text-[11px] text-red-600 font-bold">Visit First</span>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Offline Outbox</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{snapshot.outbox.length}</p>
          <span className="text-[11px] text-slate-500 font-medium">Pending Auto-Sync</span>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-emerald-200 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase">Sync Freshness</span>
          <p className="text-lg font-bold text-emerald-700 mt-1">Encrypted</p>
          <span className="text-[11px] text-emerald-600 font-bold">AES-GCM at Rest</span>
        </div>
      </div>

      {/* Quick Field Actions Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/worker/scan"
          className="p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl font-bold text-xs flex flex-col items-center justify-center gap-2 shadow-xs transition-all text-center"
        >
          <QrCode className="w-6 h-6" />
          <span>Scan Patient QR</span>
        </Link>
        <Link
          to="/worker/vitals"
          className="p-4 bg-slate-900 hover:bg-slate-800 text-white rounded-3xl font-bold text-xs flex flex-col items-center justify-center gap-2 shadow-xs transition-all text-center"
        >
          <Activity className="w-6 h-6 text-emerald-400" />
          <span>Record Vitals & 3D Symptoms</span>
        </Link>
        <Link
          to="/worker/new"
          className="p-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-3xl font-bold text-xs flex flex-col items-center justify-center gap-2 shadow-xs transition-all text-center"
        >
          <Plus className="w-6 h-6 text-emerald-600" />
          <span>Register New Patient</span>
        </Link>
        <Link
          to="/worker/zero-signal"
          className="p-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-3xl font-bold text-xs flex flex-col items-center justify-center gap-2 shadow-xs transition-all text-center"
        >
          <Radio className="w-6 h-6 text-blue-600" />
          <span>Zero-Signal QR Receiver</span>
        </Link>
      </div>

      {/* Daily Visit Priority Queue */}
      <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Prioritized Daily Visit Queue</h3>
            <p className="text-xs text-slate-500">Sorted automatically by on-device risk assessment (High risk first)</p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            {sortedQueue.length} Patients
          </span>
        </div>

        <div className="space-y-3">
          {sortedQueue.map((patient) => {
            const an = snapshot.analytics.find(a => a.user_id === patient.id);
            const isHigh = an?.risk_level === 'High' || an?.risk_level === 'Critical';

            return (
              <div 
                key={patient.id} 
                className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isHigh ? 'bg-red-50/40 border-red-200' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      an?.risk_level === 'Critical' ? 'bg-red-100 text-red-700' :
                      an?.risk_level === 'High' ? 'bg-orange-100 text-orange-700' :
                      an?.risk_level === 'Moderate' ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {an?.risk_level || 'Low'} Risk ({an?.risk_score || 20}/100)
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{patient.name}</h4>
                    <span className="text-xs text-slate-500">• {patient.age} yrs • {patient.gender}</span>
                  </div>

                  <p className="text-xs text-slate-600 font-medium">
                    <strong>Address:</strong> {patient.address || 'Village Sub-center Area'}
                  </p>

                  {an?.risks && an.risks.length > 0 && (
                    <p className="text-xs text-red-700 font-medium">
                      <strong>Risk Factors:</strong> {an.risks.slice(0, 3).join('; ')}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReadPatient(patient.name, an?.risk_score || 20, an?.risks || [])}
                    className="p-2.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl transition-colors"
                    title="Read risk summary out loud"
                  >
                    <Volume2 className="w-4 h-4 text-emerald-600" />
                  </button>

                  <Link
                    to={`/worker/patient/${patient.id}`}
                    onClick={() => store.setActivePatient(patient.id)}
                    className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    title="View Full Patient Dossier"
                  >
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>Dossier</span>
                  </Link>

                  <Link
                    to="/worker/vitals"
                    onClick={() => store.setActivePatient(patient.id)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Examine</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
