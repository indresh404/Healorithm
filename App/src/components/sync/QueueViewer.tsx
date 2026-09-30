// App/src/components/sync/QueueViewer.tsx
import React from 'react';
import { Layers, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface QueueViewerProps {
  pendingItems?: Array<{ id: string; type: string; created_at: string; priority: number }>;
}

export default function QueueViewer({ pendingItems = [] }: QueueViewerProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-bold text-slate-800">Encrypted Outbox Queue</h4>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
          {pendingItems.length} Enqueued
        </span>
      </div>

      {pendingItems.length === 0 ? (
        <div className="text-center py-4 text-xs text-slate-400">
          Queue empty • All offline changes synchronized
        </div>
      ) : (
        <div className="space-y-2">
          {pendingItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <span className="font-semibold text-slate-700 capitalize">{item.type.replace('_', ' ')}</span>
              <span className="text-[10px] text-slate-400 font-mono">{new Date(item.created_at).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
