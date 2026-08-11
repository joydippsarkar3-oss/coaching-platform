import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:local_auth/local_auth.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../api/api_service.dart';
import 'auth_state.dart';
import 'secure_storage.dart';

part 'auth_notifier.g.dart';

// ── Locale notifier ────────────────────────────────────────────────────────

@riverpod
class LocaleNotifier extends _$LocaleNotifier {
  @override
  Locale build() => const Locale('en');

  Future<void> initialize() async {
    final storage = ref.read(secureStorageProvider);
    final saved = await storage.getLocale();
    if (saved != null) state = Locale(saved);
  }

  Future<void> setLocale(String languageCode) async {
    final storage = ref.read(secureStorageProvider);
    await storage.saveLocale(languageCode);
    state = Locale(languageCode);
  }
}

// ── Auth notifier ──────────────────────────────────────────────────────────

@riverpod
class AuthNotifier extends _$AuthNotifier {
  final _localAuth = LocalAuthentication();

  @override
  AuthState build() {
    _restoreSession();
    return AuthState.unauthenticated;
  }

  Future<void> _restoreSession() async {
    state = AuthState.loading;
    final storage = ref.read(secureStorageProvider);
    final token = await storage.getAccessToken();
    if (token == null) {
      state = AuthState.unauthenticated;
      return;
    }
    final role = await storage.getUserRole() ?? 'student';
    final name = await storage.getDisplayName() ?? '';
    final userId = await storage.getUserId() ?? '';
    final center = await storage.getCenterCode();
    state = AuthState(
      status: AuthStatus.authenticated,
      accessToken: token,
      userId: userId,
      role: role == 'teacher' ? UserRole.teacher : UserRole.student,
      displayName: name,
      centerCode: center,
    );
  }

  /// Step 1 — send OTP
  Future<void> requestOtp(String phone) async {
    state = AuthState.loading;
    try {
      final api = ref.read(apiServiceProvider);
      await api.requestOtp(phone: phone);
      final storage = ref.read(secureStorageProvider);
      await storage.savePhone(phone);
      state = state.copyWith(status: AuthStatus.otpSent);
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: e.toString(),
      );
    }
  }

  /// Step 2 — verify OTP and get JWT
  Future<void> verifyOtp(String phone, String otp) async {
    state = state.copyWith(status: AuthStatus.loading);
    try {
      final api = ref.read(apiServiceProvider);
      final resp = await api.verifyOtp(phone: phone, otp: otp);
      final storage = ref.read(secureStorageProvider);
      await storage.saveTokens(
        accessToken: resp.accessToken,
        refreshToken: resp.refreshToken,
      );
      await storage.saveUserInfo(
        userId: resp.userId,
        role: resp.role,
        displayName: resp.displayName,
        centerCode: resp.centerCode,
      );
      state = AuthState(
        status: AuthStatus.authenticated,
        accessToken: resp.accessToken,
        refreshToken: resp.refreshToken,
        userId: resp.userId,
        role: resp.role == 'teacher' ? UserRole.teacher : UserRole.student,
        displayName: resp.displayName,
        centerCode: resp.centerCode,
      );
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.error,
        errorMessage: 'Invalid OTP. Please try again.',
      );
    }
  }

  /// Biometric quick unlock — does not re-issue token; just unlocks UI
  Future<bool> biometricUnlock() async {
    try {
      final canCheck = await _localAuth.canCheckBiometrics;
      if (!canCheck) return false;
      return _localAuth.authenticate(
        localizedReason: 'Confirm your identity to continue',
        options: const AuthenticationOptions(
          biometricOnly: false,
          stickyAuth: true,
        ),
      );
    } catch (_) {
      return false;
    }
  }

  Future<void> logout() async {
    final storage = ref.read(secureStorageProvider);
    await storage.clearAll();
    state = AuthState.unauthenticated;
  }
}
