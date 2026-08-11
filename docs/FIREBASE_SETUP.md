# Firebase Setup Guide — CompuTrain Coaching Platform

This guide walks through every step required to configure Firebase so the Flutter app
works end-to-end with real FCM push notifications, phone authentication, and a
Node.js backend that sends notifications via `firebase-admin`.

---

## 1. Firebase Console Setup

### Create the projects

1. Open [console.firebase.google.com](https://console.firebase.google.com) and sign in
   with the Google account that owns the project.
2. Click **Add project**.
3. Project name: `computrain-production`
   - Firebase will suggest a project ID like `computrain-production-xxxxx`. You can
     shorten it to `computrain-production` if it is still available.
4. **Enable Google Analytics** → choose **No** and click **Create project**.
5. Repeat the steps above for a staging project named `computrain-staging`
   (project ID `computrain-staging`).

> **Why two projects?** Keeping staging and production completely separate avoids
> accidental cross-environment pushes and lets you test credential changes safely.

### Project settings you will need later

- **Project ID** — visible on the home card and under
  Project Settings → General → `Project ID`
- **Web API Key** — Project Settings → General → `Web API key`
- **Service account credentials** — Project Settings → Service accounts

---

## 2. Enable Authentication

### Phone sign-in

1. In the Firebase Console, open **Authentication** → **Sign-in method**.
2. Click **Phone** → toggle **Enable** → **Save**.

### Authorised domains

1. Still on the Sign-in method tab, scroll to **Authorised domains**.
2. Click **Add domain** and enter your production domain (e.g. `app.computrain.com`).
   For staging add `staging.computrain.com`.
3. `localhost` is added by default and is sufficient for local development.

### reCAPTCHA app verifier (web OTP)

Flutter Web uses an invisible reCAPTCHA to verify phone sign-in. Firebase handles
this automatically when you call `signInWithPhoneNumber`, but you must ensure the
domain is authorised (step above). No additional console configuration is required;
Firebase injects the reCAPTCHA widget at runtime.

If you use a custom domain for your web app, also register that domain with
[Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin) and add the site key
to your Firebase project settings.

---

## 3. Add Apps to the Firebase Project

### 3.1 Android app

1. On the project overview page click **Add app** → choose the Android icon.
2. **Android package name**: `com.brand.training_app`
   - This must match `applicationId` in `app/android/app/build.gradle`.
3. App nickname (optional): `CompuTrain Android`
4. **SHA-1 certificate fingerprint** — required for Phone Auth on Android.

#### Getting the SHA-1 fingerprint

**Debug keystore (development):**

```bash
keytool -list -v \
  -keystore ~/.android/debug.keystore \
  -alias androiddebugkey \
  -storepass android \
  -keypass android
```

On Windows replace `~/.android/` with `%USERPROFILE%\.android\`.

**Release keystore (production):**

```bash
keytool -list -v \
  -keystore /path/to/your/release.keystore \
  -alias YOUR_KEY_ALIAS \
  -storepass YOUR_STORE_PASSWORD
```

Copy the `SHA1:` value (format: `AA:BB:CC:...`) and paste it into the
**SHA certificate fingerprints** field in the Firebase Console wizard, then
click **Register app**.

5. Click **Download `google-services.json`** and place the file at:

```
app/android/app/google-services.json
```

   This file must be committed to version control — it contains no secrets, only
   project identifiers.

6. The `google-services` Gradle plugin is already declared in the project if you
   used `flutterfire configure` (see section 5). If not, verify these lines exist:

   `app/android/build.gradle` (project-level):
   ```groovy
   dependencies {
       classpath 'com.google.gms:google-services:4.4.2'
   }
   ```

   `app/android/app/build.gradle` (app-level, last line of the file):
   ```groovy
   apply plugin: 'com.google.gms.google-services'
   ```

### 3.2 Web app

1. On the project overview page click **Add app** → choose the Web (`</>`) icon.
2. App nickname: `CompuTrain Web`
3. **Do not** enable Firebase Hosting unless you intend to deploy via Firebase.
4. Click **Register app**. Firebase displays a config object like:

```js
const firebaseConfig = {
  apiKey:            "AIzaSy...",
  authDomain:        "computrain-production.firebaseapp.com",
  projectId:         "computrain-production",
  storageBucket:     "computrain-production.appspot.com",
  messagingSenderId: "123456789012",
  appId:             "1:123456789012:web:abcdef1234567890",
};
```

5. These values map to the `PLACEHOLDER_*` constants in `lib/firebase_options.dart`
   (generated automatically by `flutterfire configure` — see section 5). You do
   **not** need to copy them manually if you run that command.

### 3.3 iOS app (future)

1. Click **Add app** → choose the Apple icon.
2. **Apple bundle ID**: match the value in `app/ios/Runner/Info.plist` under
   `CFBundleIdentifier` (e.g. `com.brand.trainingApp`).
3. Download `GoogleService-Info.plist` and place it at `app/ios/Runner/`.
4. **APNs key** (required for FCM on iOS):
   - Open [developer.apple.com](https://developer.apple.com) →
     Certificates, Identifiers & Profiles → Keys → **+**.
   - Enable **Apple Push Notifications service (APNs)** → Download the `.p8` file.
   - In Firebase Console → Project Settings → **Cloud Messaging** → iOS app →
     **APNs Authentication Key** → upload the `.p8` file, enter your Key ID and
     Apple Team ID.

---

## 4. Cloud Messaging (FCM)

### Server key location

Project Settings → **Cloud Messaging** → **Cloud Messaging API (Legacy)** section
shows the **Server key** (a long string starting with `AAAA...`).

> Firebase now recommends using a service account with the HTTP v1 API instead of
> the legacy server key. Section 6 covers the service account approach, which is
> what the backend uses.

### Backend environment variables

Add the following to `backend/.env` (and the corresponding `.env.staging` /
`.env.production` files):

```dotenv
FIREBASE_PROJECT_ID=computrain-production
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@computrain-production.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

The values come from the service account JSON described in section 6.

> **Security note:** Never commit `.env` files containing real credentials.
> Add them to `.gitignore` and store the canonical values in your secrets manager
> (AWS Secrets Manager, HashiCorp Vault, etc.).

### Send a test notification from Firebase Console

1. Firebase Console → **Cloud Messaging** → **Send your first message**.
2. **Notification title**: `Test`
3. **Notification text**: `Hello from Firebase`
4. Click **Next** → Target: **Single device**
5. Paste the FCM registration token printed by the Flutter app in debug mode
   (search the debug console for `FCM Token:`).
6. Click **Review** → **Publish**.

---

## 5. Run `flutterfire configure`

### Install the CLI

```bash
dart pub global activate flutterfire_cli
```

Ensure `~/.pub-cache/bin` (macOS/Linux) or `%APPDATA%\Pub\Cache\bin` (Windows)
is on your `PATH`.

### Configure the Flutter project

```bash
cd app/
flutterfire configure --project=computrain-production
```

The CLI will:

1. Detect the platforms present in the project (Android, iOS, web).
2. Fetch app configuration from the Firebase project.
3. **Overwrite** `lib/firebase_options.dart` with the correct `DefaultFirebaseOptions`
   class for every platform.

For staging, run:

```bash
flutterfire configure --project=computrain-staging --out=lib/firebase_options_staging.dart
```

### What gets written

`lib/firebase_options.dart` is a plain Dart file containing only project identifiers
(no private keys). It is **safe to commit** and should be committed so CI/CD can
build the app without running `flutterfire configure` again.

---

## 6. Backend `firebase-admin` Setup

### Install the package

```bash
cd backend/
npm install firebase-admin
```

Pin the version in `package.json`:

```json
"firebase-admin": "^12.0.0"
```

### Generate a service account key

1. Firebase Console → Project Settings → **Service accounts**.
2. Click **Generate new private key** → **Generate key**.
3. A JSON file is downloaded. It contains:

```json
{
  "type": "service_account",
  "project_id": "computrain-production",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@computrain-production.iam.gserviceaccount.com",
  "client_id": "...",
  ...
}
```

4. **Do not commit this file.** Store it as a base64-encoded environment variable:

```bash
# Encode (run once, store output in your secrets manager)
base64 -i path/to/service-account.json

# On macOS/Linux the output is a single line; on Windows use:
certutil -encode path\to\service-account.json encoded.txt
```

Add to `.env`:

```dotenv
FIREBASE_SERVICE_ACCOUNT_BASE64=eyJ0eXBlIjoic2Vydmlj...
```

### FCM provider stub

Create `src/modules/notifications/providers/fcm.provider.ts`:

```typescript
import * as admin from 'firebase-admin';

let app: admin.app.App;

export function getFirebaseApp(): admin.app.App {
  if (app) return app;

  const serviceAccount = JSON.parse(
    Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ?? '',
      'base64',
    ).toString('utf8'),
  );

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  return app;
}

export async function sendPushNotification(
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<string> {
  const messaging = getFirebaseApp().messaging();

  const messageId = await messaging.send({
    token: fcmToken,
    notification: { title, body },
    data,
    android: { priority: 'high' },
    apns: {
      payload: { aps: { sound: 'default', badge: 1 } },
    },
  });

  return messageId;
}
```

---

## 7. Credential Reference Table

| Placeholder | Where to find it | Where it goes |
|---|---|---|
| `PLACEHOLDER_API_KEY` | Firebase Console → Project Settings → General → **Web API key** | `lib/firebase_options.dart` (web platform block) |
| `PLACEHOLDER_APP_ID` | Firebase Console → Project Settings → General → Your apps → **App ID** | `lib/firebase_options.dart` (per-platform block) |
| `PLACEHOLDER_MESSAGING_SENDER_ID` | Firebase Console → Project Settings → General → **Cloud Messaging sender ID** | `lib/firebase_options.dart` (all platforms) |
| `PLACEHOLDER_PROJECT_ID` | Firebase Console → Project Settings → General → **Project ID** | `lib/firebase_options.dart`, `backend/.env` |
| `PLACEHOLDER_AUTH_DOMAIN` | `<project-id>.firebaseapp.com` | `lib/firebase_options.dart` (web) |
| `PLACEHOLDER_STORAGE_BUCKET` | `<project-id>.appspot.com` | `lib/firebase_options.dart` (web) |
| `FIREBASE_CLIENT_EMAIL` | Service account JSON → `client_email` | `backend/.env` |
| `FIREBASE_PRIVATE_KEY` | Service account JSON → `private_key` | `backend/.env` |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | `base64` of full service account JSON | `backend/.env` |

> All `firebase_options.dart` placeholders are filled automatically when you run
> `flutterfire configure`. Manual editing is only needed if you cannot run the CLI.

---

## 8. Testing FCM End-to-End

### Step 1 — Get the device FCM token

In the Flutter app, add this temporary logging code during development:

```dart
import 'package:firebase_messaging/firebase_messaging.dart';

final token = await FirebaseMessaging.instance.getToken();
debugPrint('FCM Token: $token');
```

Run the app on a physical device or an emulator that has Google Play Services.
Copy the token from the debug console.

### Step 2 — Send a test message from Firebase Console

Follow the steps in section 4 ("Send a test notification from Firebase Console"),
pasting the token from step 1. The notification should appear on the device within
a few seconds.

### Step 3 — Verify the Flutter app receives it

In foreground, messages are delivered to the `onMessage` stream:

```dart
FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  debugPrint('Foreground FCM: ${message.notification?.title}');
});
```

In background or terminated state, the system tray notification should appear
automatically.

### Step 4 — Send via the backend and check logs

Call your backend endpoint that triggers a push, then check the server logs for
a line like:

```
FCM message sent: projects/computrain-production/messages/0:1234567890123456%abcdef
```

If the send fails, the most common causes are:

| Error | Fix |
|---|---|
| `INVALID_ARGUMENT` / invalid token | Token is stale — re-fetch from the device |
| `UNREGISTERED` | App was uninstalled — remove token from DB |
| `SERVICE_UNAVAILABLE` | Transient Firebase outage — retry with backoff |
| `INTERNAL` / credential error | Service account JSON is malformed or base64 encoding is off |

---

## Quick-Start Checklist

- [ ] Firebase project `computrain-production` created
- [ ] Firebase project `computrain-staging` created
- [ ] Phone authentication enabled on both projects
- [ ] Production domain added to Authorised domains
- [ ] Android app registered; `google-services.json` placed in `app/android/app/`
- [ ] SHA-1 fingerprints added (debug + release)
- [ ] Web app registered
- [ ] `flutterfire configure` run; `lib/firebase_options.dart` committed
- [ ] Service account JSON generated and base64-encoded
- [ ] `FIREBASE_SERVICE_ACCOUNT_BASE64` added to `backend/.env`
- [ ] `fcm.provider.ts` stub created and wired into the notifications module
- [ ] End-to-end FCM test passed (Console → device → backend logs)
