import { auth, getDashboardDocRef, authReady } from './firebase-config.js';

const STORAGE_KEY_PREFIX = 'inflow36_data_';
const PENDING_MODULES_KEY = `${STORAGE_KEY_PREFIX}pending_modules`;
const cachedEntries = new Map();
const subscribers = new Set();
const syncUnsubscribers = new Map();
const saveQueues = new Map();
const pendingLocalModules = new Set((() => {
  try { return JSON.parse(localStorage.getItem(PENDING_MODULES_KEY) || '[]'); }
  catch { return []; }
})());

function localKey(moduleId) { return STORAGE_KEY_PREFIX + moduleId; }
function readLocal(moduleId) {
  try { return JSON.parse(localStorage.getItem(localKey(moduleId)) || '[]'); }
  catch { return []; }
}
function writeLocal(moduleId, entries) {
  localStorage.setItem(localKey(moduleId), JSON.stringify(entries));
  cachedEntries.set(moduleId, entries);
}

function rememberPending(moduleId) {
  pendingLocalModules.add(moduleId);
  localStorage.setItem(PENDING_MODULES_KEY, JSON.stringify([...pendingLocalModules]));
}

function forgetPending(moduleId) {
  pendingLocalModules.delete(moduleId);
  localStorage.setItem(PENDING_MODULES_KEY, JSON.stringify([...pendingLocalModules]));
}

function notify(moduleId, entries, source) {
  subscribers.forEach(listener => listener({ moduleId, entries, source }));
}

function applyEntries(moduleId, entries, source) {
  writeLocal(moduleId, entries);
  notify(moduleId, entries, source);
  return entries;
}

export async function loadEntries(moduleId) {
  const localData = cachedEntries.has(moduleId) ? cachedEntries.get(moduleId) : readLocal(moduleId);
  try {
    await authReady;
    const dashboardRef = await getDashboardDocRef();
    if (!dashboardRef) return localData;
    const snapshot = await dashboardRef.collection('modules').doc(moduleId).get();
    if (snapshot.exists && Array.isArray(snapshot.data().entries)) {
      const cloudData = snapshot.data().entries;
      applyEntries(moduleId, cloudData, 'cloud-load');
      return cloudData;
    }
  } catch (error) {
    console.error(`Firestore load failed for ${moduleId}:`, error);
  }
  return localData;
}

export async function saveEntries(moduleId, entries) {
  // Save locally first, so an entry is never lost while the device is offline.
  applyEntries(moduleId, entries, 'local-save');
  rememberPending(moduleId);

  // Preserve save order for rapid auto-saves (for example, Quick Notes typing).
  const previous = saveQueues.get(moduleId) || Promise.resolve();
  const queuedSave = previous.catch(() => undefined).then(async () => {
    await authReady;
    const dashboardRef = await getDashboardDocRef();
    if (!dashboardRef) throw new Error('Firebase authentication/database is unavailable');
    await dashboardRef.collection('modules').doc(moduleId).set({
      entries,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: auth.currentUser.uid
    }, { merge: true });
    // Do not mark a newer edit as synced when an earlier queued save finishes.
    if (cachedEntries.get(moduleId) === entries) forgetPending(moduleId);
  });
  saveQueues.set(moduleId, queuedSave);

  try {
    await queuedSave;
    console.log(`Synced ${moduleId} to Cloud Firestore successfully.`);
    return { ok: true };
  } catch (error) {
    console.error(`Firestore sync failed for ${moduleId}:`, error);
    return { ok: false, error };
  }
}

// Retry only entries that previously failed to reach Firestore. This avoids
// overwriting a healthy cloud copy merely because a user logged in again.
export async function retryPendingWrites() {
  const moduleIds = [...pendingLocalModules];
  await Promise.all(moduleIds.map(moduleId => saveEntries(
    moduleId,
    cachedEntries.has(moduleId) ? cachedEntries.get(moduleId) : readLocal(moduleId)
  )));
}

// Firestore sends remote changes here immediately, keeping desktop and mobile in sync.
export async function startRealtimeSync(moduleIds) {
  await authReady;
  const dashboardRef = await getDashboardDocRef();
  if (!dashboardRef) return false;

  stopRealtimeSync();
  moduleIds.forEach(moduleId => {
    const unsubscribe = dashboardRef.collection('modules').doc(moduleId).onSnapshot(
      snapshot => {
        if (!snapshot.exists || !Array.isArray(snapshot.data().entries)) return;
        // Local writes are already reflected in the screen. Remote writes trigger updates here.
        if (snapshot.metadata.hasPendingWrites) return;
        applyEntries(moduleId, snapshot.data().entries, 'remote-sync');
      },
      error => console.error(`Realtime sync failed for ${moduleId}:`, error)
    );
    syncUnsubscribers.set(moduleId, unsubscribe);
  });
  return true;
}

// Move pre-existing browser-only entries to Firestore once, without replacing
// a dashboard that already exists in the cloud.
export async function backupLocalEntries(moduleIds) {
  await authReady;
  const dashboardRef = await getDashboardDocRef();
  if (!dashboardRef) return false;

  await Promise.all(moduleIds.map(async moduleId => {
    const entries = cachedEntries.has(moduleId) ? cachedEntries.get(moduleId) : readLocal(moduleId);
    if (!entries.length) return;
    const moduleRef = dashboardRef.collection('modules').doc(moduleId);
    const snapshot = await moduleRef.get();
    if (!snapshot.exists) {
      await moduleRef.set({
        entries,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedBy: auth.currentUser.uid
      });
    }
  }));
  return true;
}

export function stopRealtimeSync() {
  syncUnsubscribers.forEach(unsubscribe => unsubscribe());
  syncUnsubscribers.clear();
}

export function subscribe(listener) {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
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
  forgetPending(moduleId);
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

export const store = {
  loadEntries, saveEntries, addEntry, deleteEntry, clearFeature,
  startRealtimeSync, backupLocalEntries, retryPendingWrites, stopRealtimeSync, subscribe
};

window.addEventListener('online', () => {
  retryPendingWrites().catch(error => console.error('Pending cloud backup retry failed:', error));
});
