// App/src/sync/priority.ts
import { EncryptedOutboxRecord } from '../db/schema';

/**
 * Sorts outbox records so emergency payloads sync first.
 */
export function sortOutboxByPriority(items: EncryptedOutboxRecord[]): EncryptedOutboxRecord[] {
  const priorityWeight = {
    emergency: 1,
    high: 2,
    normal: 3
  };

  return [...items].sort((a, b) => {
    const wA = priorityWeight[a.priority] || 3;
    const wB = priorityWeight[b.priority] || 3;
    if (wA !== wB) return wA - wB;
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });
}
