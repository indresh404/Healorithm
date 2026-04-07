import React from 'react';
import HealthMap from '../components/HealthMap';

export default function HealthMapPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">District Health Heatmap</h2>
        <p className="text-slate-500">Real-time visualization of health indicators across the district.</p>
      </div>
      <HealthMap />
    </div>
  );
}
