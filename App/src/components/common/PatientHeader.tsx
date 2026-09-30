// App/src/components/common/PatientHeader.tsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Volume2, 
  PhoneCall, 
  LogOut, 
  ShieldCheck, 
  QrCode, 
  Activity 
} from 'lucide-react';
import { store } from '../../lib/storage';
import { authStore } from '../../auth/authStore';
import { LanguageCode } from '@shared/types';
import { playVoicePrompt, TRANSLATIONS } from '@shared/translations';

export default function PatientHeader() {
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState(store.getSnapshot());
  const [authState, setAuthState] = useState(authStore.getState());

  useEffect(() => {
    const unsubStore = store.subscribe(() => setSnapshot({ ...store.getSnapshot() }));
    const unsubAuth = authStore.subscribe(() => setAuthState({ ...authStore.getState() }));
    return () => {
      unsubStore();
      unsubAuth();
    };
  }, []);

  const activeUser = snapshot.users.find(u => u.id === (authState.userId || snapshot.activePatientId)) || snapshot.users[0];
  const currentLang = snapshot.selectedLanguage;
  const t = TRANSLATIONS[currentLang];

  const handleLanguageChange = (lang: LanguageCode) => {
    store.setLanguage(lang);
  };

  const handleVoiceHelp = () => {
    const text = currentLang === 'hi'
      ? `नमस्ते ${activeUser.name}, यह आपका स्वास्थ्य कार्ड है। यहाँ आप अपनी दैनिक दवाइयाँ, जन औषधि बचत और आपातकालीन मदद देख सकते हैं।`
      : currentLang === 'mr'
      ? `नमस्कार ${activeUser.name}, हे आपले आरोग्य कार्ड आहे. येथे आपण आपली औषधे आणि बचत पाहू शकता.`
      : `Hello ${activeUser.name}, welcome to your digital health card. Track your daily medicines and generic savings here.`;
    playVoicePrompt(text, currentLang);
  };

  const handleLogout = () => {
    authStore.logout();
    navigate('/patient/login');
  };

  return (
    <header className="sticky top-0 z-[100] bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-5xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
        {/* Patient Brand & Name */}
        <Link to="/patient" className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-600/20 shrink-0">
            <User className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 truncate">
                {activeUser.name}
              </span>
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-extrabold rounded-md uppercase shrink-0">
                Health Card
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">
              {activeUser.village || 'Adoni'} • HH: {activeUser.household_id || 'HH-042'}
            </p>
          </div>
        </Link>

        {/* Right Tools (Language, Voice, SOS, Logout) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Language Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 sm:p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => handleLanguageChange('en')}
              className={`px-1.5 sm:px-2 py-1 rounded-lg transition-all ${
                currentLang === 'en' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => handleLanguageChange('hi')}
              className={`px-1.5 sm:px-2 py-1 rounded-lg transition-all ${
                currentLang === 'hi' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => handleLanguageChange('mr')}
              className={`px-1.5 sm:px-2 py-1 rounded-lg transition-all ${
                currentLang === 'mr' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              मराठी
            </button>
          </div>

          {/* Voice Prompt */}
          <button
            onClick={handleVoiceHelp}
            className="p-2 sm:px-3 sm:py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-blue-200"
            title="Listen in Audio"
          >
            <Volume2 className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">Voice</span>
          </button>

          {/* Emergency SOS Quick Button */}
          <Link
            to="/patient/sos"
            className="px-2.5 sm:px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1 shadow-md shadow-red-600/20 transition-transform active:scale-95"
            title="Emergency SOS"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>SOS</span>
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
