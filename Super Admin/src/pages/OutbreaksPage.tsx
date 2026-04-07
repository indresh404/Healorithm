import React from 'react';
import OutbreakDetection from '../components/OutbreakDetection';

export default function OutbreaksPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Disease Outbreak Detection</h2>
        <p className="text-slate-500">Monitoring symptom clusters to identify potential health threats early.</p>
      </div>
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <OutbreakDetection />
      </div>
    </div>
  );
}
