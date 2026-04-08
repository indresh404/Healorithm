import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import 'package:animate_do/animate_do.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../theme/app_theme.dart';
import '../services/auth_service.dart';
import 'user_page.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> with TickerProviderStateMixin {
  late final AnimationController _logoCtrl;
  bool _showLogoAnimation = true;

  final _nameCtrl = TextEditingController();
  final _ageCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();

  String? _selectedGender;
  String? _selectedLanguage;

  final List<String> _genders = ['Male', 'Female', 'Other', 'Prefer not to say'];
  final List<String> _languages = ['English', 'Hindi', 'Marathi', 'Gujarati', 'Tamil', 'Telugu', 'Bengali', 'Punjabi'];

  bool _obscurePassword = true;
  bool _isLoginMode = true;
  bool _isLoading = false; // ← NEW: loading state

  @override
  void initState() {
    super.initState();
    _logoCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2500),
    )..forward().whenComplete(() {
      setState(() {
        _showLogoAnimation = false;
      });
    });
  }

  @override
  void dispose() {
    _logoCtrl.dispose();
    _nameCtrl.dispose();
    _ageCtrl.dispose();
    _phoneCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  // ─── COMPLETELY REPLACED: now calls AuthService ───────────
  Future<void> _handleSubmit() async {
    if (_isLoginMode) {
      // ── LOGIN ──
      if (_phoneCtrl.text.isEmpty || _passwordCtrl.text.isEmpty) {
        _showSnack('Please enter phone number and password');
        return;
      }

      setState(() => _isLoading = true);

      final result = await AuthService.login(
        phone: _phoneCtrl.text.trim(),
        password: _passwordCtrl.text,
      );

      setState(() => _isLoading = false);

      if (!mounted) return;

      if (result.success) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const UserPage()),
        );
      } else {
        _showSnack(result.error ?? 'Login failed');
      }

    } else {
      // ── SIGN UP ──
      if (_nameCtrl.text.isEmpty ||
          _ageCtrl.text.isEmpty ||
          _selectedGender == null ||
          _selectedLanguage == null ||
          _phoneCtrl.text.isEmpty ||
          _passwordCtrl.text.isEmpty) {
        _showSnack('Please fill all fields');
        return;
      }

      if (int.tryParse(_ageCtrl.text) == null) {
        _showSnack('Please enter a valid age');
        return;
      }

      setState(() => _isLoading = true);

      final result = await AuthService.signUp(
        name: _nameCtrl.text.trim(),
        age: int.parse(_ageCtrl.text),
        gender: _selectedGender!,
        preferredLanguage: _selectedLanguage!,
        phone: _phoneCtrl.text.trim(),
        password: _passwordCtrl.text,
      );

      setState(() => _isLoading = false);

      if (!mounted) return;

      if (result.success) {
        // Show success animation with QR code
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (_) => Dialog(
            backgroundColor: Colors.transparent,
            child: SingleChildScrollView(
              child: Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(32),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Lottie.asset(
                      'assets/animations/success_signup.json',
                      height: 120,
                      repeat: false,
                      onLoaded: (composition) {
                        // Auto navigate after showing QR
                        Future.delayed(Duration(seconds: 4), () {
                          if (!mounted) return;
                          Navigator.pop(context);
                          Navigator.pushReplacement(
                            context,
                            MaterialPageRoute(builder: (_) => const UserPage()),
                          );
                        });
                      },
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Account Created!',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.primaryBlue,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Welcome, ${_nameCtrl.text}!',
                      style: const TextStyle(
                        fontSize: 14,
                        color: AppTheme.textSecondary,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 24),
                    // QR Code
                    if (result.userData?['qr_code'] != null) ...[
                      const Text(
                        'Your Unique QR Code:',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppTheme.inputBg,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppTheme.divider),
                        ),
                        child: QrImageView(
                          data: result.userData!['qr_code'] ?? 'QR_CODE',
                          version: QrVersions.auto,
                          size: 240.0,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF3CD),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFFFD700), width: 1),
                        ),
                        child: Text(
                          result.userData!['qr_code'],
                          style: const TextStyle(
                            fontSize: 10,
                            fontFamily: 'monospace',
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF856404),
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ],
                    const SizedBox(height: 16),
                    // Location & Info
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFE3F2FD),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFF90CAF9), width: 1),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.location_on, size: 16, color: AppTheme.primaryBlue),
                              const SizedBox(width: 8),
                              const Text(
                                'Location Captured',
                                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.primaryBlue),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          if (result.userData?['latitude'] != null && result.userData?['longitude'] != null)
                            Text(
                              'Lat: ${result.userData!['latitude']?.toStringAsFixed(4)}, Lng: ${result.userData!['longitude']?.toStringAsFixed(4)}',
                              style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                            )
                          else
                            const Text(
                              'Location access requested',
                              style: TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.pop(context);
                          Navigator.pushReplacement(
                            context,
                            MaterialPageRoute(builder: (_) => const UserPage()),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryBlue,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                        child: const Text(
                          'Continue to Home',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      } else {
        _showSnack(result.error ?? 'Sign up failed');
      }
    }
  }

  void _showSnack(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: AppTheme.accentBlue,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.primaryBlue,
      body: SafeArea(
        child: Stack(
          children: [
            // Background design circles
            Positioned(
              top: -50,
              right: -50,
              child: Container(
                width: 200,
                height: 200,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.07),
                  shape: BoxShape.circle,
                ),
              ),
            ),
            Positioned(
              bottom: -80,
              left: -40,
              child: Container(
                width: 250,
                height: 250,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.07),
                  shape: BoxShape.circle,
                ),
              ),
            ),

            // Logo Animation (only plays at start)
            if (_showLogoAnimation)
              Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    FadeIn(
                      duration: const Duration(milliseconds: 1500),
                      child: ZoomIn(
                        duration: const Duration(milliseconds: 1500),
                        child: Container(
                          height: 180,
                          width: 180,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(40),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.15),
                                blurRadius: 30,
                                offset: const Offset(0, 10),
                              ),
                            ],
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(40),
                            child: Image.asset(
                              'assets/icons/CrisisClarity Logo.png',
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    FadeInUp(
                      duration: const Duration(milliseconds: 1000),
                      delay: const Duration(milliseconds: 500),
                      child: const Text(
                        'HEALORITHM',
                        style: TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 2,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

            // Main Content (appears after animation)
            if (!_showLogoAnimation)
              SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    children: [
                      const SizedBox(height: 20),

                      // Small Logo and App Name Row
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          FadeInLeft(
                            duration: const Duration(milliseconds: 800),
                            child: Container(
                              height: 50,
                              width: 50,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.1),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(12),
                                child: Image.asset(
                                  'assets/icons/CrisisClarity Logo.png',
                                  fit: BoxFit.cover,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          FadeInRight(
                            duration: const Duration(milliseconds: 800),
                            child: const Text(
                              'HEALORITHM',
                              style: TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 1.5,
                                color: Colors.white,
                                height: 1.1,
                              ),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 30),

                      // Login/Signup Toggle
                      FadeInDown(
                        delay: const Duration(milliseconds: 200),
                        child: Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: Colors.white.withOpacity(0.25),
                              width: 1,
                            ),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: GestureDetector(
                                  onTap: () => setState(() => _isLoginMode = true),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(vertical: 14),
                                    decoration: BoxDecoration(
                                      color: _isLoginMode ? Colors.white : Colors.transparent,
                                      borderRadius: BorderRadius.circular(14),
                                    ),
                                    child: Center(
                                      child: Text(
                                        'Login',
                                        style: TextStyle(
                                          color: _isLoginMode ? AppTheme.primaryBlue : Colors.white,
                                          fontWeight: FontWeight.w800,
                                          fontSize: 16,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                              Expanded(
                                child: GestureDetector(
                                  onTap: () => setState(() => _isLoginMode = false),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(vertical: 14),
                                    decoration: BoxDecoration(
                                      color: !_isLoginMode ? Colors.white : Colors.transparent,
                                      borderRadius: BorderRadius.circular(14),
                                    ),
                                    child: Center(
                                      child: Text(
                                        'Sign Up',
                                        style: TextStyle(
                                          color: !_isLoginMode ? AppTheme.primaryBlue : Colors.white,
                                          fontWeight: FontWeight.w800,
                                          fontSize: 16,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

                      const SizedBox(height: 25),

                      // Form Fields Card
                      FadeInUp(
                        delay: const Duration(milliseconds: 300),
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(32),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.12),
                                blurRadius: 30,
                                offset: const Offset(0, 15),
                              ),
                            ],
                          ),
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _isLoginMode ? 'Welcome Back' : 'Create Account',
                                style: const TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.primaryBlue,
                                ),
                              ),

                              const SizedBox(height: 24),

                              // Sign-up only fields
                              if (!_isLoginMode) ...[
                                _buildField(Icons.person_outline_rounded, 'Full Name', _nameCtrl),
                                const SizedBox(height: 16),
                                _buildField(Icons.cake_outlined, 'Age', _ageCtrl, isNumber: true),
                                const SizedBox(height: 16),
                                _buildGenderDropdown(),
                                const SizedBox(height: 16),
                                _buildLanguageDropdown(),
                                const SizedBox(height: 16),
                              ],

                              // Common fields
                              _buildField(Icons.phone_android_rounded, 'Mobile Number', _phoneCtrl, isNumber: true),
                              const SizedBox(height: 16),
                              _buildField(Icons.lock_outline_rounded, 'Password', _passwordCtrl, isPassword: true),

                              if (_isLoginMode)
                                Align(
                                  alignment: Alignment.centerRight,
                                  child: TextButton(
                                    onPressed: () {},
                                    style: TextButton.styleFrom(foregroundColor: AppTheme.accentBlue),
                                    child: const Text('Forgot Password?', style: TextStyle(fontWeight: FontWeight.w600)),
                                  ),
                                ),

                              const SizedBox(height: 16),

                              // Submit Button — shows spinner when loading
                              SizedBox(
                                width: double.infinity,
                                height: 56,
                                child: ElevatedButton(
                                  onPressed: _isLoading ? null : _handleSubmit,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppTheme.primaryBlue,
                                    foregroundColor: Colors.white,
                                    disabledBackgroundColor: AppTheme.primaryBlue.withOpacity(0.6),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                                    elevation: 4,
                                    shadowColor: AppTheme.primaryBlue.withOpacity(0.4),
                                  ),
                                  child: _isLoading
                                      ? const SizedBox(
                                    height: 22,
                                    width: 22,
                                    child: CircularProgressIndicator(
                                      color: Colors.white,
                                      strokeWidth: 2.5,
                                    ),
                                  )
                                      : Text(
                                    _isLoginMode ? 'SIGN IN' : 'CREATE ACCOUNT',
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: 1,
                                    ),
                                  ),
                                ),
                              ),

                              if (!_isLoginMode)
                                Padding(
                                  padding: const EdgeInsets.only(top: 16),
                                  child: Center(
                                    child: Text(
                                      'By signing up, you agree to our Terms & Conditions',
                                      style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                                      textAlign: TextAlign.center,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ),

                      const SizedBox(height: 5),

                      FadeIn(
                        delay: const Duration(milliseconds: 500),
                        child: SizedBox(
                          height: 450,
                          child: Lottie.asset(
                            _isLoginMode
                                ? 'assets/animations/login.json'
                                : 'assets/animations/signup.json',
                            fit: BoxFit.contain,
                          ),
                        ),
                      ),

                      const SizedBox(height: 20),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildField(
      IconData icon,
      String hint,
      TextEditingController ctrl, {
        bool isPassword = false,
        bool isNumber = false,
      }) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.inputBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.divider, width: 1),
      ),
      child: TextField(
        controller: ctrl,
        keyboardType: isNumber ? TextInputType.number : TextInputType.text,
        obscureText: isPassword ? _obscurePassword : false,
        decoration: InputDecoration(
          prefixIcon: Icon(icon, color: AppTheme.primaryBlue.withOpacity(0.6)),
          suffixIcon: isPassword
              ? IconButton(
            icon: Icon(
              _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
              color: Colors.grey[400],
              size: 20,
            ),
            onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
          )
              : null,
          hintText: hint,
          hintStyle: const TextStyle(color: AppTheme.textSecondary),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
        ),
      ),
    );
  }

  Widget _buildGenderDropdown() {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.inputBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.divider, width: 1),
      ),
      child: DropdownButtonFormField<String>(
        value: _selectedGender,
        decoration: InputDecoration(
          prefixIcon: Icon(Icons.transgender_rounded, color: AppTheme.primaryBlue.withOpacity(0.6)),
          hintText: 'Select Gender',
          hintStyle: const TextStyle(color: AppTheme.textSecondary),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        ),
        icon: Icon(Icons.arrow_drop_down, color: AppTheme.primaryBlue),
        dropdownColor: Colors.white,
        items: _genders.map((g) => DropdownMenuItem(value: g, child: Text(g))).toList(),
        onChanged: (value) => setState(() => _selectedGender = value),
      ),
    );
  }

  Widget _buildLanguageDropdown() {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.inputBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.divider, width: 1),
      ),
      child: DropdownButtonFormField<String>(
        value: _selectedLanguage,
        decoration: InputDecoration(
          prefixIcon: Icon(Icons.language_rounded, color: AppTheme.primaryBlue.withOpacity(0.6)),
          hintText: 'Select Preferred Language',
          hintStyle: const TextStyle(color: AppTheme.textSecondary),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        ),
        icon: Icon(Icons.arrow_drop_down, color: AppTheme.primaryBlue),
        dropdownColor: Colors.white,
        items: _languages.map((l) => DropdownMenuItem(value: l, child: Text(l))).toList(),
        onChanged: (value) => setState(() => _selectedLanguage = value),
      ),
    );
  }
}