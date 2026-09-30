// Admin/src/pages/ReferralQueuePage.tsx
import React, { useState } from 'react';
import { store } from '../lib/storage';
import { ShieldAlert, Clock, ArrowRight, CheckCircle2, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ReferralQueuePage() {
  const [snapshot] = useState(store.getSnapshot());

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Emergency & Urgent Referral Queue</h2>
        <p className="text-sm text-slate-500 mt-1">Real-time triage stream from offline field workers requiring doctor review</p>
      </div>

      <div className="space-y-4">
        {snapshot.referrals.map((ref) => (
          <div key={ref.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                  ref.priority === 'Emergency' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {ref.priority}
                </span>
                <span className="text-xs font-bold text-slate-400">Target: {ref.target_facility}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Patient: {ref.patient_name}</h3>
              <p className="text-xs text-slate-600">Referred By: {ref.worker_name} • Specialty: {ref.specialty_required}</p>
              <p className="text-xs text-slate-500 italic">"{ref.reason}"</p>
            </div>

            <Link
              to={`/users/${ref.patient_id}`}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shrink-0"
            >
              <span>Review Clinical History</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
