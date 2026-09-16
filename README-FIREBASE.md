# Firebase setup for My Life Dashboard

## Required Firebase settings

1. Firebase Console → Authentication → Sign-in method → enable **Google**.
2. Firestore Database must be enabled.
3. Firestore Database → Rules → publish the included `firestore.rules`.
4. Authentication → Settings → Authorized domains → make sure `inflow36.github.io` is present for the deployed site. `localhost` is present for local testing.
5. The browser uses the Firebase Web App configuration from Project settings.

Anonymous authentication is not used by the app. It can remain enabled in the Firebase console, but it is not part of the dashboard login/sync flow.

## Firestore structure

The app writes to:

`dashboards/{GoogleUserUID}/modules/{moduleId}`

Each module document contains:

- `entries`: array of module entries
- `updatedAt`: Firestore server timestamp
- `updatedBy`: signed-in Google user's UID

## Run locally

Do not open `index.html` directly. Run `start-local-server.command`, then open `http://localhost:4173`.

## Troubleshooting

If data is saved locally but not appearing in Firestore:

1. Confirm you are signed into the same Google account on both devices.
2. Open browser DevTools → Console and look for `Firestore sync failed` or `Realtime sync failed`.
3. Confirm the Firestore Rules match the included `firestore.rules`.
4. In Firestore → Data, look for `dashboards` → your Google UID → `modules`.
