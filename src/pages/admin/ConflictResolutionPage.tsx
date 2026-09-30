// src/pages/admin/ConflictResolutionPage.tsx
import React, { useState } from 'react';
import { store } from '../../lib/storage';
import { GitMerge, CheckCircle2, AlertTriangle, ArrowRight, UserCheck } from 'lucide-react';

export default function ConflictResolutionPage() {
  const [snapshot, setSnapshot] = useState(store.getSnapshot());

  const handleResolve = (conflictId: string, choice: 'local' | 'remote') => {
    const cnf = snapshot.conflicts.find(c => c.id === conflictId);
    if (!cnf) return;
    const value = choice === 'local' ? cnf.local_value : cnf.remote_value;
    store.resolveConflict(conflictId, value);
    setSnapshot({ ...store.getSnapshot() });
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
            <GitMerge className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Clinical-Safe Conflict Resolution</h2>
            <p className="text-sm text-slate-500">Human-in-the-loop resolution for asynchronous multi-worker field collisions</p>
          </div>
        </div>
      </div>

      <div className="p-5 bg-blue-50 rounded-3xl border border-blue-100 text-xs text-blue-900 leading-relaxed">
        <strong>Zero Silent Overwrites:</strong> Vitals and prescriptions are strictly append-only. When conflicting clinical assessments or diagnoses arrive from two offline devices, Healorithm holds both records and requests a clinician's definitive sign-off.
      </div>

      {/* Conflict Records */}
      <div className="space-y-4">
        {snapshot.conflicts.map((cnf) => (
          <div key={cnf.id} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-700">
                  {cnf.status === 'resolved' ? 'Resolved' : 'Pending Doctor Decision'}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{cnf.patient_name}</h3>
                <p className="text-xs text-slate-500">Field Clashed: <strong>{cnf.field_name}</strong></p>
              </div>
            </div>

            {/* Comparison of the 2 versions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Local Field Tablet Version */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Version A (Field Sync)</span>
                <h4 className="text-xs font-bold text-slate-700">{cnf.local_source}</h4>
                <p className="text-xs font-semibold text-slate-900 bg-white p-3 rounded-xl border border-slate-200">
                  "{cnf.local_value}"
                </p>
                <p className="text-[11px] text-slate-400">Timestamp: {new Date(cnf.local_timestamp).toLocaleString()}</p>
                
                {cnf.status !== 'resolved' && (
                  <button
                    onClick={() => handleResolve(cnf.id, 'local')}
                    className="w-full mt-2 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Accept Field Worker Assessment
                  </button>
                )}
              </div>

              {/* Central Doctor Version */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Version B (CHC Doctor Portal)</span>
                <h4 className="text-xs font-bold text-slate-700">{cnf.remote_source}</h4>
                <p className="text-xs font-semibold text-slate-900 bg-white p-3 rounded-xl border border-slate-200">
                  "{cnf.remote_value}"
                </p>
                <p className="text-[11px] text-slate-400">Timestamp: {new Date(cnf.remote_timestamp).toLocaleString()}</p>

                {cnf.status !== 'resolved' && (
                  <button
                    onClick={() => handleResolve(cnf.id, 'remote')}
                    className="w-full mt-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    Accept Doctor Assessment
                  </button>
                )}
              </div>
            </div>

            {cnf.status === 'resolved' && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Resolved & Applied to Patient Profile: "{cnf.resolved_value}"</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
