// src/pages/worker/WorkerLayout.tsx
import React, { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import Header from '../../components/common/Header';
import { 
  Users, 
  QrCode, 
  UserPlus, 
  Activity, 
  Radio, 
  PhoneCall, 
  Volume2, 
  Lock, 
  Unlock,
  Menu,
  X,
  CheckCircle2
} from 'lucide-react';
import { store } from '../../lib/storage';
import { playVoicePrompt } from '@shared/translations';

export default function WorkerLayout() {
  const [snapshot, setSnapshot] = useState(store.getSnapshot());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tLang = snapshot.selectedLanguage;

  const handleAudioHelp = () => {
    const text = tLang === 'hi' 
      ? "आशा कार्यकर्ता ऐप में आपका स्वागत है। आप बिना इंटरनेट मरीज़ की जाँच कर सकते हैं।" 
      : tLang === 'mr' 
      ? "आशा सेविका ॲप मध्ये आपले स्वागत आहे. आपण इंटरनेट शिवाय रुग्णांची तपासणी करू शकता."
      : "Welcome to ASHA Health Worker App. You can record patients and evaluate risk fully offline.";
    playVoicePrompt(text, tLang);
  };

  const navItems = [
    { to: '/worker', label: 'Visit Queue', icon: Users, end: true },
    { to: '/worker/scan', label: 'Scan QR', icon: QrCode },
    { to: '/worker/new', label: 'New Patient', icon: UserPlus },
    { to: '/worker/vitals', label: 'Record Vitals', icon: Activity },
    { to: '/worker/zero-signal', label: 'Zero-Signal Handoff', icon: Radio },
    { to: '/worker/directory', label: 'Emergency Directory', icon: PhoneCall },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <Header />

      {/* Health Worker Specific Green Top Banner */}
      <div className="bg-emerald-700 text-white px-4 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-800 flex items-center justify-center font-bold text-white shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-tight">ASHA Field Worker Portal</h1>
                <span className="bg-emerald-900 px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-200">
                  {snapshot.workerSession.workerName} • {snapshot.workerSession.assignedVillage}
                </span>
              </div>
              <p className="text-[11px] text-emerald-100 font-medium">AES-256 GCM Encrypted Local Store Active</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAudioHelp}
              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-emerald-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-emerald-600"
              title="Listen to audio instructions in selected language"
            >
              <Volume2 className="w-4 h-4 text-emerald-300 animate-pulse" />
              <span className="hidden sm:inline">Voice Guide</span>
            </button>

            <Link
              to="/worker/pin"
              className="p-1.5 bg-emerald-800 hover:bg-emerald-900 text-emerald-200 rounded-xl transition-colors border border-emerald-600"
              title="PIN Lock Settings"
            >
              <Lock className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Subnav Menu Tabs (Solid Green Palette, NO Gradients) */}
      <div className="bg-white border-b border-slate-200 sticky top-[95px] z-[90]">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-none">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
