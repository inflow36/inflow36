// Firebase configuration and shared authentication.
export const firebaseConfig = {
  apiKey: "AIzaSyBu2ncBIQHklNZUpQcnMj-_2lLtlTvGm8Y",
  authDomain: "inflow36-2160c.firebaseapp.com",
  projectId: "inflow36-2160c",
  storageBucket: "inflow36-2160c.firebasestorage.app",
  messagingSenderId: "135542995416",
  appId: "1:135542995416:web:c2e4c689793ba767889aad",
  measurementId: "G-Y5CEWYXRTG"
};

export const SYNC_USER_ID = "main_user_dashboard";

const firebaseAvailable = typeof firebase !== 'undefined';
if (!firebaseAvailable) {
  console.warn('Firebase SDK is not loaded. The app will use LocalStorage only.');
}

if (firebaseAvailable && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const db = firebaseAvailable && firebase.apps.length ? firebase.firestore() : null;
export const auth = firebaseAvailable && firebase.apps.length ? firebase.auth() : null;

// Do not sign in anonymously. The dashboard must require Google login.
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
  return auth.signInWithPopup(provider);
}

export async function signOutUser() {
  if (auth) await auth.signOut();
}

export async function getDashboardDocRef() {
  const user = await authReady;
  if (!db || !user) return null;
  return db.collection('lifeDashboards').doc(SYNC_USER_ID);
}
