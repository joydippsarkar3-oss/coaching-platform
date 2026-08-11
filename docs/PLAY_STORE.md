# Play Store — Release Guide

> **Status:** Developer account already exists. Complete the three manual steps below,
> then the CI pipeline handles everything else.

---

## Step 1 — Generate a release keystore (one-time)

Run this on your machine (not on CI). Keep the `.jks` file and passwords in a
**secure password manager** — losing the keystore means you cannot update your app.

```bash
keytool -genkey -v \
  -keystore android/computrain.jks \
  -alias computrain \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

When prompted, fill in your organisation details (CN, OU, O, L, ST, C).

---

## Step 2 — Create `android/key.properties`

Copy the example file and fill in real values:

```bash
cp android/key.properties.example android/key.properties
```

Then edit `android/key.properties`:

```
storeFile=../computrain.jks
storePassword=YOUR_KEYSTORE_PASSWORD
keyAlias=computrain
keyPassword=YOUR_KEY_PASSWORD
```

`key.properties` is already in `.gitignore` and must never be committed.

---

## Step 3 — Build a signed release AAB

```bash
flutter build appbundle --release
```

Output: `build/app/outputs/bundle/release/app-release.aab`

Upload this file in the Play Console under **Production → Create new release**.

---

## Play Console checklist (first upload only)

| Item | Notes |
|---|---|
| App name | CompuTrain (or your franchise brand name) |
| Short description | ≤ 80 chars |
| Full description | ≤ 4000 chars |
| Screenshots | Phone: 2–8; Tablet: optional but recommended |
| Feature graphic | 1024 × 500 px |
| App icon | 512 × 512 px, PNG, no alpha |
| Content rating | Complete the questionnaire (Education category) |
| Privacy policy URL | `https://yourdomain.in/legal/privacy` |
| Target audience | Select appropriate age group (likely 13+) |
| Data safety form | Declare: name, phone, usage data collected; financial data processed but not retained |

---

## App signing — Play App Signing (recommended)

Opt in to **Play App Signing** when you first upload the AAB:

1. Play Console → Your app → Setup → App signing
2. Choose **"Use Play App Signing"**
3. Google re-signs with their key; your upload key is used only for verification

This protects you if your upload keystore is ever lost — you can generate a new
upload key and Google re-signs with the original app signing key.

---

## CI environment variables (GitHub Actions / Bitbucket Pipelines)

Store these as secrets and reference them in your workflow:

| Secret name | Value |
|---|---|
| `KEYSTORE_BASE64` | `base64 android/computrain.jks` output |
| `KEYSTORE_PASSWORD` | value from `storePassword` |
| `KEY_ALIAS` | `computrain` |
| `KEY_PASSWORD` | value from `keyPassword` |

Decode in CI before building:

```bash
echo "$KEYSTORE_BASE64" | base64 --decode > android/computrain.jks
```

---

## Version bumping

`versionCode` and `versionName` are read from `pubspec.yaml`:

```yaml
version: 1.0.0+1
#        ^^^^^  versionName
#              ^ versionCode (must increment on every Play Store upload)
```

Bump both before every release build.
