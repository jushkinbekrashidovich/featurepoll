# Design Document: FeaturePoll Flutter SDK

## Overview

The `feature_poll` Flutter package provides a native feature-voting board that integrates into any Flutter app with 3 lines of code. It communicates with the FeaturePoll Supabase backend exclusively via a publishable key, implements local-first caching with offline sync, optimistic voting, automatic context capture, and a fully themed board UI.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Host App                           │
│  FeaturePoll.init(key) → FeaturePoll.openBoard(ctx) │
└──────────────────────────┬──────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────┐
│              feature_poll package                     │
│                                                      │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────┐ │
│  │   core/   │  │   api/    │  │     board/       │ │
│  │ Config    │  │ ApiClient │  │ BoardScreen      │ │
│  │ DeviceId  │  │ Models    │  │ PostTile         │ │
│  │ Context   │  │ Retry     │  │ SubmitSheet      │ │
│  └─────┬────┘  └─────┬─────┘  │ StatusTabs       │ │
│        │              │        └────────┬─────────┘ │
│  ┌─────▼──────────────▼────────────────▼─────────┐ │
│  │                  cache/                         │ │
│  │  CacheManager · SyncQueue · DeviceStore        │ │
│  │  (Hive boxes: board_cache, device_info,        │ │
│  │   sync_queue)                                  │ │
│  └────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────┘
                           │ HTTP (x-publishable-key)
┌──────────────────────────▼──────────────────────────┐
│         FeaturePoll Backend (Supabase)               │
│  /board  /posts  /votes  /devices                    │
└─────────────────────────────────────────────────────┘
```

## File Structure

```
sdk/
├── lib/
│   ├── feature_poll.dart              # Public entrypoint (exports FeaturePoll, FeaturePollConfig, openBoard)
│   └── src/
│       ├── api/
│       │   ├── api_client.dart        # HTTP client with retry, headers, timeout
│       │   ├── models/
│       │   │   ├── post.dart          # Post model + JSON serialization
│       │   │   ├── vote.dart          # Vote model + JSON serialization
│       │   │   └── device.dart        # Device model + JSON serialization
│       │   └── api_exceptions.dart    # Typed API error classes
│       ├── board/
│       │   ├── board_screen.dart      # Full-screen board (StatefulWidget)
│       │   ├── board_controller.dart  # Board state (ChangeNotifier)
│       │   ├── post_tile.dart         # Single post card widget
│       │   ├── submit_sheet.dart      # Bottom sheet for new requests
│       │   └── status_tabs.dart       # Filter tab bar
│       ├── cache/
│       │   ├── cache_manager.dart     # Board data cache (stale-while-revalidate)
│       │   ├── sync_queue.dart        # Offline operation queue (FIFO)
│       │   └── hive_boxes.dart        # Box names and initialization
│       └── core/
│           ├── feature_poll_main.dart # FeaturePoll class implementation
│           ├── config.dart            # FeaturePollConfig class
│           ├── device_id_manager.dart # UUID generation + persistence
│           └── context_capture.dart   # OS, app version, screen name
├── test/
│   ├── api/
│   │   ├── api_client_test.dart
│   │   └── models_test.dart
│   ├── cache/
│   │   ├── cache_manager_test.dart
│   │   └── sync_queue_test.dart
│   └── core/
│       ├── device_id_manager_test.dart
│       └── context_capture_test.dart
├── example/
│   └── lib/main.dart                  # 3-line integration demo
├── pubspec.yaml
├── README.md
├── LICENSE
└── analysis_options.yaml
```

## Components and Interfaces

### 1. Public API (`lib/feature_poll.dart`)

The barrel file exports exactly three symbols:

```dart
library feature_poll;

export 'src/core/feature_poll_main.dart' show FeaturePoll;
export 'src/core/config.dart' show FeaturePollConfig;
export 'src/core/feature_poll_main.dart' show openBoard;
```

### 2. FeaturePoll Class (`lib/src/core/feature_poll_main.dart`)

Static class providing the entire public surface. No instance creation required.

```dart
class FeaturePoll {
  static String? _publishableKey;
  static bool _initialized = false;
  static String? _currentScreen;
  static FeaturePollConfig _config = FeaturePollConfig();

  /// Initialize the SDK. Must be called before openBoard.
  static Future<void> init(
    String publishableKey, {
    FeaturePollConfig? config,
  }) async {
    if (publishableKey.trim().isEmpty) {
      throw ArgumentError('publishableKey must not be empty');
    }
    _publishableKey = publishableKey;
    _config = config ?? FeaturePollConfig();
    
    // Initialize Hive boxes
    await HiveBoxes.initialize();
    
    // Generate or retrieve device ID
    await DeviceIdManager.ensureDeviceId();
    
    _initialized = true;
    
    // Fire-and-forget device registration
    _registerDevice();
  }

