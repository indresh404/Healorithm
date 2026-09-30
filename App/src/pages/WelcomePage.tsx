// App/src/pages/WelcomePage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  Users, 
  User, 
  ShieldCheck, 
  WifiOff, 
  ArrowRight, 
  Info, 
  Smartphone,
  Download
} from 'lucide-react';
import PwaInstallPrompt from '../components/common/PwaInstallPrompt';

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between font-sans">
      {/* Top Bar */}
      <header className="px-6 py-4 border-b border-slate-800 flex items-center justify-between max-w-5xl w-full mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-slate-900 font-extrabold shadow-lg shadow-emerald-500/20">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight">Healorithm</h1>
            <p className="text-[11px] text-slate-400 font-medium">Offline-First Rural Telemedicine</p>
          </div>
        </div>

        <Link
          to="/about"
          className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <Info className="w-4 h-4" />
          <span>About</span>
        </Link>
      </header>

      {/* Main Hero & Portal Selection Cards */}
      <main className="max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex-1 flex flex-col justify-center space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <WifiOff className="w-3.5 h-3.5" />
            <span>100% Offline-First • AES-256 GCM Encrypted</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Select Your Healthcare Portal
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
            Healthcare that keeps working without internet signal and synchronizes automatically on reconnection.
          </p>
        </div>

        {/* Portal Selection Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto w-full">
          {/* Health Worker Card */}
          <Link
            to="/worker/login"
            className="group p-6 sm:p-8 bg-slate-800/90 hover:bg-slate-800 rounded-3xl border border-slate-700 hover:border-emerald-500 transition-all flex flex-col justify-between shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                  ASHA / Health Worker
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Record patient vitals, screen symptoms with 2D anatomical map, compute deterministic risk, and manage visit queue offline.
                </p>
              </div>
            </div>

            <div className="pt-6 flex items-center justify-between text-xs font-bold text-emerald-400">
              <span>Open Worker Portal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Patient Health Card */}
          <Link
            to="/patient/login"
            className="group p-6 sm:p-8 bg-slate-800/90 hover:bg-slate-800 rounded-3xl border border-slate-700 hover:border-blue-500 transition-all flex flex-col justify-between shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <User className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                  Patient Health Card
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Access digital QR health card, track daily medicine doses, view Jan Aushadhi generic savings, and trigger SOS.
                </p>
              </div>
            </div>

            <div className="pt-6 flex items-center justify-between text-xs font-bold text-blue-400">
              <span>Open Patient Portal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-slate-800 text-center text-xs text-slate-500">
        Healorithm Rural Healthcare Platform • Built for Zero-Signal Telemedicine
      </footer>

      <PwaInstallPrompt />
    </div>
  );
}
