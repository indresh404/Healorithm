// App/src/pages/worker/WorkerVisitForm.tsx
import React from 'react';
import { FileText, Save, CheckCircle2 } from 'lucide-react';

/**
 * TODO: Standardized ASHA Household Encounter Form
 */
export default function WorkerVisitForm() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900">Encounter Visit Recording</h2>
        <p className="text-xs text-slate-500 mt-1">Field visit notes, observations, and referral triggers</p>
      </div>
    </div>
  );
}