  /// Open the feature board as a full-screen route.
  static Future<void> openBoard(BuildContext context) async {
    if (!_initialized) {
      throw StateError(
        'FeaturePoll.init() must be called before openBoard()',
      );
    }
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const BoardScreen()),
    );
  }

  /// Set the current screen name for context capture.
  static void setCurrentScreen(String screenName) {
    _currentScreen = screenName;
  }

  static void _registerDevice() {
    // Non-blocking device registration
    ApiClient.instance.registerDevice().catchError((_) {});
  }
}

/// Convenience top-level function (exported for developer ergonomics).
Future<void> openBoard(BuildContext context) => FeaturePoll.openBoard(context);
```

### 3. FeaturePollConfig (`lib/src/core/config.dart`)

```dart
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

  const FeaturePollConfig({
    this.theme,
    this.accentColor,
    this.captureContext = true,
    this.baseUrl,
  });
}
```

### 4. API Client (`lib/src/api/api_client.dart`)

Single HTTP client instance with retry logic, header injection, and typed responses.

```dart
class ApiClient {
  static ApiClient? _instance;
  static ApiClient get instance => _instance!;

  final http.Client _httpClient;
  final String _baseUrl;
  final String _publishableKey;
  
  static const _defaultBaseUrl =
      'https://sxxoofnfrgcqjpysfowi.supabase.co/functions/v1';
  static const _timeout = Duration(seconds: 15);
  static const _maxRetries = 3;

  ApiClient._({
    required String publishableKey,
    String? baseUrl,
    http.Client? httpClient,
  })  : _publishableKey = publishableKey,
        _baseUrl = baseUrl ?? _defaultBaseUrl,
        _httpClient = httpClient ?? http.Client();

  static void initialize({
    required String publishableKey,
    String? baseUrl,
    http.Client? httpClient,
  }) {
    _instance = ApiClient._(
      publishableKey: publishableKey,
      baseUrl: baseUrl,
      httpClient: httpClient,
    );
  }

  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    'x-publishable-key': _publishableKey,
  };

  /// Execute a request with retry logic for transient errors.
  Future<http.Response> _request(
    String method,
    String path, {
    Map<String, dynamic>? body,
    Map<String, String>? queryParams,
  }) async {
    final uri = Uri.parse('$_baseUrl/$path').replace(queryParameters: queryParams);
    int attempt = 0;

    while (true) {
      attempt++;
      try {
        final http.Response response;
        switch (method) {
          case 'GET':
            response = await _httpClient
                .get(uri, headers: _headers)
                .timeout(_timeout);
          case 'POST':
            response = await _httpClient
                .post(uri, headers: _headers, body: jsonEncode(body))
                .timeout(_timeout);
          case 'DELETE':
            response = await _httpClient
                .delete(uri, headers: _headers, body: jsonEncode(body))
                .timeout(_timeout);
          default:
            throw UnsupportedError('HTTP method $method not supported');
        }

        if (response.statusCode >= 500 && attempt <= _maxRetries) {
          await Future.delayed(Duration(seconds: 1 << (attempt - 1)));
          continue;
        }

        return response;
      } on TimeoutException {
        if (attempt > _maxRetries) rethrow;
        await Future.delayed(Duration(seconds: 1 << (attempt - 1)));
      }
    }
  }

  /// Fetch board posts.
  Future<List<Post>> fetchBoard({int page = 1, int pageSize = 20}) async {
    final response = await _request('GET', 'board', queryParams: {
      'page': '$page',
      'page_size': '$pageSize',
    });
    _assertSuccess(response);
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return (data['posts'] as List).map((j) => Post.fromJson(j)).toList();
  }

  /// Submit a new post.
  Future<Post> createPost({
    required String title,
    String? description,
    required String deviceId,
    String? screenContext,
    String? appVersion,
    String? os,
  }) async {
    final response = await _request('POST', 'posts', body: {
      'title': title,
      'device_id': deviceId,
      if (description != null) 'description': description,
      if (screenContext != null) 'screen_context': screenContext,
      if (appVersion != null) 'app_version': appVersion,
      if (os != null) 'os': os,
    });
    _assertSuccess(response);
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return Post.fromJson(data['post']);
  }

  /// Cast a vote.
  Future<void> castVote({required String postId, required String deviceId}) async {
    final response = await _request('POST', 'votes', body: {
      'post_id': postId,
      'device_id': deviceId,
    });
    _assertSuccess(response);
  }

  /// Remove a vote.
  Future<void> removeVote({required String postId, required String deviceId}) async {
    final response = await _request('DELETE', 'votes', body: {
      'post_id': postId,
      'device_id': deviceId,
    });
    _assertSuccess(response);
  }

  /// Register a device (fire-and-forget).
  Future<void> registerDevice() async {
    final deviceId = await DeviceIdManager.getDeviceId();
    await _request('POST', 'devices', body: {
      'device_id': deviceId,
    });
  }

  void _assertSuccess(http.Response response) {
    if (response.statusCode == 429) {
      throw RateLimitException();
    }
    if (response.statusCode >= 400) {
      throw ApiException(response.statusCode, response.body);
    }
  }
}
```

### 5. Data Models (`lib/src/api/models/`)

```dart
// post.dart
class Post {
  final String id;
  final String title;
  final String? description;
  final String status;
  final int voteCount;
  final DateTime createdAt;
  
