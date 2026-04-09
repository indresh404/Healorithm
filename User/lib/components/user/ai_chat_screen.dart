import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:healorithm/services/auth_service.dart';
import 'package:healorithm/services/ai_consultation_service.dart';
import 'package:healorithm/theme/app_theme.dart';

class AIChatScreen extends StatefulWidget {
  final String? contextTitle;
  final Color? accentColor;

  const AIChatScreen({super.key, this.contextTitle, this.accentColor});

  @override
  State<AIChatScreen> createState() => _AIChatScreenState();
}

class _AIChatScreenState extends State<AIChatScreen> {
  final TextEditingController _inputCtrl = TextEditingController();
  final ScrollController _scrollCtrl = ScrollController();
  final stt.SpeechToText _stt = stt.SpeechToText();
  final FlutterTts _tts = FlutterTts();

  final List<_ChatMessage> _messages = [];

  bool _isListening = false;
  bool _isSpeaking = false;
  bool _isThinking = false;
  bool _voiceReply = true;
  bool _sttReady = false;
  String _partialText = '';
  String _languageTag = 'en-IN';

  Color get _accent => widget.accentColor ?? AppTheme.primaryBlue;

  @override
  void initState() {
    super.initState();
    _setupVoice();
    _seedWelcome();
  }

  Future<void> _setupVoice() async {
    _languageTag = AIConsultationService.languageCodeForUser(
      AuthService.currentUser?['preferred_language']?.toString(),
    );

    _sttReady = await _stt.initialize(
      onStatus: (status) {
        if (!mounted) return;
        if (status == 'done' || status == 'notListening') {
          setState(() => _isListening = false);
        }
      },
      onError: (error) {
        if (!mounted) return;
        setState(() => _isListening = false);
      },
    );

    await _tts.setLanguage(_languageTag);
    await _tts.setSpeechRate(0.46);
    await _tts.setPitch(1.0);
    _tts.setStartHandler(() {
      if (mounted) setState(() => _isSpeaking = true);
    });
    _tts.setCompletionHandler(() {
      if (mounted) setState(() => _isSpeaking = false);
    });
    _tts.setCancelHandler(() {
      if (mounted) setState(() => _isSpeaking = false);
    });
  }

  void _seedWelcome() {
    final userName = AuthService.currentUser?['name']?.toString().trim();
    final introName =
        userName == null || userName.isEmpty ? 'there' : userName;
    final topic = widget.contextTitle?.trim();

    final welcome = topic == null || topic.isEmpty
        ? 'Hello $introName. I am your Healorithm health assistant. Ask me symptoms, medicine timing, or care guidance.'
        : 'Hello $introName. I am your Healorithm health assistant for $topic. Ask me symptoms, medicine timing, or care guidance.';

    _messages.add(
      _ChatMessage(
        text:
            '$welcome\n\nTell me your symptoms, ask about home care, or tap the mic to speak.',
        isUser: false,
      ),
    );
  }

  @override
  void dispose() {
    _inputCtrl.dispose();
    _scrollCtrl.dispose();
    _stt.stop();
    _tts.stop();
    super.dispose();
  }

  Future<void> _send(String rawText, {String type = 'text'}) async {
    final text = rawText.trim();
    if (text.isEmpty) return;

    HapticFeedback.lightImpact();
    _inputCtrl.clear();
    await _tts.stop();

    final history = _messages
        .map((m) => {
              'role': m.isUser ? 'user' : 'assistant',
              'text': m.text,
            })
        .toList();

    if (!mounted) return;
    setState(() {
      _messages.add(_ChatMessage(text: text, isUser: true, type: type));
      _isThinking = true;
    });
    _scrollDown();

    String reply;
    try {
      reply = await AIConsultationService.generateChatReply(
        message: text,
        history: history,
        language: _languageTag,
      );
    } catch (_) {
      reply = _generateStaticReply(text);
    }

    if (!mounted) return;
    setState(() {
      _messages.add(_ChatMessage(text: reply, isUser: false));
      _isThinking = false;
    });
    _scrollDown();

    if (_voiceReply) {
      await _tts.speak(reply.replaceAll('\n', ' '));
    }
  }

