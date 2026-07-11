class RemoteBackup {

  const RemoteBackup({

    required this.payload,

    required this.schemaVersion,

    required this.updatedAt,

  });



  final Map<String, dynamic> payload;

  final int schemaVersion;

  final DateTime updatedAt;

}



class FetchBackupResult {

  const FetchBackupResult({this.backup, this.hadError = false});



  final RemoteBackup? backup;

  final bool hadError;

}



enum CloudSyncAction {
  none,
  restored,
  uploaded,
  skipped,
  failed,
  needsConfirmation,
  restoreAvailable,
}



class CloudSyncResult {

  const CloudSyncResult({

    required this.action,

    this.message,

  });



  final CloudSyncAction action;

  final String? message;



  bool get restored => action == CloudSyncAction.restored;

  bool get failed => action == CloudSyncAction.failed;

  bool get uploaded => action == CloudSyncAction.uploaded;

}


