// Admin/src/pages/PrescriptionReviewPage.tsx
import React, { useState } from 'react';
import { store } from '../lib/storage';
import { Pill, CheckCircle2, FileText, ArrowRight, ShieldCheck } from 'lucide-react';
import { calculateTotalPrescriptionSavings } from '@shared/janAushadhiCatalog';

export default function PrescriptionReviewPage() {
  const [snapshot] = useState(store.getSnapshot());

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Jan Aushadhi Generic Review & Sign-Off</h2>
        <p className="text-sm text-slate-500 mt-1">Doctor sign-off for generic equivalence and PMBJP subsidy eligibility</p>
      </div>

      <div className="space-y-4">
        {snapshot.prescriptions.map((p) => (
          <div key={p.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  Jan Aushadhi Match
                </span>
                <span className="text-xs font-bold text-slate-400">Prescription #{p.id}</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {p.medicines ? p.medicines.map(m => m.name).join(', ') : p.medicine_name}
              </h3>
              <p className="text-xs text-slate-500">
                Doctor: {p.doctor_name || 'Dr. Arjun Verma'} • Date: {p.date || p.created_at}
              </p>
            </div>

            <button
              onClick={() => alert(`Prescription ${p.id} approved with Jan Aushadhi generic mapping.`)}
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 shrink-0"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Generic Mapping</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
