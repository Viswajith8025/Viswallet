/// Copy this file to `groq_local.dart` (gitignored) for **debug** builds only.
///
/// Release/profile APKs ignore this file — pass the key at build time instead:
/// `flutter build apk --release --dart-define=GROQ_API_KEY=gsk_...`
///
/// Rotate any key that was previously shipped inside an APK.
abstract final class GroqLocal {
  static const apiKey = '';
}
