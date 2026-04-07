// lib/components/user/ai_chat_screen.dart
// ─────────────────────────────────────────────────────────────────────────────
// AI Chat Screen — Real Gemini AI + Voice + Text + 429 Rate-limit handling
// ─────────────────────────────────────────────────────────────────────────────
import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:lottie/lottie.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:flutter_tts/flutter_tts.dart';
import 'package:uuid/uuid.dart';
import 'package:healorithm/theme/app_theme.dart';
import 'package:healorithm/services/auth_service.dart';
import 'package:healorithm/services/ai_consultation_service.dart';

// ─────────────────────────────────────────────────────────────────────────────
// AI Python Server Config
// ─────────────────────────────────────────────────────────────────────────────
// Use '10.0.2.2' if running on Android Emulator.
// Use your machine's local IP (e.g. '172.16.8.35') if testing on a real phone via Wi-Fi.
// Use '127.0.0.1' if testing on Windows Desktop.
// Use AIConsultationService.pythonServerUrl for centralized config
String get _pythonServerUrl => AIConsultationService.pythonServerUrl;
bool _pythonServerAvailable = true;

// ─────────────────────────────────────────────────────────────────────────────
// Main AI caller — tries Python Backend
// ─────────────────────────────────────────────────────────────────────────────
Future<String> _askAI(List<Map<String, dynamic>> history) async {
  final url = Uri.parse('$_pythonServerUrl/api/chat');

  try {
    String healthContext = await AIConsultationService.getUserHealthContext();
    String systemPrompt = "You are Healorithm's AI Medical Assistant. Here is the patient's past medical history for your context:\n"
        "$healthContext\n"
        "Use this information to provide personalized responses. Be a helpful, reassuring doctor.";

    List<Map<String, dynamic>> historyForPython = [
      {'role': 'user', 'parts': [{'text': systemPrompt}]}
    ];

    // Add existing chat history after the system prompt
    historyForPython.addAll(history);

    final res = await http
        .post(
          url,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'history': historyForPython}),
        )
        .timeout(const Duration(seconds: 45));

    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      final text = data['response'] as String?;
      if (text != null && text.trim().isNotEmpty) {
        return text.trim();
      }
    }
    
    debugPrint('Python Server returned ${res.statusCode}: ${res.body}');
    return '⚠️ AI error (${res.statusCode}). Please try again.';

  } on TimeoutException {
    return '⚠️ Request timed out. Check if AI server is running and your internet connection.';
  } catch (e) {
    debugPrint('Python AI error: $e');
    return '⚠️ Could not reach Python AI Server. Is server.py running?';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// System prompt
// ─────────────────────────────────────────────────────────────────────────────
String _systemPrompt(String ctx) => '''
You are a compassionate AI health assistant built into Healorithm, a healthcare app used across India.

Your job:
• Listen carefully to symptoms and ask smart follow-up questions.
• Give clear, simple health guidance and first-aid advice.
• End every reply with one of these risk labels:
    🟢 Mild — Home care is fine
    🟡 Monitor — Watch symptoms carefully
    🔴 Urgent — Seek medical help immediately
• For emergencies mention: Ambulance 108 · Emergency 112 · Police 100
• NEVER make definitive diagnoses — always recommend seeing a doctor for serious issues.
• Keep replies concise (3–6 lines) unless the user asks for more detail.
• Write in simple English suitable for patients with limited medical knowledge.
${ctx.isNotEmpty ? '\n--- Patient past health records ---\n$ctx\n---' : ''}
''';

// ─────────────────────────────────────────────────────────────────────────────
// AI Avatar Lottie
// ─────────────────────────────────────────────────────────────────────────────
class AIAvatarLottie extends StatefulWidget {
  final bool   isLatestChat;
  final double size;
  final Color  borderColor;
  const AIAvatarLottie({
    super.key,
    required this.isLatestChat,
    this.size = 60,
    this.borderColor = Colors.white,
  });
  @override
  State<AIAvatarLottie> createState() => _AIAvatarLottieState();
}

class _AIAvatarLottieState extends State<AIAvatarLottie>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this);
  }
  @override
  void didUpdateWidget(AIAvatarLottie old) {
    super.didUpdateWidget(old);
    if (widget.isLatestChat != old.isLatestChat) {
      widget.isLatestChat ? _ctrl.repeat() : _ctrl.stop();
    }
  }
  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => Container(
    width: widget.size, height: widget.size,
    decoration: BoxDecoration(
      shape: BoxShape.circle,
      gradient: LinearGradient(colors: [
        widget.borderColor.withOpacity(0.4),
        widget.borderColor.withOpacity(0.12),
      ], begin: Alignment.topLeft, end: Alignment.bottomRight),
      border: Border.all(color: widget.borderColor.withOpacity(0.3), width: 1.5),
    ),
    child: ClipOval(
      child: Lottie.asset('assets/animations/ai_loading.json',
        controller: _ctrl, fit: BoxFit.cover,
        onLoaded: (c) {
          _ctrl.duration = c.duration;
          widget.isLatestChat ? _ctrl.repeat() : (_ctrl.value = 1.0);
        },
      ),
    ),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pulsing mic overlay
// ─────────────────────────────────────────────────────────────────────────────
class _MicBlob extends StatefulWidget {
  final Color color;
  const _MicBlob({required this.color});
  @override State<_MicBlob> createState() => _MicBlobState();
}
class _MicBlobState extends State<_MicBlob> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
      vsync: this, duration: const Duration(milliseconds: 900))
    ..repeat(reverse: true);
  late final Animation<double> _s = Tween(begin: 0.86, end: 1.22)
      .animate(CurvedAnimation(parent: _c, curve: Curves.easeInOut));
  @override void dispose() { _c.dispose(); super.dispose(); }
  @override
  Widget build(BuildContext ctx) => ScaleTransition(
    scale: _s,
    child: Container(
      width: 96, height: 96,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: const Color(0xFFE53935),
        boxShadow: [BoxShadow(color: const Color(0xFFE53935).withOpacity(0.6),
            blurRadius: 36, spreadRadius: 10)],
      ),
      child: const Icon(Icons.mic_rounded, color: Colors.white, size: 42),
    ),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Rate-limit warning banner (shown when 429 detected)
