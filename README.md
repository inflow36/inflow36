# ನನ್ನ ಲೈಫ್ Dashboard

The dashboard contains 14 editable modules under `features/`.

## Firebase sync

This version uses Google Authentication as the identity for the dashboard. It does **not** use anonymous authentication, because anonymous users receive a different UID on different devices and therefore cannot share one dashboard.

### Firebase Console

1. Authentication → Sign-in method → Google: **Enabled**.
2. Authentication → Settings → Authorized domains: add the production hostname (the screenshots show `inflow36.github.io`) and keep `localhost` for local testing.
3. Firestore Database: create/enable the database.
4. Firestore Rules: publish the included `firestore.rules`.
5. The app uses this path:
   `lifeDashboards/{GoogleUserUID}/modules/{moduleId}`

### Local testing

Do not open `index.html` directly. Run `start-local-server.command`, then open:

`http://localhost:4173`

For the deployed site, use the HTTPS URL configured in Firebase Authorized domains.

### Sync behavior

- Every save is written to LocalStorage first.
- The same save is queued to Firestore for the signed-in Google account.
- If the network is temporarily unavailable, pending modules are retried when the browser comes back online.
- Existing local-only entries are migrated when the matching cloud module is missing or empty.
- Realtime Firestore listeners update another open device after a committed cloud change.
- Local pending edits are compared with the cloud `updatedAt` value so an older cloud copy does not silently replace a newer local edit.
