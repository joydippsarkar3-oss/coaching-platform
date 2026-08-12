// GENERATED FILE — values populated from google-services.json (computrain-production)
//
// Android app ID corresponds to package com.brand.training_app.
// Web and iOS blocks retain placeholders until those apps are registered in Firebase Console.
//
// To regenerate with the FlutterFire CLI:
//   flutterfire configure --project=computrain-production

import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) return web;
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  // ── Web ───────────────────────────────────────────────────────────────────
  // Register a Web app in Firebase Console → Project Settings → Add app
  // then replace these placeholders.
  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'PLACEHOLDER_WEB_API_KEY',
    appId: 'PLACEHOLDER_WEB_APP_ID',
    messagingSenderId: '828305204195',
    projectId: 'computrain-production',
    authDomain: 'computrain-production.firebaseapp.com',
    storageBucket: 'computrain-production.firebasestorage.app',
  );

  // ── Android ───────────────────────────────────────────────────────────────
  // Package: com.brand.training_app
  // App ID:  1:828305204195:android:86c1f3c399aab1807cf6d6
  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyBpdNHHYSQAcoiYm7kEwycM-mjZKsPdg0E',
    appId: '1:828305204195:android:86c1f3c399aab1807cf6d6',
    messagingSenderId: '828305204195',
    projectId: 'computrain-production',
    storageBucket: 'computrain-production.firebasestorage.app',
  );

  // ── iOS ───────────────────────────────────────────────────────────────────
  // Register an iOS app in Firebase Console when ready.
  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'PLACEHOLDER_IOS_API_KEY',
    appId: 'PLACEHOLDER_IOS_APP_ID',
    messagingSenderId: '828305204195',
    projectId: 'computrain-production',
    storageBucket: 'computrain-production.firebasestorage.app',
    iosBundleId: 'com.brand.trainingApp',
  );
}
