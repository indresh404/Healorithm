// lib/services/ai_consultation_service.dart
// ─────────────────────────────────────────────────────────────────────────────
// AI Consultation Service
// • Saves AI chat records to Supabase (online) or local SQLite (offline)
// • Auto-syncs pending offline records when internet is restored
// • Extracts symptoms, risk level, medicines from AI responses
// ─────────────────────────────────────────────────────────────────────────────
import 'dart:async';
import 'dart:convert';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart' as p;
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';
import 'auth_service.dart';

final supabase = Supabase.instance.client;
const _uuid = Uuid();

// ─── Data Model ──────────────────────────────────────────────────────────────
class AIConsultationRecord {
  final String id;
  final int userId;
  final String userPhone;
  final String sessionId;
  final String messageType; // 'voice' | 'text'
  final String userMessage;
  final String aiResponse;
  final List<String> extractedSymptoms;
  final String riskLevel; // 'green' | 'yellow' | 'red' | 'unknown'
  final String analysisSummary;
  final List<String> medicinesMentioned;
  final bool wasOffline;
  final DateTime createdAt;

  AIConsultationRecord({
    required this.id,
    required this.userId,
    required this.userPhone,
    required this.sessionId,
    required this.messageType,
    required this.userMessage,
    required this.aiResponse,
    required this.extractedSymptoms,
    required this.riskLevel,
    required this.analysisSummary,
    required this.medicinesMentioned,
    required this.wasOffline,
    required this.createdAt,
  });

  Map<String, dynamic> toSupabase() => {
    'id': id,
    'user_id': userId,
    'user_phone': userPhone,
    'session_id': sessionId,
    'message_type': messageType,
    'user_message': userMessage,
    'ai_response': aiResponse,
    'extracted_symptoms': extractedSymptoms,
    'risk_level': riskLevel,
    'analysis_summary': analysisSummary,
    'medicines_mentioned': medicinesMentioned,
    'was_offline': wasOffline,
    'synced_at': DateTime.now().toIso8601String(),
    'created_at': createdAt.toIso8601String(),
  };

  Map<String, dynamic> toSqlite() => {
    'id': id,
    'user_id': userId,
    'user_phone': userPhone,
    'session_id': sessionId,
    'message_type': messageType,
    'user_message': userMessage,
    'ai_response': aiResponse,
    'extracted_symptoms': jsonEncode(extractedSymptoms),
    'risk_level': riskLevel,
    'analysis_summary': analysisSummary,
    'medicines_mentioned': jsonEncode(medicinesMentioned),
    'was_offline': wasOffline ? 1 : 0,
    'is_synced': 0,
    'created_at': createdAt.toIso8601String(),
  };

  factory AIConsultationRecord.fromSqlite(Map<String, dynamic> m) =>
      AIConsultationRecord(
        id: m['id'],
        userId: m['user_id'],
        userPhone: m['user_phone'],
        sessionId: m['session_id'],
        messageType: m['message_type'],
        userMessage: m['user_message'],
        aiResponse: m['ai_response'],
        extractedSymptoms: List<String>.from(jsonDecode(m['extracted_symptoms'] ?? '[]')),
        riskLevel: m['risk_level'] ?? 'unknown',
        analysisSummary: m['analysis_summary'] ?? '',
        medicinesMentioned: List<String>.from(jsonDecode(m['medicines_mentioned'] ?? '[]')),
        wasOffline: m['was_offline'] == 1,
        createdAt: DateTime.parse(m['created_at']),
      );
}

// ─── Service ─────────────────────────────────────────────────────────────────
class AIConsultationService {
  static Database? _db;
  static StreamSubscription? _connectivitySub;
  static bool _syncInProgress = false;

  // Change this IP dynamically (10.0.2.2 for emulator, or your local machine IP)
  static const String pythonServerUrl = 'http://172.16.8.35:5000';

  // ── Init (call in main.dart after Supabase.initialize) ──────────────────
  static Future<void> init() async {
    await _initSqlite();
    _listenForConnectivity();
  }

