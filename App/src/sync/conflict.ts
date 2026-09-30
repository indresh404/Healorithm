// App/src/sync/conflict.ts
import { db, EncryptedConflictRecord } from '../db/schema';

/**
 * Client-Side Conflict Stash and Resolution
 */
export async function getLocalConflicts(): Promise<EncryptedConflictRecord[]> {
  return await db.conflicts.where('status').equals('unresolved').toArray();
}

export async function resolveLocalConflict(conflictId: string, resolution: any): Promise<void> {
  await db.conflicts.update(conflictId, { 
    status: 'resolved', 
    local_value: typeof resolution === 'string' ? resolution : JSON.stringify(resolution) 
  });
}
