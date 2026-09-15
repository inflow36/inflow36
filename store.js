import { getDashboardDocRef } from './firebase-config.js';

const STORAGE_KEY_PREFIX = 'inflow36_data_';

export const store = {
  // Clear feature helper (App.js ಗಾಗಿ)
  async clearFeature(moduleId) {
    localStorage.removeItem(STORAGE_KEY_PREFIX + moduleId);
    const docRef = getDashboardDocRef();
    if (docRef) {
      try {
        await docRef.collection('modules').doc(moduleId).delete();
      } catch (err) {
        console.error(`Clear error for ${moduleId}:`, err);
      }
    }
  },

  // Load module entries
  async loadEntries(moduleId) {
    const docRef = getDashboardDocRef();
    if (docRef) {
      try {
        const doc = await docRef.collection('modules').doc(moduleId).get();
        if (doc.exists && doc.data().entries) {
          const cloudData = doc.data().entries;
          localStorage.setItem(STORAGE_KEY_PREFIX + moduleId, JSON.stringify(cloudData));
          return cloudData;
        }
      } catch (err) {
        console.warn(`Firestore load failed for ${moduleId}, using LocalStorage:`, err);
      }
    }

    const localData = localStorage.getItem(STORAGE_KEY_PREFIX + moduleId);
    return localData ? JSON.parse(localData) : [];
  },

  // Save module entries
  async saveEntries(moduleId, entries) {
    localStorage.setItem(STORAGE_KEY_PREFIX + moduleId, JSON.stringify(entries));

    const docRef = getDashboardDocRef();
    if (docRef) {
      try {
        await docRef.collection('modules').doc(moduleId).set({
          entries: entries,
          updatedAt: new Date().toISOString()
        });
        console.log(`Synced ${moduleId} to Firebase successfully.`);
      } catch (err) {
        console.error(`Firebase Sync Error for ${moduleId}:`, err);
      }
    }
  },

  // Add single entry
  async addEntry(moduleId, entryData) {
    const entries = await this.loadEntries(moduleId);
    const newEntry = {
      id: 'entry_' + Date.now(),
      createdAt: new Date().toISOString(),
      ...entryData
    };
    entries.unshift(newEntry);
    await this.saveEntries(moduleId, entries);
    return newEntry;
  },

  // Delete entry
  async deleteEntry(moduleId, entryId) {
    let entries = await this.loadEntries(moduleId);
    entries = entries.filter(e => e.id !== entryId);
    await this.saveEntries(moduleId, entries);
  }
};

// Named export for clearFeature compatibility
export const clearFeature = (moduleId) => store.clearFeature(moduleId);