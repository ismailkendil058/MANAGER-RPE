import { getLocalRecord, openLocalDB } from './storage.js';

// SUPABASE: Replace with your actual credentials
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
// SUPABASE: Replace with your remote table name
const TABLE_NAME = 'your_table';

export const subscribeToRealtime = () => {
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || !window.supabase) {
        console.warn('Supabase Realtime not configured or JS client not loaded globally.');
        return;
    }

    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // Subscribe to all changes on the table
    client.channel('any-public-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: TABLE_NAME }, async (payload) => {
            const remoteRecord = payload.new;
            if (!remoteRecord) return;

            const localRecord = await getLocalRecord(remoteRecord.id);

            // CONFLICT RESOLUTION: "last write wins"
            // If the local database has a newer `updated_at`, ignore the remote change.
            let shouldUpdateLocal = true;
            if (localRecord && localRecord.updated_at) {
                const localDate = new Date(localRecord.updated_at);
                const remoteDate = new Date(remoteRecord.updated_at);
                if (localDate > remoteDate) {
                    shouldUpdateLocal = false; // Local is newer!
                }
            }

            if (shouldUpdateLocal) {
                const db = await openLocalDB();
                const tx = db.transaction('records', 'readwrite');
                const store = tx.objectStore('records');
                store.put({
                    id: remoteRecord.id,
                    data: remoteRecord,
                    updated_at: remoteRecord.updated_at,
                    synced: true, // It came securely from the server
                    action: 'update'
                });

                tx.oncomplete = () => {
                    console.log('Local DB pulled realtime changes for', remoteRecord.id);
                    window.dispatchEvent(new CustomEvent('local-data-changed'));
                };
            }
        })
        .subscribe();
};

window.addEventListener('load', subscribeToRealtime);
