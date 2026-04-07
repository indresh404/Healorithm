// lib/components/user/alert_section.dart
// ─────────────────────────────────────────────────────────────────────────────
// Meds Alert & Schedule — Connects to Supabase prescriptions table
// Shows medication schedule, taking dates, messages, and 7-day weekly view
// ─────────────────────────────────────────────────────────────────────────────
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:healorithm/theme/app_theme.dart';
import 'package:healorithm/services/auth_service.dart';
import 'package:healorithm/services/ai_consultation_service.dart';

final _supabase = Supabase.instance.client;

// ── View modes ────────────────────────────────────────────────────────────────
enum _ViewMode { today, weekly }

class AlertSection extends StatefulWidget {
  const AlertSection({super.key});

  @override
  State<AlertSection> createState() => _AlertSectionState();
}

class _AlertSectionState extends State<AlertSection>
    with TickerProviderStateMixin {
  bool _isLoading = true;
  List<Map<String, dynamic>> _prescriptions = [];
  List<Map<String, dynamic>> _aiMedicines = [];
  Set<String> _takenToday = {};

  // 7-day schedule state
  _ViewMode _viewMode = _ViewMode.today;
  int _weekOffset = 0; // 0 = current week
  late DateTime _selectedDate;
  final Map<String, Set<String>> _takenByDay = {}; // "YYYY-MM-DD" → Set<medName>

  late TabController _tabController;

  static const _kTimeGroups = ['Morning', 'Afternoon', 'Night'];
  static const _kTimeRanges = {
    'Morning': '07:00 – 09:00',
    'Afternoon': '12:00 – 14:00',
    'Night': '20:00 – 22:00',
  };

  @override
  void initState() {
    super.initState();
    _selectedDate = _today;
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      setState(() => _viewMode =
      _tabController.index == 0 ? _ViewMode.today : _ViewMode.weekly);
    });
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  DateTime get _today {
    final n = DateTime.now();
    return DateTime(n.year, n.month, n.day);
  }

  String _dateKey(DateTime d) => d.toIso8601String().substring(0, 10);

  // ── Week helpers ────────────────────────────────────────────────────────────
  DateTime get _weekStart {
    final now = _today;
    final base = now.subtract(Duration(days: now.weekday % 7));
    return base.add(Duration(days: _weekOffset * 7));
  }

  List<DateTime> get _weekDays =>
      List.generate(7, (i) => _weekStart.add(Duration(days: i)));

  // ── All medicines combined ─────────────────────────────────────────────────
  List<Map<String, dynamic>> get _allMeds {
    final list = <Map<String, dynamic>>[];
    for (final p in _prescriptions) {
      final name = (p['medicine_name'] ?? p['name'] ?? '') as String;
      if (name.isEmpty) continue;
      list.add({
        'name': name,
        'dose': p['dosage'] ?? '',
        'note': p['notes'] ?? p['message'] ?? '',
        'type': 'rx',
        'label': _labelFromFrequency(p['frequency'] as String? ?? ''),
        'time': _timeFromFrequency(p['frequency'] as String? ?? ''),
        'doctor': p['doctor_name'] ?? '',
      });
    }
    for (final m in _aiMedicines) {
      final name = (m['name'] as String? ?? '');
      if (name.isEmpty) continue;
      list.add({
        'name': name,
        'dose': '',
        'note': m['context'] ?? '',
        'type': 'ai',
        'label': 'Morning',
        'time': '08:00',
      });
    }
    return list;
  }

  String _labelFromFrequency(String freq) {
    final f = freq.toLowerCase();
    if (f.contains('night') || f.contains('bed') || f.contains('evening')) {
      return 'Night';
    }
    if (f.contains('afternoon') || f.contains('lunch')) return 'Afternoon';
    return 'Morning';
  }

  String _timeFromFrequency(String freq) {
    final f = freq.toLowerCase();
    if (f.contains('night') || f.contains('bed')) return '21:00';
    if (f.contains('afternoon') || f.contains('lunch')) return '13:00';
    return '08:00';
  }

  // ── Data loading ───────────────────────────────────────────────────────────
  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final userId = AuthService.currentUser?['id'];

      List<Map<String, dynamic>> prescriptions = [];
      if (userId != null) {
        try {
          final data = await _supabase
              .from('prescriptions')
              .select()
              .eq('user_id', userId)
              .order('created_at', ascending: false);
          prescriptions = List<Map<String, dynamic>>.from(data);
        } catch (e) {
          debugPrint('Prescriptions table: $e');
        }
      }

      List<Map<String, dynamic>> aiMeds = [];
      try {
        aiMeds = await AIConsultationService.getMedicineSchedule();
      } catch (e) {
        debugPrint('AI medicines: $e');
      }

      final prefs = await SharedPreferences.getInstance();

      // Load today
      final todayKey = 'meds_taken_${_dateKey(_today)}';
      final takenJson = prefs.getString(todayKey);
      Set<String> taken = {};
      if (takenJson != null) taken = Set<String>.from(jsonDecode(takenJson));

      // Load whole week for 7-day view
      final Map<String, Set<String>> byDay = {};
      for (int offset = -7; offset <= 7; offset++) {
        final d = _today.add(Duration(days: offset));
        final k = 'meds_taken_${_dateKey(d)}';
        final j = prefs.getString(k);
        if (j != null) {
          byDay[_dateKey(d)] = Set<String>.from(jsonDecode(j));
        }
      }

      if (mounted) {
        setState(() {
          _prescriptions = prescriptions;
          _aiMedicines = aiMeds;
          _takenToday = taken;
          _takenByDay.addAll(byDay);
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _toggleTaken(String medName, {DateTime? forDate}) async {
    HapticFeedback.lightImpact();
    final date = forDate ?? _today;
    final key = _dateKey(date);
    final prefs = await SharedPreferences.getInstance();
    final prefsKey = 'meds_taken_$key';

    setState(() {
      _takenByDay[key] ??= {};
      if (_takenByDay[key]!.contains(medName)) {
        _takenByDay[key]!.remove(medName);
      } else {
        _takenByDay[key]!.add(medName);
      }
      if (key == _dateKey(_today)) {
        _takenToday = Set<String>.from(_takenByDay[key]!);
      }
    });

    await prefs.setString(prefsKey, jsonEncode(_takenByDay[key]!.toList()));
  }

  bool get _hasData => _prescriptions.isNotEmpty || _aiMedicines.isNotEmpty;

  // ─────────────────────────────────────────────────────────────────────────
  // BUILD
  // ─────────────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F9FF),
      body: _isLoading
          ? _buildLoading()
          : !_hasData
          ? _buildEmpty()
          : _buildMain(),
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  Widget _buildLoading() {
    return Center(
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        SizedBox(
          width: 60,
          height: 60,
          child: CircularProgressIndicator(
            strokeWidth: 3,
            valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primaryBlue),
          ),
        ),
        const SizedBox(height: 20),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF4158D0), Color(0xFF42A5F5)],
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
          child: const Text('Loading medications…',
              style: TextStyle(
                  fontSize: 14,
                  color: Colors.white,
                  fontWeight: FontWeight.w600)),
        ),
      ]),
    );
  }

  // ── Empty ─────────────────────────────────────────────────────────────────
  Widget _buildEmpty() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF4158D0).withOpacity(0.12),
                  blurRadius: 24,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Icon(Icons.health_and_safety_outlined,
                size: 64, color: const Color(0xFF4158D0).withOpacity(0.8)),
          ),
          const SizedBox(height: 32),
          const Text('No Medications Yet',
              style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF2C3E50))),
          const SizedBox(height: 12),
          Text(
            'Prescriptions from your doctor and daily\nsupplements recommended by AI will appear here.\nYou\'re all caught up! 😊',
            textAlign: TextAlign.center,
            style: TextStyle(
                fontSize: 14, color: Colors.grey[600], height: 1.6, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 36),
          ElevatedButton.icon(
            onPressed: _loadData,
            icon: const Icon(Icons.refresh, size: 18),
            label: const Text('Sync Latest'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF4158D0),
              foregroundColor: Colors.white,
              padding:
              const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(30)),
              elevation: 4,
              shadowColor: const Color(0xFF4158D0).withOpacity(0.3),
            ),
          ),
          const SizedBox(height: 100),
        ]),
      ),
    );
  }

  // ── Main scaffold with tabs ────────────────────────────────────────────────
  Widget _buildMain() {
    return Column(
      children: [
        // Tab bar
        Container(
          margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            boxShadow: [
              BoxShadow(
                  color: const Color(0xFF4158D0).withOpacity(0.08),
                  blurRadius: 10,
                  offset: const Offset(0, 2)),
            ],
          ),
          child: TabBar(
            controller: _tabController,
            indicator: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF4158D0), Color(0xFF42A5F5)],
              ),
              borderRadius: BorderRadius.circular(10),
            ),
            labelColor: Colors.white,
            unselectedLabelColor: Colors.grey[600],
            labelStyle: const TextStyle(
                fontSize: 13, fontWeight: FontWeight.w700),
            unselectedLabelStyle: const TextStyle(
                fontSize: 13, fontWeight: FontWeight.w500),
            padding: const EdgeInsets.all(4),
            tabs: const [
              Tab(text: 'Today'),
              Tab(text: '7-Day Schedule'),
            ],
          ),
        ),
        const SizedBox(height: 4),
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildTodayView(),
              _buildWeeklyView(),
            ],
          ),
        ),
      ],
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TODAY VIEW (original logic)
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildTodayView() {
    final allMedNames = <String>{};
    for (final p in _prescriptions) {
      allMedNames
          .add(p['medicine_name']?.toString() ?? p['name']?.toString() ?? '');
    }
    for (final m in _aiMedicines) {
      allMedNames.add(m['name']?.toString() ?? '');
    }
    allMedNames.remove('');

    final takenCount =
        allMedNames.where((m) => _takenToday.contains(m)).length;
    final totalCount = allMedNames.length;
    final progress = totalCount > 0 ? takenCount / totalCount : 0.0;

    return RefreshIndicator(
      onRefresh: _loadData,
      color: const Color(0xFF4158D0),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
        children: [
          _buildProgressCard(takenCount, totalCount, progress),
          const SizedBox(height: 20),
          // Alert message for today
          _buildTodayAlertBanner(takenCount, totalCount),
          const SizedBox(height: 8),
          Row(children: [
            Container(
              width: 4,
              height: 20,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF4158D0), Color(0xFF42A5F5)],
                ),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(width: 8),
            const Expanded(child: Text("Today's Schedule",
                style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF2C3E50)))),
            const SizedBox(width: 8),
            Container(
              padding:
              const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: const Color(0xFF4158D0).withOpacity(0.1),
                borderRadius: BorderRadius.circular(15),
              ),
              child: Text(
                '${DateTime.now().day}/${DateTime.now().month}/${DateTime.now().year}',
                style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF4158D0),
                    fontWeight: FontWeight.w600),
              ),
            ),
          ]),
          const SizedBox(height: 12),
          if (_prescriptions.isNotEmpty)
            ..._prescriptions.asMap().entries.map((entry) {
              final i = entry.key;
              final p = entry.value;
              return TweenAnimationBuilder<double>(
                tween: Tween(begin: 0, end: 1),
                duration: Duration(milliseconds: 400 + i * 80),
                curve: Curves.easeOutCubic,
                builder: (_, v, child) => Opacity(
                  opacity: v,
                  child: Transform.translate(
                    offset: Offset(0, 20 * (1 - v)),
                    child: child,
                  ),
                ),
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _buildPrescriptionCard(p),
                ),
              );
            }),
          if (_aiMedicines.isNotEmpty) ...[
            if (_prescriptions.isNotEmpty) ...[
              const SizedBox(height: 8),
              Row(children: [
                Container(
                  width: 4,
                  height: 20,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFF59E0B), Color(0xFFFBBF24)],
                    ),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(width: 8),
                const Expanded(child: Text('AI Recommended',
                    style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF2C3E50)))),
                const SizedBox(width: 8),
                Container(
                  padding:
                  const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF59E0B).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text('From AI Chat',
                      style: TextStyle(
                          fontSize: 10,
                          color: Color(0xFFF59E0B),
                          fontWeight: FontWeight.w700)),
                ),
              ]),
              const SizedBox(height: 12),
            ],
            ..._aiMedicines.asMap().entries.map((entry) {
              final i = entry.key;
              final med = entry.value;
              return TweenAnimationBuilder<double>(
                tween: Tween(begin: 0, end: 1),
                duration: Duration(
                    milliseconds:
                    400 + (_prescriptions.length + i) * 80),
                curve: Curves.easeOutCubic,
                builder: (_, v, child) => Opacity(
                  opacity: v,
                  child: Transform.translate(
                    offset: Offset(0, 20 * (1 - v)),
                    child: child,
                  ),
                ),
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _buildAiMedCard(med),
                ),
              );
            }),
          ],
        ],
      ),
    );
  }

  // ── Today alert banner ─────────────────────────────────────────────────────
  Widget _buildTodayAlertBanner(int taken, int total) {
    if (taken == total && total > 0) {
      return _alertBanner(
        icon: Icons.check_circle_outline,
        color: Colors.green,
        message: 'All medications taken for today. Great job! 🎉',
      );
    }
    final hour = DateTime.now().hour;
    String msg;
    if (hour < 9) {
      msg = 'Morning medications due soon — check your schedule below.';
    } else if (hour < 13) {
      msg = 'Afternoon medications are due around lunch time.';
    } else if (hour < 20) {
      msg = 'Evening reminder: ${total - taken} medication(s) remaining for today.';
    } else {
      msg = 'Night medications due now — Atorvastatin and Metoprolol.';
    }
    return _alertBanner(
      icon: Icons.notifications_active_outlined,
      color: const Color(0xFF4158D0),
      message: msg,
    );
  }

  Widget _alertBanner({
    required IconData icon,
    required Color color,
    required String message,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.07),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withOpacity(0.25)),
      ),
      child: Row(children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(width: 10),
        Expanded(
          child: Text(message,
              style: TextStyle(
                  fontSize: 13,
                  color: color.withOpacity(0.9),
                  fontWeight: FontWeight.w500,
                  height: 1.4)),
        ),
      ]),
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 7-DAY WEEKLY VIEW
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildWeeklyView() {
    return RefreshIndicator(
      onRefresh: _loadData,
      color: const Color(0xFF4158D0),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
        children: [
          // Week navigation
          _buildWeekNav(),
          const SizedBox(height: 14),
          // Day selector pills
          _buildDaySelector(),
          const SizedBox(height: 14),
          // Selected day progress
          _buildSelectedDayProgress(),
          const SizedBox(height: 12),
          // Alert for selected day
          _buildSelectedDayAlert(),
          const SizedBox(height: 8),
          // Time-grouped med list
          _buildSelectedDayMeds(),
          const SizedBox(height: 20),
          // Weekly adherence summary bar chart
          _buildWeeklyAdherenceChart(),
        ],
      ),
    );
  }

  // ── Week navigation ───────────────────────────────────────────────────────
  Widget _buildWeekNav() {
    final ws = _weekStart;
    final we = ws.add(const Duration(days: 6));
    final months = ['Jan','Feb','Mar','Apr','May','Jun',
      'Jul','Aug','Sep','Oct','Nov','Dec'];

    String label =
        '${ws.day} ${months[ws.month - 1]} – ${we.day} ${months[we.month - 1]} ${we.year}';

    return Row(children: [
      _iconBtn(Icons.chevron_left, () {
        setState(() {
          _weekOffset--;
          if (!_weekDays.contains(_selectedDate)) {
            _selectedDate = _weekDays.first;
          }
        });
      }),
      Expanded(
        child: Text(label,
            textAlign: TextAlign.center,
            style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: Color(0xFF2C3E50))),
      ),
      _iconBtn(Icons.chevron_right, () {
        setState(() {
          _weekOffset++;
          if (!_weekDays.contains(_selectedDate)) {
            _selectedDate = _weekDays.first;
          }
        });
      }),
    ]);
  }

  Widget _iconBtn(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withOpacity(0.06),
                blurRadius: 6,
                offset: const Offset(0, 2))
          ],
        ),
        child: Icon(icon, size: 20, color: const Color(0xFF4158D0)),
      ),
    );
  }

  // ── Day selector row ──────────────────────────────────────────────────────
  Widget _buildDaySelector() {
    const dows = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    final days = _weekDays;
    return Row(
      children: List.generate(7, (i) {
        final d = days[i];
        final isSelected = _dateKey(d) == _dateKey(_selectedDate);
        final isToday = _dateKey(d) == _dateKey(_today);
        final isFuture = d.isAfter(_today);
        final dk = _dateKey(d);
        final takenSet = _takenByDay[dk] ?? {};
        final meds = _allMeds;
        final allDone =
            !isFuture && meds.isNotEmpty && takenSet.length == meds.length;

        return Expanded(
          child: GestureDetector(
            onTap: () => setState(() => _selectedDate = d),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.symmetric(horizontal: 2),
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                gradient: isSelected
                    ? const LinearGradient(
                  colors: [Color(0xFF4158D0), Color(0xFF42A5F5)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                )
                    : null,
                color: isSelected
                    ? null
                    : allDone
                    ? const Color(0xFFE8F5E9)
                    : Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isSelected
                      ? Colors.transparent
                      : isToday
                      ? const Color(0xFF4158D0).withOpacity(0.5)
                      : allDone
                      ? const Color(0xFF4CAF50).withOpacity(0.4)
                      : Colors.grey.withOpacity(0.15),
                  width: isToday && !isSelected ? 1.5 : 1,
                ),
                boxShadow: isSelected
                    ? [
                  BoxShadow(
                      color: const Color(0xFF4158D0).withOpacity(0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 3))
                ]
                    : [],
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(dows[i],
                      style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: isSelected
                              ? Colors.white.withOpacity(0.8)
                              : Colors.grey[500])),
                  const SizedBox(height: 4),
                  Text('${d.day}',
                      style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: isSelected
                              ? Colors.white
                              : allDone
                              ? const Color(0xFF4CAF50)
                              : const Color(0xFF2C3E50))),
                  const SizedBox(height: 4),
                  // Dot indicators
                  if (allDone)
                    Icon(Icons.check_circle,
                        size: 10,
                        color: isSelected
                            ? Colors.white
                            : const Color(0xFF4CAF50))
                  else if (!isFuture && takenSet.isNotEmpty)
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(
                        meds.length.clamp(0, 5),
                            (j) => Container(
                          width: 4,
                          height: 4,
                          margin: const EdgeInsets.symmetric(horizontal: 1),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: j < takenSet.length
                                ? (isSelected
                                ? Colors.white
                                : const Color(0xFF4158D0))
                                : (isSelected
                                ? Colors.white.withOpacity(0.3)
                                : Colors.grey.withOpacity(0.3)),
                          ),
                        ),
                      ),
                    )
                  else
                    const SizedBox(height: 6),
                ],
              ),
            ),
          ),
        );
      }),
    );
  }

  // ── Selected day progress ─────────────────────────────────────────────────
  Widget _buildSelectedDayProgress() {
    final dk = _dateKey(_selectedDate);
    final takenSet = _takenByDay[dk] ?? {};
    final meds = _allMeds;
    final taken = takenSet.length.clamp(0, meds.length);
    final total = meds.length;
    final progress = total > 0 ? taken / total : 0.0;

    final months = ['Jan','Feb','Mar','Apr','May','Jun',
      'Jul','Aug','Sep','Oct','Nov','Dec'];
    final isToday = _dateKey(_selectedDate) == _dateKey(_today);
    final dateLabel = isToday
        ? 'Today'
        : '${_selectedDate.day} ${months[_selectedDate.month - 1]}';

    return _buildProgressCard(taken, total, progress, label: dateLabel);
  }

  // ── Alert banner for selected day ─────────────────────────────────────────
  Widget _buildSelectedDayAlert() {
    final dk = _dateKey(_selectedDate);
    final takenSet = _takenByDay[dk] ?? {};
    final meds = _allMeds;
    final isFuture = _selectedDate.isAfter(_today);
    final isToday = _dateKey(_selectedDate) == _dateKey(_today);
    final taken = takenSet.length.clamp(0, meds.length);
    final total = meds.length;
    final missed = total - taken;

    if (isFuture) {
      return _alertBanner(
        icon: Icons.event_note_outlined,
        color: Colors.blueGrey,
        message:
        'Upcoming day — medications listed for planning. Mark them taken when the day arrives.',
      );
    }
    if (taken == total && total > 0) {
      return _alertBanner(
        icon: Icons.verified_outlined,
        color: const Color(0xFF4CAF50),
        message: 'All $total medications taken on this day. Excellent adherence!',
      );
    }
    if (!isToday && missed > 0) {
      return _alertBanner(
        icon: Icons.warning_amber_outlined,
        color: Colors.orange,
        message:
        '$missed medication${missed > 1 ? 's were' : ' was'} missed on this day. '
            'Consult your doctor if you skipped critical medications.',
      );
    }
    final hour = DateTime.now().hour;
    String msg;
    if (hour < 9) {
      msg = 'Morning medications due soon. Take them before 9 AM.';
    } else if (hour < 13) {
      msg = 'Take your afternoon supplement with lunch (Omega-3).';
    } else if (hour < 20) {
      msg = '$missed medication${missed > 1 ? 's' : ''} remaining today. Don\'t forget your evening dose.';
    } else {
      msg = 'Night medications are due now — Atorvastatin & Metoprolol.';
    }
    return _alertBanner(
      icon: Icons.alarm_outlined,
      color: const Color(0xFF4158D0),
      message: msg,
    );
  }

  // ── Time-grouped med list for selected day ────────────────────────────────
  Widget _buildSelectedDayMeds() {
    final dk = _dateKey(_selectedDate);
    final takenSet = _takenByDay[dk] ?? {};
    final meds = _allMeds;
    final isFuture = _selectedDate.isAfter(_today);

    if (meds.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Center(
          child: Column(children: [
            Icon(Icons.medication_outlined, size: 40, color: Colors.grey[400]),
            const SizedBox(height: 8),
            Text('No medications in schedule',
                style: TextStyle(fontSize: 14, color: Colors.grey[500])),
          ]),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: _kTimeGroups.map((group) {
        final groupMeds = meds.where((m) => m['label'] == group).toList();
        if (groupMeds.isEmpty) return const SizedBox.shrink();

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Time group header
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(children: [
                Container(
                  width: 3,
                  height: 16,
                  decoration: BoxDecoration(
                    color: _timeGroupColor(group),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(width: 8),
                Text(group,
                    style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: _timeGroupColor(group))),
                const SizedBox(width: 6),
                Text(_kTimeRanges[group] ?? '',
                    style: TextStyle(
                        fontSize: 11, color: Colors.grey[500])),
              ]),
            ),
            // Med cards
            ...groupMeds.map((med) {
              final name = med['name'] as String;
              final isTaken = takenSet.contains(name);
              final isMissed =
                  !isFuture && _selectedDate.isBefore(_today) && !isTaken;
              return _buildWeeklyMedCard(
                med: med,
                isTaken: isTaken,
                isMissed: isMissed,
                isFuture: isFuture,
                onTap: isFuture
                    ? null
                    : () => _toggleTaken(name, forDate: _selectedDate),
              );
            }),
            const SizedBox(height: 16),
          ],
        );
      }).toList(),
    );
  }

  Color _timeGroupColor(String group) {
    switch (group) {
      case 'Morning':
        return const Color(0xFFE67E22);
      case 'Afternoon':
        return const Color(0xFF2196F3);
      case 'Night':
        return const Color(0xFF7B1FA2);
      default:
        return const Color(0xFF4158D0);
    }
  }

  Widget _buildWeeklyMedCard({
    required Map<String, dynamic> med,
    required bool isTaken,
    required bool isMissed,
    required bool isFuture,
    VoidCallback? onTap,
  }) {
    final name = med['name'] as String;
    final displayName = name[0].toUpperCase() + name.substring(1);
    final dose = med['dose'] as String? ?? '';
    final note = med['note'] as String? ?? '';
    final type = med['type'] as String? ?? 'rx';
    final time = med['time'] as String? ?? '';
    final isRx = type == 'rx';

    Color cardBg;
    Color borderColor;
    Color iconBg;
    Color iconColor;

    if (isTaken) {
      cardBg = const Color(0xFFF0FDF4);
      borderColor = const Color(0xFF10B981).withOpacity(0.3);
      iconBg = const Color(0xFF10B981).withOpacity(0.15);
      iconColor = const Color(0xFF10B981);
    } else if (isMissed) {
      cardBg = const Color(0xFFFFF5F5);
      borderColor = Colors.red.withOpacity(0.25);
      iconBg = Colors.red.withOpacity(0.08);
      iconColor = Colors.red;
    } else if (isFuture) {
      cardBg = Colors.white;
      borderColor = Colors.grey.withOpacity(0.15);
      iconBg = Colors.grey.withOpacity(0.08);
      iconColor = Colors.grey;
    } else {
      cardBg = Colors.white;
      borderColor = isRx
          ? const Color(0xFF4158D0).withOpacity(0.15)
          : const Color(0xFFF59E0B).withOpacity(0.2);
      iconBg = isRx
          ? const Color(0xFF4158D0).withOpacity(0.08)
          : const Color(0xFFF59E0B).withOpacity(0.1);
      iconColor = isRx ? const Color(0xFF4158D0) : const Color(0xFFF59E0B);
    }

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(13),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: borderColor, width: 1.2),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withOpacity(0.03),
                blurRadius: 6,
                offset: const Offset(0, 2))
          ],
        ),
        child: Row(children: [
          // Icon
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: iconBg,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              isTaken
                  ? Icons.check_circle
                  : isMissed
                  ? Icons.cancel_outlined
                  : isRx
                  ? Icons.medication
                  : Icons.smart_toy_outlined,
              color: iconColor,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Expanded(
                    child: Text(displayName,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: isTaken
                              ? Colors.grey[600]
                              : isMissed
                              ? Colors.red[700]
                              : const Color(0xFF2C3E50),
                          decoration: isTaken
                              ? TextDecoration.lineThrough
                              : null,
                        )),
                  ),
                  // Badge
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 7, vertical: 2),
                    decoration: BoxDecoration(
                      color: isRx
                          ? const Color(0xFF4158D0).withOpacity(0.1)
                          : const Color(0xFFF59E0B).withOpacity(0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      isRx ? 'Rx' : 'AI',
                      style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          color: isRx
                              ? const Color(0xFF4158D0)
                              : const Color(0xFFF59E0B)),
                    ),
                  ),
                ]),
                if (dose.isNotEmpty || time.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    [dose, time].where((s) => s.isNotEmpty).join('  •  '),
                    style: TextStyle(fontSize: 11, color: Colors.grey[500]),
                  ),
                ],
                if (note.isNotEmpty) ...[
                  const SizedBox(height: 3),
                  Text(note,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                          fontSize: 11, color: Colors.grey[500])),
                ],
              ],
            ),
          ),
          const SizedBox(width: 8),
          // Check toggle
          if (!isFuture)
            AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: isTaken
                    ? const Color(0xFF10B981)
                    : isMissed
                    ? Colors.red.withOpacity(0.1)
                    : const Color(0xFF4158D0).withOpacity(0.08),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                isTaken
                    ? Icons.check
                    : isMissed
                    ? Icons.close
                    : Icons.add,
                color: isTaken
                    ? Colors.white
                    : isMissed
                    ? Colors.red
                    : const Color(0xFF4158D0),
                size: 18,
              ),
            )
          else
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: Colors.grey.withOpacity(0.06),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.lock_outline,
                  color: Colors.grey, size: 16),
            ),
        ]),
      ),
    );
  }

  // ── Weekly adherence bar chart ─────────────────────────────────────────────
  Widget _buildWeeklyAdherenceChart() {
    final days = _weekDays;
    final meds = _allMeds;
    const dows = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 12,
              offset: const Offset(0, 4))
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            const Icon(Icons.bar_chart, size: 18, color: Color(0xFF4158D0)),
            const SizedBox(width: 6),
            const Text('Weekly Adherence',
                style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF2C3E50))),
            const Spacer(),
            Container(
              padding:
              const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: const Color(0xFF4158D0).withOpacity(0.08),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                '${_weeklyAdherencePct(days, meds)}% avg',
                style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF4158D0)),
              ),
            ),
          ]),
          const SizedBox(height: 20),
          SizedBox(
            height: 120,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: List.generate(7, (i) {
                final d = days[i];
                final dk = _dateKey(d);
                final takenSet = _takenByDay[dk] ?? {};
                final isFuture = d.isAfter(_today);
                final pct =
                isFuture || meds.isEmpty ? 0.0 : takenSet.length / meds.length;
                final isSelected = dk == _dateKey(_selectedDate);
                final isToday = dk == _dateKey(_today);
                final barH = (pct * 80).clamp(4.0, 80.0);

                Color barColor;
                if (pct >= 1.0) {
                  barColor = const Color(0xFF4CAF50);
                } else if (pct > 0.5) {
                  barColor = const Color(0xFF4158D0);
                } else if (pct > 0) {
                  barColor = const Color(0xFFF59E0B);
                } else if (isFuture) {
                  barColor = Colors.grey.withOpacity(0.2);
                } else {
                  barColor = Colors.red.withOpacity(0.3);
                }

                return Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedDate = d),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        if (!isFuture)
                          Text(
                            '${(pct * 100).round()}%',
                            style: TextStyle(
                                fontSize: 9,
                                color: Colors.grey[500],
                                fontWeight: FontWeight.w600),
                          ),
                        const SizedBox(height: 4),
                        Container(
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          height: isFuture ? 8 : barH,
                          decoration: BoxDecoration(
                            color: barColor,
                            borderRadius: BorderRadius.circular(6),
                            border: isSelected || isToday
                                ? Border.all(
                                color: const Color(0xFF4158D0),
                                width: 1.5)
                                : null,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(dows[d.weekday % 7],
                            style: TextStyle(
                                fontSize: 11,
                                fontWeight: isToday
                                    ? FontWeight.w800
                                    : FontWeight.w500,
                                color: isToday
                                    ? const Color(0xFF4158D0)
                                    : Colors.grey[600])),
                        if (isToday)
                          Container(
                            width: 4,
                            height: 4,
                            decoration: const BoxDecoration(
                              color: Color(0xFF4158D0),
                              shape: BoxShape.circle,
                            ),
                          )
                        else
                          const SizedBox(height: 4),
                      ],
                    ),
                  ),
                );
              }),
            ),
          ),
          const SizedBox(height: 16),
          // Legend
          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            _legend(color: const Color(0xFF4CAF50), label: '100%'),
            const SizedBox(width: 12),
            _legend(color: const Color(0xFF4158D0), label: '50-99%'),
            const SizedBox(width: 12),
            _legend(color: const Color(0xFFF59E0B), label: '1-49%'),
            const SizedBox(width: 12),
            _legend(color: Colors.red.withOpacity(0.7), label: 'Missed'),
          ]),
        ],
      ),
    );
  }

  Widget _legend({required Color color, required String label}) {
    return Row(children: [
      Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
      const SizedBox(width: 4),
      Text(label, style: TextStyle(fontSize: 10, color: Colors.grey[600])),
    ]);
  }

  int _weeklyAdherencePct(List<DateTime> days, List<Map<String, dynamic>> meds) {
    if (meds.isEmpty) return 0;
    int totalTaken = 0;
    int totalPossible = 0;
    for (final d in days) {
      if (d.isAfter(_today)) continue;
      final dk = _dateKey(d);
      final takenSet = _takenByDay[dk] ?? {};
      totalTaken += takenSet.length.clamp(0, meds.length);
      totalPossible += meds.length;
    }
    if (totalPossible == 0) return 0;
    return ((totalTaken / totalPossible) * 100).round();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SHARED WIDGETS
  // ══════════════════════════════════════════════════════════════════════════

  Widget _buildProgressCard(int taken, int total, double progress,
      {String? label}) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF4158D0), Color(0xFF42A5F5)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
              color: const Color(0xFF4158D0).withOpacity(0.3),
              blurRadius: 16,
              offset: const Offset(0, 6)),
        ],
      ),
      child: Row(children: [
        SizedBox(
          width: 70,
          height: 70,
          child: Stack(alignment: Alignment.center, children: [
            SizedBox(
              width: 70,
              height: 70,
              child: CircularProgressIndicator(
                value: progress,
                strokeWidth: 6,
                backgroundColor: Colors.white.withOpacity(0.2),
                valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
              ),
            ),
            Text('${(progress * 100).toInt()}%',
                style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: Colors.white)),
          ]),
        ),
        const SizedBox(width: 20),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label != null ? '$label Progress' : 'Medication Progress',
                  style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: Colors.white)),
              const SizedBox(height: 6),
              Text('$taken of $total medicines taken',
                  style: TextStyle(
                      fontSize: 13,
                      color: Colors.white.withOpacity(0.8))),
              const SizedBox(height: 8),
              if (taken == total && total > 0)
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text('✅ All done!',
                      style: TextStyle(
                          fontSize: 11,
                          color: Colors.white,
                          fontWeight: FontWeight.w600)),
                ),
            ],
          ),
        ),
      ]),
    );
  }

  // ── Supabase prescription card (Today view) ────────────────────────────────
  Widget _buildPrescriptionCard(Map<String, dynamic> p) {
    final name = (p['medicine_name'] ?? p['name'] ?? 'Unknown') as String;
    final displayName = name[0].toUpperCase() + name.substring(1);
    final isTaken = _takenToday.contains(name);
    final dosage = p['dosage'] as String? ?? '';
    final frequency = p['frequency'] as String? ?? '';
    final doctor = p['doctor_name'] as String? ?? '';
    final notes = p['notes'] as String? ?? p['message'] as String? ?? '';
    final startDate =
        p['start_date'] as String? ?? p['created_at'] as String? ?? '';
    final endDate = p['end_date'] as String?;

    String dateStr = '';
    if (startDate.isNotEmpty) {
      try {
        final dt = DateTime.parse(startDate);
        dateStr = '${dt.day}/${dt.month}/${dt.year}';
      } catch (_) {
        dateStr = startDate;
      }
    }

    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      decoration: BoxDecoration(
        color: isTaken ? const Color(0xFFF0FDF4) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isTaken
              ? const Color(0xFF10B981).withOpacity(0.4)
              : const Color(0xFF5C6BC0).withOpacity(0.2),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
              color: (isTaken
                  ? const Color(0xFF10B981)
                  : const Color(0xFF5C6BC0))
                  .withOpacity(0.12),
              blurRadius: 14,
              blurStyle: BlurStyle.outer,
              offset: const Offset(0, 4)),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child:
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              width: 46,
              height: 46,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isTaken
                      ? [
                    const Color(0xFF10B981).withOpacity(0.2),
                    const Color(0xFF10B981).withOpacity(0.1)
                  ]
                      : [
                    const Color(0xFF4158D0).withOpacity(0.15),
                    const Color(0xFF42A5F5).withOpacity(0.1)
                  ],
                ),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(
                isTaken ? Icons.check_circle : Icons.medication,
                color: isTaken
                    ? const Color(0xFF10B981)
                    : const Color(0xFF4158D0),
                size: 24,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(displayName,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          decoration:
                          isTaken ? TextDecoration.lineThrough : null,
                          color: isTaken
                              ? Colors.grey[600]
                              : const Color(0xFF2C3E50),
                        )),
                    if (dosage.isNotEmpty || frequency.isNotEmpty)
                      Text(
                        [dosage, frequency]
                            .where((s) => s.isNotEmpty)
                            .join(' • '),
                        style:
                        TextStyle(fontSize: 12, color: Colors.grey[600]),
                      ),
                  ]),
            ),
            Container(
              padding:
              const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF4158D0), Color(0xFF42A5F5)],
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text('Rx',
                  style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: Colors.white)),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: () => _toggleTaken(name),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: isTaken
                      ? const Color(0xFF10B981)
                      : const Color(0xFF4158D0).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: isTaken
                      ? [
                    BoxShadow(
                        color:
                        const Color(0xFF10B981).withOpacity(0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 2))
                  ]
                      : [],
                ),
                child: Icon(
                  isTaken ? Icons.check : Icons.add,
                  color: isTaken ? Colors.white : const Color(0xFF4158D0),
                  size: 20,
                ),
              ),
            ),
          ]),
          if (dateStr.isNotEmpty || doctor.isNotEmpty) ...[
            const SizedBox(height: 12),
            Wrap(
              spacing: 12,
              runSpacing: 8,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
              if (dateStr.isNotEmpty)
                Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.calendar_today,
                      size: 13, color: Colors.indigo[300]),
                  const SizedBox(width: 4),
                  Text(dateStr,
                      style:
                      TextStyle(fontSize: 11.5, color: Colors.grey[700], fontWeight: FontWeight.w500)),
                ]),
              if (doctor.isNotEmpty)
                Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.person_outline,
                      size: 14, color: Colors.indigo[300]),
                  const SizedBox(width: 4),
                  Text('Dr. $doctor',
                      style:
                      TextStyle(fontSize: 11.5, color: Colors.grey[700], fontWeight: FontWeight.w500)),
                ]),
              if (endDate != null)
                Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.event_available,
                      size: 14, color: Colors.indigo[300]),
                  const SizedBox(width: 4),
                  Text('Until: $endDate',
                      style:
                      TextStyle(fontSize: 11.5, color: Colors.grey[700], fontWeight: FontWeight.w500)),
                ]),
            ]),
          ],
          if (notes.isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF4158D0).withOpacity(0.04),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                    color: const Color(0xFF4158D0).withOpacity(0.1)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.message_outlined,
                      size: 14, color: Color(0xFF4158D0)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(notes,
                        style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[700],
                            height: 1.3),
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis),
                  ),
                ],
              ),
            ),
          ],
        ]),
      ),
    );
  }

  // ── AI medicine card (Today view) ─────────────────────────────────────────
  Widget _buildAiMedCard(Map<String, dynamic> med) {
    final name = (med['name'] as String? ?? 'unknown');
    final displayName = name[0].toUpperCase() + name.substring(1);
    final isTaken = _takenToday.contains(name);
    final context = med['context'] as String? ?? '';
    final symptoms = med['symptoms'] as List? ?? [];
    final mentionCount = med['mentionCount'] as int? ?? 1;

    String dateStr = '';
    if (med['firstMentioned'] != null) {
      try {
        final dt = DateTime.parse(med['firstMentioned']);
        dateStr = '${dt.day}/${dt.month}/${dt.year}';
      } catch (_) {}
    }

    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      decoration: BoxDecoration(
        color: isTaken ? const Color(0xFFF0FDF4) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isTaken
              ? const Color(0xFF10B981).withOpacity(0.4)
              : const Color(0xFFF59E0B).withOpacity(0.35),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
              color: (isTaken ? const Color(0xFF10B981) : const Color(0xFFF59E0B)).withOpacity(0.12),
              blurRadius: 14,
              blurStyle: BlurStyle.outer,
              offset: const Offset(0, 4)),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child:
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: isTaken
                    ? const Color(0xFF10B981).withOpacity(0.15)
                    : const Color(0xFFF59E0B).withOpacity(0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                isTaken ? Icons.check_circle : Icons.smart_toy,
                color: isTaken
                    ? const Color(0xFF10B981)
                    : const Color(0xFFF59E0B),
                size: 22,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(displayName,
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          decoration:
                          isTaken ? TextDecoration.lineThrough : null,
                          color: isTaken
                              ? Colors.grey[600]
                              : const Color(0xFF2C3E50),
                        )),
                    if (dateStr.isNotEmpty)
                      Text('Suggested: $dateStr',
                          style: TextStyle(
                              fontSize: 11, color: Colors.grey[500])),
                  ]),
            ),
            Container(
              padding:
              const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFF59E0B).withOpacity(0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text('×$mentionCount',
                  style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFFF59E0B))),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: () => _toggleTaken(name),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: isTaken
                      ? const Color(0xFF10B981)
                      : const Color(0xFFF59E0B).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  isTaken ? Icons.check : Icons.add,
                  color: isTaken ? Colors.white : const Color(0xFFF59E0B),
                  size: 20,
                ),
              ),
            ),
          ]),
          if (context.isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFF59E0B).withOpacity(0.05),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(context,
                  style: TextStyle(
                      fontSize: 11,
                      color: Colors.grey[700],
                      height: 1.3),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis),
            ),
          ],
          if (symptoms.isNotEmpty) ...[
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              runSpacing: 4,
              children: (symptoms)
                  .take(4)
                  .map<Widget>((s) => Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.orange.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(s.toString(),
                    style: const TextStyle(
                        fontSize: 9,
                        color: Colors.orange,
                        fontWeight: FontWeight.w600)),
              ))
                  .toList(),
            ),
          ],
        ]),
      ),
    );
  }
}