import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rupee_track/core/constants/app_constants.dart';
import 'package:rupee_track/core/providers/supabase_provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.watch(supabaseClientProvider));
});

class AuthRepository {
  AuthRepository(this._client);

  final SupabaseClient _client;

  User? get currentUser => _client.auth.currentUser;

  Stream<AuthState> get authStateChanges => _client.auth.onAuthStateChange;

  Future<AuthResponse> signUp({
    required String email,
    required String password,
    String? displayName,
    String? passwordHint,
  }) {
    final metadata = <String, dynamic>{};
    if (displayName != null && displayName.isNotEmpty) {
      metadata['display_name'] = displayName;
    }
    if (passwordHint != null && passwordHint.isNotEmpty) {
      metadata['password_hint'] = passwordHint;
    }

    return _client.auth.signUp(
      email: email.trim(),
      password: password,
      data: metadata.isEmpty ? null : metadata,
    );
  }

  Future<AuthResponse> signIn({
    required String email,
    required String password,
  }) {
    return _client.auth.signInWithPassword(
      email: email.trim(),
      password: password,
    );
  }

  Future<void> signOut() => _client.auth.signOut();

  Future<void> sendPasswordResetEmail(String email) {
    return _client.auth.resetPasswordForEmail(
      email.trim(),
      redirectTo: AppConstants.authPasswordResetRedirect,
    );
  }

  /// Returns the signed-in user's password hint (server requires auth + email match).
  Future<String?> fetchPasswordHintForCurrentUser() async {
    final email = currentUser?.email?.trim();
    if (email == null || email.isEmpty) return null;

    try {
      final result = await _client.rpc(
        'get_password_hint',
        params: {'p_email': email},
      );
      if (result == null) return null;
      final hint = result.toString().trim();
      return hint.isEmpty ? null : hint;
    } on PostgrestException {
      return null;
    } catch (_) {
      return null;
    }
  }

  Future<bool> checkConnection() async {
    try {
      await _client.from('profiles').select('id').limit(1);
      return true;
    } on PostgrestException {
      return false;
    } catch (_) {
      return false;
    }
  }
}