  String _generateStaticReply(String message) {
    final text = message.toLowerCase();
    final name = AuthService.currentUser?['name']?.toString().trim();
    final prefix =
        name == null || name.isEmpty ? 'Here is a simple guide:' : '$name, here is a simple guide:';

    if (_containsAny(text, ['chest pain', 'can\'t breathe', 'cannot breathe', 'unconscious', 'seizure', 'stroke', 'heavy bleeding'])) {
      return '$prefix\nSeek emergency medical help now.\nGo to the nearest hospital or call 108 or 112 immediately.\nDo not wait at home if symptoms are severe.\n🔴 Urgent';
    }

    if (_containsAny(text, ['fever', 'temperature'])) {
      return '$prefix\nRest, drink plenty of fluids, and monitor your temperature.\nYou may ask a doctor before taking paracetamol, especially for children, pregnancy, or other illnesses.\nSee a doctor quickly if fever lasts more than 2 days, becomes very high, or comes with breathing trouble.\n🟡 Monitor';
    }

    if (_containsAny(text, ['cold', 'cough', 'sore throat'])) {
      return '$prefix\nWarm fluids, rest, and steam inhalation may help mild cold symptoms.\nIf cough lasts more than a few days, breathing becomes difficult, or there is chest pain, get checked by a doctor.\nUse medicines only as prescribed by your clinician.\n🟢 Mild';
    }

    if (_containsAny(text, ['headache', 'migraine'])) {
      return '$prefix\nRest in a quiet room, drink water, and avoid bright screens for some time.\nIf headache is sudden, severe, repeated, or comes with vomiting, weakness, or blurred vision, seek medical care fast.\n🟡 Monitor';
    }

    if (_containsAny(text, ['stomach pain', 'abdominal pain', 'vomit', 'vomiting', 'diarrhea', 'loose motion'])) {
      return '$prefix\nSip clean water or ORS and avoid oily or heavy foods for now.\nIf there is dehydration, blood in stool or vomit, very strong pain, or symptoms continue, see a doctor.\n🟡 Monitor';
    }

    if (_containsAny(text, ['medicine', 'medication', 'tablet', 'dose', 'dosage'])) {
      return '$prefix\nPlease follow the medicines listed in your Meds tab exactly as prescribed.\nDo not start, stop, or change a dose only from chat advice.\nIf you are confused about timing, ask your doctor or health worker and compare with the prescription shown in the app.\n🟡 Monitor';
    }

    if (_containsAny(text, ['record', 'medical record', 'history', 'report'])) {
      return '$prefix\nYour records tab shows diagnoses, visit dates, vaccines, and notes from Supabase.\nIf something is missing, it usually means it has not been added yet by the clinic or worker.\n🟢 Mild';
    }

    return '$prefix\nI can give basic health guidance.\nPlease tell me the main symptom, how long it has been happening, and whether it is getting worse.\nIf symptoms are severe or sudden, seek medical care immediately.\n🟡 Monitor';
  }

  bool _containsAny(String text, List<String> needles) {
    for (final needle in needles) {
      if (text.contains(needle)) return true;
    }
    return false;
  }

  Future<void> _startListening() async {
    if (!_sttReady || _isListening) return;
    await _tts.stop();
    HapticFeedback.mediumImpact();

    if (!mounted) return;
    setState(() {
      _isListening = true;
      _partialText = '';
    });

    await _stt.listen(
      onResult: (result) {
        if (!mounted) return;
        setState(() => _partialText = result.recognizedWords);
        if (result.finalResult && result.recognizedWords.trim().isNotEmpty) {
          setState(() => _isListening = false);
          _send(result.recognizedWords, type: 'voice');
        }
      },
      localeId: _languageTag.replaceAll('-', '_'),
      listenFor: const Duration(seconds: 30),
      pauseFor: const Duration(seconds: 4),
      partialResults: true,
    );
  }

  Future<void> _stopListening() async {
    await _stt.stop();
    if (!mounted) return;
    setState(() => _isListening = false);
    if (_partialText.trim().isNotEmpty) {
      _send(_partialText.trim(), type: 'voice');
    }
  }

