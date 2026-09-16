# Firebase Sync Check

If the app says `Local save ಆಯಿತು; Firebase sync ವಿಫಲವಾಗಿದೆ`, open browser DevTools → Console and look for the exact Firestore error.

For this project, the expected Firestore path is:

`dashboards / <Google UID> / modules / <moduleId>`

This matches the Firestore Rules shown in the supplied Firebase Console screenshot.

The most likely error from the previous build was `FirebaseError: Missing or insufficient permissions` because the code used `lifeDashboards` while the deployed rules allow `dashboards`.
