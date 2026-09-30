// App/src/pages/AboutPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  ShieldCheck, 
  WifiOff, 
  Bot, 
  Pill, 
  Users, 
  User, 
  Radio, 
  CheckCircle2, 
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Lock,
  Layers,
  Heart
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md shadow-emerald-600/20">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900">Healorithm</span>
              <p className="text-[11px] text-slate-500 font-medium">Rural Telemedicine Platform</p>
            </div>
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Portals</span>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-10 space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-4 py-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
            <Activity className="w-4 h-4" />
            <span>Healthcare that keeps working offline, and remembers when it reconnects</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight max-w-3xl mx-auto">
            Healorithm
          </h1>
          <p className="text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            An offline-first, encrypted Progressive Web App designed specifically for rural telemedicine and primary care triage.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link
              to="/worker/login"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              <span>Open Health Worker Portal</span>
            </Link>
            <Link
              to="/patient/login"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              <span>Open Patient Health Card</span>
            </Link>
          </div>
        </section>

        {/* 3 Guiding Principles */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <WifiOff className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Zero-Signal Resilience</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every critical action — patient registration, vitals recording, risk scoring, and animated QR data exchange — functions entirely on-device without internet access.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Deterministic Safety</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              No black-box emergency guessing. Fixed clinical safety rules immediately flag hypertensive crisis, severe hypoxemia, or cardiac events on the spot.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Pill className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Jan Aushadhi Generics</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Automatic generic equivalence calculation under PMBJP schemes, reducing rural out-of-pocket medication costs by up to 85%.
            </p>
          </div>
        </section>
      </main>

      <footer className="mt-auto py-6 border-t border-slate-200 text-center text-xs text-slate-500 bg-white">
        Healorithm • Rural Telemedicine & Priority Care PWA
      </footer>
    </div>
  );
}