  // Local-only state (not serialized to/from API)
  bool votedByCurrentDevice;

  Post({
    required this.id,
    required this.title,
    this.description,
    required this.status,
    required this.voteCount,
    required this.createdAt,
    this.votedByCurrentDevice = false,
  });

  factory Post.fromJson(Map<String, dynamic> json) => Post(
    id: json['id'] as String,
    title: json['title'] as String,
    description: json['description'] as String?,
    status: json['status'] as String,
    voteCount: json['vote_count'] as int,
    createdAt: DateTime.parse(json['created_at'] as String),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'description': description,
    'status': status,
    'vote_count': voteCount,
    'created_at': createdAt.toIso8601String(),
  };

  Post copyWith({int? voteCount, bool? votedByCurrentDevice, String? status}) =>
      Post(
        id: id,
        title: title,
        description: description,
        status: status ?? this.status,
        voteCount: voteCount ?? this.voteCount,
        createdAt: createdAt,
        votedByCurrentDevice:
            votedByCurrentDevice ?? this.votedByCurrentDevice,
      );
}
```

```dart
// vote.dart
class Vote {
  final String id;
  final String postId;
  final String deviceId;
  final DateTime createdAt;

  Vote({
    required this.id,
    required this.postId,
    required this.deviceId,
    required this.createdAt,
  });

  factory Vote.fromJson(Map<String, dynamic> json) => Vote(
    id: json['id'] as String,
    postId: json['post_id'] as String,
    deviceId: json['device_id'] as String,
    createdAt: DateTime.parse(json['created_at'] as String),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'post_id': postId,
    'device_id': deviceId,
    'created_at': createdAt.toIso8601String(),
  };
}
```

```dart
// device.dart
class Device {
  final String deviceId;
  final String projectId;
  final String? pushToken;
  final DateTime firstSeen;

  Device({
    required this.deviceId,
    required this.projectId,
    this.pushToken,
    required this.firstSeen,
  });

  factory Device.fromJson(Map<String, dynamic> json) => Device(
    deviceId: json['device_id'] as String,
    projectId: json['project_id'] as String,
    pushToken: json['push_token'] as String?,
    firstSeen: DateTime.parse(json['first_seen'] as String),
  );

  Map<String, dynamic> toJson() => {
    'device_id': deviceId,
    'project_id': projectId,
    'push_token': pushToken,
    'first_seen': firstSeen.toIso8601String(),
  };
}
```

### 6. Cache Manager (`lib/src/cache/cache_manager.dart`)

Implements stale-while-revalidate using a Hive box.

```dart
class CacheManager {
  static const _boardBoxName = 'board_cache';

  /// Read cached posts (returns null if no cache exists).
  static Future<List<Post>?> getCachedBoard() async {
    final box = Hive.box(_boardBoxName);
    final raw = box.get('posts');
    if (raw == null) return null;
    final list = (jsonDecode(raw as String) as List);
    return list.map((j) => Post.fromJson(j as Map<String, dynamic>)).toList();
  }

  /// Persist board data to cache, replacing previous state.
  static Future<void> setCachedBoard(List<Post> posts) async {
    final box = Hive.box(_boardBoxName);
    await box.put('posts', jsonEncode(posts.map((p) => p.toJson()).toList()));
  }

  /// Clear cache.
  static Future<void> clear() async {
    final box = Hive.box(_boardBoxName);
    await box.clear();
  }
}
```

### 7. Sync Queue (`lib/src/cache/sync_queue.dart`)

Persistent FIFO queue for offline operations.

```dart
enum SyncOperationType { vote, unvote, createPost }

class SyncOperation {
  final String id;
  final SyncOperationType type;
  final Map<String, dynamic> payload;
  final DateTime createdAt;

