import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:healorithm/services/auth_service.dart';

final supabase = Supabase.instance.client;

class UpdateSection extends StatefulWidget {
  const UpdateSection({super.key});

  @override
  State<UpdateSection> createState() => _UpdateSectionState();
}

class _UpdateSectionState extends State<UpdateSection> {
  bool _isLoading = true;
  List<Map<String, dynamic>> _records = [];
  List<Map<String, dynamic>> _vitals = [];
  List<Map<String, dynamic>> _prescriptions = [];

  static const List<Map<String, dynamic>> _fallbackRecords = [
    {
      'diagnosis': 'General checkup',
      'description': 'Sample record. Real records will appear after clinic updates.',
      'visit_date': '2026-01-01',
      'visit_type': 'routine',
    },
  ];

  static const List<Map<String, dynamic>> _fallbackVitals = [
    {
      'systolic_bp': 120,
      'diastolic_bp': 80,
      'heart_rate': 72,
      'spo2': 98,
      'temperature': 36.8,
      'recorded_at': '2026-01-01T10:00:00Z',
    },
  ];

  static const List<Map<String, dynamic>> _fallbackPrescriptions = [
    {
      'medicine_name': 'Paracetamol',
      'dosage': '500mg',
      'timing': 'Morning and Night',
      'duration': '3 days',
      'created_at': '2026-01-01T10:00:00Z',
    },
  ];

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    if (!mounted) return;
    setState(() => _isLoading = true);

    try {
      await AuthService.refreshCurrentUser();
      final userId = AuthService.currentUser?['id']?.toString();

      if (userId == null || userId.isEmpty) {
        if (!mounted) return;
        setState(() {
          _isLoading = false;
          _records = List<Map<String, dynamic>>.from(_fallbackRecords);
          _vitals = List<Map<String, dynamic>>.from(_fallbackVitals);
          _prescriptions = List<Map<String, dynamic>>.from(_fallbackPrescriptions);
        });
        return;
      }

      final recordsFuture = supabase
          .from('medical_records')
          .select()
          .eq('patient_id', userId)
          .order('visit_date', ascending: false)
          .order('created_at', ascending: false);

      final vitalsFuture = supabase
          .from('vitals')
          .select()
          .eq('patient_id', userId)
          .order('recorded_at', ascending: false)
          .order('created_at', ascending: false);

      final prescriptionsFuture = supabase
          .from('prescriptions')
          .select()
          .eq('patient_id', userId)
          .order('created_at', ascending: false);

      final results = await Future.wait([recordsFuture, vitalsFuture, prescriptionsFuture]);

      final records = List<Map<String, dynamic>>.from(results[0]);
      final vitals = List<Map<String, dynamic>>.from(results[1]);
      final prescriptions = List<Map<String, dynamic>>.from(results[2]);

      if (!mounted) return;
      setState(() {
        _records = records.isEmpty ? List<Map<String, dynamic>>.from(_fallbackRecords) : records;
        _vitals = vitals.isEmpty ? List<Map<String, dynamic>>.from(_fallbackVitals) : vitals;
        _prescriptions = prescriptions.isEmpty
            ? List<Map<String, dynamic>>.from(_fallbackPrescriptions)
            : prescriptions;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _records = List<Map<String, dynamic>>.from(_fallbackRecords);
        _vitals = List<Map<String, dynamic>>.from(_fallbackVitals);
        _prescriptions = List<Map<String, dynamic>>.from(_fallbackPrescriptions);
        _isLoading = false;
      });
    }
  }

  String _formatDate(dynamic value) {
    final raw = value?.toString();
    if (raw == null || raw.isEmpty) return 'N/A';
    try {
      final date = DateTime.parse(raw).toLocal();
      return '${date.day}/${date.month}/${date.year}';
    } catch (_) {
      return raw;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F9FF),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _fetchData,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
                children: [
                  const Text('Medical Records', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 10),
                  ..._records.map(_buildRecordCard),
                  const SizedBox(height: 16),
                  const Text('Vitals History', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 10),
                  ..._vitals.map(_buildVitalCard),
                  const SizedBox(height: 16),
                  const Text('Medicines', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 10),
                  ..._prescriptions.map(_buildPrescriptionCard),
                ],
              ),
            ),
    );
  }

  Widget _buildRecordCard(Map<String, dynamic> r) {
    final title = (r['diagnosis'] ?? r['vaccine_name'] ?? r['visit_type'] ?? 'Medical record').toString();
    final description = (r['description'] ?? 'No additional notes').toString();
    final date = _formatDate(r['visit_date'] ?? r['created_at']);

    return _card(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
        const SizedBox(height: 6),
        Text(description, style: TextStyle(fontSize: 13, color: Colors.grey[700])),
        const SizedBox(height: 8),
        Text('Date: $date', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
      ]),
    );
  }

  Widget _buildVitalCard(Map<String, dynamic> v) {
    final bp = '${v['systolic_bp'] ?? '-'} / ${v['diastolic_bp'] ?? '-'}';
    final hr = v['heart_rate']?.toString() ?? '-';
    final spo2 = v['spo2']?.toString() ?? '-';
    final temp = v['temperature']?.toString() ?? '-';
    final date = _formatDate(v['recorded_at'] ?? v['created_at']);

    return _card(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('BP $bp  |  HR $hr  |  SpO2 $spo2  |  Temp $temp', style: const TextStyle(fontWeight: FontWeight.w700)),
        const SizedBox(height: 8),
        Text('Recorded: $date', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
      ]),
    );
  }

  Widget _buildPrescriptionCard(Map<String, dynamic> p) {
    final name = (p['medicine_name'] ?? 'Medicine').toString();
    final dosage = (p['dosage'] ?? '').toString();
    final timing = (p['timing'] ?? '').toString();
    final duration = (p['duration'] ?? '').toString();
    final date = _formatDate(p['created_at'] ?? p['start_date']);

    final detail = [dosage, timing, duration].where((e) => e.isNotEmpty).join(' • ');

    return _card(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(name, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
        if (detail.isNotEmpty) ...[
          const SizedBox(height: 6),
          Text(detail, style: TextStyle(fontSize: 13, color: Colors.grey[700])),
        ],
        const SizedBox(height: 8),
        Text('Added: $date', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
      ]),
    );
  }

  Widget _card({required Widget child}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: child,
    );
  }
}
