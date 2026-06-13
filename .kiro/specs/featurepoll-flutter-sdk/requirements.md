# Requirements Document

## Introduction

This specification covers the Flutter SDK package (`feature_poll`) and its embedded Board UI for the FeaturePoll product. The SDK enables Flutter developers to add a native feature-voting board to their app with a 3-line integration. It combines networking infrastructure, local-first caching with offline sync, optimistic voting, context capture, and a fully themed board UI with submit and roadmap functionality — all communicating with the live FeaturePoll backend API via a publishable key.

## Glossary

- **SDK**: The `feature_poll` Flutter/Dart package that developers add to their app.
- **Board**: The screen displaying feature-request posts, sorted by votes, with filtering by status.
- **Post**: A feature request containing a title, optional description, status, and vote count.
- **Vote**: A single upvote on a post, unique per (post_id, device_id) combination.
- **Device**: An anonymous identity represented by a locally-generated UUID, persisted across sessions.
- **Publishable_Key**: A public API key scoped to one project, shipped inside the app, attached as `x-publishable-key` header on every request.
- **Sync_Queue**: A persistent queue of pending network operations (votes, posts) stored in Hive, flushed when connectivity is available.
- **Stale_While_Revalidate**: A caching pattern where cached data is served immediately and a background refresh updates the cache for subsequent access.
- **Host_App**: The Flutter application that integrates the SDK.
- **FeaturePollConfig**: A configuration object allowing theme overrides and privacy settings.
- **Board_API**: The backend endpoint at the base URL that serves board data and accepts posts/votes/device registrations.

## Requirements

### Requirement 1: Package Structure and Public API

**User Story:** As a Flutter developer, I want to install the feature_poll package and initialize it with a single publishable key, so that I can add a feature-voting board to my app with minimal effort.

#### Acceptance Criteria

1. THE SDK SHALL expose a public API entrypoint from `lib/feature_poll.dart` that exports only `FeaturePoll`, `FeaturePollConfig`, and `openBoard`.
2. THE SDK SHALL declare a `pubspec.yaml` with package name `feature_poll`, Flutter 3.19+ and Dart 3.3+ SDK constraints, and dependencies on `http`, `hive_ce`, `uuid`, `package_info_plus`, and `connectivity_plus`.
3. THE SDK SHALL include a README.md file documenting the 3-line integration quickstart and an MIT LICENSE file.
4. WHEN `FeaturePoll.init(publishableKey)` is called, THE SDK SHALL store the publishable key for use in all subsequent API requests.
5. WHEN `FeaturePoll.init(publishableKey)` is called with an empty or null key, THE SDK SHALL throw an `ArgumentError` with a descriptive message.
6. WHEN `FeaturePoll.openBoard(context)` is called before `FeaturePoll.init()`, THE SDK SHALL throw a `StateError` indicating initialization is required.
7. THE SDK SHALL keep all internal implementation code under `lib/src/` organized into `api`, `board`, `cache`, and `core` subdirectories.

### Requirement 2: Networking Layer

**User Story:** As a Flutter developer, I want the SDK to handle all network communication reliably, so that my app communicates with the FeaturePoll backend without me writing HTTP code.

#### Acceptance Criteria

1. THE SDK SHALL attach the `x-publishable-key` header with the stored publishable key to every HTTP request sent to the Board_API.
2. THE SDK SHALL provide typed Dart model classes for Post, Vote, and Device that deserialize JSON responses from the Board_API.
3. WHEN a network request fails with a transient error (HTTP 5xx or network timeout), THE SDK SHALL retry the request up to 3 times with exponential backoff starting at 1 second.
4. WHEN a network request fails with an HTTP 4xx error, THE SDK SHALL not retry and SHALL return the error to the caller.
5. WHEN a network request fails with HTTP 429 (rate limit), THE SDK SHALL not retry immediately and SHALL enqueue the operation in the Sync_Queue for later flush.
6. THE SDK SHALL set a request timeout of 15 seconds for all HTTP calls to the Board_API.

### Requirement 3: Local-First Cache

**User Story:** As an end user, I want the board to load instantly from local storage, so that I can browse feature requests without waiting for a network response.

#### Acceptance Criteria

1. WHEN `FeaturePoll.init(publishableKey)` is called, THE SDK SHALL initialize Hive storage and open the required boxes for board cache, device identity, and sync queue data.
2. THE SDK SHALL generate a v4 UUID as the device identifier on first launch and persist the device identifier in Hive for all subsequent sessions.
3. WHEN the board is opened and a cached board exists, THE SDK SHALL render the cached board data immediately without displaying a loading spinner.
4. WHEN the board is opened and a cached board exists, THE SDK SHALL fetch fresh data from the Board_API in the background and update the displayed board upon receiving the response.
5. WHEN the board is opened and no cached board exists, THE SDK SHALL display a loading indicator while fetching data from the Board_API.
6. WHEN fresh board data is received from the Board_API, THE SDK SHALL persist the data to the Hive cache, replacing the previous cached state.
7. WHEN the network is unreachable and no cache exists, THE SDK SHALL display an error state with a retry option.

### Requirement 4: Optimistic Voting and Sync Queue

**User Story:** As an end user, I want my votes to feel instant and survive connectivity loss, so that the board feels responsive regardless of network conditions.

#### Acceptance Criteria

