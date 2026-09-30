// App/src/pages/worker/WorkerSyncCenter.tsx
import React from 'react';
import { RefreshCw, Radio, Cloud, ShieldCheck } from 'lucide-react';
import SyncBanner from '../../components/sync/SyncBanner';

/**
 * Health Worker Sync Status & Manual Handoff Hub
 */
export default function WorkerSyncCenter() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Sync & Data Transmission Center</h2>
        <p className="text-sm text-slate-500 mt-1">Multi-tier synchronization: HTTPS background sync, 2G retry, and zero-signal QR handoff</p>
      </div>

      <SyncBanner />
    </div>
  );
}
