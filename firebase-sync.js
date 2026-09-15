import { firebaseConfig } from './firebase-config.js';
let db, userId;
export const isConfigured = () => Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
export async function connectFirebase() {
  if (!isConfigured()) return false;
  const [{ initializeApp }, { getAuth, signInAnonymously }, { getFirestore, doc, setDoc, serverTimestamp }] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js'), import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js'), import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js')
  ]);
  const app = initializeApp(firebaseConfig); const credential = await signInAnonymously(getAuth(app)); userId = credential.user.uid; db = getFirestore(app); window.lifeFirebase = { doc, setDoc, serverTimestamp }; return true;
}
export async function syncFeature(featureId, entries) { if (!db || !userId) return false; const { doc, setDoc, serverTimestamp } = window.lifeFirebase; await setDoc(doc(db, 'lifeDashboards', userId, 'features', featureId), { entries, updatedAt: serverTimestamp() }); return true; }
export async function syncAll(data) { return Promise.all(Object.entries(data).map(([key, entries]) => syncFeature(key, entries))); }
