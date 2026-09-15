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