  // ── SQLite Setup ─────────────────────────────────────────────────────────
  static Future<void> _initSqlite() async {
    try {
      if (kIsWeb) {
        debugPrint('ℹ️ [AIService] SQLite not supported on Web, skipping.');
        return;
      }
      
      final dbPath = await getDatabasesPath();
      final fullPath = p.join(dbPath, 'healorithm_offline.db');
      debugPrint('📂 [AIService] DB Path: $fullPath');

      _db = await openDatabase(
        fullPath,
        onUpgrade: (db, oldV, newV) async {
          if (oldV < 2) {
            try {
              await db.execute('ALTER TABLE ai_consultations ADD COLUMN session_id TEXT');
            } catch (_) {}
          }
        },
        onCreate: (db, version) async {
          await db.execute('''
            CREATE TABLE ai_consultations (
              id              TEXT PRIMARY KEY,
              user_id         INTEGER NOT NULL,
              user_phone      TEXT NOT NULL,
              session_id      TEXT NOT NULL,
              message_type    TEXT NOT NULL,
              user_message    TEXT NOT NULL,
              ai_response     TEXT NOT NULL,
              extracted_symptoms TEXT,
              risk_level      TEXT,
              analysis_summary TEXT,
              medicines_mentioned TEXT,
              was_offline     INTEGER DEFAULT 0,
              is_synced       INTEGER DEFAULT 0,
              created_at      TEXT NOT NULL
            )
          ''');
          await db.execute('CREATE INDEX idx_phone ON ai_consultations(user_phone)');
          await db.execute('CREATE INDEX idx_synced ON ai_consultations(is_synced)');
        },
      );
      
      // Manual check for column existence (fallback if versioning isn't bumped)
      final db = _db!;
      var columns = await db.rawQuery('PRAGMA table_info(ai_consultations)');
      bool hasSessionId = columns.any((c) => c['name'] == 'session_id');
      if (!hasSessionId) {
        await db.execute('ALTER TABLE ai_consultations ADD COLUMN session_id TEXT NOT NULL DEFAULT ""');
      }
    } catch (e) {
      debugPrint('❌ [AIService] SQLite init error: $e');
      // Set db to null just in case
      _db = null;
    }
  }

  // ── Connectivity listener → auto-sync ────────────────────────────────────
  static void _listenForConnectivity() {
    _connectivitySub = Connectivity().onConnectivityChanged.listen((results) {
      final isOnline = results.any((r) => r != ConnectivityResult.none);
      if (isOnline) syncPendingRecords();
    });
  }

  // ── Save a consultation (auto-detects online/offline) ────────────────────
  static Future<void> saveConsultation({
    required String sessionId,
    required String messageType,
    required String userMessage,
    required String aiResponse,
  }) async {
    final user = AuthService.currentUser;
    if (user == null) return;

    final analysis = _analyzeResponse(userMessage, aiResponse);

    final record = AIConsultationRecord(
      id: _uuid.v4(),
      userId: user['id'] as int,
      userPhone: user['phone'] as String,
      sessionId: sessionId,
      messageType: messageType,
      userMessage: userMessage,
      aiResponse: aiResponse,
      extractedSymptoms: analysis.symptoms,
      riskLevel: analysis.riskLevel,
      analysisSummary: analysis.summary,
      medicinesMentioned: analysis.medicines,
      wasOffline: false,
      createdAt: DateTime.now(),
    );

    final connectivity = await Connectivity().checkConnectivity();
    final isOnline = connectivity.any((r) => r != ConnectivityResult.none);

    if (isOnline) {
      try {
        await supabase.from('ai_consultations').insert(record.toSupabase());
        // Also save locally for offline access
        await _saveToSqlite(record, isSynced: true);
        return;
      } catch (_) {
        // Fall through to offline save
      }
    }

    // Offline: save locally, mark for sync
    final offlineRecord = AIConsultationRecord(
      id: record.id,
      userId: record.userId,
      userPhone: record.userPhone,
      sessionId: record.sessionId,
      messageType: record.messageType,
      userMessage: record.userMessage,
      aiResponse: record.aiResponse,
      extractedSymptoms: record.extractedSymptoms,
      riskLevel: record.riskLevel,
      analysisSummary: record.analysisSummary,
      medicinesMentioned: record.medicinesMentioned,
      wasOffline: true,
      createdAt: record.createdAt,
    );
    await _saveToSqlite(offlineRecord, isSynced: false);
  }

