// App/src/components/sync/SyncBanner.tsx
import React, { useEffect, useState } from 'react';
import { syncEngine, SyncStats } from '../../sync/syncEngine';
import { networkManager, NetworkMode } from '../../sync/networkStatus';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function SyncBanner() {
  const [stats, setStats] = useState<SyncStats>({
    lastSyncTime: null,
    bytesSentLastSync: 0,
    totalSyncedCount: 0,
    status: 'idle',
    pendingCount: 0,
    failedCount: 0,
  });
  const [mode, setMode] = useState<NetworkMode>(networkManager.getMode());

  useEffect(() => {
    const unsub1 = syncEngine.subscribe(setStats);
    const unsub2 = networkManager.subscribe(setMode);
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const handleManualSync = () => {
    syncEngine.runSync();
  };

  const handleToggleSimulated = (target: NetworkMode) => {
    networkManager.setSimulatedMode(target);
  };

  const isOnline = mode === 'online';

  return (
    <div className={`px-4 py-1.5 text-xs font-semibold flex flex-wrap items-center justify-between border-b ${
      isOnline 
        ? 'bg-slate-900 text-slate-200 border-slate-800' 
        : stats.status === 'syncing'
        ? 'bg-blue-600 text-white border-blue-700'
        : 'bg-amber-600 text-white border-amber-700'
    }`}>
      <div className="flex items-center gap-2">
        {isOnline ? (
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
        ) : stats.status === 'syncing' ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <WifiOff className="w-3.5 h-3.5 text-amber-200" />
        )}
        <span>
          {isOnline
            ? 'ONLINE • IndexedDB & Postgres Realtime Sync Connected'
            : stats.status === 'syncing'
            ? 'SYNCING • Sending Gzip Compressed Delta Outbox...'
            : 'OFFLINE (Zero-Signal) • Running on Local Encrypted Dexie Store'}
        </span>
        {stats.pendingCount > 0 && (
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
            {stats.pendingCount} Pending Outbox
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[10px] opacity-75 hidden sm:inline">Signal Simulator:</span>
        <button
          onClick={() => handleToggleSimulated('online')}
          className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
            mode === 'online' ? 'bg-white text-slate-900 shadow-xs' : 'bg-black/20 hover:bg-black/40'
          }`}
        >
          Online
        </button>
        <button
          onClick={() => handleToggleSimulated('simulated_offline')}
          className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
            mode === 'simulated_offline' ? 'bg-white text-slate-900 shadow-xs' : 'bg-black/20 hover:bg-black/40'
          }`}
        >
          Field Offline
        </button>

        {stats.pendingCount > 0 && (
          <button
            onClick={handleManualSync}
            disabled={stats.status === 'syncing'}
            className="ml-2 px-2.5 py-0.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-[11px] font-bold flex items-center gap-1 shadow-xs"
          >
            <RefreshCw className={`w-3 h-3 ${stats.status === 'syncing' ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        )}
      </div>
    </div>
  );
}
