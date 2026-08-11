import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";

import "../../../core/auth/auth_notifier.dart";
import "../../../core/auth/secure_storage.dart";
import "../../../core/navigation/routes.dart";
import "../../../core/theme/app_theme.dart";

class SplashPage extends ConsumerStatefulWidget {
  const SplashPage({super.key});

  @override
  ConsumerState<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends ConsumerState<SplashPage> {
  bool _navigating = false;

  @override
  void initState() {
    super.initState();
    _checkReturnUser();
  }

  Future<void> _checkReturnUser() async {
    await Future.delayed(const Duration(milliseconds: 300));
    if (!mounted || _navigating) return;
    final storage = ref.read(secureStorageProvider);
    final token = await storage.getAccessToken();
    if (token != null && mounted) {
      _navigating = true;
      // Auth restore happens in AuthNotifier; router redirect will handle nav
    }
  }

  Future<void> _pickLanguage(String code) async {
    final storage = ref.read(secureStorageProvider);
    await storage.saveLocale(code);
    await ref.read(localeNotifierProvider.notifier).setLocale(code);
    if (mounted) context.go(Routes.login);
  }

  @override
  Widget build(BuildContext context) {
    // If auth already restored, let the router redirect handle navigation
    ref.listen(authNotifierProvider, (_, state) {
      if (!mounted) return;
      if (state.isAuthenticated && !_navigating) {
        _navigating = true;
        context.go(
          state.isTeacher ? Routes.teacherToday : Routes.studentHome,
        );
      }
    });

    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: const Color(0xFFF0F4FF),
      body: SafeArea(
        child: Column(
          children: [
            // Brand illustration (top half)
            Expanded(
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 120,
                      height: 120,
                      decoration: BoxDecoration(
                        color: AppTheme.brandBlue,
                        borderRadius: BorderRadius.circular(30),
                      ),
                      child: const Icon(
                        Icons.school,
                        color: Colors.white,
                        size: 64,
                      ),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      "Brand Training",
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF111827),
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      "Learn. Grow. Succeed.",
                      style: TextStyle(
                        fontSize: 16,
                        color: Color(0xFF6B7280),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Language picker (bottom half)
            Container(
              width: double.infinity,
              padding: EdgeInsets.fromLTRB(24, 32, 24, 32),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    "Choose Language / भाषा चुनें",
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF374151),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Expanded(
                        child: _LangButton(
                          label: "English",
                          onTap: () => _pickLanguage("en"),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _LangButton(
                          label: "हिंदी",
                          onTap: () => _pickLanguage("hi"),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LangButton extends StatelessWidget {
  const _LangButton({required this.label, required this.onTap});
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        height: 72,
        decoration: BoxDecoration(
          border: Border.all(color: AppTheme.brandBlue, width: 2),
          borderRadius: BorderRadius.circular(16),
          color: const Color(0xFFF0F4FF),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: AppTheme.brandBlue,
          ),
        ),
      ),
    );
  }
}
