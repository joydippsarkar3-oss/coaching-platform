import "dart:async";

import "package:dio/dio.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:riverpod_annotation/riverpod_annotation.dart";

import "../auth/secure_storage.dart";

part "client.g.dart";

const _baseUrl = String.fromEnvironment("API_BASE_URL",
    defaultValue: "https://api.brand-training.example.com/v1");

@riverpod
Dio dioClient(DioClientRef ref) {
  final storage = ref.read(secureStorageProvider);
  final dio = Dio(
    BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      headers: {"Content-Type": "application/json", "Accept": "application/json"},
    ),
  );

  dio.interceptors.addAll([
    _BearerInterceptor(storage, dio),
    LogInterceptor(
      request: false,
      responseBody: false,
      error: true,
    ),
  ]);

  return dio;
}

/// Attaches Bearer token on every request and silently refreshes when 401.
class _BearerInterceptor extends QueuedInterceptor {
  _BearerInterceptor(this._storage, this._dio);

  final SecureStorageService _storage;
  final Dio _dio;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _storage.getAccessToken();
    if (token != null) {
      options.headers["Authorization"] = "Bearer $token";
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    if (err.response?.statusCode != 401) {
      handler.next(err);
      return;
    }
    // Attempt silent refresh
    try {
      final newToken = await _refresh();
      if (newToken == null) {
        handler.next(err);
        return;
      }
      // Retry original request with new token
      final opts = err.requestOptions
        ..headers["Authorization"] = "Bearer $newToken";
      final response = await _dio.fetch(opts);
      handler.resolve(response);
    } catch (e) {
      handler.next(err);
    }
  }

  Future<String?> _refresh() async {
    final refreshToken = await _storage.getRefreshToken();
    if (refreshToken == null) return null;
    try {
      final resp = await _dio.post(
        "/auth/refresh",
        data: {"refresh_token": refreshToken},
        options: Options(headers: {"Authorization": ""}),
      );
      final newAccess = resp.data["access_token"] as String;
      final newRefresh = resp.data["refresh_token"] as String;
      await _storage.saveTokens(
          accessToken: newAccess, refreshToken: newRefresh);
      return newAccess;
    } catch (_) {
      return null;
    }
  }
}
