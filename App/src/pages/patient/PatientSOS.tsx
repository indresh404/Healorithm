// src/pages/patient/PatientSOS.tsx
import React, { useState } from 'react';
import { store } from '../../lib/storage';
import { PhoneCall, ShieldAlert, MessageSquare, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function PatientSOS() {
  const [snapshot] = useState(store.getSnapshot());
  const activeUser = snapshot.users.find(u => u.id === snapshot.activePatientId) || snapshot.users[0];
  const [sosSent, setSosSent] = useState(false);

  const emergencySmsText = encodeURIComponent(
    `EMERGENCY MEDICAL ALERT: Patient ${activeUser.name}, Age ${activeUser.age}, Village ${activeUser.village || 'Adoni'}. Urgent medical assistance required. Location: Lat ${activeUser.lat || 15.346}, Lng ${activeUser.lng || 77.346}.`
  );

  const handleTriggerSOS = () => {
    setSosSent(true);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 text-center">
      <div>
        <div className="w-16 h-16 mx-auto rounded-3xl bg-red-100 text-red-600 flex items-center justify-center font-bold mb-3 shadow-md animate-pulse">
          <ShieldAlert className="w-9 h-9" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900">Emergency SOS</h2>
        <p className="text-xs text-slate-500 mt-1">One-tap emergency alert via SMS and direct 108 Ambulance dispatch</p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-red-200 shadow-lg space-y-5">
        <a
          href={`sms:108?body=${emergencySmsText}`}
          onClick={handleTriggerSOS}
          className="w-full py-5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-base font-extrabold flex items-center justify-center gap-3 transition-all shadow-md active:scale-95"
        >
          <MessageSquare className="w-6 h-6" />
          <span>Send Instant Emergency SMS</span>
        </a>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <a
            href="tel:108"
            className="p-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all"
          >
            <PhoneCall className="w-4 h-4 text-red-400" />
            <span>Call 108 Ambulance</span>
          </a>

          <a
            href="tel:+919876543211"
            className="p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all"
          >
            <PhoneCall className="w-4 h-4 text-white" />
            <span>Call ASHA (Lakshmi P.)</span>
          </a>
        </div>

        {sosSent && (
          <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-bold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Emergency SMS Prepared & Logged to Health Timeline</span>
          </div>
        )}
      </div>
    </div>
  );
}
