import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:home_widget/home_widget.dart';
import 'package:rupee_track/app.dart';
import 'package:rupee_track/bootstrap.dart';
import 'package:rupee_track/core/utils/material_icon_manifest.dart';
import 'package:rupee_track/features/home_widget/data/home_widget_sync_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  MaterialIconManifest.ensureBundled();
  if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
    HomeWidget.registerInteractivityCallback(homeWidgetInteractivityCallback);
  }
  await bootstrap();
  runApp(const ProviderScope(child: VisWalletApp()));
}