1. WHEN the end user taps the upvote button on a post, THE SDK SHALL immediately increment the displayed vote count and mark the post as voted by the current device.
2. WHEN the end user taps the upvote button on a post that is already voted, THE SDK SHALL immediately decrement the displayed vote count and mark the post as not voted by the current device.
3. WHEN an optimistic vote or un-vote is performed, THE SDK SHALL enqueue the corresponding network operation (POST /votes or DELETE /votes) in the Sync_Queue.
4. WHEN connectivity is available, THE SDK SHALL flush all pending operations from the Sync_Queue in FIFO order.
5. IF a queued network operation fails permanently (HTTP 4xx excluding 429), THEN THE SDK SHALL remove the operation from the Sync_Queue and revert the optimistic UI change.
6. THE SDK SHALL persist the Sync_Queue in Hive so that pending operations survive app restarts.
7. WHEN the app transitions from offline to online, THE SDK SHALL automatically begin flushing the Sync_Queue.

### Requirement 5: Context Capture

**User Story:** As a developer, I want the SDK to automatically attach device and app context to feature requests, so that I can understand where and how users submit feedback.

#### Acceptance Criteria

1. THE SDK SHALL capture the operating system name and version using `package_info_plus`.
2. THE SDK SHALL capture the host app version string using `package_info_plus`.
3. WHEN a new post is submitted and context capture is enabled, THE SDK SHALL attach the OS, app version, and current screen name to the post payload sent to the Board_API.
4. WHEN `FeaturePollConfig.captureContext` is set to `false`, THE SDK SHALL omit OS, app version, and screen name from all post submissions.
5. THE SDK SHALL allow the developer to set the current screen name via `FeaturePoll.setCurrentScreen(screenName)` for context attachment.
6. THE SDK SHALL NOT collect any personally identifiable information beyond the anonymous device UUID.

### Requirement 6: Device Registration

**User Story:** As a developer, I want devices to be automatically registered with the backend, so that the system can track anonymous voters and enable future push notifications.

#### Acceptance Criteria

1. WHEN `FeaturePoll.init(publishableKey)` is called, THE SDK SHALL register the device with the Board_API by calling POST /devices with the device UUID.
2. IF device registration fails due to a network error, THEN THE SDK SHALL retry device registration on the next successful network operation.
3. THE SDK SHALL send device registration as a fire-and-forget operation that does not block board rendering or voting.

### Requirement 7: Board Screen UI

**User Story:** As an end user, I want to see a list of feature requests sorted by popularity, so that I can quickly find and vote on the most relevant ideas.

#### Acceptance Criteria

1. WHEN `FeaturePoll.openBoard(context)` is called, THE SDK SHALL navigate to a full-screen board displaying posts sorted by vote count in descending order.
2. THE SDK SHALL display each post with its title, vote count, and an upvote button.
3. WHEN the end user taps the upvote button, THE SDK SHALL animate the vote count change with a scale or bounce animation.
4. WHEN no posts exist for the current project, THE SDK SHALL display an empty state with a message encouraging the user to submit the first request.
5. WHEN the board is loading from cache, THE SDK SHALL not display a full-screen spinner and SHALL render the cached posts.
6. THE SDK SHALL support pull-to-refresh to manually trigger a fresh fetch from the Board_API.

### Requirement 8: Submit Feature Request Flow

**User Story:** As an end user, I want to suggest a new feature directly from the board, so that I can share my ideas without leaving the app.

#### Acceptance Criteria

1. THE SDK SHALL display a "Suggest a feature" button on the board screen.
2. WHEN the end user taps the "Suggest a feature" button, THE SDK SHALL present a bottom sheet with input fields for title (required) and description (optional).
3. WHEN the end user submits the form with an empty title, THE SDK SHALL display a validation error and prevent submission.
4. WHEN the end user submits a valid feature request, THE SDK SHALL add the new post to the displayed list immediately with vote count of 0.
5. WHEN the end user submits a valid feature request, THE SDK SHALL send POST /posts to the Board_API with title, description, device_id, and context fields (if capture is enabled).
6. IF the post submission fails permanently, THEN THE SDK SHALL display a brief error message and remove the optimistically-added post from the list.

### Requirement 9: Roadmap and Status Tabs

**User Story:** As an end user, I want to filter feature requests by status, so that I can see what is planned, in progress, or already shipped.

#### Acceptance Criteria

1. THE SDK SHALL display filter tabs on the board screen with labels: Open, Planned, In Progress, and Shipped.
2. WHEN the end user selects a status tab, THE SDK SHALL filter the displayed posts to only those matching the selected status.
3. WHEN the "Open" tab is selected, THE SDK SHALL display posts with status "open" sorted by vote count descending.
4. THE SDK SHALL visually distinguish shipped posts with a distinct style to communicate completion (the "we listened" moment).
5. THE SDK SHALL default to showing the "Open" tab when the board is first opened.

### Requirement 10: Theming

**User Story:** As a Flutter developer, I want the board to automatically match my app's look and feel, so that it appears native to my users without extra configuration.

#### Acceptance Criteria

1. THE SDK SHALL inherit the Host_App's `ThemeData` including color scheme, text styles, and brightness (light/dark mode) by default.
2. WHERE `FeaturePollConfig.theme` is provided, THE SDK SHALL use the developer-specified theme overrides instead of the Host_App theme for the board UI.
3. THE SDK SHALL render correctly in both light and dark mode without visual artifacts or unreadable text.
4. THE SDK SHALL use Material 3 design tokens from the inherited or overridden theme for all board UI components.
5. WHERE `FeaturePollConfig.accentColor` is provided, THE SDK SHALL use the specified color for the upvote button and primary interactive elements.
