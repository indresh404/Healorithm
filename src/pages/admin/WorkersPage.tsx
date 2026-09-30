// src/pages/admin/WorkersPage.tsx
import React, { useState } from 'react';
import { store } from '../../lib/storage';
import { UserCheck, Clock, MapPin, AlertTriangle, Phone, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function WorkersPage() {
  const [snapshot] = useState(store.getSnapshot());

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">ASHA & Health Worker Workforce Management</h2>
        <p className="text-sm text-slate-500 mt-1">Field coverage, offline sync freshness, and rural visit queue completion</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {snapshot.workers.map((worker) => (
          <div key={worker.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  worker.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                  worker.status === 'Idle' ? 'bg-amber-100 text-amber-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {worker.status}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900">{worker.name}</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Assigned: {worker.village}</span>
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{worker.phone}</span>
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Assigned Patients</span>
                <span className="font-bold text-slate-900">{worker.assigned_patients}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Visits this week</span>
                <span className="font-bold text-emerald-600">{worker.visits_this_week}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Overdue Follow-ups</span>
                <span className={`font-bold ${worker.overdue_patients > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                  {worker.overdue_patients}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 border-t border-slate-50">
                <span>Last Sync</span>
                <span>{new Date(worker.last_sync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
