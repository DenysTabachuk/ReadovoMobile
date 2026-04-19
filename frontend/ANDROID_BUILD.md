# Android Build Notes

This app is an Expo / React Native project. Run Android commands from the `frontend` directory, not from the repository root.

## Quick Run On A Connected Android Device

1. Check that ADB can see the phone:

```powershell
adb devices
```

The device should be listed with the `device` status, for example:

```text
8tvcfuukgu5llbga    device
```

If the status is `unauthorized`, accept the USB debugging prompt on the phone.

2. Build and install the debug app:

```powershell
cd C:\SpeaklyMobile\frontend
npm run android
```

This runs:

```powershell
expo run:android
```

## Build The APK Manually

If you only need the APK and do not want to run through Expo CLI:

```powershell
cd C:\SpeaklyMobile\frontend\android
.\gradlew.bat assembleDebug
```

The APK will be generated here:

```text
C:\SpeaklyMobile\frontend\android\app\build\outputs\apk\debug\app-debug.apk
```

Install the APK manually:

```powershell
adb install -r C:\SpeaklyMobile\frontend\android\app\build\outputs\apk\debug\app-debug.apk
```

## What Was Fixed

The original build error was:

```text
No matching variant of project :react-native-gesture-handler was found
No matching variant of project :react-native-reanimated was found
No matching variant of project :react-native-screens was found
No variants exist
```

The cause was a missing `@react-native-community/cli` dependency. Because of that, `react-native config` did not work correctly. Gradle autolinking included the native modules as projects, but did not configure them as Android libraries with debug/release variants.

This was fixed by running:

```powershell
cd C:\SpeaklyMobile\frontend
npm install --save-dev @react-native-community/cli
```

After that, `frontend/package.json` contains:

```json
"devDependencies": {
  "@react-native-community/cli": "^20.1.3"
}
```

Then `npx.cmd react-native config` started detecting Android native modules correctly, for example:

```text
react-native-gesture-handler -> android/sourceDir
react-native-reanimated -> android/sourceDir
react-native-screens -> android/sourceDir
```

## Common Problems

### `npx.ps1 cannot be loaded because running scripts is disabled`

PowerShell may block `.ps1` scripts. Use this instead of `npx`:

```powershell
npx.cmd react-native config
```

Or:

```powershell
npm.cmd run android
```

### `adb devices` Does Not Show The Phone

Check the following:

- USB debugging is enabled in Developer options.
- The RSA prompt was accepted on the phone.
- The USB cable supports data transfer, not only charging.
- Android / ADB drivers are installed.

After making changes, restart ADB:

```powershell
adb kill-server
adb start-server
adb devices
```

### Device Shows As `unauthorized`

Accept the `Allow USB debugging` prompt on the phone.

If the prompt does not appear:

```powershell
adb kill-server
adb start-server
adb devices
```

Then reconnect the USB cable.

### `No matching variant ... No variants exist`

Verify that the CLI dependency is installed:

```powershell
cd C:\SpeaklyMobile\frontend
npm install
npx.cmd react-native config
```

If `react-native config` says that `@react-native-community/cli` is missing, install it:

```powershell
npm install --save-dev @react-native-community/cli
```

Then run the Android build again:

```powershell
npm run android
```

### `NODE_ENV environment variable is required but was not specified`

If you build directly through Gradle, set `NODE_ENV`:

```powershell
cd C:\SpeaklyMobile\frontend\android
$env:NODE_ENV='development'
.\gradlew.bat assembleDebug
```

When using `npm run android`, Expo CLI usually sets the required environment automatically.

### Gradle Daemon Is Stuck After An Interrupted Build

If the build was interrupted or appears to be stuck for a long time, stop the daemon:

```powershell
cd C:\SpeaklyMobile\frontend\android
.\gradlew.bat --stop
```

Then run the build again:

```powershell
cd C:\SpeaklyMobile\frontend
npm run android
```

### npm Warning About Node Version

During `npm install`, you may see a warning like:

```text
Unsupported engine
required: ^20.19.0 || ^22.13.0 || >=24
current: v22.11.0
```

This is a warning and is not always fatal. If npm or the Android build behaves inconsistently, update Node to `22.13+` or use LTS `20.19+`.

## Useful Commands

```powershell
cd C:\SpeaklyMobile\frontend
npm install
npm run android
```

```powershell
cd C:\SpeaklyMobile\frontend
npx.cmd react-native config
```

```powershell
cd C:\SpeaklyMobile\frontend\android
.\gradlew.bat --stop
.\gradlew.bat assembleDebug
```
