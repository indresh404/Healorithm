// src/pages/AboutPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/common/Header';
import { 
  Activity, 
  ShieldCheck, 
  WifiOff, 
  Bot, 
  Pill, 
  Users, 
  User, 
  Stethoscope, 
  Radio, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Lock,
  Layers,
  Heart
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      <main className="max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-10 space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-4 py-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-200">
            <Activity className="w-4 h-4" />
            <span>Healthcare that keeps working offline, and remembers when it reconnects</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight max-w-3xl mx-auto">
            Healorithm
          </h1>
          <p className="text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            An offline-first, encrypted, AI-assisted Progressive Web App designed specifically for rural telemedicine and primary care triage.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link
              to="/worker"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-all shadow-sm"
            >
              Launch Health Worker App (Green)
            </Link>
            <Link
              to="/patient"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all shadow-sm"
            >
              Launch Patient QR Card (Blue)
            </Link>
            <Link
              to="/admin"
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all shadow-sm"
            >
              Launch Doctor / Admin Portal
            </Link>
          </div>
        </section>

        {/* 3 Guiding Principles */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <WifiOff className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">1. Offline is the Default</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every important function (recording, risk scoring, emergency detection, referral ranking) runs on the device. The internet is only needed to deliver data, never to do the work.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">2. Prioritize, Never Diagnose</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Healorithm flags risk, explains contributing factors, and helps the right patient reach the right doctor sooner. The human clinician always makes the diagnosis.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">3. Explainable by Design</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every risk score displays the clinical factors behind it, so a worker or physician can see why, not just a black-box number.
            </p>
          </div>
        </section>

        {/* The End-to-End Workflow Flowchart */}
        <section className="bg-slate-900 text-white p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
          <div>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">End-to-End Architecture</span>
            <h3 className="text-xl font-bold text-white mt-1">The 8-Step Telemedicine Flow</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700 space-y-1">
              <span className="text-emerald-400 font-bold uppercase text-[10px]">Step 1 • Field</span>
              <h4 className="font-bold text-white">Record Offline</h4>
              <p className="text-slate-400">Worker scans QR, inputs vitals and symptoms in ~2s.</p>
            </div>

            <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700 space-y-1">
              <span className="text-emerald-400 font-bold uppercase text-[10px]">Step 2 • Security</span>
              <h4 className="font-bold text-white">Encrypted at Rest</h4>
              <p className="text-slate-400">AES-GCM encryption with worker PIN-derived key.</p>
            </div>

            <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700 space-y-1">
              <span className="text-emerald-400 font-bold uppercase text-[10px]">Step 3 • AI Core</span>
              <h4 className="font-bold text-white">Deterministic Risk</h4>
              <p className="text-slate-400">Fixed emergency rules + 0-100 explainable score.</p>
            </div>

            <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700 space-y-1">
              <span className="text-emerald-400 font-bold uppercase text-[10px]">Step 4 • Triage</span>
              <h4 className="font-bold text-white">Referral Priority</h4>
              <p className="text-slate-400">Ranked queue (Emergency, Urgent, Routine).</p>
            </div>

            <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700 space-y-1">
              <span className="text-blue-400 font-bold uppercase text-[10px]">Step 5 • Economy</span>
              <h4 className="font-bold text-white">Jan Aushadhi Preview</h4>
              <p className="text-slate-400">Offline savings calculation and scheme match.</p>
            </div>

            <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700 space-y-1">
              <span className="text-blue-400 font-bold uppercase text-[10px]">Step 6 • Network</span>
              <h4 className="font-bold text-white">Delta Auto-Sync</h4>
              <p className="text-slate-400">Compressed deltas sync on 30s connection.</p>
            </div>

            <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700 space-y-1">
              <span className="text-blue-400 font-bold uppercase text-[10px]">Step 7 • Agent</span>
              <h4 className="font-bold text-white">Care Coordination</h4>
              <p className="text-slate-400">Agent flags missing data and prepares handoff.</p>
            </div>

            <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700 space-y-1">
              <span className="text-blue-400 font-bold uppercase text-[10px]">Step 8 • Doctor</span>
              <h4 className="font-bold text-white">Confirmed Report</h4>
              <p className="text-slate-400">Doctor approves generic lines; syncs to patient.</p>
            </div>
          </div>
        </section>

        {/* Care Coordination Agent Feature Highlight */}
        <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Care Coordination Agent</h3>
              <p className="text-xs text-slate-500">Autonomous workflow orchestration, not a chat window</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            The agent runs server-side on every incoming sync. It observes new records, checks for missing baseline data (e.g. missing blood pressure on cardiac patients), creates follow-up tasks for the worker's next home visit, escalates critical cases, and tracks whether clinicians have acted.
          </p>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-mono text-slate-700">
            Agent Loop: Observe → Analyze → Recommend → Ask/Act → Escalate → Record
          </div>
        </section>
      </main>
    </div>
  );
}