// ─────────────────────────────────────────────────────────────────────────────
class _RateBanner extends StatefulWidget {
  const _RateBanner();
  @override State<_RateBanner> createState() => _RateBannerState();
}
class _RateBannerState extends State<_RateBanner> {
  int _secs = 30;
  Timer? _t;
  @override
  void initState() {
    super.initState();
    _t = Timer.periodic(const Duration(seconds: 1), (_) {
      if (_secs > 0) setState(() => _secs--);
    });
  }
  @override void dispose() { _t?.cancel(); super.dispose(); }
  @override
  Widget build(BuildContext ctx) => Container(
    margin: const EdgeInsets.fromLTRB(16, 0, 16, 6),
    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
    decoration: BoxDecoration(
      color: Colors.red.withOpacity(0.1),
      borderRadius: BorderRadius.circular(10),
      border: Border.all(color: Colors.red.withOpacity(0.35)),
    ),
    child: Row(children: [
      const Icon(Icons.timer_outlined, color: Colors.redAccent, size: 16),
      const SizedBox(width: 8),
      Expanded(child: Text(
        _secs > 0
            ? 'AI rate limit hit — cooldown $_secs s. Adding more API keys in _apiKeys[] speeds this up.'
            : 'Cooldown done — you can send messages again.',
        style: const TextStyle(fontSize: 11, color: Colors.redAccent),
      )),
    ]),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AIChatScreen
// ─────────────────────────────────────────────────────────────────────────────
class AIChatScreen extends StatefulWidget {
  final String? contextTitle;
  final Color?  accentColor;
  const AIChatScreen({super.key, this.contextTitle, this.accentColor});
  @override State<AIChatScreen> createState() => _AIChatScreenState();
}

class _AIChatScreenState extends State<AIChatScreen> with TickerProviderStateMixin {
  final _inputCtrl  = TextEditingController();
  final _scrollCtrl = ScrollController();
  late final AnimationController _headerCtrl;

  final List<_Msg>                _msgs    = [];
  final List<Map<String,dynamic>> _history = [];
  final String _sid = const Uuid().v4();

  bool   _typing     = false;
  bool   _inputOn    = true;
  bool   _listening  = false;
  bool   _speaking   = false;
  bool   _voiceReply = false;
  bool   _rateLimited = false;
  int    _pending    = 0;
  String _partial    = '';

  final _stt = stt.SpeechToText();
  final _tts = FlutterTts();
  bool _sttReady = false;

  static const _sugg = [
    _Sugg('🤒 Symptoms',   'I have fever and headache since yesterday'),
    _Sugg('💊 Medicines',  'What medicine should I take for a cold?'),
    _Sugg('📋 My History', 'What were my past health issues?'),
    _Sugg('🚨 Emergency',  'I have severe chest pain, what do I do?'),
  ];

  Color get _c => widget.accentColor ?? AppTheme.primaryBlue;

  @override
  void initState() {
    super.initState();
    _headerCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 800))..forward();
    _setupVoice();
    _bootstrap();
    _refreshPending();
  }

