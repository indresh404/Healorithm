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
  failedCount: number;
}

class SyncEngine {
  private stats: SyncStats = {
    lastSyncTime: null,
    bytesSentLastSync: 0,
    totalSyncedCount: 0,
    status: 'idle',
    pendingCount: 0,
    failedCount: 0,
  };
  private listeners: Set<(stats: SyncStats) => void> = new Set();
  private isRunning = false;
  private readonly BACKEND_URL = 'http://127.0.0.1:8000/sync/push';
  private readonly MAX_ATTEMPTS = 5;

  constructor() {
    this.updatePendingCount();
    networkManager.subscribe((mode) => {
      if (mode === 'online') this.runSync();
    });
  }

  private notify() {
    this.listeners.forEach((cb) => cb({ ...this.stats }));
  }

  public subscribe(cb: (stats: SyncStats) => void): () => void {
    this.listeners.add(cb);
    cb({ ...this.stats });
    return () => this.listeners.delete(cb);
  }

  public async updatePendingCount() {
    const pending = await db.outbox.filter((i) => i.status === 'pending').count();
    const failed = await db.outbox.filter((i) => i.status === 'failed').count();
    this.stats.pendingCount = pending;
    this.stats.failedCount = failed;
    this.notify();
  }

  /**
   * POSTs one outbox record to the backend.
   * Returns true if the server acknowledged it (2xx).
   */
  private async postRecord(record: EncryptedOutboxRecord): Promise<boolean> {
    try {
      const body = JSON.stringify({
        records: [
          {
            id: record.id,
            table_name: record.table_name,
            record_id: record.record_id,
            action: record.action,
            priority: record.priority,
            payload_cipher: record.payload_cipher,
            timestamp: record.timestamp,
          },
        ],
      });
      const res = await fetch(this.BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: AbortSignal.timeout(15000),
      });
      return res.ok;
    } catch {
      return false;
    }
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

    let syncedCount = 0;
    let bytesSent = 0;

    try {
      const allPending = await db.outbox
        .filter((i) => i.status === 'pending')
        .toArray();
      const sorted = sortOutboxByPriority(allPending);

      if (sorted.length === 0) {
        this.stats.status = 'synced';
        this.isRunning = false;
        this.notify();
        return { syncedCount: 0, bytesSent: 0 };
      }

      for (const record of sorted) {
        await db.outbox.update(record.id, { status: 'syncing' });
        const ok = await this.postRecord(record);

        if (ok) {
          await db.outbox.delete(record.id);
          syncedCount++;
          bytesSent += compressGzipPayload(record.payload_cipher).length;
        } else {
          const newAttempts = (record.attempts || 0) + 1;
          if (newAttempts >= this.MAX_ATTEMPTS) {
            await db.outbox.update(record.id, {
              status: 'failed',
              attempts: newAttempts,
              last_error: `Permanently failed after ${newAttempts} attempts`,
            });
          } else {
            await db.outbox.update(record.id, {
              status: 'pending',
              attempts: newAttempts,
              last_error: `Attempt ${newAttempts} failed`,
            });
          }
        }
      }

      await this.updatePendingCount();
      this.stats.lastSyncTime = new Date().toISOString();
      this.stats.bytesSentLastSync = bytesSent;
      this.stats.totalSyncedCount += syncedCount;
      this.stats.status = this.stats.pendingCount > 0 ? 'error' : 'synced';
      this.isRunning = false;
      this.notify();

      return { syncedCount, bytesSent };
    } catch (e) {
      console.error('[SyncEngine] Unhandled error:', e);
      this.stats.status = 'error';
      this.isRunning = false;
      await this.updatePendingCount();
      return { syncedCount: 0, bytesSent: 0 };
    }
  }
}

export const syncEngine = new SyncEngine();
