# Google login troubleshooting

This version uses Firebase Google `signInWithRedirect`, which works well on desktop and mobile browsers.

## Firebase Console

- Authentication → Sign-in method → **Google: Enabled**.
- Authentication → Settings → Authorized domains → `inflow36.github.io` must be present for the deployed site.
- `localhost` is used for local testing.
- Anonymous authentication is **not** used by this app.

## If login works but data is missing

The app identifies the dashboard by the signed-in Google user's Firebase UID. Make sure the same Google account is used on every device.

Firestore location:

`lifeDashboards/{GoogleUserUID}/modules/{moduleId}`
