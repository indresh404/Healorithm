// App/src/sync/outbox.ts
import { db, EncryptedOutboxRecord } from '../db/schema';

/**
 * TODO: Outbox Queue Management & Compression Handler
 */
export async function getPendingOutboxItems(): Promise<EncryptedOutboxRecord[]> {
  return await db.outbox.where('status').equals('pending').sortBy('created_at');
}

export async function markOutboxItemSynced(id: string): Promise<void> {
  await db.outbox.update(id, { status: 'synced', attempts: 0 });
}
