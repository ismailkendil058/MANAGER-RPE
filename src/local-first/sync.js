import { getUnsyncedRecords, markAsSynced } from './storage.js';

// Real Supabase credentials (matching lib/supabase.ts)
const SUPABASE_URL = 'https://pvssckygpatanopdatrf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2c3Nja3lncGF0YW5vcGRhdHJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3ODgyNjgsImV4cCI6MjA5MDM2NDI2OH0.8LjyOxzui-yjtrBOC64uR1Y7BKuy0s_peeGfJ9TxnBw';

let isSyncing = false;

const fetchSupabase = async (url, options = {}) => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1${url}`, {
        ...options,
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
            ...(options.headers || {})
        }
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Supabase request failed [${res.status}]: ${errText}`);
    }
    return res.status !== 204 ? res.json() : null;
};

export const syncToSupabase = async () => {
    if (!navigator.onLine || isSyncing) return;

    try {
        isSyncing = true;
        window.dispatchEvent(new CustomEvent('sync-started'));

        const unsynced = await getUnsyncedRecords();
        if (unsynced.length === 0) {
            window.dispatchEvent(new CustomEvent('sync-completed', { detail: { pendingCount: 0 } }));
            return;
        }

        console.log(`[Sync] Syncing ${unsynced.length} pending records to Supabase...`);

        for (const record of unsynced) {
            try {
                if (record.action === 'delete') {
                    await fetchSupabase(`/${record.table}?id=eq.${record.id}`, { method: 'DELETE' });
                } else if (record.action === 'update') {
                    // PATCH / update existing row
                    const bodyData = { ...record.data, updated_at: record.updated_at };
                    if (bodyData.products) delete bodyData.products; // Supabase doesn't accept nested arrays

                    await fetchSupabase(
                        `/${record.table}?id=eq.${record.id}`,
                        {
                            method: 'PATCH',
                            headers: { 'Prefer': 'return=representation' },
                            body: JSON.stringify(bodyData)
                        }
                    );
                } else {
                    // INSERT / create — use UPSERT to avoid duplicates
                    const bodyData = { id: record.id, ...record.data, updated_at: record.updated_at };
                    if (bodyData.products) delete bodyData.products;

                    await fetchSupabase(`/${record.table}`, {
                        method: 'POST',
                        headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
                        body: JSON.stringify(bodyData)
                    });
                }

                // Mark as synced in local DB
                await markAsSynced(record.id);
                console.log(`[Sync] ✅ Synced record ${record.id} (table: ${record.table})`);
            } catch (err) {
                console.error(`[Sync] ❌ Failed to sync record ${record.id} (${record.table}):`, err);
                // Continue with remaining records rather than stopping
            }
        }

    } catch (error) {
        console.error('[Sync] Master sync process failed:', error);
    } finally {
        isSyncing = false;
        const remaining = await getUnsyncedRecords();
        window.dispatchEvent(new CustomEvent('sync-completed', { detail: { pendingCount: remaining.length } }));
    }
};

// Auto-sync when back online
window.addEventListener('online', () => {
    console.log('[Sync] Network restored — triggering sync...');
    setTimeout(syncToSupabase, 800); // small delay so connection is stable
});

// Attempt sync 500ms after a local change (also works when already online)
window.addEventListener('local-data-changed', () => {
    if (navigator.onLine) {
        setTimeout(syncToSupabase, 500);
    }
});
