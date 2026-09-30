// Admin/src/components/FactorBars.tsx
import React from 'react';

interface FactorBarsProps {
  factors: string[];
}

export default function FactorBars({ factors }: FactorBarsProps) {
  if (!factors || factors.length === 0) return null;

  return (
    <div className="space-y-2">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Top Explainable Factors</span>
      <div className="space-y-1.5">
        {factors.map((factor, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="font-semibold text-slate-700">{factor}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
