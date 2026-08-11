import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:package_info_plus/package_info_plus.dart";
import "package:riverpod_annotation/riverpod_annotation.dart";

import "../../../core/auth/auth_notifier.dart";
import "../../../core/auth/secure_storage.dart";
import "../../../core/theme/app_theme.dart";

part "profile_page.g.dart";

@riverpod
Future<PackageInfo> packageInfo(PackageInfoRef ref) =>
    PackageInfo.fromPlatform();

class ProfilePage extends ConsumerStatefulWidget {
  const ProfilePage({super.key});

  @override
  ConsumerState<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends ConsumerState<ProfilePage> {
  bool _biometricEnabled = false;

  @override
  void initState() {
    super.initState();
    _loadBiometric();
  }

  Future<void> _loadBiometric() async {
    final storage = ref.read(secureStorageProvider);
    final enabled = await storage.getBiometricEnabled();
    if (mounted) setState(() => _biometricEnabled = enabled);
  }

  Future<void> _toggleBiometric(bool value) async {
    final storage = ref.read(secureStorageProvider);
    await storage.setBiometricEnabled(value);
    if (mounted) setState(() => _biometricEnabled = value);
  }

  Future<void> _logout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Logout"),
        content: const Text("Are you sure you want to logout?"),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text("Cancel"),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style:
                ElevatedButton.styleFrom(backgroundColor: AppTheme.errorRed),
            child: const Text("Logout"),
          ),
        ],
      ),
    );
    if (confirmed == true && mounted) {
      await ref.read(authNotifierProvider.notifier).logout();
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authNotifierProvider);
    final locale = ref.watch(localeNotifierProvider);
    final pkgAsync = ref.watch(packageInfoProvider);

    return Scaffold(
      appBar: AppBar(title: const Text("Profile")),
      body: ListView(
        children: [
          // Avatar + name
          Container(
            color: Colors.white,
            padding: const EdgeInsets.all(24),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 36,
                  backgroundColor: AppTheme.brandBlue,
                  child: Text(
                    (auth.displayName ?? "U")
                        .split(" ")
                        .take(2)
                        .map((w) => w.isNotEmpty ? w[0] : "")
                        .join()
                        .toUpperCase(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        auth.displayName ?? "Student",
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF111827),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppTheme.brandBlue.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          auth.isTeacher ? "Teacher" : "Student",
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.brandBlue,
                          ),
                        ),
                      ),
                      if (auth.centerCode != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          "Center: ${auth.centerCode}",
                          style: const TextStyle(
                            fontSize: 13,
                            color: Color(0xFF6B7280),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 8),

          // Language selection
          _SettingsSection(
            title: "Preferences",
            children: [
              ListTile(
                leading: const Icon(Icons.language),
                title: const Text("App Language"),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _LangChip(
                      label: "EN",
                      selected: locale.languageCode == "en",
                      onTap: () => ref
                          .read(localeNotifierProvider.notifier)
                          .setLocale("en"),
                    ),
                    const SizedBox(width: 8),
                    _LangChip(
                      label: "हि",
                      selected: locale.languageCode == "hi",
                      onTap: () => ref
                          .read(localeNotifierProvider.notifier)
                          .setLocale("hi"),
                    ),
                  ],
                ),
              ),
              SwitchListTile(
                secondary: const Icon(Icons.fingerprint),
                title: const Text("Biometric Unlock"),
                subtitle: const Text(
                    "Skip OTP for returning sessions"),
                value: _biometricEnabled,
                onChanged: _toggleBiometric,
              ),
            ],
          ),

          const SizedBox(height: 8),

          // App info
          pkgAsync.when(
            data: (info) => _SettingsSection(
              title: "About",
              children: [
                ListTile(
                  leading: const Icon(Icons.info_outline),
                  title: const Text("Version"),
                  trailing: Text(
                    "${info.version} (${info.buildNumber})",
                    style: const TextStyle(color: Color(0xFF6B7280)),
                  ),
                ),
              ],
            ),
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const SizedBox.shrink(),
          ),

          const SizedBox(height: 8),

          // Logout
          Padding(
            padding: const EdgeInsets.all(16),
            child: OutlinedButton.icon(
              onPressed: _logout,
              icon: const Icon(Icons.logout, color: AppTheme.errorRed),
              label: const Text(
                "Logout",
                style: TextStyle(color: AppTheme.errorRed),
              ),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppTheme.errorRed),
                minimumSize: const Size.fromHeight(52),
              ),
            ),
          ),

          const SizedBox(height: 32),
        ],
      ),
    );
  }
}

class _SettingsSection extends StatelessWidget {
  const _SettingsSection({required this.title, required this.children});
  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
          child: Text(
            title.toUpperCase(),
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: Color(0xFF9CA3AF),
              letterSpacing: 0.8,
            ),
          ),
        ),
        Container(
          color: Colors.white,
          child: Column(children: children),
        ),
      ],
    );
  }
}

class _LangChip extends StatelessWidget {
  const _LangChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? AppTheme.brandBlue : const Color(0xFFF3F4F6),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: selected ? Colors.white : const Color(0xFF6B7280),
          ),
        ),
      ),
    );
  }
}
