import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';

import '../api/api_client.dart';
import '../api/api_exceptions.dart';
import '../api/models/post.dart';
import '../cache/cache_manager.dart';
import '../cache/sync_queue.dart';
import '../core/context_capture.dart';
import '../core/device_id_manager.dart';
import '../core/feature_poll_main.dart';

/// Manages board state including posts, filtering, loading, and offline sync.
///
/// Uses [ChangeNotifier] for simple reactive state — no external state
/// management dependency required.
class BoardController extends ChangeNotifier {
  List<Post> _posts = [];
  String _activeFilter = 'all';
  bool _isLoading = false;
  String? _error;

  StreamSubscription<List<ConnectivityResult>>? _connectivitySub;

  /// Creates a [BoardController] and starts listening for connectivity changes.
  BoardController() {
    _listenConnectivity();
  }

  /// Posts filtered by [activeFilter] and sorted by vote count descending.
  List<Post> get filteredPosts {
    final posts = _activeFilter == 'all'
        ? _posts.toList()
        : _posts.where((p) => p.status == _activeFilter).toList();
    posts.sort((a, b) => b.voteCount.compareTo(a.voteCount));
    return posts;
  }

  /// The currently active status filter (e.g. 'open', 'planned').
  String get activeFilter => _activeFilter;

  /// Whether the board is performing an initial load (no cached data).
  bool get isLoading => _isLoading;

  /// User-facing error message, or null if no error.
  String? get error => _error;

  /// Load the board using stale-while-revalidate: show cache immediately,
  /// then refresh from the API in the background.
  Future<void> loadBoard() async {
    // 1. Try cache first
    final cached = CacheManager.getCachedBoard();
    if (cached != null) {
      _posts = cached;
      notifyListeners();
    } else {
      _isLoading = true;
      notifyListeners();
    }

    // 2. Fetch fresh data from API
    try {
      final fresh = await ApiClient.instance.fetchBoard(
        deviceId: DeviceIdManager.getDeviceId(),
      );
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

  /// Change the active status filter tab.
  void setFilter(String status) {
    _activeFilter = status;
    notifyListeners();
  }

  /// Toggle the current device's vote on a post (optimistic update).
  ///
  /// Updates UI immediately, enqueues the operation to the sync queue,
  /// and attempts an immediate flush.
  Future<void> toggleVote(Post post) async {
    final deviceId = DeviceIdManager.getDeviceId();
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

  /// Submit a new feature request with optimistic add.
  ///
  /// Inserts a temporary post immediately, calls the API, and replaces
  /// the temp post with the server response on success. Removes the
  /// temp post and rethrows on failure.
  Future<void> submitPost({
    required String title,
    String? description,
  }) async {
    final deviceId = DeviceIdManager.getDeviceId();
    final context = ContextCapture.buildContext(
      captureEnabled: FeaturePoll.config.captureContext,
      currentScreen: FeaturePoll.currentScreen,
    );

    // Optimistic add with a temporary ID
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

  /// Execute a single sync operation by calling the appropriate API method.
  Future<void> _executeSyncOperation(SyncOperation op) async {
    switch (op.type) {
      case SyncOperationType.vote:
        await ApiClient.instance.castVote(
          postId: op.payload['post_id'] as String,
          deviceId: op.payload['device_id'] as String,
        );
      case SyncOperationType.unvote:
        await ApiClient.instance.removeVote(
          postId: op.payload['post_id'] as String,
          deviceId: op.payload['device_id'] as String,
        );
      case SyncOperationType.createPost:
        await ApiClient.instance.createPost(
          title: op.payload['title'] as String,
          description: op.payload['description'] as String?,
          deviceId: op.payload['device_id'] as String,
        );
    }
  }

  /// Revert optimistic state when the sync queue reports a permanent failure.
  void _handlePermanentFailure(SyncOperation op) {
    if (op.type == SyncOperationType.vote) {
      final idx = _posts.indexWhere(
        (p) => p.id == op.payload['post_id'],
      );
      if (idx != -1) {
        _posts[idx] = _posts[idx].copyWith(
          voteCount: _posts[idx].voteCount - 1,
          votedByCurrentDevice: false,
        );
        notifyListeners();
      }
    } else if (op.type == SyncOperationType.unvote) {
      final idx = _posts.indexWhere(
        (p) => p.id == op.payload['post_id'],
      );
      if (idx != -1) {
        _posts[idx] = _posts[idx].copyWith(
          voteCount: _posts[idx].voteCount + 1,
          votedByCurrentDevice: true,
        );
        notifyListeners();
      }
    }
  }

  /// Listen for connectivity changes and flush the sync queue on reconnection.
  void _listenConnectivity() {
    _connectivitySub = Connectivity()
        .onConnectivityChanged
        .listen((List<ConnectivityResult> results) {
      final isOnline = results.any((r) => r != ConnectivityResult.none);
      if (isOnline) {
        SyncQueue.flush(
          executor: _executeSyncOperation,
          onPermanentFailure: _handlePermanentFailure,
        );
      }
    });
  }

  @override
  void dispose() {
    _connectivitySub?.cancel();
    super.dispose();
  }
}
