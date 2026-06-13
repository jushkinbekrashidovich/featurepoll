# feature_poll

Native feature-voting board for Flutter apps. Add a feature-request board to your app in 3 lines of code.

## Quick Start

```dart
import 'package:feature_poll/feature_poll.dart';

// 1. Initialize (once, at app startup)
await FeaturePoll.init('your-publishable-key');

// 2. Open the board (from any screen)
FeaturePoll.openBoard(context);
```

## Features

- **Truly native** — no WebView, inherits your app's theme
- **Anonymous** — no sign-up required for voters
- **Offline-first** — instant load from cache, syncs in background
- **Optimistic voting** — UI updates immediately
- **Context capture** — auto-tags requests with screen, OS, app version

## Installation

```yaml
dependencies:
  feature_poll: ^0.1.0
```

## Configuration

```dart
await FeaturePoll.init(
  'your-publishable-key',
  config: FeaturePollConfig(
    captureContext: true,    // attach device/app info to posts
    accentColor: Colors.blue, // custom upvote button color
  ),
);
```

## License

MIT
