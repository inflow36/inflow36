// firebase-config.js

// Firebase App configuration
const firebaseConfig = {
  apiKey: "AIzaSy...", // Firebase Console Project Settings ನಲ್ಲಿರುವ ನಿಜವಾದ apiKey ಹಾಕಿ
  authDomain: "inflow36-2160c.firebaseapp.com",
  projectId: "inflow36-2160c",
  storageBucket: "inflow36-2160c.firebasestorage.app",
  messagingSenderId: "135542995416",
  appId: "1:135542995416:web:..." // Firebase Console ನಲ್ಲಿರುವ ನಿಜವಾದ appId ಹಾಕಿ
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// Anonymous Auto-Login to handle initial auth seamlessly
auth.onAuthStateChanged(user => {
  if (!user) {
    auth.signInAnonymously().catch(err => {
      console.error("Firebase Anonymous Auth Error:", err);
    });
  } else {
    console.log("Firebase Auth Active. User ID:", user.uid);
  }
});

// Helper Function to get Firestore Document Reference
export function getDashboardDocRef() {
  const user = auth.currentUser;
  if (!user) {
    // Auth ಲೋಡ್ ಆಗುವ ತನಕ 'default_user' ಗೆ ಸಿಂಕ್ ಮಾಡುತ್ತದೆ
    return db.collection('dashboards').doc('default_user');
  }
  return db.collection('dashboards').doc(user.uid);
}

export { auth, db };