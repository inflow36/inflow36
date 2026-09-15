// Backwards-compatible Firebase helpers. The dashboard itself uses store.js.
// Keeping this file on the same signed-in Google session prevents accidental
// anonymous writes to a different account or a second Firebase app instance.
import { authReady } from './firebase-config.js';
import { store } from './store.js';

export async function connectFirebase() {
  return Boolean(await authReady);
}

export async function syncFeature(featureId, entries) {
  return store.saveEntries(featureId, entries);
}

export async function syncAll(data) {
  return Promise.all(Object.entries(data).map(([featureId, entries]) => syncFeature(featureId, entries)));
}
