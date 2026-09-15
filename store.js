import { getDashboardDocRef, authReady } from './firebase-config.js';

const STORAGE_KEY_PREFIX = 'inflow36_data_';

function localKey(moduleId) { return STORAGE_KEY_PREFIX + moduleId; }
function readLocal(moduleId) {
  try { return JSON.parse(localStorage.getItem(localKey(moduleId)) || '[]'); }
  catch { return []; }
}
function writeLocal(moduleId, entries) {
  localStorage.setItem(localKey(moduleId), JSON.stringify(entries));
}

export async function loadEntries(moduleId) {
  const localData = readLocal(moduleId);
  try {
    await authReady;
    const dashboardRef = await getDashboardDocRef();
    if (!dashboardRef) return localData;
    const snapshot = await dashboardRef.collection('modules').doc(moduleId).get();
    if (snapshot.exists && Array.isArray(snapshot.data().entries)) {
      const cloudData = snapshot.data().entries;
      writeLocal(moduleId, cloudData);
      return cloudData;
    }
  } catch (error) {
    console.error(`Firestore load failed for ${moduleId}:`, error);
  }
  return localData;
}

export async function saveEntries(moduleId, entries) {
  writeLocal(moduleId, entries);
  try {
    await authReady;
    const dashboardRef = await getDashboardDocRef();
    if (!dashboardRef) throw new Error('Firebase authentication/database is unavailable');
    await dashboardRef.collection('modules').doc(moduleId).set({
      entries,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.log(`Synced ${moduleId} to Cloud Firestore successfully.`);
    return { ok: true };
  } catch (error) {
    console.error(`Firestore sync failed for ${moduleId}:`, error);
    return { ok: false, error };
  }
}

export async function addEntry(moduleId, entryData) {
  const entries = await loadEntries(moduleId);
  const newEntry = { id: 'entry_' + Date.now(), createdAt: new Date().toISOString(), ...entryData };
  entries.unshift(newEntry);
  await saveEntries(moduleId, entries);
  return newEntry;
}

export async function deleteEntry(moduleId, entryId) {
  const entries = (await loadEntries(moduleId)).filter(entry => entry.id !== entryId);
  return saveEntries(moduleId, entries);
}

export async function clearFeature(moduleId) {
  localStorage.removeItem(localKey(moduleId));
  try {
    await authReady;
    const dashboardRef = await getDashboardDocRef();
    if (dashboardRef) await dashboardRef.collection('modules').doc(moduleId).delete();
    return { ok: true };
  } catch (error) {
    console.error(`Clear error for ${moduleId}:`, error);
    return { ok: false, error };
  }
}

export const store = { loadEntries, saveEntries, addEntry, deleteEntry, clearFeature };
