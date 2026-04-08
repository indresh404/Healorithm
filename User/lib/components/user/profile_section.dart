import 'package:flutter/material.dart';
import 'package:healorithm/theme/app_theme.dart';
import 'package:healorithm/services/auth_service.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart'; // ✅ FIXED: correct package for placemark

class ProfileSection extends StatefulWidget {
  const ProfileSection({super.key});

  @override
  State<ProfileSection> createState() => _ProfileSectionState();
}

class _ProfileSectionState extends State<ProfileSection> {
  String? _currentAddress;
  bool _isLoadingLocation = false;
  Position? _currentPosition;

  @override
  void initState() {
    super.initState();
    _getCurrentLocation();
  }

  Future<void> _getCurrentLocation() async {
    setState(() => _isLoadingLocation = true);

    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() {
          _currentAddress = 'Location';
          _isLoadingLocation = false;
        });
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          setState(() {
            _currentAddress = 'Location permissions denied';
            _isLoadingLocation = false;
          });
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        setState(() {
          _currentAddress = 'Location permissions permanently denied';
          _isLoadingLocation = false;
        });
        return;
      }

      _currentPosition = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      await _getAddressFromLatLng();
    } catch (e) {
      setState(() {
        _currentAddress = 'Unable to get location';
        _isLoadingLocation = false;
      });
    }
  }

  Future<void> _getAddressFromLatLng() async {
    try {
      // ✅ FIXED: placemarkFromCoordinates is from geocoding package, not geolocator
      List<Placemark> placemarks = await placemarkFromCoordinates(
        _currentPosition!.latitude,
        _currentPosition!.longitude,
      );

      if (placemarks.isNotEmpty) {
        Placemark place = placemarks[0];
        final List<String> parts = [
          if (place.subLocality?.isNotEmpty == true) place.subLocality!,
          if (place.locality?.isNotEmpty == true) place.locality!,
          if (place.administrativeArea?.isNotEmpty == true) place.administrativeArea!,
          if (place.country?.isNotEmpty == true) place.country!,
        ];
        setState(() {
          _currentAddress =
          parts.isNotEmpty ? parts.join(', ') : 'Address not found';
          _isLoadingLocation = false;
        });
      } else {
        setState(() {
          _currentAddress = 'Address not found';
          _isLoadingLocation = false;
        });
      }
    } catch (e) {
      setState(() {
        _currentAddress = 'Unable to get address';
        _isLoadingLocation = false;
      });
    }
  }

  String _getUserQrData() {
    final user = AuthService.currentUser;
    if (user != null) {
      final qrCode = user['qr_code']?.toString();
      if (qrCode != null && qrCode.isNotEmpty) {
        return qrCode;
      }
    }
    return 'QR_CODE_UNAVAILABLE';
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return 'N/A';
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day} ${_getMonth(date.month)} ${date.year}';
    } catch (e) {
      return dateStr;
    }
  }

  String _getMonth(int month) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[month - 1];
  }

  @override
  Widget build(BuildContext context) {
    final user = AuthService.currentUser;

    if (user == null) {
      return Scaffold(
        backgroundColor: Colors.grey[50],
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 64, color: Colors.grey),
              const SizedBox(height: 16),
              Text('No user logged in',
                  style: TextStyle(fontSize: 18, color: Colors.grey[600])),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () =>
                    Navigator.pushReplacementNamed(context, '/login'),
                style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryBlue),
                child: const Text('Go to Login'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
          child: Column(
            children: [
              _buildProfileHeader(user),
              const SizedBox(height: 20),
              _buildProfileInfo(user),
              const SizedBox(height: 20),
              _buildSettingsOptions(),
              const SizedBox(height: 20),
              _buildLogoutButton(context),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildProfileHeader(Map<String, dynamic> user) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
              color: Colors.grey.withOpacity(0.05),
              spreadRadius: 1,
              blurRadius: 4),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: AppTheme.primaryBlue.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.badge, size: 16, color: AppTheme.primaryBlue),
                const SizedBox(width: 8),
                Text(
                  'ID: ${user['id'].toString().substring(0, 8)}...',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primaryBlue,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          _buildLargeQrCard(data: _getUserQrData()),
          const SizedBox(height: 20),

          // FIXED: Better layout for location section
          Container(
            width: double.infinity,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Location icon and text
                Expanded(
                  child: Row(
                    children: [
                      const Icon(Icons.location_on, size: 16, color: Colors.grey),
                      const SizedBox(width: 6),
                      Expanded(
                        child: _isLoadingLocation
                            ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                            : Text(
                          _currentAddress ?? 'Tap to detect',
                          style: TextStyle(
                              fontSize: 13,
                              color: Colors.grey[600]),
                          overflow: TextOverflow.ellipsis,
                          maxLines: 1,
                        ),
                      ),
                    ],
                  ),
                ),

                // Detect button
                if (!_isLoadingLocation)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    child: TextButton(
                      onPressed: _getCurrentLocation,
                      style: TextButton.styleFrom(
                        foregroundColor: AppTheme.primaryBlue,
                        minimumSize: Size.zero,
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      child: const Text(
                        'Detect',
                        style: TextStyle(fontSize: 12),
                      ),
                    ),
                  ),

                // Verified badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryBlue.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text(
                    'Verified',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primaryBlue,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLargeQrCard({required String data}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.offWhite,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.divider),
      ),
      child: Column(
        children: [
          Container(
            width: 200,
            height: 200,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppTheme.divider),
            ),
            child: QrImageView(
              data: data,
              version: QrVersions.auto,
              errorCorrectionLevel: QrErrorCorrectLevel.H,
              eyeStyle: const QrEyeStyle(
                eyeShape: QrEyeShape.square,
                color: AppTheme.primaryBlue,
              ),
              dataModuleStyle: const QrDataModuleStyle(
                dataModuleShape: QrDataModuleShape.square,
                color: AppTheme.textPrimary,
              ),
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Your QR Code',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Show this to quickly share your profile and medical information with healthcare providers.',
            textAlign: TextAlign.center,
            style: TextStyle(
                fontSize: 14, color: Colors.grey[600], height: 1.4),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileInfo(Map<String, dynamic> user) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
              color: Colors.grey.withOpacity(0.05),
              spreadRadius: 1,
              blurRadius: 4),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Personal Information',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          _buildInfoRow(Icons.badge_outlined, 'User ID',
              user['id']?.toString() ?? 'N/A'),
          _buildInfoRow(
              Icons.person_outlined, 'Full Name', user['name'] ?? 'N/A'),
          _buildInfoRow(Icons.cake_outlined, 'Age',
              '${user['age'] ?? 'N/A'} years'),
          _buildInfoRow(
              Icons.phone_outlined, 'Phone', user['phone'] ?? 'N/A'),
          _buildInfoRow(Icons.translate_outlined, 'Language',
              user['preferred_language'] ?? 'N/A'),
          _buildInfoRow(
              Icons.wc_outlined, 'Gender', user['gender'] ?? 'N/A'),
          _buildInfoRow(Icons.calendar_today_outlined, 'Member Since',
              _formatDate(user['created_at'])),
          const Divider(height: 24),
          Row(
            children: [
              const Icon(Icons.location_on_outlined,
                  size: 18, color: Colors.grey),
              const SizedBox(width: 12),
              Text('Current Location',
                  style: TextStyle(fontSize: 13, color: Colors.grey[600])),
              const SizedBox(width: 12),
              Text(':', style: TextStyle(fontSize: 13, color: Colors.grey[600])),
              const SizedBox(width: 12),
              Expanded(
                child: _isLoadingLocation
                    ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
                    : Text(
                  _currentAddress ?? 'Not detected',
                  style: const TextStyle(
                      fontSize: 13, fontWeight: FontWeight.w500),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 18, color: Colors.grey[600]),
          const SizedBox(width: 12),
          SizedBox(
            width: 100,
            child: Text(label,
                style: TextStyle(fontSize: 13, color: Colors.grey[600])),
          ),
          Text(':', style: TextStyle(fontSize: 13, color: Colors.grey[600])),
          const SizedBox(width: 12),
          Expanded(
            child: Text(value,
                style: const TextStyle(
                    fontSize: 13, fontWeight: FontWeight.w500)),
          ),
        ],
      ),
    );
  }

  Widget _buildSettingsOptions() {
    final user = AuthService.currentUser;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
              color: Colors.grey.withOpacity(0.05),
              spreadRadius: 1,
              blurRadius: 4),
        ],
      ),
      child: Column(
        children: [
          _buildSettingTile(
            icon: Icons.notifications_outlined,
            title: 'Notifications',
            subtitle: 'Manage alert preferences',
            onTap: () {},
          ),
          const Divider(height: 1),
          _buildSettingTile(
            icon: Icons.language_outlined,
            title: 'Language',
            subtitle: user?['preferred_language'] ?? 'English',
            onTap: () {},
          ),
          const Divider(height: 1),
          _buildSettingTile(
            icon: Icons.location_on_outlined,
            title: 'Location Settings',
            subtitle: _currentAddress ?? 'Tap to detect',
            onTap: _getCurrentLocation,
          ),
          const Divider(height: 1),
          _buildSettingTile(
            icon: Icons.security_outlined,
            title: 'Privacy & Security',
            subtitle: 'Manage your data',
            onTap: () {},
          ),
          const Divider(height: 1),
          _buildSettingTile(
            icon: Icons.help_outline,
            title: 'Help & Support',
            subtitle: 'FAQs, Contact us',
            onTap: () {},
          ),
          const Divider(height: 1),
          _buildSettingTile(
            icon: Icons.info_outline,
            title: 'About',
            subtitle: 'Version 1.0.0',
            onTap: () {},
          ),
        ],
      ),
    );
  }

  Widget _buildSettingTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Icon(icon, color: AppTheme.primaryBlue),
      title: Text(title,
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
      subtitle: Text(subtitle,
          style: TextStyle(fontSize: 11, color: Colors.grey[600])),
      trailing: const Icon(Icons.chevron_right, size: 18),
      onTap: onTap,
    );
  }

  Widget _buildLogoutButton(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: () {
          showDialog(
            context: context,
            builder: (context) => AlertDialog(
              title: const Text('Logout'),
              content: const Text('Are you sure you want to logout?'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: () {
                    AuthService.logout();
                    Navigator.pop(context);
                    Navigator.pushReplacementNamed(context, '/login');
                  },
                  style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryBlue),
                  child: const Text('Logout'),
                ),
              ],
            ),
          );
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.white,
          foregroundColor: AppTheme.primaryBlue,
          side: const BorderSide(color: AppTheme.primaryBlue),
          shape:
          RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          padding: const EdgeInsets.symmetric(vertical: 16),
        ),
        child: const Text('Logout',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
      ),
    );
  }
}
