// App/src/components/common/WorkerHeader.tsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Lock, 
  LogOut, 
  Volume2, 
  UserCheck, 
  Radio, 
  ShieldCheck 
} from 'lucide-react';
import { store, NetworkStatus } from '../../lib/storage';
import { authStore } from '../../auth/authStore';
import { LanguageCode } from '@shared/types';
import { playVoicePrompt } from '@shared/translations';

export default function WorkerHeader() {
  const navigate = useNavigate();
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
    navigate('/worker/login');
  };

  const currentLang = snapshot.selectedLanguage;

  return (
    <header className="sticky top-0 z-[100] bg-white border-b border-slate-200 shadow-xs">
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
              ? 'ONLINE • Real-time Sync Active'
              : snapshot.networkStatus === 'syncing'
              ? 'SYNCING • Transferring Encrypted Deltas...'
              : 'OFFLINE (Zero-Signal) • Local Encrypted DB Active'}
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
        {/* Brand & Worker Info */}
        <div className="flex items-center gap-3">
          <Link to="/worker" className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900">Healorithm</span>
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-md uppercase">
                  ASHA Field
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                {authState.userName || 'Anitha K.'} • {authState.village || 'Alur'}
              </p>
            </div>
          </Link>
        </div>

        {/* Right Tools (Language, Voice Guide, Lock, Logout) */}
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="flex items-center bg-slate-100 p-0.5 sm:p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => handleLanguageChange('en')}
              className={`px-2 py-1 rounded-lg transition-all ${
                currentLang === 'en' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => handleLanguageChange('hi')}
              className={`px-2 py-1 rounded-lg transition-all ${
                currentLang === 'hi' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => handleLanguageChange('mr')}
              className={`px-2 py-1 rounded-lg transition-all ${
                currentLang === 'mr' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              मराठी
            </button>
          </div>

          {/* Voice Prompt Button */}
          <button
            onClick={handleVoiceHelp}
            className="p-2 sm:px-3 sm:py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-emerald-200"
            title="Listen to audio instructions"
          >
            <Volume2 className="w-4 h-4 text-emerald-600" />
            <span className="hidden md:inline">Voice Help</span>
          </button>

          {/* Lock / PIN Screen Link */}
          <Link
            to="/worker/pin"
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
            title="Lock App"
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
  );
}
