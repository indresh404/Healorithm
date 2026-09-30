// App/src/components/common/WorkerHeader.tsx
import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { 
  Menu,
  X,
  Activity, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Lock, 
  LogOut, 
  Volume2, 
  UserCheck, 
  Radio, 
  ShieldCheck,
  UserPlus,
  QrCode,
  HeartPulse,
  BookOpen,
  Send
} from 'lucide-react';
import { store, NetworkStatus } from '../../lib/storage';
import { authStore } from '../../auth/authStore';
import { LanguageCode } from '@shared/types';
import { playVoicePrompt } from '@shared/translations';

export default function WorkerHeader() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [snapshot, setSnapshot] = useState(store.getSnapshot());
  const [authState, setAuthState] = useState(authStore.getState());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubStore = store.subscribe(() => setSnapshot({ ...store.getSnapshot() }));
    const unsubAuth = authStore.subscribe(() => setAuthState({ ...authStore.getState() }));
    return () => {
      unsubStore();
      unsubAuth();
    };
  }, []);

  const handleNetworkChange = (status: NetworkStatus) => {
    store.setNetworkStatus(status);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await store.syncOutbox();
    setIsSyncing(false);
  };

  const handleLanguageChange = (lang: LanguageCode) => {
    store.setLanguage(lang);
  };

  const handleVoiceHelp = () => {
    const lang = snapshot.selectedLanguage;
    const text = lang === 'hi' 
      ? `आशा कार्यकर्ता पोर्टल। आप ऑफ़लाइन मरीज़ जोड़ सकते हैं, जाँच दर्ज कर सकते हैं और बिना इंटरनेट डेटा सिंक कर सकते हैं।` 
      : lang === 'mr' 
      ? `आशा सेविका पोर्टल. आपण ऑफलाइन रुग्ण जोडू शकता, तपासणी नोंदवू शकता आणि डेटा सिंक करू शकता.`
      : `Health Worker Portal. You can register patients, record vitals, and sync data offline.`;
    playVoicePrompt(text, lang);
  };

  const handleLogout = () => {
    authStore.logout();
    setDrawerOpen(false);
    navigate('/worker/login');
  };

  const currentLang = snapshot.selectedLanguage;

  const workerNavItems = [
    { to: '/worker', label: 'Triage & Visit Queue', icon: Activity, end: true },
    { to: '/worker/vitals', label: 'Record Vitals & Symptoms', icon: HeartPulse },
    { to: '/worker/scan', label: 'Scan Patient QR Card', icon: QrCode },
    { to: '/worker/new', label: 'Register New Patient', icon: UserPlus },
    { to: '/worker/zero-signal', label: 'Zero-Signal Chunk Receiver', icon: Radio },
    { to: '/worker/sync', label: 'Sync & Outbox Center', icon: Send },
    { to: '/worker/directory', label: 'Offline Emergency Directory', icon: BookOpen },
    { to: '/worker/pin', label: 'PIN Security Lock', icon: Lock },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        {/* Network Status & Quick Signal Toggle Bar */}
        <div className={`px-4 py-1.5 text-xs font-semibold flex flex-wrap items-center justify-between border-b ${
          snapshot.networkStatus === 'online' 
            ? 'bg-slate-900 text-slate-200 border-slate-800' 
            : snapshot.networkStatus === 'syncing'
            ? 'bg-blue-600 text-white border-blue-700'
            : 'bg-amber-600 text-white border-amber-700'
        }`}>
          <div className="flex items-center gap-2">
            {snapshot.networkStatus === 'online' ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : snapshot.networkStatus === 'syncing' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-amber-200 shrink-0" />
            )}
            <span className="truncate">
              {snapshot.networkStatus === 'online'
                ? 'ONLINE • Live Sync Active'
                : snapshot.networkStatus === 'syncing'
                ? 'SYNCING • Encrypted Deltas...'
                : 'OFFLINE (Zero-Signal) • Local DB Active'}
            </span>
            {snapshot.outbox.length > 0 && (
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0">
                {snapshot.outbox.length} Outbox
              </span>
            )}
          </div>

          {/* Signal Simulation Switcher */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleNetworkChange('online')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                snapshot.networkStatus === 'online' ? 'bg-white text-slate-900 shadow-xs' : 'bg-black/20 hover:bg-black/40'
              }`}
            >
              Online
            </button>
            <button
              onClick={() => handleNetworkChange('offline')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                snapshot.networkStatus === 'offline' ? 'bg-white text-slate-900 shadow-xs' : 'bg-black/20 hover:bg-black/40'
              }`}
            >
              Offline
            </button>
            {snapshot.outbox.length > 0 && (
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="ml-1 px-2.5 py-0.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-[10px] font-bold flex items-center gap-1 shadow-xs"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Health Worker App Bar */}
        <div className="max-w-7xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
          {/* Hamburger Menu & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 text-slate-700 hover:bg-slate-100 rounded-2xl transition-colors border border-slate-200/80"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link to="/worker" className="flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900">Healorithm</span>
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-md uppercase">
                    ASHA Field
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                  {authState.userName || 'Anitha K.'} • {authState.village || 'Alur Village'}
                </p>
              </div>
            </Link>
          </div>

          {/* Right Tools (Language, Voice Guide, Lock, Logout) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Language Selector */}
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

            {/* Voice Prompt Button */}
            <button
              onClick={handleVoiceHelp}
              className="p-2 sm:px-2.5 sm:py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-emerald-200"
              title="Voice Guidance"
            >
              <Volume2 className="w-4 h-4 text-emerald-600" />
              <span className="hidden md:inline">Voice Help</span>
            </button>

            {/* Lock / PIN Screen Link */}
            <Link
              to="/worker/pin"
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
              title="Lock Vault"
            >
              <Lock className="w-4 h-4" />
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-slate-200"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Slide-in Hamburger Drawer for Field Worker */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          <div
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300"
          />

          <div className="fixed inset-y-0 left-0 max-w-xs sm:max-w-sm w-full bg-slate-900 text-slate-100 flex flex-col justify-between shadow-2xl z-50 animate-in slide-in-from-left duration-300">
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/20">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-white leading-tight">
                      {authState.userName || 'Anitha K.'}
                    </h2>
                    <p className="text-[11px] font-mono text-emerald-400">
                      ASHA Worker • {authState.village || 'Alur Village'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="p-3 space-y-1 overflow-y-auto flex-1 scrollbar-thin">
                {workerNavItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setDrawerOpen(false)}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all
                      ${isActive 
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' 
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'}
                    `}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="p-4 border-t border-slate-800 shrink-0">
              <button
                onClick={handleLogout}
                className="w-full py-2.5 bg-slate-800 hover:bg-red-500/20 hover:text-red-300 text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-slate-700"
              >
                <LogOut className="w-4 h-4" />
                <span>Switch Portal / Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
