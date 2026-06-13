# Implementation Plan: FeaturePoll Flutter SDK

## Overview

Build the `feature_poll` Flutter package from scratch inside `sdk/`. The implementation follows a bottom-up approach: package skeleton → core utilities → networking → caching → board UI → example app → verification. All code is Dart targeting Flutter 3.19+. The existing `sdk/README.md` will be replaced with proper SDK documentation.

## Tasks

- [x] 1. Package skeleton and project setup
  - [x] 1.1 Create `sdk/pubspec.yaml`, `sdk/analysis_options.yaml`, `sdk/LICENSE` (MIT), and replace `sdk/README.md` with quickstart documentation
    - pubspec.yaml with package name `feature_poll`, Flutter 3.19+ / Dart 3.3+ constraints, dependencies on `http`, `hive_ce`, `hive_ce_flutter`, `uuid`, `package_info_plus`, `connectivity_plus`, and dev_dependencies on `flutter_test`, `flutter_lints`, `mocktail`
    - analysis_options.yaml including `flutter_lints`
    - README.md documenting 3-line integration quickstart
    - LICENSE with MIT text
    - _Requirements: 1.2, 1.3_

  - [x] 1.2 Create barrel file `sdk/lib/feature_poll.dart` and directory structure under `sdk/lib/src/`
    - Create empty directories: `sdk/lib/src/api/models/`, `sdk/lib/src/board/`, `sdk/lib/src/cache/`, `sdk/lib/src/core/`
    - Create `sdk/test/api/`, `sdk/test/cache/`, `sdk/test/core/` directories
    - Create `sdk/example/lib/` directory
    - Barrel file exports `FeaturePoll`, `FeaturePollConfig`, and `openBoard`
    - _Requirements: 1.1, 1.7_

- [x] 2. Core layer
  - [x] 2.1 Implement `sdk/lib/src/core/config.dart` — `FeaturePollConfig` class
    - Immutable config with `theme`, `accentColor`, `captureContext` (default true), `baseUrl` fields
    - _Requirements: 1.1, 10.1, 10.5_

  - [x] 2.2 Implement `sdk/lib/src/core/device_id_manager.dart` — UUID generation and persistence
    - `ensureDeviceId()` generates v4 UUID on first call, persists to Hive, returns same ID on subsequent calls
    - `getDeviceId()` reads persisted ID
    - _Requirements: 3.2_

  - [x] 2.3 Implement `sdk/lib/src/core/context_capture.dart` — OS, app version, screen name capture
    - `initialize()` loads platform info via `package_info_plus`
    - `buildContext()` returns context map or null based on `captureEnabled` flag
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 2.4 Implement `sdk/lib/src/core/feature_poll_main.dart` — `FeaturePoll` static class and `openBoard` top-level function
    - `init(publishableKey, config?)` validates key, initializes Hive, device ID, API client, context capture, fires device registration
    - `openBoard(context)` pushes `BoardScreen` route, throws `StateError` if not initialized
    - `setCurrentScreen(screenName)` stores current screen for context
    - _Requirements: 1.4, 1.5, 1.6, 6.1, 6.3_

  - [ ]* 2.5 Write property tests for core layer
    - **Property 1: Invalid key rejection** — empty/whitespace strings throw `ArgumentError`
    - **Property 6: Device ID persistence idempotence** — repeated calls return same UUID
    - **Property 13: Context capture conditional inclusion** — payload fields present/absent based on config
    - **Property 14: No PII in payloads** — only `device_id` UUID present as identity
    - **Validates: Requirements 1.5, 3.2, 5.3, 5.4, 5.5, 5.6**

- [x] 3. API layer
  - [x] 3.1 Implement `sdk/lib/src/api/api_exceptions.dart` — typed error classes
    - `ApiException` with statusCode and body
    - `RateLimitException` extends `ApiException`
    - _Requirements: 2.4, 2.5_

  - [x] 3.2 Implement `sdk/lib/src/api/models/post.dart`, `vote.dart`, `device.dart` — data models with JSON serialization
    - `Post` with `fromJson`, `toJson`, `copyWith`
    - `Vote` with `fromJson`, `toJson`
    - `Device` with `fromJson`, `toJson`
    - _Requirements: 2.2_

  - [x] 3.3 Implement `sdk/lib/src/api/api_client.dart` — HTTP client with retry, headers, timeout
    - Singleton pattern with `initialize()` and `instance` getter
    - Attaches `x-publishable-key` header to every request
    - 15-second timeout, retry up to 3× on 5xx/timeout with exponential backoff
    - No retry on 4xx; throws `RateLimitException` on 429
    - Methods: `fetchBoard`, `createPost`, `castVote`, `removeVote`, `registerDevice`
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 3.4 Write property tests for API layer
    - **Property 2: Publishable key header attachment** — every request contains correct header
    - **Property 3: Model JSON serialization round-trip** — Post, Vote, Device survive toJson/fromJson
    - **Property 4: Transient error retry with backoff** — 5xx/timeout retried up to 3×
    - **Property 5: No retry on client errors** — 4xx (not 429) returns immediately
    - **Validates: Requirements 1.4, 2.1, 2.2, 2.3, 2.4**

