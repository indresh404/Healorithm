import React from 'react';
import HealthMap from '../components/HealthMap';

export default function HealthMapPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">District Health Heatmap & Outbreak Watch</h2>
        <p className="text-slate-500">Switch between the current health map and the outbreak prediction view to clearly compare observed data with early-warning analytics.</p>
      </div>
      <HealthMap />
    </div>
  );
}
