// App/src/pages/worker/WorkerSyncCenter.tsx
import React, { useEffect, useState } from 'react';
import {
  RefreshCw, Radio, Cloud, ShieldCheck, CheckCircle2,
  AlertTriangle, WifiOff, Wifi, Loader2, Clock, Upload,
  PackageCheck, XCircle, ChevronRight
} from 'lucide-react';
import { syncEngine, SyncStats } from '../../sync/syncEngine';
import { networkManager } from '../../sync/networkStatus';
import { db } from '../../db/schema';

interface OutboxRow {
  id: string;
  table_name: string;
  action: string;
  priority: string;
  status: string;
  timestamp: string;
  attempts: number;
  last_error?: string;
}

export default function WorkerSyncCenter() {
  const [stats, setStats] = useState<SyncStats>({
    lastSyncTime: null,
    bytesSentLastSync: 0,
    totalSyncedCount: 0,
    status: 'idle',
    pendingCount: 0,
    failedCount: 0,
  });
  const [networkMode, setNetworkMode] = useState(networkManager.getMode());
  const [outboxRows, setOutboxRows] = useState<OutboxRow[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsub = syncEngine.subscribe(setStats);
    const unsubNet = networkManager.subscribe(setNetworkMode);
    loadOutbox();
    return () => { unsub(); unsubNet(); };
  }, []);

  async function loadOutbox() {
    const rows = await db.outbox.toArray();
    setOutboxRows(rows as OutboxRow[]);
  }

  async function handleManualSync() {
    setIsSyncing(true);
    await syncEngine.runSync();
    await loadOutbox();
    setIsSyncing(false);
  }

  const statusColor = {
    idle: 'text-slate-500',
    syncing: 'text-blue-600',
    synced: 'text-emerald-600',
    error: 'text-red-600',
    offline: 'text-amber-600',
  };

  const networkColor = {
    online: 'text-emerald-600',
    offline: 'text-red-600',
    '2g_poor': 'text-amber-600',
    simulated_offline: 'text-orange-600',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Sync &amp; Data Transmission Center</h2>
        <p className="text-sm text-slate-500 mt-1">
          Multi-tier synchronization: HTTPS background sync, 2G retry, and zero-signal QR handoff
        </p>
      </div>

      {/* Status Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Network Status */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            {networkMode === 'online' ? (
              <Wifi className="w-4 h-4 text-emerald-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span className="text-xs font-bold text-slate-400 uppercase">Network</span>
          </div>
          <p className={`text-base font-bold capitalize ${networkColor[networkMode] || 'text-slate-600'}`}>
            {networkMode.replace('_', ' ')}
          </p>
        </div>

        {/* Sync Status */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Cloud className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-bold text-slate-400 uppercase">Sync Status</span>
          </div>
          <p className={`text-base font-bold capitalize ${statusColor[stats.status]}`}>
            {stats.status === 'syncing' ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Syncing…
              </span>
            ) : stats.status}
          </p>
        </div>

        {/* Pending Records */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Upload className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-slate-400 uppercase">Pending</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.pendingCount}</p>
          <p className="text-[11px] text-slate-500">Records awaiting upload</p>
        </div>

        {/* Total Synced */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <PackageCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-slate-400 uppercase">Synced Today</span>
          </div>
          <p className="text-2xl font-bold text-emerald-700">{stats.totalSyncedCount}</p>
          <p className="text-[11px] text-slate-500">Records confirmed by server</p>
        </div>
      </div>

      {/* Sync Summary Panel */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Sync Control Panel</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Records are automatically synced when internet is detected. Trigger manual sync anytime.
            </p>
          </div>
          <button
            onClick={handleManualSync}
            disabled={isSyncing || networkMode === 'offline' || networkMode === 'simulated_offline'}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs"
          >
            {isSyncing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>{isSyncing ? 'Syncing…' : 'Sync Now'}</span>
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Last Sync</span>
            <p className="text-sm font-bold text-slate-900 mt-1">
              {stats.lastSyncTime
                ? new Date(stats.lastSyncTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                : '—'}
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Data Sent</span>
            <p className="text-sm font-bold text-slate-900 mt-1">
              {stats.bytesSentLastSync > 0 ? `${(stats.bytesSentLastSync / 1024).toFixed(1)} KB` : '—'}
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Failed Records</span>
            <p className={`text-sm font-bold mt-1 ${stats.failedCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>
              {stats.failedCount}
            </p>
          </div>
        </div>
      </div>

      {/* Outbox Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Encrypted Outbox Queue</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              AES-GCM encrypted payloads awaiting server acknowledgment
            </p>
          </div>
          <button
            onClick={loadOutbox}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            title="Refresh outbox"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {outboxRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3" />
            <p className="font-bold text-emerald-700">All records synced</p>
            <p className="text-xs text-slate-500 mt-1">No pending outbox items</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {outboxRows.map((row) => (
              <div key={row.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      row.priority === 'emergency' ? 'bg-red-100 text-red-700' :
                      row.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {row.priority}
                    </span>
                    <span className="text-xs font-bold text-slate-900 truncate">{row.table_name}</span>
                    <span className="text-xs text-slate-400 uppercase">/ {row.action}</span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-400 truncate">{row.id}</p>
                  {row.last_error && (
                    <p className="text-[10px] text-red-500 font-medium">{row.last_error}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                    {new Date(row.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {row.status === 'pending' && <Clock className="w-4 h-4 text-amber-500" />}
                  {row.status === 'syncing' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                  {row.status === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
                  {row.status === 'synced' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Zero-Signal Tier */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-md flex items-start gap-5">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shrink-0">
          <Radio className="w-6 h-6 text-white" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white">Zero-Signal Fallback</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            When offline and outside 2G range, generate a QR handoff package that the doctor at the
            health facility can scan to import the patient record — no internet required.
          </p>
          <a
            href="/worker/zero-signal"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 mt-2 transition-colors"
          >
            <span>Open Zero-Signal Console</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Encryption Badge */}
      <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
        <p className="text-xs font-semibold text-emerald-800">
          All patient data is encrypted with AES-256-GCM before leaving the device. Private keys never
          leave the worker's browser. Only ciphertext is transmitted to the server.
        </p>
      </div>
    </div>
  );
}
