import { getUnsyncedRecords } from './storage.js';

export const mergeUnsyncedRecords = async <T extends { id: string }>(
  table: string,
  base: T[]
): Promise<T[]> => {
  const unsynced = await getUnsyncedRecords();
  const filtered = unsynced.filter(record => record.table === table);

  const map = new Map<string, T>();
  base.forEach(item => map.set(item.id, item));

  for (const record of filtered) {
    if (record.action === 'delete') {
      map.delete(record.id);
      continue;
    }

    map.set(record.id, { ...(map.get(record.id) ?? (record.data as T)), ...(record.data as T), id: record.id });
  }

  return Array.from(map.values());
};
