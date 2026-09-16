// Firebase App configuration
const firebaseConfig = {
  // ನಿಮ್ಮ ಪ್ರಾಜೆಕ್ಟ್ ಸೆಟ್ಟಿಂಗ್ಸ್‌ನಲ್ಲಿರುವ Config ವಿವರಗಳನ್ನು ಇಲ್ಲಿ ಹಾಕಿ
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// ಸೈಟ್ ಓಪನ್ ಆಗ್ತಿದ್ದಂತೆ ಆಟೋಮ್ಯಾಟಿಕ್ ಲಾಗಿನ್ ಆಗಲು:
auth.onAuthStateChanged(user => {
  if (!user) {
    auth.signInAnonymously().catch(err => {
      console.error("Firebase Anonymous Auth Error:", err);
    });
  } else {
    console.log("Firebase Auth Ready. User ID:", user.uid);
  }
});

export function getDashboardDocRef() {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }
  // User ID ಆಧಾರದ ಮೇಲೆ Correct Path ರಿಟರ್ನ್ ಮಾಡುತ್ತದೆ
  return db.collection('dashboards').doc(user.uid);
}

export { auth, db };