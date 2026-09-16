# Firebase Sync Fixes

## Root causes found

1. `firebase-config.js` had placeholder values (`AIzaSy...` and an incomplete `appId`), so the deployed code did not contain the actual Firebase Web App configuration shown in the Firebase Console screenshot.
2. `app.js` imported `authReady`, `signInWithGoogle`, and `signOutUser`, but the current `firebase-config.js` did not export them. That breaks the module initialization.
3. The current code automatically signed in anonymously. Anonymous Firebase users have device-specific UIDs, so different devices did not share the same dashboard identity.
4. The current code wrote to `dashboards/{uid}`, while the Firestore rules shown in the Firebase Console and the supplied rules file use `lifeDashboards/{uid}`. The path and rules therefore did not match.
5. Initial realtime listeners could race with local-data migration and briefly apply an empty cloud module over existing LocalStorage data.
6. Local pending edits could be overwritten by a cloud copy during loading without comparing update times.
7. `app.js` contained an accidental duplicated `showForm` declaration and had lost the textarea rendering branch.

## Changes made

- Restored the Firebase Web App configuration from the supplied Firebase Console screenshot.
- Restored Google redirect authentication and `authReady`.
- Removed anonymous auto-login from the application code.
- Standardized Firestore storage on `lifeDashboards/{uid}/modules/{moduleId}`.
- Added safer local/cloud migration and pending-write handling.
- Added local edit timestamps for safer startup conflict handling.
- Start local migration before realtime listeners to avoid empty-snapshot races.
- Restored proper `<textarea>` rendering for Quick Notes.
- Updated documentation and Firestore rules.
- Added a compatibility `firebase-sync.js` shim so the old file no longer contains a second, incorrect Firebase configuration.
- Bumped the `app.js` cache version in `index.html` to `v=6`.

## Firestore rules

The rules remain user-scoped: a signed-in user can read/write only their own `lifeDashboards/{uid}` document and its `modules` subcollection.


## Follow-up fix — 16 Sep 2026

The previous package used the Firestore root collection `lifeDashboards`. The supplied Firebase Console screenshot shows that the deployed Firestore Rules are configured for `dashboards/{userId}/modules/{moduleId}`. This mismatch causes Firestore writes to fail with `permission-denied` even though localStorage saves successfully.

The website code has now been changed back to the Firebase Console's actual `dashboards/{uid}/modules/{moduleId}` path so it matches the rules and preserves any existing cloud data stored there.

**Important:** deploy the website files and make sure the Firestore Rules in the Firebase Console are the same as `firestore.rules` in this ZIP.
