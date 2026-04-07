import 'package:flutter/material.dart';

class AppTheme {
  // Primary Palette
  static const Color primaryBlue = Color(0xFF1565C0);
  static const Color accentBlue = Color(0xFF1E88E5);
  static const Color lightBlue = Color(0xFFE3F2FD);
  static const Color skyBlue = Color(0xFFBBDEFB);
  static const Color darkBlue = Color(0xFF0D47A1);
  static const Color white = Color(0xFFFFFFFF);
  static const Color offWhite = Color(0xFFF4F8FF);
  static const Color inputBg = Color(0xFFEEF4FF);

  // Semantic
  static const Color success = Color(0xFF43A047);
  static const Color warning = Color(0xFFFB8C00);
  static const Color error = Color(0xFFE53935);

  // Backwards‑compat: map old red to primary blue so
  // existing components automatically adopt the blue branding.
  static const Color primaryRed = primaryBlue;
  static const Color textPrimary = Color(0xFF0D1B3E);
  static const Color textSecondary = Color(0xFF5A6A85);
  static const Color divider = Color(0xFFDDE6F5);

  static final ThemeData themeData = ThemeData(
    primaryColor: primaryBlue,
    scaffoldBackgroundColor: offWhite,
    fontFamily: 'Inter',
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: primaryBlue,
      primary: primaryBlue,
      secondary: accentBlue,
      surface: white,
      error: error,
    ),

    appBarTheme: const AppBarTheme(
      backgroundColor: primaryBlue,
      foregroundColor: white,
      elevation: 0,
      centerTitle: true,
      titleTextStyle: TextStyle(
        color: white,
        fontSize: 18,
        fontWeight: FontWeight.w600,
        fontFamily: 'Inter',
        letterSpacing: 0.3,
      ),
    ),

    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: white,
      selectedItemColor: primaryBlue,
      unselectedItemColor: textSecondary,
      showSelectedLabels: true,
      showUnselectedLabels: true,
      elevation: 8,
    ),

    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        foregroundColor: white,
        backgroundColor: accentBlue,
        elevation: 2,
        shadowColor: const Color(0x661E88E5),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        textStyle: const TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.3,
        ),
      ),
    ),

    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: primaryBlue,
        side: const BorderSide(color: primaryBlue, width: 1.5),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    ),

    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: accentBlue,
        textStyle: const TextStyle(
          fontWeight: FontWeight.w600,
          fontSize: 14,
        ),
      ),
    ),

    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: inputBg,
      hintStyle: const TextStyle(color: textSecondary, fontSize: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: divider, width: 1),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: accentBlue, width: 1.8),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: error, width: 1),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),

    // ✅ Fixed: Use CardThemeData for ThemeData.cardTheme
    cardTheme: CardThemeData(
      color: white,
      elevation: 2,
      shadowColor: const Color(0x141565C0),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
    ),

    chipTheme: ChipThemeData(
      backgroundColor: lightBlue,
      labelStyle: const TextStyle(color: primaryBlue, fontWeight: FontWeight.w500),
      side: BorderSide.none,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
    ),

    dividerTheme: const DividerThemeData(
      color: divider,
      thickness: 1,
    ),

    textTheme: const TextTheme(
      headlineLarge: TextStyle(color: textPrimary, fontWeight: FontWeight.w700, fontSize: 28),
      headlineMedium: TextStyle(color: textPrimary, fontWeight: FontWeight.w700, fontSize: 22),
      headlineSmall: TextStyle(color: textPrimary, fontWeight: FontWeight.w600, fontSize: 18),
      bodyLarge: TextStyle(color: textPrimary, fontSize: 16),
      bodyMedium: TextStyle(color: textSecondary, fontSize: 14),
      bodySmall: TextStyle(color: textSecondary, fontSize: 12),
      labelLarge: TextStyle(color: white, fontWeight: FontWeight.w600, fontSize: 15),
    ),
  );
}