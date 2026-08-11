import 'package:flutter/material.dart';

/// Brand colours, typography and spacing tokens.
/// All colours chosen for WCAG AA contrast on both light and dark surfaces.
class AppTheme {
  AppTheme._();

  // ── Brand Palette ──────────────────────────────────────────────────────────
  static const Color brandBlue = Color(0xFF1A5CFF);
  static const Color brandBlueDark = Color(0xFF1347CC);
  static const Color brandAccent = Color(0xFFFF6B00);
  static const Color successGreen = Color(0xFF22C55E);
  static const Color warningOrange = Color(0xFFF59E0B);
  static const Color errorRed = Color(0xFFEF4444);

  // Fee status colours
  static const Color feeOverdue = Color(0xFFEF4444);
  static const Color feePending = Color(0xFFF59E0B);
  static const Color feePaid = Color(0xFF22C55E);

  // Exam palette colours
  static const Color examAnswered = Color(0xFF22C55E);
  static const Color examMarkedReview = Color(0xFFF59E0B);
  static const Color examSkipped = Color(0xFF9CA3AF);
  static const Color examCurrent = Color(0xFF1A5CFF);

  // ── Light Theme ────────────────────────────────────────────────────────────
  static ThemeData get light => ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: brandBlue,
          brightness: Brightness.light,
        ),
        fontFamily: 'NotoSans',
        appBarTheme: const AppBarTheme(
          elevation: 0,
          centerTitle: false,
          backgroundColor: Colors.white,
          foregroundColor: Color(0xFF111827),
          titleTextStyle: TextStyle(
            fontFamily: 'NotoSans',
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: Color(0xFF111827),
          ),
        ),
        cardTheme: CardTheme(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: const BorderSide(color: Color(0xFFE5E7EB)),
          ),
          color: Colors.white,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: brandBlue,
            foregroundColor: Colors.white,
            minimumSize: const Size.fromHeight(52),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            textStyle: const TextStyle(
              fontFamily: 'NotoSans',
              fontSize: 16,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: brandBlue,
            side: const BorderSide(color: brandBlue, width: 1.5),
            minimumSize: const Size.fromHeight(52),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: const Color(0xFFF9FAFB),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFFD1D5DB)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFFD1D5DB)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: brandBlue, width: 2),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: errorRed),
          ),
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        ),
        bottomNavigationBarTheme: const BottomNavigationBarThemeData(
          selectedItemColor: brandBlue,
          unselectedItemColor: Color(0xFF6B7280),
          backgroundColor: Colors.white,
          elevation: 8,
          type: BottomNavigationBarType.fixed,
        ),
        chipTheme: ChipThemeData(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
        ),
      );

  // ── Dark Theme ─────────────────────────────────────────────────────────────
  static ThemeData get dark => ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: brandBlue,
          brightness: Brightness.dark,
        ),
        fontFamily: 'NotoSans',
      );

  // ── Spacing Tokens ─────────────────────────────────────────────────────────
  static const double spaceXS = 4;
  static const double spaceSM = 8;
  static const double spaceMD = 16;
  static const double spaceLG = 24;
  static const double spaceXL = 32;
  static const double space2XL = 48;

  // ── Radius Tokens ──────────────────────────────────────────────────────────
  static const double radiusSM = 8;
  static const double radiusMD = 12;
  static const double radiusLG = 16;
  static const double radiusXL = 24;
}
