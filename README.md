# Clarix Mobile App

Native Android & iOS app for https://app.clarixai.com, built with Capacitor 8.
The app opens your live web app in a native shell, so any change you deploy to
app.clarixai.com shows up in the app instantly — no app update needed.

App ID: `ai.clarix.app`   ·   App name: `Clarix`

Included: app icon + splash screen, offline screen with Retry, Android back button
navigates back inside the app, logins persist between launches, and report
exports (Excel/PDF/CSV) save to the phone's Downloads folder.

---

## Option A — Get an APK without installing anything (GitHub)

1. Create a new **private** GitHub repo and push this folder to it.
2. Open the repo's **Actions** tab → "Build Android APK" → **Run workflow**.
3. After ~5 minutes, open the finished run and download **Clarix-debug-apk**.
4. Send the APK to your phone, open it, and allow "Install unknown apps".

## Option B — Build on your PC with Android Studio

    npm install
    npx cap sync android
    npx cap open android

In Android Studio: **Build → Build App Bundle(s) / APK(s) → Build APK(s)**.
Or plug in a phone with USB debugging on and press ▶ Run.

## Publishing to the Play Store

1. Android Studio → **Build → Generate Signed App Bundle / APK** → Android App Bundle.
2. Create a keystore when prompted — **back it up**; you need it for every future update.
3. Upload the `.aab` in Google Play Console ($25 one-time developer fee).

Play may reject a pure "website in a wrapper" with no app-specific value; the
offline screen, downloads and persistent login help, but adding push
notifications (e.g. ETL failure alerts) makes approval much more likely.

## iOS

Requires a Mac with Xcode and an Apple Developer account ($99/yr):

    npm install
    npx cap sync ios
    npx cap open ios

Then set your Team under Signing & Capabilities and run, or Archive for App Store.

## Changing things

- Website URL / allowed domains: `capacitor.config.json` → `server`
- Colors: `capacitor.config.json` → `SplashScreen` / `StatusBar`
- Icon & splash: replace files in `assets/`, then run
  `npx capacitor-assets generate --iconBackgroundColor '#0B1220' --splashBackgroundColor '#0B1220'`
- After any config change: `npx cap sync`
