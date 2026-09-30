// src/pages/patient/PatientAdherenceDiary.tsx
import React, { useState, useEffect } from 'react';
import { store } from '../../lib/storage';
import { Calendar, CheckCircle2, Flame, AlertCircle, Plus, Sparkles } from 'lucide-react';

export default function PatientAdherenceDiary() {
  const [snapshot, setSnapshot] = useState(store.getSnapshot());
  const activeUser = snapshot.users.find(u => u.id === snapshot.activePatientId) || snapshot.users[0];
  const diary = snapshot.patientAdherenceLogs[activeUser.id] || [];

  useEffect(() => {
    return store.subscribe(() => {
      setSnapshot({ ...store.getSnapshot() });
    });
  }, []);

  const streakDays = diary.filter(d => d.morning_taken && d.afternoon_taken && d.night_taken).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">7-Day Medicine Adherence Diary</h2>
          <p className="text-xs text-slate-500">Stored on your phone until synced with your assigned ASHA worker</p>
        </div>

        <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-2xl border border-amber-200">
          <Flame className="w-5 h-5 text-amber-600 fill-amber-500 animate-bounce" />
          <span className="text-xs font-bold text-amber-900">{streakDays} Days Perfect Streak</span>
        </div>
      </div>

      {/* 7-Day Adherence Grid */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Past 7 Days Compliance Log</h3>

        <div className="space-y-3">
          {diary.map((entry) => (
            <div 
              key={entry.date} 
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <span className="text-xs font-bold text-slate-900">{new Date(entry.date).toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                {entry.symptoms_reported && entry.symptoms_reported.length > 0 && (
                  <p className="text-[11px] text-amber-700 mt-0.5">Reported: {entry.symptoms_reported.join(', ')}</p>
                )}
              </div>

              {/* 3 Dose Status Indicators */}
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className={`px-3 py-1.5 rounded-xl flex items-center gap-1 ${
                  entry.morning_taken ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'
                }`}>
                  <span>Morning</span>
                  {entry.morning_taken ? '✓' : '✗'}
                </span>

                <span className={`px-3 py-1.5 rounded-xl flex items-center gap-1 ${
                  entry.afternoon_taken ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'
                }`}>
                  <span>Noon</span>
                  {entry.afternoon_taken ? '✓' : '✗'}
                </span>

                <span className={`px-3 py-1.5 rounded-xl flex items-center gap-1 ${
                  entry.night_taken ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'
                }`}>
                  <span>Night</span>
                  {entry.night_taken ? '✓' : '✗'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
