import 'package:flutter/material.dart';

import '../api/api_client.dart';
import '../board/board_screen.dart';
import '../cache/hive_boxes.dart';
import 'config.dart';
import 'context_capture.dart';
import 'device_id_manager.dart';

/// Main entry point for the FeaturePoll SDK.
///
/// Call [init] once at app startup, then [openBoard] to display the board.
/// This is a static-only class — no instances are created.
class FeaturePoll {
  FeaturePoll._();

  static bool _initialized = false;
  static String? _currentScreen;
  static FeaturePollConfig _config = const FeaturePollConfig();

  /// The current SDK configuration. Used internally by board components.
  static FeaturePollConfig get config => _config;

  /// The current screen name set by [setCurrentScreen].
  static String? get currentScreen => _currentScreen;

  /// Initialize the SDK. Must be called before [openBoard].
  ///
  /// [publishableKey] is the public API key from your FeaturePoll dashboard.
  /// Throws [ArgumentError] if [publishableKey] is empty or whitespace-only.
  static Future<void> init(
    String publishableKey, {
    FeaturePollConfig? config,
  }) async {
    if (publishableKey.trim().isEmpty) {
      throw ArgumentError('publishableKey must not be empty');
    }
    _config = config ?? const FeaturePollConfig();

    // Initialize Hive boxes for local storage
    await HiveBoxes.initialize();

    // Generate or retrieve persistent device ID
    await DeviceIdManager.ensureDeviceId();

    // Initialize the API client
    ApiClient.initialize(
      publishableKey: publishableKey,
      baseUrl: _config.baseUrl,
    );

    // Load platform context (app version, OS)
    await ContextCapture.initialize();

    _initialized = true;

    // Fire-and-forget device registration
    _registerDevice();
  }

  /// Open the feature board as a full-screen route.
  ///
  /// Throws [StateError] if [init] has not been called.
  static Future<void> openBoard(BuildContext context) async {
    if (!_initialized) {
      throw StateError(
        'FeaturePoll.init() must be called before openBoard()',
      );
    }
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const BoardScreen()),
    );
  }

  /// Set the current screen name for context capture.
  ///
  /// Call this in your screen's `initState` or route observer so that
  /// feature requests include which screen the user was on.
  static void setCurrentScreen(String screenName) {
    _currentScreen = screenName;
  }

  /// Non-blocking device registration with the backend.
  static void _registerDevice() {
    ApiClient.instance.registerDevice().catchError((_) {});
  }
}

/// Convenience top-level function to open the board.
///
/// Equivalent to calling [FeaturePoll.openBoard].
Future<void> openBoard(BuildContext context) => FeaturePoll.openBoard(context);
