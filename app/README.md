# Brand Training App

Flutter umbrella Android app for franchise computer/vocational training platform.
One APK — two roles: **Student** and **Teacher** (role determined from JWT at login).

---

## Prerequisites

| Tool | Version |
|------|---------|
| Flutter | 3.24.x |
| Dart | 3.5.x |
| Android Studio | Hedgehog 2023.1+ |
| Android SDK | API 34 (target), API 26 (min) |
| Java | 17 |

---

## Running the app

```bash
# Install dependencies
flutter pub get

# Generate code (Drift, Retrofit, Riverpod)
dart run build_runner build --delete-conflicting-outputs

# Run on a connected device or emulator
flutter run

# Run on a specific device
flutter run -d <device-id>
```

---

## Build release APK

```bash
# Clean first
flutter clean && flutter pub get

# Generate code
dart run build_runner build --delete-conflicting-outputs

# Build release APK (minified + shrunk, target <= 40MB)
flutter build apk --release --split-per-abi

# Output: build/app/outputs/flutter-apk/
#   app-arm64-v8a-release.apk   <- main target
#   app-armeabi-v7a-release.apk <- Android Go fallback
```

---

## Architecture

### State management
Riverpod 2 with `@riverpod` code-generation annotations.
All providers live in `lib/*/providers/` and `lib/core/*/` notifiers.

### Navigation
GoRouter 14 with role-based redirect guards.
Route constants in `lib/core/navigation/routes.dart`.
Deep links configured in `AndroidManifest.xml`:
- `brand://exam/123`
- `brand://verify/{certNo}`

### Offline-first
Drift SQLite ORM with three tables:
- `examAnswers` — written locally on every MCQ tap, synced every 10s via background isolate
- `cachedMaterials` — PDF/video paths after download
- `pendingSyncOps` — queue for all offline mutations (attendance, marks, exam submit)

`SyncService` runs on connectivity restored, processes `pendingSyncOps` with up to 3 retries.

### Networking
Dio 5 with JWT Bearer interceptor and silent token-refresh queue.
Retrofit 4 for type-safe API methods.

### Localisation
Flutter ARB files: `lib/core/l10n/app_en.arb` and `app_hi.arb`.
Toggle stored in `flutter_secure_storage`; change triggers Riverpod locale notifier.

---

## Deep link setup

In `android/app/src/main/AndroidManifest.xml` add inside `<activity>`:

```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="brand" android:host="exam" />
    <data android:scheme="brand" android:host="verify" />
</intent-filter>
```

---

## Project structure

```
lib/
  main.dart                         App entry, ProviderScope
  app.dart                          MaterialApp.router + GoRouter + locale
  core/
    api/
      client.dart                   Dio + Bearer interceptor + refresh queue
      api_service.dart              Retrofit annotations for all endpoints
      models/api_models.dart        Dart response classes (fromJson)
    db/
      app_database.dart             Drift database definition
      tables/
        exam_answers.dart           Offline exam answer table
        cached_materials.dart       Downloaded PDF/video cache table
        pending_sync.dart           Offline mutation queue table
    auth/
      auth_notifier.dart            Riverpod notifier: login/logout/refresh
      auth_state.dart               AuthState, AuthStatus, UserRole
      secure_storage.dart           FlutterSecureStorage wrapper
    navigation/
      router.dart                   GoRouter + role-based redirect
      routes.dart                   Route path constants
    l10n/
      app_en.arb                    English strings
      app_hi.arb                    Hindi strings
    theme/
      app_theme.dart                Brand colours, typography, spacing tokens
    utils/
      money_formatter.dart          paise -> Rs formatting
      date_utils.dart               Date/time helpers
  features/
    onboarding/
      pages/
        splash_page.dart            A1: language picker, returning user check
        login_page.dart             A2: phone OTP + biometric unlock
        link_identity_page.dart     A3: center code + QR scan
        consent_page.dart           A4: privacy notice + U-18 guardian flow
    student/
      pages/
        home_page.dart              S1: greeting, classes, fee card, streak, actions
        courses_page.dart           S2: enrolled courses with progress
        exam_list_page.dart         S3: exam list with status chips
        exam_runner_page.dart       S4: CRITICAL - full exam with timer, drift, sync
        results_page.dart           S5: result history
        fees_page.dart              S7: installments + UPI/QR/gateway payment sheet
        certificates_page.dart      S9: certificates with download/share/verify
        notifications_page.dart     S11: FCM in-app inbox mirror
        profile_page.dart           S12: language toggle, biometric, logout
      widgets/
        fee_due_card.dart           Red/amber fee alert card
        exam_question_card.dart     MCQ / MCQ_MULTI / TF question renderer
        question_palette.dart       Slide-in grid with colour-coded status
        course_progress_card.dart   Course thumbnail + progress bar
        certificate_card.dart       Gradient certificate card
    teacher/
      pages/
        today_page.dart             T1: batches, upcoming exams, announcements
        attendance_page.dart        T2: roster with P/A toggle + QR scan mode
        marks_entry_page.dart       T3: marks grid with bulk paste
        announcements_page.dart     T6: post and list announcements
      widgets/
        batch_roster_row.dart       Student row with P/A toggle
        attendance_quick_mark.dart  P/A pill buttons
    shared/
      widgets/
        app_shell.dart              Role-aware bottom nav scaffold
        offline_banner.dart         Connectivity-aware amber banner
        loading_shimmer.dart        Shimmer placeholder list
        empty_state.dart            Icon + message + optional CTA
```

---

## Key implementation notes

### Exam Runner (exam_runner_page.dart)
- Enables `SystemUiMode.immersiveSticky` on exam start; restores on exit.
- Timer ticks every second; re-syncs with server every 30s.
- Answers written to Drift on every tap; batch-synced to API every 10s.
- Tab-switch logged via `WidgetsBindingObserver.didChangeAppLifecycleState`.
- Auto-submit fires when countdown reaches 0.
- Offline submit queued in `pendingSyncOps` if network unavailable.
- WorkManager integration point commented for background submit.

### Offline sync
`pendingSyncOps` table queues `exam_submit`, `attendance`, `marks`, `notification_read`.
Re-run sync on `ConnectivityResult` change (connectivity_plus).

### Code generation
Run after any change to Drift tables, Retrofit service, or `@riverpod` providers:
```bash
dart run build_runner build --delete-conflicting-outputs
```
