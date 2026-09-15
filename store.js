import { getDashboardDocRef } from './firebase-config.js';

const STORAGE_KEY_PREFIX = 'inflow36_data_';

export const store = {
  // Load module entries (First from Firestore, fallback to LocalStorage)
  async loadEntries(moduleId) {
    const docRef = getDashboardDocRef();
    if (docRef) {
      try {
        const doc = await docRef.collection('modules').doc(moduleId).get();
        if (doc.exists && doc.data().entries) {
          const cloudData = doc.data().entries;
          // Sync to LocalStorage for offline support
          localStorage.setItem(STORAGE_KEY_PREFIX + moduleId, JSON.stringify(cloudData));
          return cloudData;
        }
      } catch (err) {
        console.warn(`Firestore load failed for ${moduleId}, using LocalStorage:`, err);
      }
    }

    // LocalStorage Fallback
    const localData = localStorage.getItem(STORAGE_KEY_PREFIX + moduleId);
    return localData ? JSON.parse(localData) : [];
  },

  // Save module entries (Saves to both Firestore & LocalStorage)
  async saveEntries(moduleId, entries) {
    // 1. Save to LocalStorage immediately
    localStorage.setItem(STORAGE_KEY_PREFIX + moduleId, JSON.stringify(entries));

    // 2. Sync to Firebase Cloud
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