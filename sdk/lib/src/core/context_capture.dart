import 'dart:io';

import 'package:package_info_plus/package_info_plus.dart';

/// Captures device and app context for post submissions.
class ContextCapture {
  ContextCapture._();

  static String? _appVersion;
  static String? _os;

  /// Load platform info. Called once during [FeaturePoll.init].
  static Future<void> initialize() async {
    try {
      final info = await PackageInfo.fromPlatform();
      _appVersion = '${info.version}+${info.buildNumber}';
      _os = '${Platform.operatingSystem} ${Platform.operatingSystemVersion}';
    } catch (_) {
      // Gracefully handle if platform info unavailable (e.g. in tests)
      _appVersion = null;
      _os = null;
    }
  }

  /// Build context map for post submission.
  /// Returns null if [captureEnabled] is false.
  static Map<String, String?>? buildContext({
    required bool captureEnabled,
    String? currentScreen,
  }) {
    if (!captureEnabled) return null;
    return {
      'app_version': _appVersion,
      'os': _os,
      'screen_context': currentScreen,
    };
  }
}
