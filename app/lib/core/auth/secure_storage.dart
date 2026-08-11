import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'secure_storage.g.dart';

@riverpod
SecureStorageService secureStorage(SecureStorageRef ref) =>
    SecureStorageService();

class SecureStorageService {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  // Keys
  static const _keyAccessToken = 'access_token';
  static const _keyRefreshToken = 'refresh_token';
  static const _keyUserId = 'user_id';
  static const _keyUserRole = 'user_role';
  static const _keyDisplayName = 'display_name';
  static const _keyCenterCode = 'center_code';
  static const _keyLocale = 'app_locale';
  static const _keyBiometricEnabled = 'biometric_enabled';
  static const _keyPhone = 'phone_number';

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await Future.wait([
      _storage.write(key: _keyAccessToken, value: accessToken),
      _storage.write(key: _keyRefreshToken, value: refreshToken),
    ]);
  }

  Future<String?> getAccessToken() => _storage.read(key: _keyAccessToken);
  Future<String?> getRefreshToken() => _storage.read(key: _keyRefreshToken);

  Future<void> saveUserInfo({
    required String userId,
    required String role,
    required String displayName,
    String? centerCode,
  }) async {
    await Future.wait([
      _storage.write(key: _keyUserId, value: userId),
      _storage.write(key: _keyUserRole, value: role),
      _storage.write(key: _keyDisplayName, value: displayName),
      if (centerCode != null)
        _storage.write(key: _keyCenterCode, value: centerCode),
    ]);
  }

  Future<String?> getUserId() => _storage.read(key: _keyUserId);
  Future<String?> getUserRole() => _storage.read(key: _keyUserRole);
  Future<String?> getDisplayName() => _storage.read(key: _keyDisplayName);
  Future<String?> getCenterCode() => _storage.read(key: _keyCenterCode);

  Future<void> saveLocale(String languageCode) =>
      _storage.write(key: _keyLocale, value: languageCode);
  Future<String?> getLocale() => _storage.read(key: _keyLocale);

  Future<void> setBiometricEnabled(bool enabled) =>
      _storage.write(key: _keyBiometricEnabled, value: enabled.toString());
  Future<bool> getBiometricEnabled() async {
    final val = await _storage.read(key: _keyBiometricEnabled);
    return val == 'true';
  }

  Future<void> savePhone(String phone) =>
      _storage.write(key: _keyPhone, value: phone);
  Future<String?> getPhone() => _storage.read(key: _keyPhone);

  Future<void> clearAll() => _storage.deleteAll();
}
