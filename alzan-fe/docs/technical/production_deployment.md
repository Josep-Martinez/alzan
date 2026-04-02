# Android Production Build & Deployment Guide

## Overview

This guide documents the configuration and steps required to build and deploy the Android version of the Alzan Health app for production (Google Play Store).

**Tools**: EAS Build, Google Play Console

## 1. Environment Variables (Critical)

For the app to function in production (specifically to connect to Supabase), it requires environment variables. Since `.env` files are gitignored, these **MUST** be configured in EAS Secrets.

### Current Configuration

We use **EAS Secrets** to securely inject these values during the build process.

- `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase Project URL.
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Public/Anon Key.
- `EXPO_PUBLIC_SUPABASE_KEY`: (Same as Anon Key, often used as fallback).

### Managing Secrets

To view the current secrets:

```bash
eas secret:list
```

To update or add a secret:

```bash
eas secret:create --scope project --name MY_VARIABLE --value "my-value" --type string
```

> **Warning:** If these secrets are missing, the app will **crash immediately on startup** because the Supabase client cannot initialize.

## 2. R8 Optimization & Minification

To keep the app size small (approx 15-20MB instead of 50MB+), we use R8 shrinking and obfuscation.

### Configuration (`app.json`)

The following settings in `app.json` control this:

```json
"expo-build-properties",
{
  "android": {
    "enableShrinkResourcesInReleaseBuilds": true,
    "enableMinifyInReleaseBuilds": true
  }
}
```

And the custom plugin:

```json
"./plugins/withOptimizedR8"
```

### Troubleshooting Crashes

If the app crashes immediately after the splash screen in production but works in development:

1.  **Check Env Vars:** This is the #1 cause. Ensure EAS Secrets are set.
2.  **Disable R8:** Temporarily set `enableShrinkResourcesInReleaseBuilds` and `enableMinifyInReleaseBuilds` to `false` in `app.json` and rebuild. If it works, R8 is stripping necessary code.

## 3. Build & Release Process

### Generating the Build (.aab)

To create a production bundle for the Play Store:

```bash
eas build --platform android
```

This generates an `.aab` file. You **cannot** install this directly on a phone.

### Generating a Test APK

To test on a physical device without using the Play Store:

```bash
eas build --profile preview --platform android
```

This generates a standard `.apk` file.

### Uploading to Play Console

1.  Download the `.aab` from the EAS Dashboard.
2.  Go to **Google Play Console** > **Testing** > **Internal testing**.
3.  Create a new release and upload the `.aab`.
4.  Add your email to the testers list.
5.  Use the copyable link to download/update the app on your device.