- [x] 4. Cache layer
  - [x] 4.1 Implement `sdk/lib/src/cache/hive_boxes.dart` — box name constants and initialization
    - `HiveBoxes.initialize()` opens `board_cache`, `device_info`, `sync_queue` boxes
    - _Requirements: 3.1_

  - [x] 4.2 Implement `sdk/lib/src/cache/cache_manager.dart` — stale-while-revalidate board cache
    - `getCachedBoard()` returns cached posts or null
    - `setCachedBoard(posts)` persists full post list as JSON
    - `clear()` wipes cache
    - _Requirements: 3.3, 3.4, 3.6_

  - [x] 4.3 Implement `sdk/lib/src/cache/sync_queue.dart` — persistent FIFO operation queue
    - `SyncOperation` model with id, type (vote/unvote/createPost), payload, createdAt
    - `enqueue()`, `pending()`, `remove()`, `flush()` methods
    - Flush processes in FIFO order; stops on transient failure; removes + notifies on permanent failure
    - _Requirements: 4.3, 4.4, 4.5, 4.6_

  - [ ]* 4.4 Write property tests for cache layer
    - **Property 7: Board cache write-read round-trip** — posts survive cache cycle
    - **Property 10: Sync queue FIFO ordering** — operations flush in enqueue order
    - **Property 12: Sync queue persistence round-trip** — queue survives simulated restart
    - **Validates: Requirements 3.6, 4.4, 4.6**

- [x] 5. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Board UI
  - [x] 6.1 Implement `sdk/lib/src/board/board_controller.dart` — `ChangeNotifier` managing board state
    - Posts list, active filter, loading state, error state
    - `loadBoard()` with stale-while-revalidate pattern
    - `setFilter()`, `toggleVote()`, `submitPost()`
    - Connectivity listener triggers sync queue flush on reconnection
    - Optimistic vote with revert on permanent failure
    - _Requirements: 3.3, 3.4, 3.5, 3.7, 4.1, 4.2, 4.7, 7.1_

  - [x] 6.2 Implement `sdk/lib/src/board/status_tabs.dart` — filter tab bar widget
    - FilterChips for Open, Planned, In Progress, Shipped
    - Defaults to "Open" tab active
    - _Requirements: 9.1, 9.2, 9.5_

  - [x] 6.3 Implement `sdk/lib/src/board/post_tile.dart` — single post card widget
    - Displays title, vote count, upvote button
    - Upvote button uses accent color
    - Vote count animation (scale) on tap
    - Shipped posts get distinct visual style
    - _Requirements: 7.2, 7.3, 9.4, 10.4, 10.5_

  - [x] 6.4 Implement `sdk/lib/src/board/submit_sheet.dart` — bottom sheet for new feature requests
    - Title (required) and description (optional) fields
    - Validation: rejects empty/whitespace title
    - Submitting state with loading indicator
    - Shows error SnackBar on failure
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 6.5 Implement `sdk/lib/src/board/board_screen.dart` — full-screen board widget
    - Uses `BoardController` with `ListenableBuilder`
    - Integrates StatusTabs, PostTile list, SubmitSheet FAB
    - Pull-to-refresh support
    - Empty state, error state with retry, loading state
    - Theming: applies config theme or inherits host app theme
    - _Requirements: 7.1, 7.4, 7.5, 7.6, 8.1, 10.1, 10.2, 10.3, 10.4_

  - [ ]* 6.6 Write property tests for board logic
    - **Property 8: Vote toggle correctness** — increment/decrement based on current voted state
    - **Property 9: Vote action enqueues sync operation** — each toggle produces exactly one SyncOperation
    - **Property 11: Permanent failure reverts optimistic state** — vote count restored on 4xx
    - **Property 15: Post list filtering and sorting** — correct filter + descending sort
    - **Property 17: Empty title validation** — empty/whitespace rejected
    - **Property 18: Valid submission produces correct payload** — required fields present
    - **Property 19: Failed submission rollback** — optimistic post removed on failure
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.5, 7.1, 8.3, 8.4, 8.5, 8.6, 9.2, 9.3**

  - [ ]* 6.7 Write unit tests for board UI widgets
    - **Property 16: Post rendering completeness** — title, count, button present in widget tree
    - **Property 20: Theme resolution** — correct theme applied based on config
    - **Property 21: Accent color application** — upvote button uses specified color
    - Test empty state display, pull-to-refresh trigger, submit sheet validation UX
    - _Requirements: 7.2, 7.4, 7.6, 10.1, 10.2, 10.5_

- [x] 7. Example app
  - [x] 7.1 Create `sdk/example/lib/main.dart` — 3-line integration demo
    - Minimal Flutter app calling `FeaturePoll.init()` and `FeaturePoll.openBoard(context)`
    - Demonstrates the "2-minute, 3-line" integration promise
    - _Requirements: 1.3_

- [x] 8. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Verification
  - [x] 9.1 Run `flutter analyze` in `sdk/` and fix all lint issues
    - Zero warnings, zero errors
    - _Requirements: 1.2_

  - [ ]* 9.2 Run `flutter test` in `sdk/` and confirm all tests pass
    - All unit and property tests green
    - _Requirements: all_

- [x] 10. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document (21 total)
- Unit tests validate specific examples and edge cases
- All code is Dart targeting Flutter 3.19+ — no build step needed beyond `flutter analyze` and `flutter test`
- The existing `sdk/README.md` is replaced in task 1.1

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["2.1", "3.1", "4.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "3.2"] },
    { "id": 4, "tasks": ["2.4", "3.3", "4.2", "4.3"] },
    { "id": 5, "tasks": ["2.5", "3.4", "4.4"] },
    { "id": 6, "tasks": ["6.1", "6.2", "6.3", "6.4"] },
    { "id": 7, "tasks": ["6.5"] },
    { "id": 8, "tasks": ["6.6", "6.7", "7.1"] },
    { "id": 9, "tasks": ["9.1", "9.2"] }
  ]
}
```
