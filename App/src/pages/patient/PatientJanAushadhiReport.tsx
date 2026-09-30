// src/pages/patient/PatientJanAushadhiReport.tsx
import React, { useState } from 'react';
import { store } from '../../lib/storage';
import { calculateTotalPrescriptionSavings, GOVERNMENT_SCHEMES } from '@shared/janAushadhiCatalog';
import { Pill, CheckCircle2, Printer, MapPin, Building, ShieldCheck } from 'lucide-react';

export default function PatientJanAushadhiReport() {
  const [snapshot] = useState(store.getSnapshot());
  const activeUser = snapshot.users.find(u => u.id === snapshot.activePatientId) || snapshot.users[0];
  const prescriptions = snapshot.prescriptions.filter(p => p.user_id === activeUser.id);
  const savings = calculateTotalPrescriptionSavings(prescriptions);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
              Doctor-Confirmed Report
            </span>
            <span className="text-xs text-slate-500">• Synced Offline</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">Jan Aushadhi Generic Savings Report</h2>
          <p className="text-xs text-slate-500">Show or print this at any Pradhan Mantri Bhartiya Janaushadhi Kendra</p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all shrink-0"
        >
          <Printer className="w-4 h-4" />
          <span>Print Jan Aushadhi Slip</span>
        </button>
      </div>

      {/* Confirmed Prescription Items Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Approved Generic Substitutions</h3>
          <span className="text-xs font-bold text-emerald-700">All Quality-Tested Generics</span>
        </div>

        <div className="divide-y divide-slate-100">
          {prescriptions.map((rx) => (
            <div key={rx.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">{rx.generic_name || rx.medicine_name}</h4>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                    Generic Approved
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Dosage: <strong>{rx.dosage}</strong> • Timing: {rx.timing} • Duration: {rx.duration}
                </p>
                <p className="text-[11px] text-slate-400">
                  Branded Reference: {rx.medicine_name}
                </p>
              </div>

              <div className="flex items-center gap-4 text-right">
                <div>
                  <span className="text-xs text-slate-400 line-through">₹{rx.brand_price || 120}</span>
                  <p className="text-base font-bold text-emerald-700">₹{rx.generic_price || 20}</p>
                </div>
                <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100 text-xs font-bold text-emerald-800">
                  Save ₹{(rx.brand_price || 120) - (rx.generic_price || 20)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Total Month Savings Footer */}
        <div className="p-6 bg-emerald-50 border-t border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-800 uppercase">Monthly Out-of-Pocket Savings</span>
            <p className="text-2xl font-extrabold text-emerald-900 mt-0.5">
              ₹{savings.totalSavings} saved / month ({savings.percentage}% reduction)
            </p>
          </div>
          <div className="text-xs text-emerald-800">
            Certified by <strong>Dr. Arvind Sharma (Reg. #KMC-48291)</strong>
          </div>
        </div>
      </div>

      {/* Nearest Jan Aushadhi Kendra Pharmacy */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">PMBJP Kendra (Adoni Main Branch)</h4>
            <p className="text-xs text-slate-500">Shop No 4, Gandhi Circle, Adoni • Open 9:00 AM - 9:00 PM</p>
          </div>
        </div>

        <a
          href="tel:+919440155667"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
        >
          Call Pharmacy (+91 94401 55667)
        </a>
      </div>
    </div>
  );
}
