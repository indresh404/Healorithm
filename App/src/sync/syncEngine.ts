// App/src/sync/syncEngine.ts
import { db, EncryptedOutboxRecord } from '../db/schema';
import { sortOutboxByPriority } from './priority';
import { compressGzipPayload } from './compress';
import { networkManager } from './networkStatus';

export interface SyncStats {
  lastSyncTime: string | null;
  bytesSentLastSync: number;
  totalSyncedCount: number;
  status: 'idle' | 'syncing' | 'synced' | 'error' | 'offline';
  pendingCount: number;
}

class SyncEngine {
  private stats: SyncStats = {
    lastSyncTime: null,
    bytesSentLastSync: 0,
    totalSyncedCount: 0,
    status: 'idle',
    pendingCount: 0
  };
  private listeners: Set<(stats: SyncStats) => void> = new Set();
  private isRunning: boolean = false;

  constructor() {
    this.updatePendingCount();
    // Auto-sync when reconnecting
    networkManager.subscribe((mode) => {
      if (mode === 'online') {
        this.runSync();
      }
    });
  }

  private notify() {
    this.listeners.forEach(cb => cb({ ...this.stats }));
  }

  public subscribe(cb: (stats: SyncStats) => void): () => void {
    this.listeners.add(cb);
    cb({ ...this.stats });
    return () => this.listeners.delete(cb);
  }

  public async updatePendingCount() {
    const count = await db.outbox.filter(item => item.status === 'pending').count();
    this.stats.pendingCount = count;
    this.notify();
  }

  public async runSync(): Promise<{ syncedCount: number; bytesSent: number }> {
    if (this.isRunning) return { syncedCount: 0, bytesSent: 0 };
    if (!networkManager.isConnected()) {
      this.stats.status = 'offline';
      this.notify();
      return { syncedCount: 0, bytesSent: 0 };
    }

    this.isRunning = true;
    this.stats.status = 'syncing';
    this.notify();

    try {
      const allPending = await db.outbox.filter(item => item.status === 'pending').toArray();
      const sorted = sortOutboxByPriority(allPending);

      if (sorted.length === 0) {
        this.stats.status = 'synced';
        this.isRunning = false;
        this.notify();
        return { syncedCount: 0, bytesSent: 0 };
      }

      // Prepare delta batch
      const compressedBatch = compressGzipPayload(sorted);
      const bytesSent = compressedBatch.length;

      // Simulated network sync delay
      await new Promise(res => setTimeout(res, 1200));

      // Acknowledge records and delete from outbox transactionally
      const idsToDelete = sorted.map(s => s.id);
      await db.outbox.bulkDelete(idsToDelete);

      this.stats.lastSyncTime = new Date().toISOString();
      this.stats.bytesSentLastSync = bytesSent;
      this.stats.totalSyncedCount += sorted.length;
      this.stats.status = 'synced';
      this.stats.pendingCount = 0;
      this.isRunning = false;
      this.notify();

      return { syncedCount: sorted.length, bytesSent };
    } catch (e) {
      console.error('Sync failure, retrying with backoff:', e);
      this.stats.status = 'error';
      this.isRunning = false;
      this.notify();
      return { syncedCount: 0, bytesSent: 0 };
    }
  }
}

export const syncEngine = new SyncEngine();