  static Future<void> _saveToSqlite(AIConsultationRecord record,
      {required bool isSynced}) async {
    if (_db == null) return;
    final row = record.toSqlite();
    row['is_synced'] = isSynced ? 1 : 0;
    await _db!.insert('ai_consultations', row,
        conflictAlgorithm: ConflictAlgorithm.replace);
  }

  // ── Sync pending offline records to Supabase ─────────────────────────────
  static Future<void> syncPendingRecords() async {
    if (_syncInProgress || _db == null) return;
    _syncInProgress = true;

    try {
      final pending = await _db!.query(
        'ai_consultations',
        where: 'is_synced = 0',
        orderBy: 'created_at ASC',
        limit: 50,
      );

      for (final row in pending) {
        final record = AIConsultationRecord.fromSqlite(row);
        try {
          await supabase.from('ai_consultations').insert(record.toSupabase());
          await _db!.update(
            'ai_consultations',
            {'is_synced': 1},
            where: 'id = ?',
            whereArgs: [record.id],
          );
        } catch (_) {
          // Skip this record, will retry next time
          continue;
        }
      }
      
      // After syncing successfully, silently generate & upload a new patient summary
      if (pending.isNotEmpty) {
        _generateAndStoreSummaryInBackground();
      }
      
    } finally {
      _syncInProgress = false;
    }
  }

