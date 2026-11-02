# Remember a Day — Complete Surprise Studio Upgrade

This is the integrated project based on the uploaded Remember a Day project. Existing occasion, calendar, memories, reminder and Capacitor files are retained. New feature files are under `www/`.

## New feature
- Gift card studio with 20 original CSS-based design templates and categories.
- Custom recipient/sender, heading, message, date, colour mood and up to 4 photos.
- Live preview, PNG download and native share-sheet attempt (download fallback).
- Animated interactive gift box with personalised reveal, optional photo selection and music file selection.
- Photo-memory collage creator with up to 8 photos, layouts, PNG download and link sharing.
- Optional Supabase-backed shareable links and remote photo storage.
- Shared link recipient view runs in the same hosted page; recipients do not need the Android app.
- New home-screen shortcut and updated service-worker cache.

## Run locally
Open the project root in VS Code and start Live Server from `www/index.html`.
Open the Studio using the new **Create a Surprise** home-screen card or `www/pages/surprise-studio.html`.

## Android
From the project root:
```bash
npm install
npx cap sync android
```
Then open `android/` in Android Studio and build/run the app.

## Enable Supabase share links
1. Create a Supabase project.
2. Open `www/js/supabase-config.js`.
3. Set `url` to the Project URL and `anonKey` to the project's anon/public key. Never use the service-role key in a client app.
4. In Supabase SQL Editor, run `supabase-setup.sql`.
5. The SQL creates the `surprises` table, policies and a public `surprise-media` bucket.
6. Deploy the `www/` folder to a static HTTPS host (e.g. GitHub Pages) for recipients to open links.

Until Supabase is configured, local template editing, gift-box preview, memory preview and PNG downloads work. Shareable links are intentionally disabled rather than pretending a local-only link will work on another device.

## Security and production notes
The included SQL is a starter configuration for a personal prototype. Anonymous users can create and read non-expired surprise records and upload files to a public bucket. Anyone with a shared link can view its content. Do not put sensitive information in a surprise. Before public release, add authentication or CAPTCHA/rate limiting, upload quotas, moderation/abuse controls, and a cleanup policy for expired records/files. The anon key is designed for client use only when Row Level Security is enabled; never expose a service-role key.

## Notes
- Browser and Android native sharing support varies. If file sharing is unavailable, the card PNG can be downloaded and attached manually.
- Selected music is currently a design input for future playback support; this version does not upload/play music in the recipient experience.
- This package is an integrated source project. Build a new APK in Android Studio after syncing.
