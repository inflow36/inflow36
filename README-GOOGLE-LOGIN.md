Google login troubleshooting

This version uses Firebase Google signInWithRedirect instead of a popup, which is more reliable on mobile browsers and when popups are blocked.

In Firebase Console, Authentication > Settings > Authorized domains, add the exact domain where this website is hosted. Do not add http:// or https://, and do not add a path.
