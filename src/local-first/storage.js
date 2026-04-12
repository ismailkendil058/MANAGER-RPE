const DB_NAME = 'local_first_db';
const DB_VERSION = 1;
// SUPABASE: Update your indexedDB store name internally
const STORE_NAME = 'records';

export const openLocalDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
};

export const saveLocally = async (table, id, data, action = 'update') => {
    const db = await openLocalDB();
    const ts = new Date().toISOString();
    const record = {
        table,
        id,
        data,
        updated_at: ts,
        synced: false,
        action // 'create', 'update', 'delete'
    };

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(record);
        tx.oncomplete = () => {
            // Trigger an event so sync/UI can respond
            window.dispatchEvent(new CustomEvent('local-data-changed'));
            resolve(record);
        };
        tx.onerror = () => reject(tx.error);
    });
};

export const getLocalRecord = async (id) => {
    const db = await openLocalDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
};

export const getUnsyncedRecords = async () => {
    const db = await openLocalDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
            const all = req.result || [];
            resolve(all.filter(r => !r.synced));
        };
        req.onerror = () => reject(req.error);
    });
};

export const getAllTableRecords = async (tableName) => {
    const db = await openLocalDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
            const all = req.result || [];
            // Filter by table and valid data, sorting by updated_at descending
            const tableRecords = all
                .filter(r => r.table === tableName && r.action !== 'delete')
                .map(r => r.data)
                .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
            resolve(tableRecords);
        };
        req.onerror = () => reject(req.error);
    });
};

export const markAsSynced = async (id, serverUpdatedAt = null) => {
    const record = await getLocalRecord(id);
    if (!record) return;

    record.synced = true;
    if (serverUpdatedAt) {
        record.updated_at = serverUpdatedAt;
    }

    const db = await openLocalDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(record);
        tx.oncomplete = () => {
            window.dispatchEvent(new CustomEvent('local-data-synced'));
            resolve();
        };
        tx.onerror = () => reject(tx.error);
    });
};

export const syncAndPruneLocalDB = async (tableName, remoteIdsArray) => {
    const remoteIds = new Set(remoteIdsArray);
    const db = await openLocalDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
            const all = req.result || [];
            all.forEach(record => {
                if (record.table === tableName) {
                    // if it's already synced and NOT in Supabase anymore, it was deleted on Supabase
                    if (!remoteIds.has(record.id) && record.synced === true) {
                        store.delete(record.id);
                    }
                }
            });
            resolve();
        };
        req.onerror = () => reject(tx.error);
    });
};
