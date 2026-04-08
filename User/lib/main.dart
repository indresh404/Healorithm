import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'screens/intro_page.dart';
import 'theme/app_theme.dart';
import 'services/ai_consultation_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  debugPrint('🚀 [Healorithm] App starting...');

  try {
    debugPrint('⚙️ [Healorithm] Initializing Supabase...');
    await Supabase.initialize(
      url: 'https://kjtxdsgvsmaatxvjyjiy.supabase.co',
      anonKey: 'sb_publishable_0Ll21kpoogWZshjctcsetg_0ZTLCCdB',
    );
    debugPrint('✅ [Healorithm] Supabase initialized.');
  } catch (e) {
    debugPrint('❌ [Healorithm] Supabase init failed: $e');
  }

  try {
    debugPrint('⚙️ [Healorithm] Initializing AIService...');
    // Initialize local SQLite DB + connectivity listener for offline sync
    await AIConsultationService.init();
    debugPrint('✅ [Healorithm] AIService initialized.');
  } catch (e) {
    debugPrint('❌ [Healorithm] AIService init failed: $e');
  }

  runApp(const MyApp());
}

final supabase = Supabase.instance.client;

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Healorithm',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.themeData,  // ✅ fixed
      home: const IntroPage(),
    );
  }
}