  void _scrollDown() {
    Timer(const Duration(milliseconds: 100), () {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Scaffold(
      backgroundColor: const Color(0xFF0B1220),
      body: Stack(
        children: [
          SafeArea(
            child: Column(
              children: [
                _buildHeader(),
                _buildStatusBar(),
                Expanded(child: _buildMessages()),
                _buildSuggestions(),
                _buildInputBar(bottomInset),
              ],
            ),
          ),
          if (_isListening) _buildListeningOverlay(),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 8, 16, 8),
      child: Row(
        children: [
          IconButton(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white70),
          ),
          CircleAvatar(
            radius: 22,
            backgroundColor: _accent.withOpacity(0.18),
            child: Icon(Icons.health_and_safety_rounded, color: _accent),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Health AI',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                Text(
                _isListening
                      ? 'Listening...'
                      : _isSpeaking
                          ? 'Speaking...'
                          : 'AI voice assistant',
                  style: const TextStyle(
                    color: Colors.white60,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: () => setState(() => _voiceReply = !_voiceReply),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
              decoration: BoxDecoration(
                color: _voiceReply
                    ? _accent.withOpacity(0.18)
                    : Colors.white.withOpacity(0.06),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: _voiceReply
                      ? _accent.withOpacity(0.45)
                      : Colors.white.withOpacity(0.1),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    _voiceReply
                        ? Icons.volume_up_rounded
                        : Icons.volume_off_rounded,
                    size: 16,
                    color: _voiceReply ? _accent : Colors.white54,
                  ),
                  const SizedBox(width: 5),
                  Text(
                    _voiceReply ? 'Voice On' : 'Voice Off',
                    style: TextStyle(
                      color: _voiceReply ? _accent : Colors.white54,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBar() {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.06),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: const Text(
        'This assistant gives AI guidance from your server. For emergencies, seek direct medical help immediately.',
        style: TextStyle(
          color: Colors.white70,
          fontSize: 12,
          height: 1.4,
        ),
      ),
    );
  }

  Widget _buildMessages() {
    return ListView.builder(
      controller: _scrollCtrl,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      itemCount: _messages.length + (_isThinking ? 1 : 0),
      itemBuilder: (context, index) {
        if (_isThinking && index == _messages.length) {
          return Align(
            alignment: Alignment.centerLeft,
            child: Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.08),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: Colors.white.withOpacity(0.08)),
              ),
              child: const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            ),
          );
        }
        final message = _messages[index];
        return Align(
          alignment:
              message.isUser ? Alignment.centerRight : Alignment.centerLeft,
          child: Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            constraints: const BoxConstraints(maxWidth: 320),
            decoration: BoxDecoration(
              color: message.isUser
                  ? _accent
                  : Colors.white.withOpacity(0.08),
              borderRadius: BorderRadius.only(
                topLeft: const Radius.circular(18),
                topRight: const Radius.circular(18),
                bottomLeft: Radius.circular(message.isUser ? 18 : 4),
                bottomRight: Radius.circular(message.isUser ? 4 : 18),
              ),
              border: message.isUser
                  ? null
                  : Border.all(color: Colors.white.withOpacity(0.08)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (message.type == 'voice' && message.isUser)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        Icon(Icons.mic_rounded, size: 14, color: Colors.white),
                        SizedBox(width: 4),
                        Text(
                          'Voice',
                          style: TextStyle(
                            fontSize: 11,
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                Text(
                  message.text,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    height: 1.45,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildSuggestions() {
    const suggestions = [
      'I have fever since yesterday',
      'What should I do for cough?',
      'How to take my medicine?',
      'I have stomach pain',
    ];

    return SizedBox(
      height: 46,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: suggestions.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final suggestion = suggestions[index];
          return ActionChip(
            backgroundColor: _accent.withOpacity(0.14),
            side: BorderSide(color: _accent.withOpacity(0.28)),
            label: Text(
              suggestion,
              style: TextStyle(
                color: _accent,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
            onPressed: () => _send(suggestion),
          );
        },
      ),
    );
  }

  Widget _buildInputBar(double bottomInset) {
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 8, 16, 16 + bottomInset),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          GestureDetector(
            onTap: _isListening ? _stopListening : _startListening,
            child: Container(
              width: 52,
              height: 52,
              margin: const EdgeInsets.only(right: 10),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _isListening
                    ? const Color(0xFFE53935).withOpacity(0.16)
                    : _accent.withOpacity(0.16),
                border: Border.all(
                  color: _isListening ? const Color(0xFFE53935) : _accent,
                  width: 2,
                ),
              ),
              child: Icon(
                _isListening ? Icons.stop_rounded : Icons.mic_rounded,
                color: _isListening ? const Color(0xFFE53935) : _accent,
              ),
            ),
          ),
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.08),
                borderRadius: BorderRadius.circular(28),
                border: Border.all(color: Colors.white.withOpacity(0.08)),
              ),
              child: TextField(
                controller: _inputCtrl,
                minLines: 1,
                maxLines: 4,
                style: const TextStyle(color: Colors.white),
                textInputAction: TextInputAction.send,
                onSubmitted: _send,
                decoration: InputDecoration(
                  hintText: _sttReady
                      ? 'Type or tap the mic to speak...'
                      : 'Describe your symptom...',
                  hintStyle: TextStyle(color: Colors.white.withOpacity(0.38)),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 18,
                    vertical: 14,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),
          GestureDetector(
            onTap: () => _send(_inputCtrl.text),
            child: Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _accent,
              ),
              child: const Icon(Icons.send_rounded, color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildListeningOverlay() {
    return Positioned.fill(
      child: GestureDetector(
        onTap: _stopListening,
        child: Container(
          color: Colors.black.withOpacity(0.84),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 104,
                height: 104,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFFE53935),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFE53935).withOpacity(0.45),
                      blurRadius: 24,
                      spreadRadius: 6,
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.mic_rounded,
                  color: Colors.white,
                  size: 42,
                ),
              ),
              const SizedBox(height: 28),
              const Text(
                'Listening...',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 12),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Text(
                  _partialText.isEmpty ? 'Speak clearly' : _partialText,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: _partialText.isEmpty ? Colors.white60 : _accent,
                    fontSize: 16,
                    fontStyle:
                        _partialText.isEmpty ? FontStyle.normal : FontStyle.italic,
                  ),
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'Tap anywhere to stop and send',
                style: TextStyle(color: Colors.white60, fontSize: 13),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ChatMessage {
  final String text;
  final bool isUser;
  final String type;

  const _ChatMessage({
    required this.text,
    required this.isUser,
    this.type = 'text',
  });
}

