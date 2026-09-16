// Firebase App configuration
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY", // Firebase Project Settings ನಿಂದ ಸಿಗುವ API Key ಹಾಕಿ
  authDomain: "inflow36-2160c.firebaseapp.com",
  projectId: "inflow36-2160c",
  storageBucket: "inflow36-2160c.firebasestorage.app",
  messagingSenderId: "135542995416",
  appId: "YOUR_ACTUAL_APP_ID" // Firebase ನಲ್ಲಿ ಸಿಗುವ Web App ID (1:135542995416:web:...)
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// Anonymous Auto-Login to ensure Firebase Auth passes
auth.onAuthStateChanged(user => {
  if (!user) {
    auth.signInAnonymously().catch(err => {
      console.error("Firebase Anonymous Auth Error:", err);
    });
  } else {
    console.log("Firebase Auth Active. User ID:", user.uid);
  }
});

// Export Doc Reference Helper Function
export function getDashboardDocRef() {
  const user = auth.currentUser;
  if (!user) {
    // Fallback ID until Auth state initializes
    return db.collection('dashboards').doc('default_user');
  }
  return db.collection('dashboards').doc(user.uid);
}

export { auth, db };