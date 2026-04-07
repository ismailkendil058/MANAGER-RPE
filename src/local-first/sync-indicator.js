import { getUnsyncedRecords } from './storage.js';
import { syncToSupabase } from './sync.js';

class SyncIndicator {
    constructor() {
        this.container = document.createElement('div');
        this.container.style.position = 'fixed';
        this.container.style.top = '20px';
        this.container.style.right = '20px';
        this.container.style.padding = '8px 12px';
        this.container.style.background = '#333';
        this.container.style.color = '#fff';
        this.container.style.borderRadius = '20px';
        this.container.style.fontFamily = 'system-ui, sans-serif';
        this.container.style.fontSize = '12px';
        this.container.style.fontWeight = '500';
        this.container.style.zIndex = '99999';
        this.container.style.display = 'flex';
        this.container.style.alignItems = 'center';
        this.container.style.gap = '6px';
        this.container.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
        this.container.style.cursor = 'pointer';

        document.body.appendChild(this.container);

        // Manual sync on click
        this.container.addEventListener('click', () => {
            if (navigator.onLine) syncToSupabase();
        });

        // Event listeners
        window.addEventListener('online', () => this.updateStatus());
        window.addEventListener('offline', () => this.updateStatus());
        window.addEventListener('sync-started', () => this.render('🔄 Syncing...'));
        window.addEventListener('sync-completed', (e) => this.updateStatus(e.detail.pendingCount));
        window.addEventListener('local-data-changed', () => this.updateStatus());
        window.addEventListener('local-data-synced', () => this.updateStatus());

        this.updateStatus();
    }

    async updateStatus(pendingCountOverride = null) {
        if (!navigator.onLine) {
            const count = pendingCountOverride !== null ? pendingCountOverride : (await getUnsyncedRecords()).length;
            this.render(`📴 Offline (${count} pending)`);
            return;
        }

        const count = pendingCountOverride !== null ? pendingCountOverride : (await getUnsyncedRecords()).length;
        if (count > 0) {
            this.render(`🔄 ${count} pending...`);
            syncToSupabase();
        } else {
            this.render(`✅ Synced`);
        }
    }

    render(text) {
        this.container.textContent = text;
    }
}

// Initialize floating UI automatically
window.addEventListener('load', () => new SyncIndicator());
