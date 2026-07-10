import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rupee_track/core/database/database_backup.dart';
import 'package:rupee_track/core/providers/supabase_provider.dart';
import 'package:rupee_track/features/cloud_backup/domain/cloud_backup_models.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final cloudBackupRepositoryProvider = Provider<CloudBackupRepository>((ref) {
  return CloudBackupRepository(ref.watch(supabaseClientProvider));
});

class CloudBackupRepository {
  CloudBackupRepository(this._client);

  final SupabaseClient _client;

  static const _table = 'user_data_backups';

  Future<RemoteBackup?> fetchBackup(String userId) async {
    final result = await fetchBackupWithStatus(userId);
    return result.backup;
  }

  Future<FetchBackupResult> fetchBackupWithStatus(String userId) async {
    try {
      final row = await _client
          .from(_table)
          .select('payload, schema_version, updated_at')
          .eq('user_id', userId)
          .maybeSingle();
      if (row == null) return const FetchBackupResult();

      final payload = row['payload'];
      if (payload is! Map<String, dynamic>) return const FetchBackupResult();

      final updatedRaw = row['updated_at']?.toString();
      final updatedAt = updatedRaw != null
          ? DateTime.tryParse(updatedRaw)?.toUtc()
          : null;

      return FetchBackupResult(
        backup: RemoteBackup(
          payload: payload,
          schemaVersion: row['schema_version'] as int? ?? 1,
          updatedAt: updatedAt ?? DateTime.fromMillisecondsSinceEpoch(0),
        ),
      );
    } on PostgrestException {
      return const FetchBackupResult(hadError: true);
    }
  }

  Future<DateTime> uploadBackup({
    required String userId,
    required Map<String, dynamic> payload,
  }) async {
    final now = DateTime.now().toUtc();
    await _client.from(_table).upsert(
      {
        'user_id': userId,
        'payload': payload,
        'schema_version': DatabaseBackup.schemaVersion,
        'updated_at': now.toIso8601String(),
      },
      onConflict: 'user_id',
    );
    return now;
  }

  Future<void> deleteBackup(String userId) async {
    await _client.from(_table).delete().eq('user_id', userId);
  }
}
