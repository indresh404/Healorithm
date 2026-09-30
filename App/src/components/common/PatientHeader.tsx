// App/src/components/common/PatientHeader.tsx
import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  X, 
  User, 
  QrCode, 
  Pill, 
  Calendar, 
  Radio, 
  ShieldCheck, 
  PhoneCall, 
  Volume2, 
  LogOut, 
  Lock, 
  ClipboardCheck, 
  Activity,
  Sparkles,
  Heart
} from 'lucide-react';
import { store } from '../../lib/storage';
import { authStore } from '../../auth/authStore';
import { lockManager } from '../../crypto/lockManager';
import { LanguageCode } from '@shared/types';
import { playVoicePrompt, TRANSLATIONS } from '@shared/translations';

interface PatientHeaderProps {
  onLockVault?: () => void;
}

export default function PatientHeader({ onLockVault }: PatientHeaderProps) {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
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
      ? `नमस्ते ${activeUser.name} जी। यह आपका डिजिटल स्वास्थ्य कार्ड है। यहाँ आप अपनी आज की दवाइयाँ, रोज़ाना जाँच और बचत देख सकते हैं।`
      : currentLang === 'mr'
      ? `नमस्कार ${activeUser.name} जी. हे आपले आरोग्य कार्ड आहे. येथे आपण आपली औषधे आणि दैनिक तपासणी पाहू शकता.`
      : `Hello ${activeUser.name}. This is your simple health card. Track your daily medicines and health check-in here.`;
    playVoicePrompt(text, currentLang);
  };

  const handleLockVault = () => {
    lockManager.lock();
    setDrawerOpen(false);
    if (onLockVault) onLockVault();
  };

  const handleSwitchActivePatient = (id: string, name: string, phone: string) => {
    authStore.loginPatient(phone, '1234', name, id);
    store.setActivePatient(id);
    setDrawerOpen(false);
    navigate('/patient');
  };

  const handleLogout = () => {
    authStore.logout();
    setDrawerOpen(false);
    navigate('/patient/login');
  };

  // Ultra-simple navigation items for rural users
  const navMenuItems = [
    { 
      to: '/patient', 
      label: currentLang === 'hi' ? 'मेरा स्वास्थ्य कार्ड' : currentLang === 'mr' ? 'माझे आरोग्य कार्ड' : 'My Health Card',
      sub: currentLang === 'hi' ? 'डॉक्टर को क्यूआर दिखाएं' : 'Show QR to Doctor / ASHA',
      icon: QrCode, 
      end: true,
      bg: 'bg-blue-50 text-blue-700'
    },
    { 
      to: '/patient/diary', 
      label: currentLang === 'hi' ? 'आज की दवाइयाँ' : currentLang === 'mr' ? 'आजची औषधे' : 'Today\'s Medicines',
      sub: currentLang === 'hi' ? 'सुबह, दोपहर, रात की गोली' : 'Morning, Noon, Night Doses',
      icon: Pill, 
      bg: 'bg-emerald-50 text-emerald-700'
    },
    { 
      to: '/patient/checkin', 
      label: currentLang === 'hi' ? 'रोज़ाना स्वास्थ्य जाँच' : currentLang === 'mr' ? 'दैनिक आरोग्य तपासणी' : 'Daily Health Check-in',
      sub: currentLang === 'hi' ? 'कैसा महसूस हो रहा है?' : 'How are you feeling today?',
      icon: ClipboardCheck, 
      bg: 'bg-indigo-50 text-indigo-700'
    },
    { 
      to: '/patient/savings', 
      label: currentLang === 'hi' ? 'दवाई पर बचत' : currentLang === 'mr' ? 'औषधांवर बचत' : 'Generic Medicine Savings',
      sub: currentLang === 'hi' ? 'जन औषधि से सस्ती दवाई' : 'Jan Aushadhi Low-cost Medicines',
      icon: Sparkles, 
      bg: 'bg-amber-50 text-amber-700'
    },
    { 
      to: '/patient/zero-signal', 
      label: currentLang === 'hi' ? 'आशा दीदी को भेजें' : currentLang === 'mr' ? 'आशा सेविकेला पाठवा' : 'Share with ASHA Worker',
      sub: currentLang === 'hi' ? 'बिना इंटरनेट क्यूआर ट्रांसफर' : 'Zero-Internet QR Transfer',
      icon: Radio, 
      bg: 'bg-purple-50 text-purple-700'
    },
    { 
      to: '/patient/sos', 
      label: currentLang === 'hi' ? 'आपातकालीन 108 मदद' : currentLang === 'mr' ? 'तातडीची १०८ मदत' : 'Emergency 108 SOS',
      sub: currentLang === 'hi' ? 'एम्बुलेंस / आशा को कॉल' : 'Call Ambulance / ASHA',
      icon: PhoneCall, 
      bg: 'bg-red-50 text-red-700',
      isSOS: true
    },
  ];

  return (
    <>
      {/* Ultra-Clean Rural Health Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 h-16 sm:h-18 flex items-center justify-between">
          {/* Hamburger Menu & Patient Identity */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl transition-colors active:scale-95"
              aria-label="Menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <Link to="/patient" className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0 font-bold">
                <User className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight truncate">
                  {activeUser.name}
                </h1>
                <p className="text-xs text-slate-500 font-medium truncate">
                  {activeUser.village || 'Adoni Village'} • {activeUser.age}y
                </p>
              </div>
            </Link>
          </div>

          {/* Right: Language Pill, Audio Help, SOS */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
              <button
                onClick={() => handleLanguageChange('en')}
                className={`px-2 py-1 rounded-xl transition-all ${
                  currentLang === 'en' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => handleLanguageChange('hi')}
                className={`px-2 py-1 rounded-xl transition-all ${
                  currentLang === 'hi' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500'
                }`}
              >
                हिन्दी
              </button>
              <button
                onClick={() => handleLanguageChange('mr')}
                className={`px-2 py-1 rounded-xl transition-all ${
                  currentLang === 'mr' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500'
                }`}
              >
                मराठी
              </button>
            </div>

            {/* Audio Voice Guidance Button */}
            <button
              onClick={handleVoiceHelp}
              className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-2xl border border-blue-200 transition-colors flex items-center gap-1.5 active:scale-95"
              title="Listen to audio instructions"
            >
              <Volume2 className="w-5 h-5 text-blue-600" />
              <span className="hidden sm:inline text-xs font-extrabold">
                {currentLang === 'hi' ? 'सुनो' : currentLang === 'mr' ? 'ऐका' : 'Audio'}
              </span>
            </button>

            {/* Emergency SOS */}
            <Link
              to="/patient/sos"
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-red-600/20 active:scale-95 transition-transform"
            >
              <PhoneCall className="w-4 h-4" />
              <span>SOS</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Slide-in Hamburger Menu (Simple, High-Contrast & Big Touch Targets) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          <div
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300"
          />

          <div className="fixed inset-y-0 left-0 max-w-xs sm:max-w-sm w-full bg-white text-slate-900 flex flex-col justify-between shadow-2xl z-50 animate-in slide-in-from-left duration-300">
            {/* Drawer Header */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white font-bold text-lg">
                    {activeUser.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold leading-tight">
                      {activeUser.name}
                    </h2>
                    <p className="text-xs text-blue-100 font-medium">
                      {activeUser.village || 'Adoni'} • {activeUser.gender}, {activeUser.age}y
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 text-white/80 hover:text-white rounded-xl bg-white/10"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Menu List */}
              <nav className="p-4 space-y-2 overflow-y-auto flex-1 scrollbar-thin">
                {navMenuItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setDrawerOpen(false)}
                    className={({ isActive }) => `
                      flex items-center gap-3.5 p-3.5 rounded-2xl transition-all border
                      ${item.isSOS 
                        ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100 font-extrabold'
                        : isActive 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20 font-bold' 
                        : 'bg-slate-50 border-slate-100 text-slate-800 hover:bg-slate-100 font-semibold'}
                    `}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      item.isSOS ? 'bg-red-100 text-red-600' : item.bg
                    }`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold truncate">{item.label}</div>
                      <div className="text-[11px] opacity-75 truncate">{item.sub}</div>
                    </div>
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* Footer: Sign Out */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0">
              <button
                onClick={handleLogout}
                className="w-full py-3 bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-slate-200 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{currentLang === 'hi' ? 'बाहर निकलें (लॉग आउट)' : 'Log Out / Switch Portal'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
