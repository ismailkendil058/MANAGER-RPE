import { getUnsyncedRecords, markAsSynced } from './storage.js';

// SUPABASE: Replace with your actual Supabase configuration and credentials
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';

let isSyncing = false;

const fetchSupabase = async (url, options = {}) => {
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
        console.warn('Supabase is not configured yet. Skipping sync.');
        return null; // Don't throw to avoid UI crashing offline
    }
    const res = await fetch(`${SUPABASE_URL}/rest/v1${url}`, {
        ...options,
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation', // Optional: 'resolution=merge-duplicates' for UPSERTs
            ...(options.headers || {})
        }
    });

    if (!res.ok) {
        throw new Error(`Supabase request failed: ${res.statusText}`);
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

        for (const record of unsynced) {
            try {
                if (record.action === 'delete') {
                    // Send delete
                    await fetchSupabase(`/${record.table}?id=eq.${record.id}`, { method: 'DELETE' });
                } else {
                    // UPSERT (last write wins natively pushed with primary key)
                    await fetchSupabase(`/${record.table}`, {
                        method: 'POST',
                        headers: { 'Prefer': 'resolution=merge-duplicates' }, // Enables UPSERT
                        body: JSON.stringify({
                            id: record.id,
                            ...record.data,
                            updated_at: record.updated_at
                        })
                    });
                }

                // Success: mark as synced in local DB
                await markAsSynced(record.id);
            } catch (err) {
                console.error(`Failed to sync record ${record.id}:`, err);
            }
        }

    } catch (error) {
        console.error('Master Sync process failed:', error);
    } finally {
        isSyncing = false;
        const remaining = await getUnsyncedRecords();
        window.dispatchEvent(new CustomEvent('sync-completed', { detail: { pendingCount: remaining.length } }));
    }
};

window.addEventListener('online', syncToSupabase);
window.addEventListener('local-data-changed', () => {
    // Attempt sync 500ms after a local change
    setTimeout(syncToSupabase, 500);
});
