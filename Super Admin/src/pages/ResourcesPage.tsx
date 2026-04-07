import React from 'react';
import ResourcePlanning from '../components/ResourcePlanning';

export default function ResourcesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Resource Planning</h2>
        <p className="text-slate-500">Forecasting medicine demand and managing medical resources.</p>
      </div>
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <ResourcePlanning />
      </div>
    </div>
  );
}
