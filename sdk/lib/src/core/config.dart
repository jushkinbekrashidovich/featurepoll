import 'package:flutter/material.dart';

/// Configuration for the FeaturePoll SDK.
///
/// Pass an instance to [FeaturePoll.init] to customize theming and behavior.
class FeaturePollConfig {
  /// Custom theme overrides for the board UI. If null, inherits host app theme.
  final ThemeData? theme;

  /// Accent color for upvote button and primary interactive elements.
  final Color? accentColor;

  /// Whether to capture OS, app version, and screen name on post submission.
  /// Defaults to true.
  final bool captureContext;

  /// Override the base URL for testing against a local/staging backend.
  final String? baseUrl;

  /// Creates a [FeaturePollConfig].
  const FeaturePollConfig({
    this.theme,
    this.accentColor,
    this.captureContext = true,
    this.baseUrl,
  });
}
