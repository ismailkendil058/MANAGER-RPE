/**
 * Wrapper for IndexedDB to store failed requests when offline.
 */
const DB_NAME = 'recyclage-offline-db';
const DB_VERSION = 1;
const STORE_NAME = 'sync-queue';

export const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                // We'll use a generated ID as key so we can identify each request uniquely
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject('IndexedDB error: ' + event.target.errorCode);
    });
};

/**
 * Save data to the store
 */
export const saveData = async (storeName, data) => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject('Save failed');
        });
    } catch (error) {
        console.error('saveData error', error);
    }
};

/**
 * Get all data from the store
 */
export const getAllData = async (storeName) => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject('GetAll failed');
        });
    } catch (error) {
        console.error('getAllData error', error);
        return [];
    }
};

/**
 * Delete a specific key from the store
 */
export const deleteData = async (storeName, key) => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject('Delete failed');
        });
    } catch (error) {
        console.error('deleteData error', error);
    }
};
