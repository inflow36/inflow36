# Firebase setup for My Life Dashboard

1. Firebase Console → Authentication → Sign-in method → enable Google.
2. The website now requires Google login before showing the dashboard.
3. Firestore must be enabled.
4. Add the exact hostname where the site runs under Authentication → Settings → Authorized domains. For local testing, Firebase normally already accepts `localhost`; use `http://localhost:4173` in the browser, never `file:///...`.
5. Do not put the Web client secret inside website code.
6. In Firestore Database → Rules, publish the contents of `firestore.rules`.

Important: Google provider must be enabled before testing the login button. Also add every production hostname (for example `your-site.web.app`) to Authorized domains — enter only the hostname, without `http://`, `https://`, or a path.

## Run locally

Do not open `index.html` directly. Run `start-local-server.command`, then open `http://localhost:4173` in Chrome. For mobile and computer sync, open the deployed site at `https://inflow36.github.io/`. Firebase Google login and cloud backup do not work reliably from a `file:///` website address.

## What now syncs automatically

- Every save is written to the device immediately, then backed up to the signed-in user's private Firestore area.
- Existing browser-only entries are copied to Firestore after the first successful Google login, but never overwrite an existing cloud dashboard.
- Firestore listens for changes in every dashboard module. A change on a phone is reflected on an open computer (and the reverse) without a manual refresh.
- If the device temporarily has no internet, the local copy remains available and the next save will retry on a later action. Check the browser console for a Firebase error if a save cannot reach the cloud.
