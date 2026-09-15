# ನನ್ನ ಲೈಫ್ Dashboard

The 14 home buttons each have their own editable file under `features/`. The home design is retained; only the button icons and labels are larger, and the new **ತಕ್ವಾ** button was added.

## Firebase backup setup

1. Create a Firebase project and register a Web app.
2. Enable **Authentication > Sign-in method > Anonymous**.
3. Create a Firestore database and deploy appropriate authenticated-user rules.
4. Paste the Web app configuration values into `firebase-config.js`.

Once configured, every saved entry automatically backs up to Firestore. Until then, the dashboard remains usable with browser local storage.
