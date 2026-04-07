import 'package:flutter/material.dart';
import 'package:healorithm/theme/app_theme.dart';
import 'package:healorithm/services/auth_service.dart'; // ✅ FIXED: added import
import 'package:lottie/lottie.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final supabase = Supabase.instance.client;

class UpdateSection extends StatefulWidget {
  const UpdateSection({super.key});

  @override
  State<UpdateSection> createState() => _UpdateSectionState();
}

class _UpdateSectionState extends State<UpdateSection> {
  bool _isLoading = true;
  List<Map<String, dynamic>> _records = [];
  Map<String, dynamic>? _analytics;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    try {
      final userId = AuthService.currentUser?['id'];

      if (userId == null) {
        setState(() => _isLoading = false);
        return;
      }

      final records = await supabase
          .from('medical_records')
          .select()
          .eq('user_id', userId)
          .order('created_at', ascending: false);

      final analytics = await supabase
          .from('health_analytics')
          .select()
          .eq('user_id', userId)
          .limit(1)
          .maybeSingle();

      setState(() {
        _records = List<Map<String, dynamic>>.from(records);
        _analytics = analytics;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F9FF), // ✅ Softer blue-tinted background
      body: _isLoading
          ? _buildLoadingState()
          : _records.isEmpty
          ? _buildEmptyState()
          : _buildMainContent(),
    );
  }

