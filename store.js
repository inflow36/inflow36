import { getDashboardDocRef } from './firebase-config.js';

const STORAGE_KEY_PREFIX = 'inflow36_data_';

// 1. Load module entries
export async function loadEntries(moduleId) {
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
}

// 2. Save module entries
export async function saveEntries(moduleId, entries) {
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
}

// 3. Add single entry
export async function addEntry(moduleId, entryData) {
  const entries = await loadEntries(moduleId);
  const newEntry = {
    id: 'entry_' + Date.now(),
    createdAt: new Date().toISOString(),
    ...entryData
  };
  entries.unshift(newEntry);
  await saveEntries(moduleId, entries);
  return newEntry;
}

// 4. Delete entry
export async function deleteEntry(moduleId, entryId) {
  let entries = await loadEntries(moduleId);
  entries = entries.filter(e => e.id !== entryId);
  await saveEntries(moduleId, entries);
}

// 5. Clear feature
export async function clearFeature(moduleId) {
  localStorage.removeItem(STORAGE_KEY_PREFIX + moduleId);
  const docRef = getDashboardDocRef();
  if (docRef) {
    try {
      await docRef.collection('modules').doc(moduleId).delete();
    } catch (err) {
      console.error(`Clear error for ${moduleId}:`, err);
    }
  }
}

export const store = {
  loadEntries,
  saveEntries,
  addEntry,
  deleteEntry,
  clearFeature
};