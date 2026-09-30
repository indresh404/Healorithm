// src/pages/patient/PatientDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { store } from '../../lib/storage';
import { 
  QrCode, 
  Pill, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Volume2, 
  Printer, 
  PhoneCall, 
  ShieldCheck, 
  ChevronRight,
  Radio
} from 'lucide-react';
import { playVoicePrompt, TRANSLATIONS } from '../../lib/translations';
import { calculateTotalPrescriptionSavings } from '../../lib/janAushadhiCatalog';

export default function PatientDashboard() {
  const [snapshot, setSnapshot] = useState(store.getSnapshot());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    return store.subscribe(() => {
      setSnapshot({ ...store.getSnapshot() });
    });
  }, []);

  const tLang = snapshot.selectedLanguage;
  const t = TRANSLATIONS[tLang];
  const activeUser = snapshot.users.find(u => u.id === snapshot.activePatientId) || snapshot.users[0];
  const prescriptions = snapshot.prescriptions.filter(p => p.user_id === activeUser.id);
  const savings = calculateTotalPrescriptionSavings(prescriptions);

  const todayStr = new Date().toISOString().split('T')[0];
  const userDiary = snapshot.patientAdherenceLogs[activeUser.id] || [];
  const todayEntry = userDiary.find(e => e.date === todayStr);

  const handleToggleDose = (dose: 'morning' | 'afternoon' | 'night') => {
    store.toggleAdherenceDose(activeUser.id, todayStr, dose);
  };

  const handleAudioQR = () => {
    const text = tLang === 'hi'
      ? `यह आपका डिजिटल क्यूआर कार्ड है। जब भी आप स्वास्थ्य कार्यकर्ता या अस्पताल जाएं, यह कार्ड दिखाएं।`
      : tLang === 'mr'
      ? `हे आपले डिजिटल क्यूआर कार्ड आहे. आरोग्य सेविका किंवा रुग्णालयात जाताना हे कार्ड दाखवा.`
      : `This is your digital QR health card. Show this QR code whenever you visit your ASHA worker or doctor.`;
    playVoicePrompt(text, tLang);
  };

  return (
    <div className="space-y-6">
      {/* Patient QR Health Card Presentation */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-blue-200 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-extrabold uppercase tracking-wider">
              National Telemedicine Health Card
            </span>
            <button
              onClick={handleAudioQR}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-xl"
              title="Listen in audio"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{activeUser.name}</h2>
          <p className="text-sm font-semibold text-slate-600">
            {activeUser.age} Years • {activeUser.gender} • Blood Group: {activeUser.blood_group || 'B+'}
          </p>
          <p className="text-xs text-slate-500 font-mono">
            ID: {activeUser.id} • HH: {activeUser.household_id || 'HH-042'} • Village: {activeUser.village || 'Adoni'}
          </p>
          <p className="text-xs text-emerald-700 font-bold flex items-center justify-center md:justify-start gap-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Encrypted at Rest with AES-256 GCM</span>
          </p>
        </div>

        {/* Big Crisp QR Code Box */}
        <div className="bg-slate-900 p-5 rounded-3xl text-center shadow-lg border border-slate-800 shrink-0">
          <div className="bg-white p-3 rounded-2xl inline-block shadow-xs">
            {/* SVG Crisp QR Code Visualizer */}
            <div className="w-36 h-36 bg-white flex items-center justify-center relative">
              <QrCode className="w-32 h-32 text-slate-950" />
            </div>
          </div>
          <p className="text-[11px] text-slate-300 font-bold mt-2">Scan with ASHA Worker App</p>
          <button
            onClick={() => window.print()}
            className="mt-2 w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print QR Card</span>
          </button>
        </div>
      </div>

      {/* Today's Medicine Tracker Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{t.today_medicine || "Today's Medicine Tracker"}</h3>
              <p className="text-xs text-slate-500">Tap checkbox after taking your prescribed dose</p>
            </div>
          </div>

          <Link to="/patient/diary" className="text-blue-600 text-xs font-bold hover:underline flex items-center gap-1">
            <span>7-Day Log</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 3 Large Touch Checkboxes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Morning Dose */}
          <button
            onClick={() => handleToggleDose('morning')}
            className={`p-5 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
              todayEntry?.morning_taken
                ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:bg-blue-50/40 text-slate-800'
            }`}
          >
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">🌅 Morning (Subah)</span>
              <h4 className="text-sm font-bold mt-1">Telma 40 + Pan 40</h4>
              <p className="text-xs text-slate-500 mt-0.5">After breakfast</p>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
              todayEntry?.morning_taken ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
            }`}>
              {todayEntry?.morning_taken ? '✓' : ''}
            </div>
          </button>

          {/* Afternoon Dose */}
          <button
            onClick={() => handleToggleDose('afternoon')}
            className={`p-5 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
              todayEntry?.afternoon_taken
                ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:bg-blue-50/40 text-slate-800'
            }`}
          >
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">☀️ Noon (Dopahar)</span>
              <h4 className="text-sm font-bold mt-1">Glycomet 500</h4>
              <p className="text-xs text-slate-500 mt-0.5">With lunch</p>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
              todayEntry?.afternoon_taken ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
            }`}>
              {todayEntry?.afternoon_taken ? '✓' : ''}
            </div>
          </button>

          {/* Night Dose */}
          <button
            onClick={() => handleToggleDose('night')}
            className={`p-5 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
              todayEntry?.night_taken
                ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:bg-blue-50/40 text-slate-800'
            }`}
          >
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">🌙 Night (Raat)</span>
              <h4 className="text-sm font-bold mt-1">Atorva 10 + Metformin</h4>
              <p className="text-xs text-slate-500 mt-0.5">Before sleep</p>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
              todayEntry?.night_taken ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
            }`}>
              {todayEntry?.night_taken ? '✓' : ''}
            </div>
          </button>
        </div>
      </div>

      {/* Jan Aushadhi Savings Summary Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <span className="text-xs font-bold text-emerald-700 uppercase">Jan Aushadhi Generic Savings</span>
          <h3 className="text-xl font-bold text-slate-900">
            You Save ₹{savings.totalSavings} Every Month ({savings.percentage}% Less Cost)
          </h3>
          <p className="text-xs text-slate-500">
            Doctor confirmed generic substitutes available at your nearest PMBJP Kendra.
          </p>
        </div>

        <Link
          to="/patient/savings"
          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-all shadow-xs shrink-0"
        >
          View Savings Report
        </Link>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/patient/zero-signal"
          className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-3xl font-bold text-xs flex flex-col items-center justify-center gap-2 shadow-xs transition-all text-center"
        >
          <Radio className="w-6 h-6 text-blue-600" />
          <span>Sync via QR to ASHA</span>
        </Link>
        <Link
          to="/patient/diary"
          className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-3xl font-bold text-xs flex flex-col items-center justify-center gap-2 shadow-xs transition-all text-center"
        >
          <Calendar className="w-6 h-6 text-blue-600" />
          <span>7-Day Adherence Streak</span>
        </Link>
        <Link
          to="/patient/consent"
          className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-3xl font-bold text-xs flex flex-col items-center justify-center gap-2 shadow-xs transition-all text-center"
        >
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
          <span>Data Sharing Consent</span>
        </Link>
        <Link
          to="/patient/sos"
          className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-3xl font-bold text-xs flex flex-col items-center justify-center gap-2 shadow-sm transition-all text-center"
        >
          <PhoneCall className="w-6 h-6 text-white" />
          <span>Emergency 108 SOS</span>
        </Link>
      </div>
    </div>
  );
}
