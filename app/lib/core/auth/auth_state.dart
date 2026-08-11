import 'package:flutter/foundation.dart';

enum UserRole { student, teacher, unknown }

@immutable
class AuthState {
  const AuthState({
    required this.status,
    this.accessToken,
    this.refreshToken,
    this.userId,
    this.role = UserRole.unknown,
    this.displayName,
    this.centerCode,
    this.errorMessage,
  });

  final AuthStatus status;
  final String? accessToken;
  final String? refreshToken;
  final String? userId;
  final UserRole role;
  final String? displayName;
  final String? centerCode;
  final String? errorMessage;

  bool get isAuthenticated => status == AuthStatus.authenticated;
  bool get isLoading => status == AuthStatus.loading;
  bool get isStudent => role == UserRole.student;
  bool get isTeacher => role == UserRole.teacher;

  AuthState copyWith({
    AuthStatus? status,
    String? accessToken,
    String? refreshToken,
    String? userId,
    UserRole? role,
    String? displayName,
    String? centerCode,
    String? errorMessage,
  }) =>
      AuthState(
        status: status ?? this.status,
        accessToken: accessToken ?? this.accessToken,
        refreshToken: refreshToken ?? this.refreshToken,
        userId: userId ?? this.userId,
        role: role ?? this.role,
        displayName: displayName ?? this.displayName,
        centerCode: centerCode ?? this.centerCode,
        errorMessage: errorMessage ?? this.errorMessage,
      );

  static const unauthenticated = AuthState(status: AuthStatus.unauthenticated);
  static const loading = AuthState(status: AuthStatus.loading);
}

enum AuthStatus {
  unauthenticated,
  loading,
  otpSent,
  authenticated,
  error,
}