  Future<void> _setupVoice() async {
    _sttReady = await _stt.initialize(
      onError:  (e) => debugPrint('STT: $e'),
      onStatus: (s) {
        if ((s == 'done' || s == 'notListening') && mounted) {
          setState(() => _listening = false);
        }
      },
    );
    await _tts.setLanguage('en-IN');
    await _tts.setSpeechRate(0.48);
    _tts.setStartHandler(()     => setState(() => _speaking = true));
    _tts.setCompletionHandler(() => setState(() => _speaking = false));
    _tts.setCancelHandler(()    => setState(() => _speaking = false));
  }

  Future<void> _bootstrap() async {
    final ctx = await AIConsultationService.getUserHealthContext();
    _history.addAll([
      {'role': 'user',  'parts': [{'text': _systemPrompt(ctx)}]},
      {'role': 'model', 'parts': [{'text': 'Understood. I am the Healorithm health assistant, ready to help.'}]},
    ]);

    await Future.delayed(const Duration(milliseconds: 550));
    if (!mounted) return;

    final greet = widget.contextTitle != null
        ? 'Hello! I\'m your AI Health Assistant. 🩺\n\nI\'m here to help with **${widget.contextTitle}**.\n\nTap the **🎤 mic** to speak or type your symptoms below.'
        : 'Hello! I\'m your AI Health Assistant. 🩺\n\nTap the **🎤 mic** to speak your symptoms, or type below.\nI have access to your past health records for better guidance.';

    setState(() => _msgs.add(_Msg(text: greet, isUser: false, type: 'text')));
    _scrollDown();
  }

  Future<void> _refreshPending() async {
    final n = await AIConsultationService.getPendingSyncCount();
    if (mounted) setState(() => _pending = n);
  }

  @override
  void dispose() {
    // Summarize the chat session when the user closes the bot
    if (_msgs.length > 2) {
      AIConsultationService.summarizeSessionOnClose(_sid);
    }
    _headerCtrl.dispose();
    _inputCtrl.dispose();
    _scrollCtrl.dispose();
    _stt.stop();
    _tts.stop();
    super.dispose();
  }

