// Firebase configuration and shared authentication.
// This is the browser-safe Firebase Web App config from the Firebase Console.
export const firebaseConfig = {
  apiKey: "AIzaSyBu2ncBIQHklNZUpQcnMj-_2lLtlTvGm8Y",
  authDomain: "inflow36-2160c.firebaseapp.com",
  databaseURL: "https://inflow36-2160c-default-rtdb.firebaseio.com",
  projectId: "inflow36-2160c",
  storageBucket: "inflow36-2160c.firebasestorage.app",
  messagingSenderId: "135542995416",
  appId: "1:135542995416:web:c2e4c689793ba767889aad",
  measurementId: "G-Y5CEWYXRTG"
};

const firebaseAvailable = typeof firebase !== 'undefined';

if (!firebaseAvailable) {
  console.warn('Firebase SDK is not loaded. The app will use LocalStorage only.');
}

if (firebaseAvailable && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const db = firebaseAvailable && firebase.apps.length ? firebase.firestore() : null;
export const auth = firebaseAvailable && firebase.apps.length ? firebase.auth() : null;

// Resolve after Firebase has restored the current signed-in session.
// IMPORTANT: Do not use anonymous sign-in here. The same Google account must
// identify the dashboard on every device so Firestore can sync correctly.
export const authReady = new Promise(resolve => {
  if (!auth) return resolve(null);
  const unsubscribe = auth.onAuthStateChanged(user => {
    unsubscribe();
    resolve(user || null);
  });
});

export async function signInWithGoogle() {
  if (!auth) throw new Error('Firebase Authentication is unavailable');
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return auth.signInWithRedirect(provider);
}

export async function signOutUser() {
  if (auth) await auth.signOut();
}

export async function getDashboardDocRef() {
  if (!db || !auth) return null;

  // Prefer the current user. This matters immediately after a redirect login.
  const user = auth.currentUser || await authReady;
  if (!user) return null;

  // Canonical Firestore path. This matches firestore.rules.
  return db.collection('lifeDashboards').doc(user.uid);
}
