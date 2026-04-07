import React from 'react';
import HealthTrends from '../components/HealthTrends';

export default function TrendsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Health Trends & Analytics</h2>
        <p className="text-slate-500">Visualizing health data over time to identify district-wide patterns.</p>
      </div>
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <HealthTrends />
      </div>
    </div>
  );
}
