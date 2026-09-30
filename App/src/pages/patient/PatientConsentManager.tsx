// src/pages/patient/PatientConsentManager.tsx
import React, { useState } from 'react';
import { store } from '../../lib/storage';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Volume2 } from 'lucide-react';
import { playVoicePrompt } from '@shared/translations';

export default function PatientConsentManager() {
  const [snapshot, setSnapshot] = useState(store.getSnapshot());
  const activeUser = snapshot.users.find(u => u.id === snapshot.activePatientId) || snapshot.users[0];
  const [consentGranted, setConsentGranted] = useState(activeUser.consent_status === 'granted');
  const tLang = snapshot.selectedLanguage;

  const handleAudioConsent = () => {
    const text = tLang === 'hi'
      ? `आपकी सहमति के बिना आपका स्वास्थ्य डेटा किसी के साथ साझा नहीं किया जाएगा। आप कभी भी सहमति दे या रद्द कर सकते हैं।`
      : tLang === 'mr'
      ? `आपल्या संमतीशिवाय आपली माहिती कोणालाही दिली जाणार नाही. आपण केव्हाही संमती देऊ किंवा रद्द करू शकता.`
      : `Your medical data will not be shared without your explicit consent. You can grant or revoke permission at any time.`;
    playVoicePrompt(text, tLang);
  };

  const handleToggle = (status: boolean) => {
    setConsentGranted(status);
    activeUser.consent_status = status ? 'granted' : 'revoked';
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Data Sharing & Privacy Consent</h2>
          <p className="text-xs text-slate-500 mt-0.5">Control who can access your vitals and medical records</p>
        </div>
        <button
          onClick={handleAudioConsent}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl"
          title="Audio guidance"
        >
          <Volume2 className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
            consentGranted ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}>
            {consentGranted ? <ShieldCheck className="w-7 h-7" /> : <ShieldAlert className="w-7 h-7" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {consentGranted ? 'Data Sharing: APPROVED' : 'Data Sharing: REVOKED'}
            </h3>
            <p className="text-xs text-slate-500">
              {consentGranted
                ? 'Your assigned ASHA worker and CHC doctor can review your vitals and prescriptions.'
                : 'All medical records are locked solely to your phone and will not be synced.'}
            </p>
          </div>
        </div>

        {/* Action Toggle Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => handleToggle(true)}
            className={`py-3.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              consentGranted
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approve Sharing</span>
          </button>

          <button
            onClick={() => handleToggle(false)}
            className={`py-3.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              !consentGranted
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <XCircle className="w-4 h-4" />
            <span>Deny / Revoke</span>
          </button>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-600 text-xs space-y-2">
          <p className="font-bold text-slate-800">Privacy Guarantees:</p>
          <p>• Data on your phone is encrypted with AES-256 GCM.</p>
          <p>• Telemedicine consultations require explicit patient authentication.</p>
          <p>• You may audit every worker who scans your QR code in the access log.</p>
        </div>
      </div>
    </div>
  );
}
