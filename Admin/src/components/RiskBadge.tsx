// Admin/src/components/RiskBadge.tsx
import React from 'react';

interface RiskBadgeProps {
  level: 'Low' | 'Moderate' | 'High' | 'Critical';
  score?: number;
}

export default function RiskBadge({ level, score }: RiskBadgeProps) {
  const colorMap = {
    Low: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Moderate: 'bg-amber-100 text-amber-800 border-amber-200',
    High: 'bg-orange-100 text-orange-800 border-orange-200',
    Critical: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${colorMap[level] || colorMap.Low}`}>
      {level} {score !== undefined && `(${score}/100)`}
    </span>
  );
}
