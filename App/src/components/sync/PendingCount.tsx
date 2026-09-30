// App/src/components/sync/PendingCount.tsx
import React from 'react';
import { CloudOff } from 'lucide-react';

interface PendingCountProps {
  count: number;
}

export default function PendingCount({ count }: PendingCountProps) {
  if (count <= 0) return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500 text-white text-[11px] font-bold shadow-xs">
      <CloudOff className="w-3.5 h-3.5" />
      <span>{count} pending sync</span>
    </div>
  );
}