  // ── Background AI Summarizer ───────────────────────────────────────────────
  static Future<void> _generateAndStoreSummaryInBackground() async {
    final user = AuthService.currentUser;
    if (user == null) return;
    
    try {
      final contextStr = await getUserHealthContext();
      if (contextStr.trim().isEmpty) return;
      
      // Update this IP dynamically if testing on a real device
      final url = Uri.parse('$pythonServerUrl/api/summarize'); 
      
      final res = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'health_context': contextStr}),
      ).timeout(const Duration(seconds: 45));
      
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final String summaryString = data['summary'] ?? '';
        
        if (summaryString.isNotEmpty) {
          await supabase.from('users').update({
            'ai_summary': summaryString
          }).eq('id', user['id']);
          debugPrint('Updated User AI Summary successfully');
        }
      } else {
        debugPrint('Bg Summarizer failed: ${res.statusCode}');
      }
    } catch (e) {
      debugPrint('Bg Summarizer EXCEPTION: $e');
    }
  }

  // ── Fetch user's local consultation history ───────────────────────────────
  static Future<List<AIConsultationRecord>> getUserHistory({
    String? phone,
    int limit = 50,
  }) async {
    if (_db == null) return [];
    final userPhone = phone ?? AuthService.currentUser?['phone'];
    if (userPhone == null) return [];

    final rows = await _db!.query(
      'ai_consultations',
      where: 'user_phone = ?',
      whereArgs: [userPhone],
      orderBy: 'created_at DESC',
      limit: limit,
    );
    return rows.map(AIConsultationRecord.fromSqlite).toList();
  }

  // ── Fetch past records for AI context ────────────────────────────────────
  static Future<String> getUserHealthContext({String? phone}) async {
    final records = await getUserHistory(phone: phone, limit: 10);
    if (records.isEmpty) return '';

    final buf = StringBuffer();
    buf.writeln('=== PATIENT HEALTH HISTORY (last ${records.length} consultations) ===');
    for (final r in records) {
      buf.writeln('\n[${r.createdAt.toLocal().toString().substring(0, 16)}]');
      buf.writeln('Patient: ${r.userMessage}');
      buf.writeln('Symptoms: ${r.extractedSymptoms.join(', ')}');
      buf.writeln('Risk: ${r.riskLevel.toUpperCase()}');
      if (r.analysisSummary.isNotEmpty) buf.writeln('Analysis: ${r.analysisSummary}');
    }
    return buf.toString();
  }

  static int get pendingSyncCount => 0; // Use getPendingSyncCount() async below

  static Future<int> getPendingSyncCount() async {
    if (_db == null) return 0;
    final result = await _db!.rawQuery(
        'SELECT COUNT(*) as cnt FROM ai_consultations WHERE is_synced = 0');
    return Sqflite.firstIntValue(result) ?? 0;
  }

  // ── Analytics summary for Records tab ─────────────────────────────────────
  static Future<Map<String, dynamic>> getAnalyticsSummary({String? phone}) async {
    final records = await getUserHistory(phone: phone, limit: 200);
    int total = records.length;
    int green = 0, yellow = 0, red = 0, unknown = 0;
    final symptomCounts = <String, int>{};
    final medicineCounts = <String, int>{};

    for (final r in records) {
      switch (r.riskLevel) {
        case 'green':  green++;  break;
        case 'yellow': yellow++; break;
        case 'red':    red++;    break;
        default:       unknown++;
      }
      for (final s in r.extractedSymptoms) {
        symptomCounts[s] = (symptomCounts[s] ?? 0) + 1;
      }
      for (final m in r.medicinesMentioned) {
        medicineCounts[m] = (medicineCounts[m] ?? 0) + 1;
      }
    }

    // Sort symptoms/medicines by frequency
    final topSymptoms = symptomCounts.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    final topMedicines = medicineCounts.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return {
      'total': total,
      'green': green,
      'yellow': yellow,
      'red': red,
      'unknown': unknown,
      'topSymptoms': topSymptoms.take(8).map((e) => {'name': e.key, 'count': e.value}).toList(),
      'topMedicines': topMedicines.take(8).map((e) => {'name': e.key, 'count': e.value}).toList(),
      'lastConsultation': records.isNotEmpty ? records.first.createdAt.toIso8601String() : null,
    };
  }

  // ── Medicine schedule for Meds tab ─────────────────────────────────────────
  static Future<List<Map<String, dynamic>>> getMedicineSchedule({String? phone}) async {
    final records = await getUserHistory(phone: phone, limit: 100);
    final medicines = <String, Map<String, dynamic>>{};

    for (final r in records) {
      for (final m in r.medicinesMentioned) {
        if (!medicines.containsKey(m)) {
          medicines[m] = {
            'name': m,
            'firstMentioned': r.createdAt.toIso8601String(),
            'lastMentioned': r.createdAt.toIso8601String(),
            'context': r.analysisSummary.isNotEmpty ? r.analysisSummary : r.userMessage,
            'symptoms': r.extractedSymptoms.toList(),
            'riskLevel': r.riskLevel,
            'mentionCount': 1,
          };
        } else {
          medicines[m]!['mentionCount'] = (medicines[m]!['mentionCount'] as int) + 1;
          // Keep earliest date
          final existing = DateTime.parse(medicines[m]!['firstMentioned']);
          if (r.createdAt.isBefore(existing)) {
            medicines[m]!['firstMentioned'] = r.createdAt.toIso8601String();
          }
        }
      }
    }

    return medicines.values.toList()
      ..sort((a, b) => DateTime.parse(b['lastMentioned']).compareTo(DateTime.parse(a['lastMentioned'])));
  }

  // ── Summarize Session On Close ─────────────────────────────────────────────
  static Future<void> summarizeSessionOnClose(String sessionId) async {
    final user = AuthService.currentUser;
    if (user == null) return;
    
    try {
      final db = _db!;
      final List<Map<String, dynamic>> rows = await db.query(
        'ai_consultations',
        where: 'session_id = ?',
        whereArgs: [sessionId],
        orderBy: 'created_at ASC'
      );
      
      if (rows.isEmpty) return;
      
      String fullChat = "Patient Chat Log:\n";
      for (var row in rows) {
        fullChat += "Patient: ${row['user_message']}\n";
        fullChat += "AI: ${row['ai_response']}\n\n";
      }
      
      final url = Uri.parse('$pythonServerUrl/api/summarize_chat'); 
      final res = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'chat_text': fullChat}),
      ).timeout(const Duration(seconds: 45));
      
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final String summary = data['summary'] ?? '';
        
        if (summary.isNotEmpty) {
          final dbRes = await supabase.from('user_ai_summaries').insert({
            'user_id': user['id'],
            'session_id': sessionId,
            'summary_text': summary,
          }).select();
          debugPrint('Successfully stored summary in Supabase: $dbRes');
        } else {
          debugPrint('AI returned empty summary');
        }
      } else {
        debugPrint('Summarizer server error: ${res.statusCode} -> ${res.body}');
      }
    } catch (e) {
      debugPrint('summarizeSessionOnClose EXCEPTION: $e');
    }
  }

  static void dispose() {
    _connectivitySub?.cancel();
  }
}

