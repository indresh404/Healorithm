// lib/components/user/home_screen.dart
// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Home — Welcome, health summary, quick actions, nearby hospitals
// ─────────────────────────────────────────────────────────────────────────────
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:healorithm/theme/app_theme.dart';
import 'package:healorithm/services/auth_service.dart';
import 'package:healorithm/services/ai_consultation_service.dart';
import 'package:healorithm/components/user/ai_chat_screen.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:flutter_phone_direct_caller/flutter_phone_direct_caller.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Map<String, dynamic>> _hospitals = [];
  List<Map<String, dynamic>> _workers = [];
  bool _loadingHospitals = true;
  bool _loadingWorkers = true;
  bool _loadingAnalytics = true;
  String? _error;
  Map<String, dynamic> _analytics = {};

  @override
  void initState() {
    super.initState();
    _loadAnalytics();
    _loadWorkers();
    getNearbyHospitals();
  }

  Future<void> _loadWorkers() async {
    setState(() => _loadingWorkers = true);
    try {
      final data = await Supabase.instance.client
          .from('worker')
          .select('name, phone_no, created_at')
          .order('created_at', ascending: false);
      if (!mounted) return;
      setState(() {
        _workers = List<Map<String, dynamic>>.from(data);
        _loadingWorkers = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loadingWorkers = false);
    }
  }

  Future<void> _callWorker(String phone) async {
    final cleaned = phone.replaceAll(RegExp(r'[^0-9+]'), '');
    if (cleaned.isEmpty) return;

    final status = await Permission.phone.request();
    if (!status.isGranted) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Phone call permission is required to place direct calls.')),
      );
      return;
    }

    await FlutterPhoneDirectCaller.callNumber(cleaned);
  }

  Future<void> _loadAnalytics() async {
    try {
      final data = await AIConsultationService.getAnalyticsSummary();
      if (mounted) {
        setState(() {
          _analytics = data;
          _loadingAnalytics = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingAnalytics = false);
    }
  }

  Future<void> getNearbyHospitals() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (mounted) {
          setState(() {
            _error = 'Location services are disabled';
            _loadingHospitals = false;
          });
        }
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.deniedForever) {
        if (mounted) {
          setState(() {
            _error = 'Location permission denied';
            _loadingHospitals = false;
          });
        }
        return;
      }

      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      final lat = position.latitude;
      final lon = position.longitude;
      final url =
          'https://overpass-api.de/api/interpreter?data=[out:json];node(around:5000,$lat,$lon)[amenity=hospital];out;';

      final response = await http.get(Uri.parse(url));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        final elements =
            (data['elements'] as List?)?.cast<Map<String, dynamic>>() ?? [];
        if (mounted) {
          setState(() {
            _hospitals = elements;
            _loadingHospitals = false;
            _error = null;
          });
        }
      } else if (mounted) {
        setState(() {
          _error = 'Failed to fetch hospitals';
          _loadingHospitals = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Unable to get nearby hospitals';
          _loadingHospitals = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = AuthService.currentUser;
    final userName = user?['name'] as String? ?? 'User';
    final firstName = userName.split(' ').first;

    // Get time-based greeting
    final hour = DateTime.now().hour;
    String greeting;
    if (hour < 12) {
      greeting = 'Good Morning';
    } else if (hour < 17) {
      greeting = 'Good Afternoon';
    } else {
      greeting = 'Good Evening';
    }

    return Container(
      color: AppTheme.offWhite,
      child: RefreshIndicator(
        onRefresh: () async {
          await Future.wait([_loadAnalytics(), _loadWorkers(), getNearbyHospitals()]);
        },
        color: AppTheme.primaryBlue,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 120),
          children: [
            // Welcome card
            _buildWelcomeCard(greeting, firstName),
            const SizedBox(height: 16),

            // Health summary strip
            if (!_loadingAnalytics) _buildHealthSummary(),
            if (!_loadingAnalytics) const SizedBox(height: 16),

            // Quick actions
            _buildQuickActions(context),
            const SizedBox(height: 20),

            _buildWorkersSection(),
            const SizedBox(height: 20),

            // Nearby hospitals
            _buildHospitalsSection(),
          ],
        ),
      ),
    );
  }

  // ── Welcome card ───────────────────────────────────────────────────────────
  Widget _buildWelcomeCard(String greeting, String name) {
    final todayStr =
        '${_monthName(DateTime.now().month)} ${DateTime.now().day}, ${DateTime.now().year}';

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppTheme.primaryBlue,
            AppTheme.accentBlue,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
              color: AppTheme.primaryBlue.withOpacity(0.3),
              blurRadius: 16,
              offset: const Offset(0, 6)),
        ],
      ),
      child: Row(children: [
        Expanded(
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(greeting,
                style: TextStyle(
                    fontSize: 14,
                    color: Colors.white.withOpacity(0.8),
                    fontWeight: FontWeight.w500)),
            const SizedBox(height: 4),
            Text('$name 👋',
                style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                    letterSpacing: -0.5)),
            const SizedBox(height: 8),
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Icon(Icons.calendar_today,
                    size: 12, color: Colors.white.withOpacity(0.8)),
                const SizedBox(width: 6),
                Text(todayStr,
                    style: TextStyle(
                        fontSize: 11,
                        color: Colors.white.withOpacity(0.9),
                        fontWeight: FontWeight.w500)),
              ]),
            ),
          ]),
        ),
        Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.2),
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Icon(Icons.health_and_safety_rounded,
              color: Colors.white, size: 32),
        ),
      ]),
    );
  }

  // ── Health summary tiles ───────────────────────────────────────────────────
  Widget _buildHealthSummary() {
    final total = _analytics['total'] ?? 0;
    final meds = (_analytics['topMedicines'] as List?)?.length ?? 0;
    final green = _analytics['green'] ?? 0;
    final yellow = _analytics['yellow'] ?? 0;
    final red = _analytics['red'] ?? 0;

    String statusText = 'New';
    Color statusColor = Colors.grey;
    if (total > 0) {
      if (red > 0) {
        statusText = 'Needs Attention';
        statusColor = const Color(0xFFE53935);
      } else if (yellow > 0) {
        statusText = 'Monitoring';
        statusColor = const Color(0xFFFB8C00);
      } else {
        statusText = 'Healthy';
        statusColor = const Color(0xFF43A047);
      }
    }

    return Row(children: [
      _summaryTile(
        icon: Icons.chat_bubble_outline,
        value: '$total',
        label: 'Consultations',
        color: AppTheme.primaryBlue,
      ),
      const SizedBox(width: 10),
      _summaryTile(
        icon: Icons.medication_outlined,
        value: '$meds',
        label: 'Medicines',
        color: const Color(0xFFFB8C00),
      ),
      const SizedBox(width: 10),
      _summaryTile(
        icon: Icons.favorite_outline,
        value: statusText,
        label: 'Status',
        color: statusColor,
        isSmallText: true,
      ),
    ]);
  }

  Widget _summaryTile({
    required IconData icon,
    required String value,
    required String label,
    required Color color,
    bool isSmallText = false,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withOpacity(0.03),
                blurRadius: 8,
                offset: const Offset(0, 2)),
          ],
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 16),
          ),
          const SizedBox(height: 10),
          Text(value,
              style: TextStyle(
                  fontSize: isSmallText ? 12 : 18,
                  fontWeight: FontWeight.w800,
                  color: color)),
          const SizedBox(height: 2),
          Text(label,
              style: TextStyle(fontSize: 10, color: Colors.grey[500])),
        ]),
      ),
    );
  }

  // ── Quick actions ──────────────────────────────────────────────────────────
  Widget _buildQuickActions(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Container(
          width: 4,
          height: 20,
          decoration: BoxDecoration(
            color: AppTheme.primaryBlue,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 8),
        const Text('Quick Actions',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
      ]),
      const SizedBox(height: 12),
      Row(children: [
        _actionCard(
          icon: Icons.smart_toy_rounded,
          label: 'Talk to AI',
          color: AppTheme.primaryBlue,
          onTap: () {
            HapticFeedback.mediumImpact();
            Navigator.push(
              context,
              PageRouteBuilder(
                pageBuilder: (_, a, __) => const AIChatScreen(),
                transitionsBuilder: (_, a, __, child) => SlideTransition(
                  position: Tween<Offset>(
                          begin: const Offset(0, 1), end: Offset.zero)
                      .animate(CurvedAnimation(
                          parent: a, curve: Curves.easeOutCubic)),
                  child: child,
                ),
                transitionDuration: const Duration(milliseconds: 420),
              ),
            );
          },
        ),
        const SizedBox(width: 10),
        _actionCard(
          icon: Icons.analytics_outlined,
          label: 'View Records',
          color: const Color(0xFF43A047),
          onTap: () {
            // Navigate to records tab — handled by parent
          },
        ),
        const SizedBox(width: 10),
        _actionCard(
          icon: Icons.medication_outlined,
          label: 'Meds',
          color: const Color(0xFFFB8C00),
          onTap: () {
            // Navigate to meds tab — handled by parent
          },
        ),
      ]),
    ]);
  }

  Widget _actionCard({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: color.withOpacity(0.15)),
            boxShadow: [
              BoxShadow(
                  color: Colors.black.withOpacity(0.03),
                  blurRadius: 8,
                  offset: const Offset(0, 2)),
            ],
          ),
          child: Column(children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(height: 8),
            Text(label,
                style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: color)),
          ]),
        ),
      ),
    );
  }

  // ── Hospitals section ──────────────────────────────────────────────────────
  Widget _buildHospitalsSection() {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Container(
          width: 4,
          height: 20,
          decoration: BoxDecoration(
            color: AppTheme.primaryBlue,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 8),
        Icon(Icons.local_hospital,
            color: AppTheme.primaryBlue, size: 20),
        const SizedBox(width: 6),
        const Text('Nearest Hospitals',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
      ]),
      const SizedBox(height: 12),
      if (_loadingHospitals)
        const Center(
          child: Padding(
            padding: EdgeInsets.all(32),
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        )
      else if (_error != null)
        _buildHospitalError()
      else if (_hospitals.isEmpty)
        _buildNoHospitals()
      else
        ..._hospitals.take(10).map(_buildHospitalCard),
    ]);
  }

  Widget _buildWorkersSection() {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Container(
          width: 4,
          height: 20,
          decoration: BoxDecoration(
            color: AppTheme.primaryBlue,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 8),
        Icon(Icons.support_agent_rounded, color: AppTheme.primaryBlue, size: 20),
        const SizedBox(width: 6),
        const Text('Health Workers', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
      ]),
      const SizedBox(height: 12),
      if (_loadingWorkers)
        const Center(
          child: Padding(
            padding: EdgeInsets.all(20),
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        )
      else if (_workers.isEmpty)
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14)),
          child: const Text('No workers available right now.'),
        )
      else
        ..._workers.map((w) {
          final name = (w['name'] ?? 'Health Worker').toString();
          final phone = (w['phone_no'] ?? '').toString();
          return Container(
            margin: const EdgeInsets.only(bottom: 10),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              boxShadow: [
                BoxShadow(
                    color: Colors.black.withOpacity(0.03),
                    blurRadius: 8,
                    offset: const Offset(0, 2)),
              ],
            ),
            child: ListTile(
              leading: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppTheme.primaryBlue.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(Icons.person, color: AppTheme.primaryBlue),
              ),
              title: Text(name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
              subtitle: Text(phone.isEmpty ? 'Phone not available' : phone),
              trailing: IconButton(
                onPressed: phone.isEmpty ? null : () => _callWorker(phone),
                icon: const Icon(Icons.call_rounded),
                color: phone.isEmpty ? Colors.grey : const Color(0xFF2E7D32),
              ),
            ),
          );
        }),
    ]);
  }

  Widget _buildHospitalError() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(children: [
        Icon(Icons.location_off, size: 40, color: Colors.grey[400]),
        const SizedBox(height: 12),
        Text(_error!,
            style: TextStyle(fontSize: 14, color: Colors.grey[600]),
            textAlign: TextAlign.center),
        const SizedBox(height: 16),
        ElevatedButton.icon(
          onPressed: getNearbyHospitals,
          icon: const Icon(Icons.refresh, size: 16),
          label: const Text('Retry'),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.primaryBlue,
            foregroundColor: Colors.white,
          ),
        ),
      ]),
    );
  }

  Widget _buildNoHospitals() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(children: [
        Icon(Icons.local_hospital_outlined,
            size: 40, color: Colors.grey[400]),
        const SizedBox(height: 12),
        Text('No hospitals found nearby',
            style: TextStyle(fontSize: 14, color: Colors.grey[600])),
        const SizedBox(height: 16),
        TextButton.icon(
          onPressed: getNearbyHospitals,
          icon: const Icon(Icons.refresh, size: 16),
          label: const Text('Retry'),
        ),
      ]),
    );
  }

  Widget _buildHospitalCard(Map<String, dynamic> hospital) {
    final tags = hospital['tags'] as Map<String, dynamic>?;
    final name = tags?['name'] as String? ?? 'Unknown Hospital';
    final phone = tags?['phone'] as String?;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 8,
              offset: const Offset(0, 2)),
        ],
      ),
      child: ListTile(
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: const Color(0xFFE53935).withOpacity(0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(Icons.local_hospital,
              color: Color(0xFFE53935), size: 20),
        ),
        title: Text(name,
            style: const TextStyle(
                fontWeight: FontWeight.w600, fontSize: 14)),
        subtitle: phone != null
            ? Text(phone,
                style: TextStyle(fontSize: 12, color: Colors.grey[600]))
            : null,
        trailing: Icon(Icons.chevron_right,
            size: 18, color: Colors.grey[400]),
      ),
    );
  }

  String _monthName(int m) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[m - 1];
  }
}
