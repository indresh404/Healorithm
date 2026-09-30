// App/src/pages/worker/WorkerPatientProfile.tsx
import React from 'react';
import { User, Activity, FileText, Phone, MapPin } from 'lucide-react';

/**
 * TODO: Detailed Offline Patient Dossier & Longitudinal History
 */
export default function WorkerPatientProfile() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900">Patient Longitudinal Profile</h2>
        <p className="text-xs text-slate-500 mt-1">Encrypted local dossier, visit history, and generic prescriptions</p>
      </div>
    </div>
  );
}
