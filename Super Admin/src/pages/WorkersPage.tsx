import React from 'react';
import WorkerManagement from '../components/WorkerManagement';

export default function WorkersPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Worker Management</h2>
        <p className="text-slate-500">Monitoring field worker performance and managing district coverage.</p>
      </div>
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <WorkerManagement />
      </div>
    </div>
  );
}