  SyncOperation({
    required this.id,
    required this.type,
    required this.payload,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  factory SyncOperation.fromJson(Map<String, dynamic> json) => SyncOperation(
    id: json['id'] as String,
    type: SyncOperationType.values.byName(json['type'] as String),
    payload: json['payload'] as Map<String, dynamic>,
    createdAt: DateTime.parse(json['created_at'] as String),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'type': type.name,
    'payload': payload,
    'created_at': createdAt.toIso8601String(),
  };
}

class SyncQueue {
  static const _boxName = 'sync_queue';
  static bool _isFlushing = false;

  /// Add an operation to the queue (persisted to Hive).
  static Future<void> enqueue(SyncOperation operation) async {
    final box = Hive.box(_boxName);
    final queue = _readQueue(box);
    queue.add(operation);
    await _writeQueue(box, queue);
  }

  /// Read all pending operations in FIFO order.
  static List<SyncOperation> pending() {
    final box = Hive.box(_boxName);
    return _readQueue(box);
  }

  /// Remove an operation by ID after successful processing or permanent failure.
  static Future<void> remove(String operationId) async {
    final box = Hive.box(_boxName);
    final queue = _readQueue(box);
    queue.removeWhere((op) => op.id == operationId);
    await _writeQueue(box, queue);
  }

  /// Flush all pending operations in FIFO order.
  /// Stops on transient failure; removes on permanent failure.
  static Future<void> flush({
    required Future<void> Function(SyncOperation) executor,
    void Function(SyncOperation)? onPermanentFailure,
  }) async {
    if (_isFlushing) return;
    _isFlushing = true;

    try {
      while (true) {
        final queue = pending();
        if (queue.isEmpty) break;

        final op = queue.first;
        try {
          await executor(op);
          await remove(op.id);
        } on ApiException catch (e) {
          if (e.statusCode >= 400 && e.statusCode < 500 && e.statusCode != 429) {
            // Permanent failure — remove and notify
            await remove(op.id);
            onPermanentFailure?.call(op);
          } else {
            // Transient or rate-limited — stop flushing, retry later
            break;
          }
        } catch (_) {
          // Network error — stop flushing
          break;
        }
      }
    } finally {
      _isFlushing = false;
    }
  }

  static List<SyncOperation> _readQueue(Box box) {
    final raw = box.get('operations');
    if (raw == null) return [];
    final list = jsonDecode(raw as String) as List;
    return list.map((j) => SyncOperation.fromJson(j as Map<String, dynamic>)).toList();
  }

  static Future<void> _writeQueue(Box box, List<SyncOperation> queue) async {
    await box.put('operations', jsonEncode(queue.map((o) => o.toJson()).toList()));
  }
}
```

### 8. Device ID Manager (`lib/src/core/device_id_manager.dart`)

```dart
class DeviceIdManager {
  static const _boxName = 'device_info';
  static const _key = 'device_id';

  /// Ensure a device ID exists. Generates one on first call, persists it.
  static Future<String> ensureDeviceId() async {
    final box = Hive.box(_boxName);
    final existing = box.get(_key) as String?;
    if (existing != null) return existing;

    final newId = const Uuid().v4();
    await box.put(_key, newId);
    return newId;
  }

  /// Get the persisted device ID (must call ensureDeviceId first).
  static Future<String> getDeviceId() async {
    final box = Hive.box(_boxName);
    return box.get(_key) as String;
  }
}
```

### 9. Context Capture Service (`lib/src/core/context_capture.dart`)

```dart
class ContextCapture {
  static String? _appVersion;
  static String? _os;

  /// Load platform info once during init.
  static Future<void> initialize() async {
    final info = await PackageInfo.fromPlatform();
    _appVersion = '${info.version}+${info.buildNumber}';
    _os = '${Platform.operatingSystem} ${Platform.operatingSystemVersion}';
  }

  /// Build context map for post submission.
  /// Returns null if captureContext is disabled.
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
```

### 10. Connectivity Listener (`lib/src/cache/hive_boxes.dart`)

```dart
class HiveBoxes {
  static const boardCache = 'board_cache';
  static const deviceInfo = 'device_info';
  static const syncQueue = 'sync_queue';

  static Future<void> initialize() async {
    await Hive.initFlutter();
    await Future.wait([
      Hive.openBox(boardCache),
      Hive.openBox(deviceInfo),
      Hive.openBox(syncQueue),
    ]);
  }
}
```

The connectivity listener is set up in `BoardController` to trigger sync queue flush on reconnection:

```dart
// Inside BoardController
StreamSubscription<List<ConnectivityResult>>? _connectivitySub;

void _listenConnectivity() {
  _connectivitySub = Connectivity()
      .onConnectivityChanged
      .listen((results) {
    final isOnline = results.any((r) => r != ConnectivityResult.none);
    if (isOnline) {
      SyncQueue.flush(
        executor: _executeSyncOperation,
        onPermanentFailure: _handlePermanentFailure,
      );
    }
  });
}
```

### 11. Board Controller (`lib/src/board/board_controller.dart`)

Simple `ChangeNotifier` — no external state management dependency.

```dart
class BoardController extends ChangeNotifier {
  List<Post> _posts = [];
  String _activeFilter = 'open';
  bool _isLoading = false;
  String? _error;

  List<Post> get filteredPosts => _posts
      .where((p) => p.status == _activeFilter)
      .toList()
    ..sort((a, b) => b.voteCount.compareTo(a.voteCount));

  String get activeFilter => _activeFilter;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadBoard() async {
    // 1. Try cache first
    final cached = await CacheManager.getCachedBoard();
    if (cached != null) {
      _posts = cached;
      notifyListeners();
    } else {
      _isLoading = true;
      notifyListeners();
    }

    // 2. Fetch fresh data
    try {
      final fresh = await ApiClient.instance.fetchBoard();
      _posts = fresh;
      _isLoading = false;
      _error = null;
      await CacheManager.setCachedBoard(fresh);
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      if (_posts.isEmpty) {
        _error = 'Unable to load board. Check your connection.';
      }
      notifyListeners();
    }
  }

  void setFilter(String status) {
    _activeFilter = status;
    notifyListeners();
  }

  Future<void> toggleVote(Post post) async {
    final deviceId = await DeviceIdManager.getDeviceId();
    final index = _posts.indexWhere((p) => p.id == post.id);
    if (index == -1) return;

    if (post.votedByCurrentDevice) {
      // Un-vote (optimistic)
      _posts[index] = post.copyWith(
        voteCount: post.voteCount - 1,
        votedByCurrentDevice: false,
      );
      await SyncQueue.enqueue(SyncOperation(
        id: const Uuid().v4(),
        type: SyncOperationType.unvote,
        payload: {'post_id': post.id, 'device_id': deviceId},
      ));
    } else {
      // Vote (optimistic)
      _posts[index] = post.copyWith(
        voteCount: post.voteCount + 1,
        votedByCurrentDevice: true,
      );
      await SyncQueue.enqueue(SyncOperation(
        id: const Uuid().v4(),
        type: SyncOperationType.vote,
        payload: {'post_id': post.id, 'device_id': deviceId},
      ));
    }

    notifyListeners();
    await CacheManager.setCachedBoard(_posts);

    // Try immediate flush if online
    await SyncQueue.flush(
      executor: _executeSyncOperation,
      onPermanentFailure: _handlePermanentFailure,
    );
  }

  Future<void> submitPost({required String title, String? description}) async {
    final deviceId = await DeviceIdManager.getDeviceId();
    final context = ContextCapture.buildContext(
      captureEnabled: FeaturePoll._config.captureContext,
      currentScreen: FeaturePoll._currentScreen,
    );

    // Optimistic add
    final tempPost = Post(
      id: const Uuid().v4(),
      title: title,
      description: description,
      status: 'open',
      voteCount: 0,
      createdAt: DateTime.now(),
    );
    _posts.insert(0, tempPost);
    notifyListeners();

    try {
      final created = await ApiClient.instance.createPost(
        title: title,
        description: description,
        deviceId: deviceId,
        screenContext: context?['screen_context'],
        appVersion: context?['app_version'],
        os: context?['os'],
      );
      // Replace temp with server response
      final idx = _posts.indexWhere((p) => p.id == tempPost.id);
      if (idx != -1) _posts[idx] = created;
      await CacheManager.setCachedBoard(_posts);
      notifyListeners();
    } on ApiException {
      // Remove optimistic post on permanent failure
      _posts.removeWhere((p) => p.id == tempPost.id);
      notifyListeners();
      rethrow;
    }
  }

  Future<void> _executeSyncOperation(SyncOperation op) async {
    switch (op.type) {
      case SyncOperationType.vote:
        await ApiClient.instance.castVote(
          postId: op.payload['post_id'],
          deviceId: op.payload['device_id'],
        );
      case SyncOperationType.unvote:
        await ApiClient.instance.removeVote(
          postId: op.payload['post_id'],
          deviceId: op.payload['device_id'],
        );
      case SyncOperationType.createPost:
        await ApiClient.instance.createPost(
          title: op.payload['title'],
          description: op.payload['description'],
          deviceId: op.payload['device_id'],
        );
    }
  }

  void _handlePermanentFailure(SyncOperation op) {
    // Revert optimistic vote change
    if (op.type == SyncOperationType.vote) {
      final idx = _posts.indexWhere((p) => p.id == op.payload['post_id']);
      if (idx != -1) {
        _posts[idx] = _posts[idx].copyWith(
          voteCount: _posts[idx].voteCount - 1,
          votedByCurrentDevice: false,
        );
        notifyListeners();
      }
    } else if (op.type == SyncOperationType.unvote) {
      final idx = _posts.indexWhere((p) => p.id == op.payload['post_id']);
      if (idx != -1) {
        _posts[idx] = _posts[idx].copyWith(
          voteCount: _posts[idx].voteCount + 1,
          votedByCurrentDevice: true,
        );
        notifyListeners();
      }
    }
  }

  @override
  void dispose() {
    _connectivitySub?.cancel();
    super.dispose();
  }
}
```

### 12. Board Screen Widget (`lib/src/board/board_screen.dart`)

```dart
class BoardScreen extends StatefulWidget {
  const BoardScreen({super.key});

  @override
  State<BoardScreen> createState() => _BoardScreenState();
}

class _BoardScreenState extends State<BoardScreen> {
  late final BoardController _controller;

  @override
  void initState() {
    super.initState();
    _controller = BoardController();
    _controller.loadBoard();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = FeaturePoll._config.theme ?? Theme.of(context);
    final accent = FeaturePoll._config.accentColor ?? theme.colorScheme.primary;

    return Theme(
      data: theme,
      child: Scaffold(
        appBar: AppBar(title: const Text('Feature Requests')),
        body: ListenableBuilder(
          listenable: _controller,
          builder: (context, _) {
            if (_controller.error != null && _controller.filteredPosts.isEmpty) {
              return _ErrorState(
                message: _controller.error!,
                onRetry: _controller.loadBoard,
              );
            }

            return Column(
              children: [
                StatusTabs(
                  activeFilter: _controller.activeFilter,
                  onChanged: _controller.setFilter,
                ),
                Expanded(
                  child: _controller.isLoading
                      ? const Center(child: CircularProgressIndicator())
                      : RefreshIndicator(
                          onRefresh: _controller.loadBoard,
                          child: _controller.filteredPosts.isEmpty
                              ? const _EmptyState()
                              : ListView.builder(
                                  itemCount: _controller.filteredPosts.length,
                                  itemBuilder: (ctx, i) => PostTile(
                                    post: _controller.filteredPosts[i],
                                    accentColor: accent,
                                    onVote: () => _controller
                                        .toggleVote(_controller.filteredPosts[i]),
                                  ),
                                ),
                        ),
                ),
              ],
            );
          },
        ),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: () => _showSubmitSheet(context),
          label: const Text('Suggest a feature'),
          icon: const Icon(Icons.add),
        ),
      ),
    );
  }

  void _showSubmitSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => SubmitSheet(
        onSubmit: (title, description) async {
          await _controller.submitPost(title: title, description: description);
        },
      ),
    );
  }
}
```

### 13. Submit Sheet (`lib/src/board/submit_sheet.dart`)

```dart
class SubmitSheet extends StatefulWidget {
  final Future<void> Function(String title, String? description) onSubmit;

