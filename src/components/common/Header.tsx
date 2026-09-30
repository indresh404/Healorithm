// src/components/common/Header.tsx
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Globe, 
  ShieldCheck, 
  User, 
  Users, 
  Stethoscope, 
  Sparkles,
  Info,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { store, NetworkStatus } from '../../lib/storage';
import { LanguageCode } from '../../types';
import { TRANSLATIONS } from '../../lib/translations';

export default function Header() {
  const location = useLocation();
  const [snapshot, setSnapshot] = useState(store.getSnapshot());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    return store.subscribe(() => {
      setSnapshot({ ...store.getSnapshot() });
    });
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

  const currentLang = snapshot.selectedLanguage;
  const t = TRANSLATIONS[currentLang];

  // Determine current portal
  const isAdmin = location.pathname.startsWith('/admin') || location.pathname === '/' || location.pathname.startsWith('/map') || location.pathname.startsWith('/outbreaks') || location.pathname.startsWith('/trends') || location.pathname.startsWith('/resources') || location.pathname.startsWith('/workers') || location.pathname.startsWith('/users');
  const isWorker = location.pathname.startsWith('/worker');
  const isPatient = location.pathname.startsWith('/patient');
  const isAbout = location.pathname.startsWith('/about');

  return (
    <header className="sticky top-0 z-[100] bg-white border-b border-slate-200">
      {/* Network Status & Quick Demo Control Banner */}
      <div className={`px-4 py-1.5 text-xs font-semibold flex flex-wrap items-center justify-between border-b ${
        snapshot.networkStatus === 'online' 
          ? 'bg-slate-900 text-slate-200 border-slate-800' 
          : snapshot.networkStatus === 'syncing'
          ? 'bg-blue-600 text-white border-blue-700'
          : 'bg-amber-600 text-white border-amber-700'
      }`}>
        <div className="flex items-center gap-2">
          {snapshot.networkStatus === 'online' ? (
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          ) : snapshot.networkStatus === 'syncing' ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-amber-200" />
          )}
          <span>
            {snapshot.networkStatus === 'online'
              ? 'ONLINE • Live Postgres Realtime Sync Connected'
              : snapshot.networkStatus === 'syncing'
              ? 'SYNCING • Sending Encrypted Deltas & Outbox Queue...'
              : 'OFFLINE (Zero-Signal) • Running on Local Encrypted IndexedDB'}
          </span>
          {snapshot.outbox.length > 0 && (
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
              {snapshot.outbox.length} Pending Outbox
            </span>
          )}
        </div>

        {/* Demo Network Switcher */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] opacity-75 hidden sm:inline">Simulate Signal:</span>
          <button
            onClick={() => handleNetworkChange('online')}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
              snapshot.networkStatus === 'online' ? 'bg-white text-slate-900 shadow-xs' : 'bg-black/20 hover:bg-black/40'
            }`}
          >
            Online
          </button>
          <button
            onClick={() => handleNetworkChange('2g_poor')}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
              snapshot.networkStatus === '2g_poor' ? 'bg-white text-slate-900 shadow-xs' : 'bg-black/20 hover:bg-black/40'
            }`}
          >
            2G Poor
          </button>
          <button
            onClick={() => handleNetworkChange('offline')}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
              snapshot.networkStatus === 'offline' ? 'bg-white text-slate-900 shadow-xs' : 'bg-black/20 hover:bg-black/40'
            }`}
          >
            Offline 0-Signal
          </button>
          {snapshot.outbox.length > 0 && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="ml-2 px-2.5 py-0.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-[11px] font-bold flex items-center gap-1 shadow-xs"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync Now</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Top Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-md shadow-blue-500/20 text-white">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-slate-900">Healorithm</span>
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-extrabold uppercase rounded-md tracking-wider">v2.0 PWA</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Rural Telemedicine & Priority Care</p>
          </div>
        </div>

        {/* 3 Portal Navigation Switcher */}
        <nav className="hidden md:flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <Link
            to="/admin"
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              isAdmin && !isAbout
                ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Doctor / Super Admin</span>
          </Link>

          <Link
            to="/worker"
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              isWorker
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Health Worker (Green)</span>
          </Link>

          <Link
            to="/patient"
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              isPatient
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Patient App (Blue)</span>
          </Link>

          <Link
            to="/about"
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              isAbout
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>About Healorithm</span>
          </Link>
        </nav>

        {/* Right Tools (Language Switcher & Quick Links) */}
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
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

          <Link
            to="/about"
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors md:hidden"
            title="About Healorithm"
          >
            <Info className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Mobile Portal Navigation Switcher */}
      <div className="flex md:hidden items-center justify-around border-t border-slate-100 px-2 py-1.5 bg-slate-50 text-xs font-bold">
        <Link 
          to="/admin" 
          className={`px-3 py-1.5 rounded-lg ${isAdmin && !isAbout ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'}`}
        >
          Admin
        </Link>
        <Link 
          to="/worker" 
          className={`px-3 py-1.5 rounded-lg ${isWorker ? 'bg-emerald-600 text-white' : 'text-slate-600'}`}
        >
          Worker (ASHA)
        </Link>
        <Link 
          to="/patient" 
          className={`px-3 py-1.5 rounded-lg ${isPatient ? 'bg-blue-600 text-white' : 'text-slate-600'}`}
        >
          Patient
        </Link>
        <Link 
          to="/about" 
          className={`px-3 py-1.5 rounded-lg ${isAbout ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
        >
          About
        </Link>
      </div>
    </header>
  );
}