  void _scrollDown() => Future.delayed(const Duration(milliseconds: 120), () {
    if (_scrollCtrl.hasClients) {
      _scrollCtrl.animateTo(_scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 350), curve: Curves.easeOut);
    }
  });

  // ── SEND ──────────────────────────────────────────────────────────────────
  Future<void> _send(String raw, {String type = 'text'}) async {
    final text = raw.trim();
    if (text.isEmpty || !_inputOn) return;

    HapticFeedback.lightImpact();
    _inputCtrl.clear();
    setState(() {
      _msgs.add(_Msg(text: text, isUser: true, type: type));
      _typing  = true;
      _inputOn = false;
      _rateLimited = false;
    });
    _scrollDown();

    _history.add({'role': 'user', 'parts': [{'text': text}]});
    final reply = await _askAI(_history);

    final isRateMsg = reply.contains('rate limit') || reply.contains('busy');
    final isError = reply.startsWith('⚠️');

    String displayReply = reply;
    String dbReply = reply;

    if (isError) {
      displayReply = "You are currently offline or the server is unreachable. But don't worry, I have securely saved your symptoms locally. 🩺";
      dbReply = "(Offline message)";
    }

    if (!isRateMsg) {
      _history.add({'role': 'model', 'parts': [{'text': displayReply}]});
    }

    if (!mounted) return;
    setState(() {
      _typing      = false;
      _inputOn     = true;
      _rateLimited = isRateMsg;
      _msgs.add(_Msg(text: displayReply, isUser: false, type: 'text'));
    });
    _scrollDown();

    if (!isRateMsg) {
      await AIConsultationService.saveConsultation(
        sessionId:   _sid,
        messageType: type,
        userMessage: text,
        aiResponse:  dbReply,
      );
      _refreshPending();

      if (_voiceReply && !isError) {
        final clean = displayReply
            .replaceAll(RegExp(r'\*+'), '')
            .replaceAll(RegExp(r'[🟢🟡🔴✅⚠️🩺💊🤒]'), '');
        await _tts.speak(clean);
      }
    }
  }

  // ── VOICE ─────────────────────────────────────────────────────────────────
  Future<void> _startListening() async {
    if (!_sttReady || _listening) return;
    await _tts.stop();
    HapticFeedback.mediumImpact();
    setState(() { _listening = true; _partial = ''; });

    await _stt.listen(
      onResult: (r) {
        setState(() => _partial = r.recognizedWords);
        if (r.finalResult && r.recognizedWords.isNotEmpty) {
          setState(() => _listening = false);
          _send(r.recognizedWords, type: 'voice');
        }
      },
      listenFor:      const Duration(seconds: 45),
      pauseFor:       const Duration(seconds: 4),
      partialResults: true,
      localeId:       'en_IN',
    );
  }

  Future<void> _stopListening() async {
    await _stt.stop();
    setState(() => _listening = false);
    if (_partial.trim().isNotEmpty) _send(_partial.trim(), type: 'voice');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BUILD
  // ─────────────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    final c   = _c;
    final bot = MediaQuery.of(context).viewInsets.bottom;

    return Scaffold(
      backgroundColor: const Color(0xFF09090F),
      resizeToAvoidBottomInset: true,
      body: Stack(children: [
        Positioned(top: -80,  right: -80, child: _Glow(color: c, size: 340, op: 0.16)),
        Positioned(bottom: 140, left: -60, child: _Glow(color: c, size: 260, op: 0.10)),

        SafeArea(child: Column(children: [
          _header(c),
          if (_pending > 0)     _syncBanner(),
          if (_rateLimited)     const _RateBanner(),
          Expanded(child: _msgs.isEmpty ? _empty(c) : _list(c)),
          if (!_typing && _msgs.length <= 1) _suggestions(c),
          _inputBar(c, bot),
        ])),

        // voice overlay
        if (_listening)
          Positioned.fill(
            child: GestureDetector(
              onTap: _stopListening,
              child: Container(
                color: Colors.black.withOpacity(0.88),
                child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  _MicBlob(color: c),
                  const SizedBox(height: 32),
                  const Text('Listening…',
                      style: TextStyle(color: Colors.white, fontSize: 26,
                          fontWeight: FontWeight.w800, letterSpacing: -0.5)),
                  const SizedBox(height: 14),
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 200),
                    child: _partial.isEmpty
                        ? Text('Speak clearly…', key: const ValueKey('e'),
                        style: TextStyle(color: Colors.white.withOpacity(0.35), fontSize: 15))
                        : Padding(
                      key: ValueKey(_partial),
                      padding: const EdgeInsets.symmetric(horizontal: 36),
                      child: Text('"$_partial"', textAlign: TextAlign.center,
                          style: TextStyle(color: c, fontSize: 16, fontStyle: FontStyle.italic)),
                    ),
                  ),
                  const SizedBox(height: 30),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 11),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.07),
                      borderRadius: BorderRadius.circular(30),
                      border: Border.all(color: Colors.white.withOpacity(0.12)),
                    ),
                    child: const Text('Tap anywhere to stop & send',
                        style: TextStyle(color: Colors.white54, fontSize: 13)),
                  ),
                ]),
              ),
            ),
          ),
      ]),
    );
  }

  // ── header ────────────────────────────────────────────────────────────────
  Widget _header(Color c) => SlideTransition(
    position: Tween<Offset>(begin: const Offset(0, -0.4), end: Offset.zero)
        .animate(CurvedAnimation(parent: _headerCtrl, curve: Curves.easeOutCubic)),
    child: Padding(
      padding: const EdgeInsets.fromLTRB(4, 10, 16, 10),
      child: Row(children: [
        IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white60, size: 19),
          onPressed: () => Navigator.pop(context),
        ),
        AIAvatarLottie(isLatestChat: true, size: 46, borderColor: c),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Health AI',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800,
                  color: Colors.white, letterSpacing: -0.3)),
          Row(children: [
            Container(width: 7, height: 7,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: _rateLimited ? Colors.orange : const Color(0xFF4CAF50),
                )),
            const SizedBox(width: 5),
            Text(
              _rateLimited ? 'Rate limited — retrying…'
                  : _speaking  ? 'Speaking…'
                  : _listening ? 'Listening…'
                  : 'Online · Ready to help',
              style: const TextStyle(fontSize: 11.5, color: Colors.white54),
            ),
          ]),
        ])),
        // voice reply toggle
        GestureDetector(
          onTap: () => setState(() => _voiceReply = !_voiceReply),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: _voiceReply ? c.withOpacity(0.18) : Colors.white.withOpacity(0.06),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                  color: _voiceReply ? c.withOpacity(0.55) : Colors.white.withOpacity(0.12)),
            ),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              Icon(_voiceReply ? Icons.volume_up_rounded : Icons.volume_off_rounded,
                  color: _voiceReply ? c : Colors.white38, size: 14),
              const SizedBox(width: 4),
              Text(_voiceReply ? 'Voice On' : 'Voice Off',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600,
                      color: _voiceReply ? c : Colors.white38)),
            ]),
          ),
        ),
      ]),
    ),
  );

  Widget _syncBanner() => Container(
    margin: const EdgeInsets.fromLTRB(16, 0, 16, 6),
    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
    decoration: BoxDecoration(
      color: Colors.orange.withOpacity(0.12),
      borderRadius: BorderRadius.circular(10),
      border: Border.all(color: Colors.orange.withOpacity(0.3)),
    ),
    child: Row(children: [
      const Icon(Icons.cloud_upload_outlined, color: Colors.orange, size: 15),
      const SizedBox(width: 8),
      Expanded(child: Text(
        '$_pending record${_pending == 1 ? '' : 's'} saved offline — syncs on reconnect',
        style: const TextStyle(fontSize: 11, color: Colors.orange),
      )),
      GestureDetector(
        onTap: () async {
          await AIConsultationService.syncPendingRecords();
          _refreshPending();
        },
        child: const Text('Sync',
            style: TextStyle(fontSize: 11, color: Colors.orange, fontWeight: FontWeight.w700)),
      ),
    ]),
  );

  Widget _empty(Color c) => Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
    AIAvatarLottie(isLatestChat: true, size: 130, borderColor: c),
    const SizedBox(height: 14),
    Text('Connecting to AI…',
        style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 14, fontWeight: FontWeight.w500)),
  ]));

  Widget _list(Color c) => ListView.builder(
    controller: _scrollCtrl,
    padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
    itemCount: _msgs.length + (_typing ? 1 : 0),
    itemBuilder: (_, i) {
      if (_typing && i == _msgs.length) return _TypingDot(color: c);
      return _Bubble(msg: _msgs[i], color: c,
          isLatest: i == _msgs.length - 1 && !_msgs[i].isUser);
    },
  );

  Widget _suggestions(Color c) => SizedBox(
    height: 44,
    child: ListView.separated(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: _sugg.length,
      separatorBuilder: (_, __) => const SizedBox(width: 8),
      itemBuilder: (_, i) => GestureDetector(
        onTap: () => _send(_sugg[i].query),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
          decoration: BoxDecoration(
            color: c.withOpacity(0.08),
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: c.withOpacity(0.28)),
          ),
          child: Text(_sugg[i].label,
              style: TextStyle(fontSize: 12.5, color: c.withOpacity(0.9), fontWeight: FontWeight.w600)),
        ),
      ),
    ),
  );

  Widget _inputBar(Color c, double bot) => AnimatedPadding(
    duration: const Duration(milliseconds: 200),
    padding: EdgeInsets.fromLTRB(16, 8, 16, 16 + bot),
    child: Row(crossAxisAlignment: CrossAxisAlignment.end, children: [

      // mic button
      GestureDetector(
        onTap: _listening ? _stopListening : _startListening,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          width: 52, height: 52,
          margin: const EdgeInsets.only(right: 10),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: _listening
                ? const Color(0xFFE53935).withOpacity(0.15)
                : c.withOpacity(0.15),
            border: Border.all(
                color: _listening ? const Color(0xFFE53935) : c, width: 2),
            boxShadow: [BoxShadow(
                color: (_listening ? const Color(0xFFE53935) : c).withOpacity(0.35),
                blurRadius: 14)],
          ),
          child: Icon(
            _listening ? Icons.stop_rounded : Icons.mic_rounded,
            color: _listening ? const Color(0xFFE53935) : c,
            size: 24,
          ),
        ),
      ),

      // text field
      Expanded(
        child: Container(
          constraints: const BoxConstraints(minHeight: 52, maxHeight: 120),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.07),
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: Colors.white.withOpacity(0.12)),
          ),
          child: TextField(
            controller: _inputCtrl,
            enabled: _inputOn,
            style: const TextStyle(color: Colors.white, fontSize: 14),
            maxLines: null, minLines: 1,
            keyboardType: TextInputType.multiline,
            textInputAction: TextInputAction.send,
            onSubmitted: (t) => _send(t),
            decoration: InputDecoration(
              hintText: _sttReady ? 'Type or tap 🎤 to speak…' : 'Describe your symptoms…',
              hintStyle: TextStyle(color: Colors.white.withOpacity(0.28), fontSize: 14),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            ),
          ),
        ),
      ),
      const SizedBox(width: 10),

      // send button
      GestureDetector(
        onTap: () => _send(_inputCtrl.text),
        child: Container(
          width: 52, height: 52,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: LinearGradient(colors: [c, c.withOpacity(0.7)],
                begin: Alignment.topLeft, end: Alignment.bottomRight),
            boxShadow: [BoxShadow(color: c.withOpacity(0.45), blurRadius: 14, offset: const Offset(0, 4))],
          ),
          child: const Icon(Icons.send_rounded, color: Colors.white, size: 22),
        ),
      ),
    ]),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Message bubble