// ─── AI Response Analyser ─────────────────────────────────────────────────────
class _AnalysisResult {
  final List<String> symptoms;
  final String riskLevel;
  final String summary;
  final List<String> medicines;
  _AnalysisResult(this.symptoms, this.riskLevel, this.summary, this.medicines);
}

_AnalysisResult _analyzeResponse(String query, String response) {
  final combined = '${query.toLowerCase()} ${response.toLowerCase()}';

  // ── Symptom extraction ───────────────────────────────────────────────────
  const symptomKeywords = [
    'fever', 'cough', 'cold', 'headache', 'nausea', 'vomiting', 'diarrhea',
    'chest pain', 'breathlessness', 'shortness of breath', 'fatigue', 'weakness',
    'dizziness', 'rash', 'swelling', 'pain', 'bleeding', 'unconscious',
    'seizure', 'allergic', 'infection', 'injury', 'burn', 'fracture',
  ];
  final symptoms = symptomKeywords.where((s) => combined.contains(s)).toList();

  // ── Risk level ───────────────────────────────────────────────────────────
  String riskLevel = 'unknown';
  if (combined.contains('🔴') ||
      combined.contains('red') ||
      combined.contains('emergency') ||
      combined.contains('hospital immediately') ||
      combined.contains('refer') ||
      combined.contains('unconscious') ||
      combined.contains('severe') ||
      combined.contains('chest pain')) {
    riskLevel = 'red';
  } else if (combined.contains('🟡') ||
      combined.contains('yellow') ||
      combined.contains('monitor') ||
      combined.contains('observe') ||
      combined.contains('moderate')) {
    riskLevel = 'yellow';
  } else if (combined.contains('🟢') ||
      combined.contains('green') ||
      combined.contains('home care') ||
      combined.contains('mild') ||
      combined.contains('rest')) {
    riskLevel = 'green';
  } else if (symptoms.isNotEmpty) {
    riskLevel = 'yellow';
  } else {
    riskLevel = 'green';
  }

  // ── Medicine extraction ──────────────────────────────────────────────────
  const medicineKeywords = [
    'paracetamol', 'ibuprofen', 'aspirin', 'amoxicillin', 'metformin',
    'ors', 'antibiotic', 'antifungal', 'inhaler', 'insulin', 'tablet',
    'syrup', 'injection', 'drops', 'ointment', 'gel', 'cream',
  ];
  final medicines =
  medicineKeywords.where((m) => combined.contains(m)).toList();

  // ── Summary ──────────────────────────────────────────────────────────────
  String summary = '';
  if (symptoms.isNotEmpty) {
    summary =
    'Patient reported: ${symptoms.take(3).join(', ')}. Risk: $riskLevel.';
  }

  return _AnalysisResult(symptoms, riskLevel, summary, medicines);
}