  Widget _buildLoadingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: 300,
            height: 300,
            child: Lottie.asset('assets/animations/update_loading.json',
                fit: BoxFit.contain),
          ),
          const SizedBox(height: 54),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF4158D0), Color(0xFFC850C0)],
              ),
              borderRadius: BorderRadius.circular(30),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF4158D0).withOpacity(0.3),
                  blurRadius: 15,
                  offset: const Offset(0, 5),
                ),
              ],
            ),
            child: const Text(
              'Fetching latest updates...',
              style: TextStyle(
                  fontSize: 16,
                  color: Colors.white,
                  fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: 350,
            height: 350,
            child: Lottie.asset(
                'assets/animations/nothing_here_animation.json',
                fit: BoxFit.contain),
          ),
          const SizedBox(height: 26),
          ShaderMask(
            shaderCallback: (bounds) => const LinearGradient(
              colors: [Color(0xFF4158D0), Color(0xFFC850C0), Color(0xFFFFCC70)],
            ).createShader(bounds),
            child: const Text(
              'No Recent Updates',
              style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.white),
            ),
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Text(
              'There are no new updates at the moment.\nCheck back later for the latest information.',
              textAlign: TextAlign.center,
              style:
              TextStyle(fontSize: 14, color: Colors.grey[700], height: 1.5),
            ),
          ),
          const SizedBox(height: 24),
          GestureDetector(
            onTapDown: (_) => setState(() {}),
            onTapUp: (_) => setState(() {}),
            child: TweenAnimationBuilder(
              tween: Tween<double>(begin: 1, end: 1),
              duration: const Duration(milliseconds: 100),
              builder: (context, double scale, child) {
                return Transform.scale(
                  scale: scale,
                  child: child,
                );
              },
              child: ElevatedButton.icon(
                onPressed: _fetchData,
                icon: const Icon(Icons.refresh, size: 18),
                label: const Text('Refresh'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF4158D0),
                  foregroundColor: Colors.white,
                  padding:
                  const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30)),
                  elevation: 8,
                  shadowColor: const Color(0xFF4158D0).withOpacity(0.5),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMainContent() {
    return RefreshIndicator(
      onRefresh: _fetchData,
      color: const Color(0xFF4158D0),
      backgroundColor: Colors.white,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
        children: [
          if (_analytics != null) ...[
            _buildHealthAnalyticsCard(_analytics!),
            const SizedBox(height: 20),
          ],
          Padding(
            padding: const EdgeInsets.only(left: 8, bottom: 8),
            child: Row(
              children: [
                Container(
                  width: 4,
                  height: 20,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF4158D0), Color(0xFFC850C0)],
                    ),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(width: 8),
                const Text(
                  'Your Personal Reports',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF2C3E50),
                  ),
                ),
              ],
            ),
          ),
          ..._records.map((record) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _buildPersonalReportCard(record),
          )),
          const SizedBox(height: 20),
          const Divider(
            thickness: 1,
            height: 20,
            color: Color(0xFFE0E7FF),
          ),
        ],
      ),
    );
  }

  Widget _buildHealthAnalyticsCard(Map<String, dynamic> data) {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Colors.white, Color(0xFFF0F5FF)],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF4158D0).withOpacity(0.2),
            spreadRadius: 1,
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.analytics, color: Color(0xFF4158D0), size: 24),
                SizedBox(width: 8),
                Text('Health Analytics',
                    style:
                    TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF2C3E50))),
              ],
            ),
            const SizedBox(height: 16),
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.2,
              children: [
                _buildAnalyticsItem(
                  icon: Icons.vaccines,
                  title: 'Vaccination',
                  value: data['vaccination_status'] ?? 'N/A',
                  status: data['vaccination_label'] ?? 'N/A',
                  statusColor: const Color(0xFF10B981),
                  progress: 1.0,
                ),
                _buildAnalyticsItem(
                  icon: Icons.medication,
                  title: 'Medicine Tracker',
                  value: data['medicine_tracker'] ?? 'N/A',
                  status: data['medicine_percent'] ?? 'N/A',
                  statusColor: const Color(0xFFF59E0B),
                  progress:
                  (data['medicine_progress'] as num?)?.toDouble() ?? 0.75,
                ),
                _buildAnalyticsItem(
                  icon: Icons.health_and_safety,
                  title: 'Last Check',
                  value: data['last_checkup_date'] ?? 'N/A',
                  status: data['last_checkup_status'] ?? 'N/A',
                  statusColor: const Color(0xFF10B981),
                  showProgress: false,
                ),
                _buildAnalyticsItem(
                  icon: Icons.calendar_month,
                  title: 'Next Appt',
                  value: data['next_appointment_doctor'] ?? 'N/A',
                  status: data['next_appointment_date'] ?? 'N/A',
                  statusColor: const Color(0xFF4158D0),
                  showProgress: false,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAnalyticsItem({
    required IconData icon,
    required String title,
    required String value,
    required String status,
    required Color statusColor,
    double? progress,
    bool showProgress = true,
  }) {
    return GestureDetector(
      onTapDown: (_) {
        setState(() {});
      },
      onTapUp: (_) {
        setState(() {});
      },
      onTapCancel: () {
        setState(() {});
      },
      child: TweenAnimationBuilder(
        tween: Tween<double>(begin: 1, end: 1),
        duration: const Duration(milliseconds: 150),
        curve: Curves.elasticOut,
        builder: (context, double scale, child) {
          return Transform.scale(
            scale: scale,
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: statusColor.withOpacity(0.3), width: 1.5),
                boxShadow: [
                  BoxShadow(
                    color: statusColor.withOpacity(0.15),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8), // Increased padding
                        decoration: BoxDecoration(
                          color: statusColor.withOpacity(0.15),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(icon, color: statusColor, size: 20), // Increased from 14 to 20
                      ),
                      Container(
                        padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3), // Increased padding
                        decoration: BoxDecoration(
                          color: statusColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: statusColor.withOpacity(0.3)),
                        ),
                        child: Text(status,
                            style: TextStyle(
                                fontSize: 9, // Increased from 8 to 9
                                fontWeight: FontWeight.bold,
                                color: statusColor)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10), // Increased spacing
                  Text(title, style: TextStyle(fontSize: 11, color: Colors.grey[700], fontWeight: FontWeight.w500)), // Increased size
                  Text(value,
                      style:
                      const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF2C3E50)), // Increased from 13 to 14
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis),
                  if (showProgress && progress != null) ...[
                    const SizedBox(height: 8), // Increased spacing
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4), // Increased radius
                      child: LinearProgressIndicator(
                        value: progress,
                        backgroundColor: statusColor.withOpacity(0.1),
                        valueColor: AlwaysStoppedAnimation<Color>(statusColor),
                        minHeight: 5, // Increased from 4 to 5
                      ),
                    ),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  IconData _getIcon(String? iconName) {
    switch (iconName) {
      case 'medical_services': return Icons.medical_services;
      case 'description':      return Icons.description;
      case 'vaccines':         return Icons.vaccines;
      case 'science':          return Icons.science;
      case 'favorite':         return Icons.favorite;
      case 'healing':          return Icons.healing;
      default:                 return Icons.medical_services;
    }
  }

  Color _getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'normal':
      case 'completed':      return const Color(0xFF10B981);
      case 'active':         return const Color(0xFF4158D0);
      case 'pending review':
      case 'pending':        return const Color(0xFFF59E0B);
      case 'critical':       return const Color(0xFFEF4444);
      default:               return const Color(0xFF4158D0);
    }
  }

  Widget _buildPersonalReportCard(Map<String, dynamic> record) {
    final statusColor = _getStatusColor(record['status']);
    final icon = _getIcon(record['icon']);

    return GestureDetector(
      onTapDown: (_) {
        setState(() {});
      },
      onTapUp: (_) {
        setState(() {});
      },
      onTapCancel: () {
        setState(() {});
      },
      child: TweenAnimationBuilder(
        tween: Tween<double>(begin: 1, end: 1),
        duration: const Duration(milliseconds: 150),
        curve: Curves.elasticOut,
        builder: (context, double scale, child) {
          return Transform.scale(
            scale: scale,
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Colors.white,
                    statusColor.withOpacity(0.03),
                  ],
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                    color: statusColor.withOpacity(0.3), width: 1.5),
                boxShadow: [
                  BoxShadow(
                      color: statusColor.withOpacity(0.15),
                      spreadRadius: 1,
                      blurRadius: 8,
                      offset: const Offset(0, 3)),
                ],
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 45, // Increased from 40 to 45
                          height: 45, // Increased from 40 to 45
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                statusColor.withOpacity(0.2),
                                statusColor.withOpacity(0.1),
                              ],
                            ),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(icon, color: statusColor, size: 24), // Increased from 20 to 24
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(record['report_type'] ?? '',
                                  style: const TextStyle(
                                      fontSize: 17, fontWeight: FontWeight.bold, color: Color(0xFF2C3E50))), // Increased from 16 to 17
                              const SizedBox(height: 2),
                              Text(record['hospital'] ?? '',
                                  style: TextStyle(
                                      fontSize: 13, color: Colors.grey[700])), // Increased from 12 to 13
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 6), // Increased padding
                          decoration: BoxDecoration(
                            color: statusColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: statusColor.withOpacity(0.3)),
                          ),
                          child: Text(record['status'] ?? '',
                              style: TextStyle(
                                  fontSize: 11, // Increased from 10 to 11
                                  fontWeight: FontWeight.bold,
                                  color: statusColor)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14), // Increased from 12 to 14
                    Row(
                      children: [
                        Icon(Icons.person_outline, size: 15, color: Colors.grey[600]), // Increased from 14 to 15
                        const SizedBox(width: 4),
                        Text(record['patient_name'] ?? '',
                            style: TextStyle(
                                fontSize: 13, // Increased from 12 to 13
                                color: Colors.grey[800],
                                fontWeight: FontWeight.w500)),
                        const SizedBox(width: 12),
                        Container(
                            width: 4, // Increased from 3 to 4
                            height: 4, // Increased from 3 to 4
                            decoration: const BoxDecoration(
                                color: Colors.grey, shape: BoxShape.circle)),
                        const SizedBox(width: 12),
                        Icon(Icons.calendar_today, size: 13, color: Colors.grey[600]), // Increased from 12 to 13
                        const SizedBox(width: 4),
                        Text(record['date'] ?? '',
                            style:
                            TextStyle(fontSize: 13, color: Colors.grey[800])), // Increased from 12 to 13
                      ],
                    ),
                    const SizedBox(height: 10), // Increased from 8 to 10
                    Row(
                      children: [
                        Icon(Icons.medical_services_outlined,
                            size: 15, color: Colors.grey[600]), // Increased from 14 to 15
                        const SizedBox(width: 4),
                        Text(record['doctor'] ?? '',
                            style:
                            TextStyle(fontSize: 13, color: Colors.grey[800])), // Increased from 12 to 13
                      ],
                    ),
                    const SizedBox(height: 14), // Increased from 12 to 14
                    Container(
                      padding: const EdgeInsets.all(14), // Increased from 12 to 14
                      decoration: BoxDecoration(
                        color: statusColor.withOpacity(0.03),
                        borderRadius: BorderRadius.circular(14), // Increased from 12 to 14
                        border: Border.all(color: statusColor.withOpacity(0.1)),
                      ),
                      child: Text(record['details'] ?? '',
                          style: TextStyle(
                              fontSize: 14, color: Colors.grey[800], height: 1.4)), // Increased from 13 to 14
                    ),
                    const SizedBox(height: 14), // Increased from 12 to 14
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        TextButton.icon(
                          onPressed: () {},
                          icon: const Icon(Icons.download, size: 17), // Increased from 16 to 17
                          label: const Text('Download', style: TextStyle(fontSize: 13)), // Added font size
                          style:
                          TextButton.styleFrom(foregroundColor: statusColor),
                        ),
                        const SizedBox(width: 8),
                        ElevatedButton.icon(
                          onPressed: () {},
                          icon: const Icon(Icons.visibility, size: 17), // Increased from 16 to 17
                          label: const Text('View Full Report', style: TextStyle(fontSize: 13)), // Added font size
                          style: ElevatedButton.styleFrom(
                            backgroundColor: statusColor,
                            foregroundColor: Colors.white,
                            elevation: 4,
                            shadowColor: statusColor.withOpacity(0.4),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(20)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}