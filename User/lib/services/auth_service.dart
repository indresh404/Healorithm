import 'package:crypto/crypto.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'dart:convert';

final supabase = Supabase.instance.client;

class AuthService {
  // ─── HASH PASSWORD (SHA-256) ───────────────────────────────
  static String _hashPassword(String password) {
    final bytes = utf8.encode(password);
    return sha256.convert(bytes).toString();
  }

  // ─── SIGN UP ───────────────────────────────────────────────
  static Future<AuthResult> signUp({
    required String name,
    required int age,
    required String gender,
    required String preferredLanguage,
    required String phone,
    required String password,
  }) async {
    try {
      // Check if phone already exists
      final existing = await supabase
          .from('users')
          .select('phone')
          .eq('phone', phone)
          .maybeSingle();

      if (existing != null) {
        return AuthResult(success: false, error: 'Phone number already registered');
      }

      // Insert new user with hashed password
      final response = await supabase
          .from('users')
          .insert({
        'name': name,
        'age': age,
        'gender': gender,
        'preferred_language': preferredLanguage,
        'phone': phone,
        'password': _hashPassword(password),
      })
          .select()
          .single();

      // Store logged in user locally
      _currentUser = response;
      return AuthResult(success: true, userData: response);
    } on PostgrestException catch (e) {
      return AuthResult(success: false, error: 'DB error: ${e.message}');
    } catch (e) {
      return AuthResult(success: false, error: e.toString());
    }
  }

  // ─── LOGIN ─────────────────────────────────────────────────
  static Future<AuthResult> login({
    required String phone,
    required String password,
  }) async {
    try {
      final data = await supabase
          .from('users')
          .select()
          .eq('phone', phone)
          .eq('password', _hashPassword(password))
          .maybeSingle();

      if (data == null) {
        return AuthResult(success: false, error: 'Invalid phone number or password');
      }

      // Store logged in user locally
      _currentUser = data;
      return AuthResult(success: true, userData: data);
    } on PostgrestException catch (e) {
      return AuthResult(success: false, error: 'DB error: ${e.message}');
    } catch (e) {
      return AuthResult(success: false, error: e.toString());
    }
  }

  // ─── LOGOUT ────────────────────────────────────────────────
  static void logout() {
    _currentUser = null;
  }

  // ─── CURRENT USER (in-memory session) ─────────────────────
  static Map<String, dynamic>? _currentUser;

  static Map<String, dynamic>? get currentUser => _currentUser;

  static bool get isLoggedIn => _currentUser != null;

  // ─── GET PROFILE FROM DB ───────────────────────────────────
  static Future<Map<String, dynamic>?> getUserProfile(String phone) async {
    try {
      final data = await supabase
          .from('users')
          .select()
          .eq('phone', phone)
          .single();

      // Update current user if it's the same phone
      if (_currentUser?['phone'] == phone) {
        _currentUser = data;
      }
      return data;
    } catch (e) {
      return null;
    }
  }

  // ─── REFRESH CURRENT USER ─────────────────────────────────
  static Future<void> refreshCurrentUser() async {
    if (_currentUser != null) {
      final updatedUser = await getUserProfile(_currentUser!['phone']);
      if (updatedUser != null) {
        _currentUser = updatedUser;
      }
    }
  }
}

// Simple result wrapper
class AuthResult {
  final bool success;
  final String? error;
  final Map<String, dynamic>? userData;

  const AuthResult({
    required this.success,
    this.error,
    this.userData,
  });
}