  const SubmitSheet({super.key, required this.onSubmit});

  @override
  State<SubmitSheet> createState() => _SubmitSheetState();
}

class _SubmitSheetState extends State<SubmitSheet> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  bool _isSubmitting = false;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 16, right: 16, top: 24,
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextFormField(
              controller: _titleController,
              decoration: const InputDecoration(labelText: 'Title *'),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'Title is required' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _descController,
              decoration: const InputDecoration(labelText: 'Description (optional)'),
              maxLines: 3,
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _isSubmitting ? null : _submit,
              child: _isSubmitting
                  ? const SizedBox.square(
                      dimension: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Submit'),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSubmitting = true);
    try {
      await widget.onSubmit(
        _titleController.text.trim(),
        _descController.text.trim().isEmpty ? null : _descController.text.trim(),
      );
      if (mounted) Navigator.of(context).pop();
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to submit. Please try again.')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    super.dispose();
  }
}
```

### 14. Status Tabs (`lib/src/board/status_tabs.dart`)

```dart
class StatusTabs extends StatelessWidget {
  static const _filters = ['open', 'planned', 'in_progress', 'shipped'];
  static const _labels = ['Open', 'Planned', 'In Progress', 'Shipped'];

  final String activeFilter;
  final ValueChanged<String> onChanged;

  const StatusTabs({
    super.key,
    required this.activeFilter,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(
        children: List.generate(_filters.length, (i) {
          final isActive = _filters[i] == activeFilter;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: FilterChip(
              label: Text(_labels[i]),
              selected: isActive,
              onSelected: (_) => onChanged(_filters[i]),
            ),
          );
        }),
      ),
    );
  }
}
```

## Data Models

### Post

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Unique post identifier |
| title | String | Feature request title |
| description | String? | Optional description |
| status | String | One of: open, planned, in_progress, shipped, declined |
| voteCount | int | Denormalized vote count |
| createdAt | DateTime | Creation timestamp |
| votedByCurrentDevice | bool | Local-only flag (not serialized to API) |

### Vote

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Unique vote identifier |
| postId | String (UUID) | Referenced post |
| deviceId | String (UUID) | Voter device |
| createdAt | DateTime | Vote timestamp |

### Device

| Field | Type | Description |
|-------|------|-------------|
| deviceId | String (UUID) | Primary key, locally generated |
| projectId | String (UUID) | Scoped to one project |
| pushToken | String? | For future push notifications |
| firstSeen | DateTime | First registration timestamp |

### SyncOperation

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Unique operation ID for deduplication |
| type | SyncOperationType | vote, unvote, or createPost |
| payload | Map<String, dynamic> | Operation-specific data (post_id, device_id, etc.) |
| createdAt | DateTime | Enqueue timestamp (determines FIFO order) |

### FeaturePollConfig

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| theme | ThemeData? | null | Custom theme override for board UI |
| accentColor | Color? | null | Upvote button and interactive element color |
| captureContext | bool | true | Whether to attach OS/app/screen info to posts |
| baseUrl | String? | null | Override backend URL for testing |

## Data Flow

### Initialization Sequence

1. Developer calls `FeaturePoll.init(publishableKey, config: ...)`
2. Validate key is non-empty → throw `ArgumentError` if invalid
3. Open Hive boxes (board_cache, device_info, sync_queue)
4. Generate/retrieve device UUID from Hive
5. Initialize `ApiClient` singleton with key + base URL
6. Initialize `ContextCapture` (load platform info)
7. Fire-and-forget POST /devices to register device
8. Set `_initialized = true`

### Board Load Sequence (Stale-While-Revalidate)

1. `openBoard()` → push `BoardScreen` → create `BoardController`
2. `loadBoard()` reads Hive cache
3. If cache exists: render immediately, no spinner
4. If no cache: show `CircularProgressIndicator`
5. Fetch GET /board in background
6. On success: update posts, persist to cache, notify UI
7. On failure with empty cache: show error + retry button

### Vote Sequence (Optimistic + Queue)

1. User taps upvote → `toggleVote(post)` called
2. Immediately update local state (increment/decrement vote count)
3. Enqueue `SyncOperation` to Hive-backed sync queue
4. Attempt immediate flush (if online)
5. If flush succeeds: operation removed from queue
6. If permanent failure (4xx): remove from queue, revert UI
7. If transient failure: leave in queue for retry on connectivity change

### Connectivity Recovery

1. `Connectivity().onConnectivityChanged` fires with non-none result
2. `SyncQueue.flush()` processes operations in FIFO order
3. Each operation is executed and removed on success
4. On permanent failure: remove + revert
5. On transient failure: stop processing, wait for next connectivity event

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Empty/null publishable key | `ArgumentError` thrown synchronously |
| `openBoard` before `init` | `StateError` thrown synchronously |
| HTTP 5xx / timeout | Retry up to 3× with exponential backoff (1s, 2s, 4s) |
| HTTP 4xx (not 429) | No retry, return error, revert optimistic UI if queued |
| HTTP 429 | Enqueue to sync queue, retry on next flush |
| No network + no cache | Display error state with retry button |
| No network + cache exists | Serve from cache, queue writes for later |
| Device registration failure | Silent retry on next successful network call |

## pubspec.yaml

```yaml
name: feature_poll
description: Native feature-voting board for Flutter apps. 3-line integration.
version: 0.1.0
homepage: https://featurepoll.com
repository: https://github.com/featurepoll/feature_poll

