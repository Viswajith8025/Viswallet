import 'package:flutter/foundation.dart';
import 'package:rupee_track/core/config/groq_local.example.dart'
    if (dart.library.io) 'package:rupee_track/core/config/groq_local.dart';

/// Groq API configuration for Jithu (cloud AI assistant).
///
/// Release/profile builds only accept `--dart-define=GROQ_API_KEY=...` so a
/// gitignored local key cannot ship inside APKs. Debug may use `groq_local.dart`.
///
/// Prefer a server/Edge Function proxy for production; never commit keys.
abstract final class GroqConfig {
  static const _fromEnv = String.fromEnvironment('GROQ_API_KEY');

  static String get apiKey {
    if (_fromEnv.isNotEmpty) return _fromEnv;
    if (kDebugMode) return GroqLocal.apiKey;
    return '';
  }

  static bool get isConfigured => apiKey.isNotEmpty;

  static const model = String.fromEnvironment(
    'GROQ_MODEL',
    defaultValue: 'openai/gpt-oss-120b',
  );

  static const baseUrl = 'https://api.groq.com/openai/v1';
}
