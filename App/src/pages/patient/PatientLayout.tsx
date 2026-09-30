// src/pages/patient/PatientLayout.tsx
import React, { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import Header from '../../components/common/Header';
import { 
  User, 
  QrCode, 
  Calendar, 
  Pill, 
  Radio, 
  ShieldCheck, 
  PhoneCall, 
  Volume2,
  AlertCircle
} from 'lucide-react';
import { store } from '../../lib/storage';
import { playVoicePrompt, TRANSLATIONS } from '@shared/translations';

export default function PatientLayout() {
  const [snapshot] = useState(store.getSnapshot());
  const tLang = snapshot.selectedLanguage;
  const t = TRANSLATIONS[tLang];

  const activePatient = snapshot.users.find(u => u.id === snapshot.activePatientId) || snapshot.users[0];

  const handleAudioHelp = () => {
    const text = tLang === 'hi'
      ? `नमस्ते ${activePatient.name}, यह आपका स्वास्थ्य कार्ड है। यहाँ आप अपनी आज की दवाइयाँ देख सकते हैं और बचत रिपोर्ट देख सकते हैं।`
      : tLang === 'mr'
      ? `नमस्कार ${activePatient.name}, हे आपले आरोग्य कार्ड आहे. येथे आपण आपली औषधे आणि बचत पाहू शकता.`
      : `Hello ${activePatient.name}, this is your digital QR Health Card. Check your medicine doses and Jan Aushadhi savings here.`;
    playVoicePrompt(text, tLang);
  };

  const navItems = [
    { to: '/patient', label: 'My Health Card', icon: QrCode, end: true },
    { to: '/patient/diary', label: 'Medicine Diary', icon: Calendar },
    { to: '/patient/savings', label: 'Jan Aushadhi Savings', icon: Pill },
    { to: '/patient/zero-signal', label: 'Transfer to ASHA', icon: Radio },
    { to: '/patient/consent', label: 'Consent Manager', icon: ShieldCheck },
    { to: '/patient/sos', label: 'Emergency SOS', icon: PhoneCall },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <Header />

      {/* Patient Solid Blue Top Banner */}
      <div className="bg-blue-600 text-white px-4 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-700 flex items-center justify-center font-bold text-white shadow-xs">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight">{activePatient.name}</h1>
                <span className="bg-blue-800 px-2 py-0.5 rounded-full text-[10px] font-bold text-blue-100">
                  {activePatient.village || 'Adoni'}
                </span>
              </div>
              <p className="text-xs text-blue-100 font-medium">Digital QR Health Card • Offline Protected</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAudioHelp}
              className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-blue-500 shadow-xs"
              title="Voice guidance in selected language"
            >
              <Volume2 className="w-4 h-4 text-blue-200 animate-pulse" />
              <span>{t.listen_audio || 'Listen in Audio'}</span>
            </button>

            <Link
              to="/patient/sos"
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-extrabold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <span>SOS</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Big Touch Navigation Tabs (Solid Blue Theme, NO Gradients) */}
      <div className="bg-white border-b border-slate-200 sticky top-[95px] z-[90]">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center gap-2 overflow-x-auto py-2.5 scrollbar-none">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
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

      {/* Main Patient Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
