// Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyBu2ncBIQHklNZUpQcnMj-_2lLtlTvGm8Y",
  authDomain: "inflow36-2160c.firebaseapp.com",
  projectId: "inflow36-2160c",
  storageBucket: "inflow36-2160c.firebasestorage.app",
  messagingSenderId: "135542995416",
  appId: "1:135542995416:web:c2e4c689793ba767889aad",
  measurementId: "G-Y5CEWYXRTG"
};

// Global Initialization
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const db = (typeof firebase !== 'undefined' && firebase.apps.length) ? firebase.firestore() : null;

// Static User ID to sync all devices (Desktop & Mobile)
export const SYNC_USER_ID = "main_user_dashboard";

// Helper function to get single document reference
export function getDashboardDocRef() {
  if (db) {
    return db.collection('lifeDashboards').doc(SYNC_USER_ID);
  }
  return null;
}