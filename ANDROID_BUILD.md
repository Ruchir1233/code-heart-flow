# Pankti Engineering — Android APK Build Guide

The web app is wrapped with [Capacitor](https://capacitorjs.com) for Android.

- **App ID**: `com.panktiengineering.crm`
- **App Name**: `Pankti Engineering`
- **Web build output**: `dist/`
- **Splash**: `public/splash.png`
- **Icon**: `public/icon-512.png`

> Supabase, `tel:` and `https://wa.me/...` links all work inside the Android
> WebView out of the box — no extra plugins required.

---

## 1. One-time setup (on your machine)

Install these once:
- **Node.js 20+** and **bun** (or npm)
- **Android Studio** (latest) with the Android SDK 34+
- **JDK 17** (bundled with Android Studio)

Export the project from Lovable to GitHub (top-right → GitHub → Connect),
then clone it locally:

```bash
git clone https://github.com/<your-user>/<your-repo>.git
cd <your-repo>
bun install
```

## 2. Add Capacitor + Android platform

```bash
# Capacitor core + CLI + Android
bun add @capacitor/core @capacitor/cli @capacitor/android @capacitor/splash-screen

# Build the web app first (Capacitor copies dist/ into the Android project)
bun run build

# Initialize Android (only the first time)
bunx cap add android
```

`capacitor.config.ts` (already in the repo) sets the package name to
`com.panktiengineering.crm` and app name to `Pankti Engineering`.

## 3. Generate launcher icons & splash

```bash
bun add -D @capacitor/assets

# Put square 1024x1024 (or larger) source files at the repo root:
#   resources/icon.png    → use public/icon-512.png upscaled, or your own
#   resources/splash.png  → use public/splash.png
mkdir -p resources
cp public/icon-512.png resources/icon.png
cp public/splash.png   resources/splash.png

bunx capacitor-assets generate --android
```

This generates all Android launcher densities + adaptive icon + splash.

## 4. Sync and open in Android Studio

```bash
bun run build && bunx cap sync android
bunx cap open android
```

In Android Studio:
1. Let Gradle sync finish.
2. **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
3. Click "locate" in the toast → grab `app-debug.apk` from
   `android/app/build/outputs/apk/debug/`.

## 5. Release (signed) APK / AAB

1. **Build → Generate Signed Bundle / APK…**
2. Choose **APK** (for sideloading) or **Android App Bundle** (for Play Store).
3. Create a new keystore (keep the `.jks` file safe — you need it for every
   future update) or pick an existing one.
4. Pick build variant `release`. Output lands in
   `android/app/release/app-release.apk`.

## 6. Updating the app later

Every time you change web code:

```bash
bun run build
bunx cap sync android
# then rebuild APK in Android Studio
```

---

## Permissions

WhatsApp and Phone work via OS intents — no Android permissions needed:
- `tel:9876543210` opens the dialer
- `https://wa.me/91...` opens WhatsApp if installed, else browser

## Supabase inside the WebView

The Supabase JS client uses fetch + WebSocket, both fully supported by
Android WebView. Realtime, auth, and queries all work without extra config.
Make sure RLS policies on the `enquiries` table allow the `anon` role.
