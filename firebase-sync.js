// Deprecated compatibility shim.
// The app's Firebase setup and authentication now live in firebase-config.js.
export {
  firebaseConfig,
  auth,
  db,
  authReady,
  signInWithGoogle,
  signOutUser,
  getDashboardDocRef
} from './firebase-config.js';