environment:
  sdk: '>=3.3.0 <4.0.0'
  flutter: '>=3.19.0'

dependencies:
  flutter:
    sdk: flutter
  http: ^1.2.0
  hive_ce: ^2.6.0
  hive_ce_flutter: ^2.1.0
  uuid: ^4.3.0
  package_info_plus: ^8.0.0
  connectivity_plus: ^6.0.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^4.0.0
  mocktail: ^1.0.0

flutter:
```

## Theming Approach

The SDK resolves theme in this order:
1. If `FeaturePollConfig.theme` is provided → use it as the board's `ThemeData`
2. Otherwise → inherit from `Theme.of(context)` (host app's theme)
3. If `FeaturePollConfig.accentColor` is set → override the upvote button color and primary interactive elements regardless of theme source

All widgets use Material 3 design tokens (`Theme.of(context).colorScheme`, `Theme.of(context).textTheme`) rather than hardcoded colors or styles. This ensures correct rendering in both light and dark mode.

Shipped posts get a distinct visual style via a `Container` decoration with the `surfaceVariant` color and a checkmark icon.

## Testing Strategy

**Unit Tests** (example-based):
- Initialization validation (empty key, pre-init openBoard)
- Cache hit/miss UI states (spinner vs cached render)
- Empty board state display
- Submit sheet validation
- Connectivity event triggers flush
- Device registration fire-and-forget behavior
- Default filter tab selection
- Pull-to-refresh triggering API call

**Property Tests** (100+ iterations each):
- Model serialization round-trips (Post, Vote, Device, SyncOperation)
- Sync queue FIFO ordering across random operation sequences
- Vote toggle correctness for random vote counts
- Context capture conditional inclusion across random configs
- Filter + sort invariant across random post lists
- API client header attachment across random keys
- Empty/whitespace title validation across random whitespace strings

**Integration Tests** (with mock HTTP client):
- Full board load flow (cache → API → update)
- Optimistic vote → queue → flush → success
- Optimistic vote → queue → flush → permanent failure → revert
- Offline → online connectivity transition triggers flush

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Invalid key rejection

*For any* string that is empty or composed entirely of whitespace, calling `FeaturePoll.init()` with that string SHALL throw an `ArgumentError`.

**Validates: Requirements 1.5**

### Property 2: Publishable key header attachment

*For any* non-empty publishable key used to initialize the SDK, every HTTP request made by the API client SHALL contain an `x-publishable-key` header with that exact key value.

**Validates: Requirements 1.4, 2.1**

### Property 3: Model JSON serialization round-trip

*For any* valid `Post`, `Vote`, or `Device` object, serializing it to JSON via `toJson()` and deserializing it back via `fromJson()` SHALL produce an object with equivalent field values.

**Validates: Requirements 2.2**

### Property 4: Transient error retry with backoff

*For any* HTTP request that receives a 5xx response or times out, the API client SHALL retry up to 3 times. If the Nth attempt (N ≤ 3) succeeds, the successful response SHALL be returned. If all 3 retries fail, the error SHALL propagate to the caller.

**Validates: Requirements 2.3**

### Property 5: No retry on client errors

*For any* HTTP response with a 4xx status code (excluding 429), the API client SHALL not retry and SHALL immediately return the error to the caller.

**Validates: Requirements 2.4**

### Property 6: Device ID persistence idempotence

*For any* sequence of calls to `DeviceIdManager.ensureDeviceId()`, all calls after the first SHALL return the same UUID that was generated on the first call.

**Validates: Requirements 3.2**

### Property 7: Board cache write-read round-trip

*For any* list of `Post` objects written to the cache via `setCachedBoard()`, reading back via `getCachedBoard()` SHALL return a list with equivalent posts in the same order.

**Validates: Requirements 3.6**

### Property 8: Vote toggle correctness

*For any* post with vote count N that is not yet voted by the current device, toggling the vote SHALL produce a displayed count of N+1 and mark it as voted. For any post with vote count N that is already voted, toggling the vote SHALL produce a displayed count of N-1 and mark it as not voted.

**Validates: Requirements 4.1, 4.2**

### Property 9: Vote action enqueues sync operation

*For any* vote or un-vote toggle action, exactly one `SyncOperation` with the corresponding type (vote/unvote) and correct post_id/device_id payload SHALL be added to the sync queue.

**Validates: Requirements 4.3**

### Property 10: Sync queue FIFO ordering

*For any* sequence of N enqueued operations, flushing the sync queue SHALL process them in the exact order they were enqueued (first-in, first-out).

**Validates: Requirements 4.4**

### Property 11: Permanent failure reverts optimistic state

*For any* queued sync operation that receives a permanent failure (HTTP 4xx excluding 429), the operation SHALL be removed from the queue and the corresponding optimistic UI change SHALL be reverted (vote count restored, voted state toggled back).

**Validates: Requirements 4.5**

### Property 12: Sync queue persistence round-trip

*For any* list of `SyncOperation` objects persisted to the sync queue Hive box, reading the queue back after a simulated restart SHALL return the same operations in the same order.

**Validates: Requirements 4.6**

### Property 13: Context capture conditional inclusion

*For any* post submission: if `captureContext` is `true` and a screen name is set, the outgoing payload SHALL include `os`, `app_version`, and `screen_context` fields. If `captureContext` is `false`, the outgoing payload SHALL omit all three fields regardless of whether a screen name is set.

**Validates: Requirements 5.3, 5.4, 5.5**

### Property 14: No PII in payloads

*For any* outgoing API request payload, the only identity field present SHALL be `device_id` (a UUID). No email, name, phone, IP address, or other personally identifiable information SHALL be included.

**Validates: Requirements 5.6**

### Property 15: Post list filtering and sorting

*For any* list of posts with mixed statuses and any selected status filter, the displayed list SHALL contain only posts matching that status, and those posts SHALL be sorted by `vote_count` in descending order.

**Validates: Requirements 7.1, 9.2, 9.3**

### Property 16: Post rendering completeness

*For any* post displayed on the board, the rendered widget tree SHALL contain the post's title text, its vote count as a string, and a tappable upvote button widget.

**Validates: Requirements 7.2**

### Property 17: Empty title validation

*For any* string that is empty or composed entirely of whitespace, attempting to submit a feature request with that string as the title SHALL be rejected with a validation error and SHALL not add a post to the list.

**Validates: Requirements 8.3**

### Property 18: Valid submission produces correct payload

*For any* valid (non-empty, non-whitespace) title and optional description, submitting a feature request SHALL produce an outgoing POST /posts request containing `title`, `device_id`, and (if context capture is enabled) `screen_context`, `app_version`, and `os` fields.

**Validates: Requirements 8.4, 8.5**

### Property 19: Failed submission rollback

*For any* optimistically-added post whose submission receives a permanent server failure (4xx), the post SHALL be removed from the displayed list.

**Validates: Requirements 8.6**

### Property 20: Theme resolution

*For any* board instance: if `FeaturePollConfig.theme` is provided, the board widget tree SHALL use that theme; otherwise it SHALL use the host app's `Theme.of(context)`.

**Validates: Requirements 10.1, 10.2**

### Property 21: Accent color application

*For any* `FeaturePollConfig.accentColor` value, the upvote button and primary interactive elements SHALL render using that exact color.

**Validates: Requirements 10.5**
