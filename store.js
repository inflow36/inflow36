import { auth, getDashboardDocRef, authReady } from './firebase-config.js';

const STORAGE_KEY_PREFIX = 'inflow36_data_';
const PENDING_MODULES_KEY = `${STORAGE_KEY_PREFIX}pending_modules`;
const UPDATED_AT_PREFIX = `${STORAGE_KEY_PREFIX}updated_at_`;
const cachedEntries = new Map();
const subscribers = new Set();
const syncUnsubscribers = new Map();
const saveQueues = new Map();
const pendingLocalModules = new Set((() => {
  try { return JSON.parse(localStorage.getItem(PENDING_MODULES_KEY) || '[]'); }
  catch { return []; }
})());

function localKey(moduleId) { return STORAGE_KEY_PREFIX + moduleId; }
function updatedAtKey(moduleId) { return UPDATED_AT_PREFIX + moduleId; }

function readLocal(moduleId) {
  try {
    const value = JSON.parse(localStorage.getItem(localKey(moduleId)) || '[]');
    return Array.isArray(value) ? value : [];
  } catch { return []; }
}

function writeLocal(moduleId, entries) {
  const safeEntries = Array.isArray(entries) ? entries : [];
  localStorage.setItem(localKey(moduleId), JSON.stringify(safeEntries));
  cachedEntries.set(moduleId, safeEntries);
}

function getLocalUpdatedAt(moduleId) {
  const value = Number(localStorage.getItem(updatedAtKey(moduleId)) || 0);
  return Number.isFinite(value) ? value : 0;
}

function setLocalUpdatedAt(moduleId, value = Date.now()) {
  localStorage.setItem(updatedAtKey(moduleId), String(value));
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

function applyEntries(moduleId, entries, source, { markLocalChange = false } = {}) {
  writeLocal(moduleId, entries);
  if (markLocalChange) setLocalUpdatedAt(moduleId);
  notify(moduleId, entries, source);
  return entries;
}

function cloudMillis(snapshot) {
  const value = snapshot?.data()?.updatedAt;
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (value instanceof Date) return value.getTime();
  return Number(value) || 0;
}

export async function loadEntries(moduleId) {
  const localData = cachedEntries.has(moduleId) ? cachedEntries.get(moduleId) : readLocal(moduleId);

  try {
    await authReady;
    const dashboardRef = await getDashboardDocRef();
    if (!dashboardRef) return localData;

    const moduleRef = dashboardRef.collection('modules').doc(moduleId);
    const snapshot = await moduleRef.get();

    if (!snapshot.exists) {
      // First login on a device: move existing browser data to the user's cloud.
      if (localData.length) {
        await writeCloud(moduleRef, moduleId, localData);
        forgetPending(moduleId);
      }
      return localData;
    }

    const cloudData = snapshot.data()?.entries;
    if (!Array.isArray(cloudData)) return localData;

    // If this browser has an unsynced edit, do not silently replace it with
    // an older cloud copy. Compare the local edit time with Firestore metadata.
    if (pendingLocalModules.has(moduleId) && localData.length) {
      const localTime = getLocalUpdatedAt(moduleId);
      const remoteTime = cloudMillis(snapshot);
      if (localTime > remoteTime) {
        await writeCloud(moduleRef, moduleId, localData);
        forgetPending(moduleId);
        return localData;
      }
    }

    applyEntries(moduleId, cloudData, 'cloud-load');
    forgetPending(moduleId);
    return cloudData;
  } catch (error) {
    console.error(`Firestore load failed for ${moduleId}:`, error);
  }

  return localData;
}

async function writeCloud(moduleRef, moduleId, entries) {
  if (!auth?.currentUser) throw new Error('Firebase authentication is unavailable');
  await moduleRef.set({
    entries: Array.isArray(entries) ? entries : [],
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedBy: auth.currentUser.uid
  }, { merge: true });
}

export async function saveEntries(moduleId, entries) {
  // Local-first: the UI remains usable even if the network is temporarily down.
  applyEntries(moduleId, entries, 'local-save', { markLocalChange: true });
  rememberPending(moduleId);

  // Preserve save order for rapid saves such as Quick Notes typing.
  const previous = saveQueues.get(moduleId) || Promise.resolve();
  const queuedSave = previous.catch(() => undefined).then(async () => {
    await authReady;
    const dashboardRef = await getDashboardDocRef();
    if (!dashboardRef) throw new Error('Please sign in with Google before syncing');

    await writeCloud(dashboardRef.collection('modules').doc(moduleId), moduleId, entries);

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

export async function retryPendingWrites() {
  const moduleIds = [...pendingLocalModules];
  await Promise.all(moduleIds.map(moduleId => saveEntries(
    moduleId,
    cachedEntries.has(moduleId) ? cachedEntries.get(moduleId) : readLocal(moduleId)
  )));
}

export async function startRealtimeSync(moduleIds) {
  await authReady;
  const dashboardRef = await getDashboardDocRef();
  if (!dashboardRef) return false;

  stopRealtimeSync();
  moduleIds.forEach(moduleId => {
    const unsubscribe = dashboardRef.collection('modules').doc(moduleId).onSnapshot(
      snapshot => {
        if (!snapshot.exists || !Array.isArray(snapshot.data()?.entries)) return;
        // Local writes are already shown immediately. Ignore the pending local
        // echo and only apply the committed remote version.
        if (snapshot.metadata.hasPendingWrites) return;
        applyEntries(moduleId, snapshot.data().entries, 'remote-sync');
        forgetPending(moduleId);
      },
      error => console.error(`Realtime sync failed for ${moduleId}:`, error)
    );
    syncUnsubscribers.set(moduleId, unsubscribe);
  });
  return true;
}

export async function backupLocalEntries(moduleIds) {
  await authReady;
  const dashboardRef = await getDashboardDocRef();
  if (!dashboardRef) return false;

  await Promise.all(moduleIds.map(async moduleId => {
    const entries = cachedEntries.has(moduleId) ? cachedEntries.get(moduleId) : readLocal(moduleId);
    if (!entries.length) return;

    const moduleRef = dashboardRef.collection('modules').doc(moduleId);
    const snapshot = await moduleRef.get();

    // Migrate local data when the cloud module is missing or still empty.
    // Never replace an existing non-empty cloud module during login.
    const cloudEntries = snapshot.exists && Array.isArray(snapshot.data()?.entries)
      ? snapshot.data().entries : [];
    if (!snapshot.exists || cloudEntries.length === 0) {
      await writeCloud(moduleRef, moduleId, entries);
      forgetPending(moduleId);
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
  localStorage.removeItem(updatedAtKey(moduleId));
  forgetPending(moduleId);
  cachedEntries.delete(moduleId);
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
