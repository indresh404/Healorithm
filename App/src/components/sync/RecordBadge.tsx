// App/src/components/sync/RecordBadge.tsx
import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, XCircle } from 'lucide-react';

interface RecordBadgeProps {
  status: 'synced' | 'pending' | 'conflict' | 'failed';
}

export default function RecordBadge({ status }: RecordBadgeProps) {
  if (status === 'synced') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
        <CheckCircle2 className="w-3 h-3" />
        <span>Synced</span>
      </span>
    );
  }

  if (status === 'conflict') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
        <AlertTriangle className="w-3 h-3" />
        <span>Conflict</span>
      </span>
    );
  }

  if (status === 'failed') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-800">
        <XCircle className="w-3 h-3" />
        <span>Failed</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800">
      <Clock className="w-3 h-3" />
      <span>Pending Sync</span>
    </span>
  );
}
