# Building the XetaX CRM APK / AAB

## Option A — local build (no Expo account)
Requirements (already on this machine): JDK 21 at `/usr/lib/jvm/java-21-openjdk-amd64`, Android SDK at `~/Android/Sdk`.

```bash
cd ~/Music/xetax-mobile
./build-apk.sh      # → android/app/build/outputs/apk/release/app-release.apk
./build-aab.sh      # → android/app/build/outputs/bundle/release/app-release.aab (Play Store)
```
The scripts run `expo prebuild` (generates `android/`) and then Gradle. First run takes ~10–15 min
(Gradle downloads); later runs ~3–5 min.

### Signing
The first `prebuild` uses the debug keystore. For a real release create one once and keep it safe:
```bash
mkdir -p credentials && keytool -genkeypair -v -keystore credentials/xetax-release.keystore \
  -alias xetax -keyalg RSA -keysize 2048 -validity 10000
```
Then add `signingConfigs.release` in `android/app/build.gradle` (see the prp-ces-mobile project for
the exact snippet) — or use Option B and let EAS manage the keystore.
`credentials/` and `android/` are git-ignored. **Losing the keystore means you cannot update the app.**

### Before each release
1. Bump `expo.version` and `expo.android.versionCode` in `app.json`.
2. `./build-apk.sh` (or `./build-aab.sh`).
3. Install: `adb install -r android/app/build/outputs/apk/release/app-release.apk` or share the file.

## Option B — EAS Build (cloud, Expo account)
```bash
npx eas-cli login
npx eas build -p android --profile production    # APK
npx eas build -p android --profile playstore     # AAB
```
Profiles are in `eas.json`.

## Server
The app talks to `https://api.xetacrm.pro/` by default (`src/lib/config.js`). The login screen's
**Server** switch flips to local for development; remove that Pressable in `src/app/(auth)/login.jsx`
if you don't want customers to see it.