// ─────────────────────────────────────────────────────────────────────────────
class _Bubble extends StatefulWidget {
  final _Msg msg; final Color color; final bool isLatest;
  const _Bubble({required this.msg, required this.color, required this.isLatest});
  @override State<_Bubble> createState() => _BubbleState();
}
class _BubbleState extends State<_Bubble> with SingleTickerProviderStateMixin {
  late final AnimationController _c =
  AnimationController(vsync: this, duration: const Duration(milliseconds: 350))..forward();
  late final Animation<double> _sc =
  Tween(begin: 0.86, end: 1.0).animate(CurvedAnimation(parent: _c, curve: Curves.easeOutBack));
  late final Animation<double> _fa = CurvedAnimation(parent: _c, curve: Curves.easeOut);
  @override void dispose() { _c.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext ctx) {
    final u = widget.msg.isUser;
    final c = widget.color;
    return FadeTransition(opacity: _fa,
      child: ScaleTransition(scale: _sc,
        alignment: u ? Alignment.centerRight : Alignment.centerLeft,
        child: Padding(
          padding: const EdgeInsets.only(bottom: 14),
          child: Row(
            mainAxisAlignment: u ? MainAxisAlignment.end : MainAxisAlignment.start,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              if (!u) ...[
                AIAvatarLottie(isLatestChat: widget.isLatest, size: 32, borderColor: c),
                const SizedBox(width: 8),
              ],
              Flexible(child: Column(
                crossAxisAlignment: u ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                children: [
                  if (u && widget.msg.type == 'voice')
                    Padding(padding: const EdgeInsets.only(bottom: 3, right: 4),
                        child: Row(mainAxisSize: MainAxisSize.min, children: [
                          Icon(Icons.mic_rounded, size: 11, color: c.withOpacity(0.75)),
                          const SizedBox(width: 3),
                          Text('Voice', style: TextStyle(fontSize: 10, color: c.withOpacity(0.75),
                              fontWeight: FontWeight.w600)),
                        ])),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      gradient: u ? LinearGradient(colors: [c, c.withOpacity(0.72)],
                          begin: Alignment.topLeft, end: Alignment.bottomRight) : null,
                      color: u ? null : Colors.white.withOpacity(0.08),
                      borderRadius: BorderRadius.only(
                        topLeft:     const Radius.circular(18),
                        topRight:    const Radius.circular(18),
                        bottomLeft:  Radius.circular(u ? 18 : 4),
                        bottomRight: Radius.circular(u ? 4 : 18),
                      ),
                      border: u ? null : Border.all(color: Colors.white.withOpacity(0.1)),
                      boxShadow: u ? [BoxShadow(color: c.withOpacity(0.28),
                          blurRadius: 12, offset: const Offset(0, 4))] : null,
                    ),
                    child: _rich(widget.msg.text, u),
                  ),
                ],
              )),
              if (u) ...[
                const SizedBox(width: 8),
                Container(width: 32, height: 32,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withOpacity(0.1),
                    border: Border.all(color: Colors.white.withOpacity(0.15)),
                  ),
                  child: const Icon(Icons.person_rounded, color: Colors.white60, size: 17),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _rich(String text, bool u) {
    final spans = <TextSpan>[];
    final re = RegExp(r'\*\*(.*?)\*\*');
    int last = 0;
    for (final m in re.allMatches(text)) {
      if (m.start > last) spans.add(TextSpan(text: text.substring(last, m.start)));
      spans.add(TextSpan(text: m.group(1), style: const TextStyle(fontWeight: FontWeight.w700)));
      last = m.end;
    }
    if (last < text.length) spans.add(TextSpan(text: text.substring(last)));
    return RichText(text: TextSpan(
      style: TextStyle(fontSize: 13.5, height: 1.55,
          color: u ? Colors.white : Colors.white.withOpacity(0.88)),
      children: spans,
    ));
  }
}

class _TypingDot extends StatelessWidget {
  final Color color;
  const _TypingDot({required this.color});
  @override
  Widget build(BuildContext ctx) => Padding(
    padding: const EdgeInsets.only(bottom: 14),
    child: Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
      AIAvatarLottie(isLatestChat: true, size: 32, borderColor: color),
      const SizedBox(width: 10),
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 13),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.08),
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(18), topRight: Radius.circular(18),
            bottomRight: Radius.circular(18), bottomLeft: Radius.circular(4),
          ),
          border: Border.all(color: Colors.white.withOpacity(0.1)),
        ),
        child: const SizedBox(width: 56, height: 18,
            child: Center(child: Text('...', style: TextStyle(color: Colors.white60, fontSize: 18)))),
      ),
    ]),
  );
}

class _Glow extends StatelessWidget {
  final Color color; final double size, op;
  const _Glow({required this.color, required this.size, required this.op});
  @override
  Widget build(BuildContext ctx) => Container(
    width: size, height: size,
    decoration: BoxDecoration(shape: BoxShape.circle,
        gradient: RadialGradient(colors: [color.withOpacity(op), Colors.transparent])),
  );
}

class _Msg {
  final String text, type;
  final bool isUser;
  _Msg({required this.text, required this.isUser, required this.type});
}

class _Sugg {
  final String label, query;
  const _Sugg(this.label, this.query);
}