# /sdk — Flutter SDK

Home of the `feature_poll` Flutter/Dart package.

- **Open source** under the MIT license
- Published to pub.dev
- Pure Dart — no native dependencies
- Will be split to its own public repository before v1 launch

## Structure (planned)

```
/lib
  feature_poll.dart        # Public entrypoint
  /src
    /api                   # Networking client + typed models
    /board                 # Board UI widgets
    /cache                 # Local store + sync queue
    /core                  # Device ID, config, context capture
/example                   # Runnable demo app
/test                      # Unit + property tests
```
