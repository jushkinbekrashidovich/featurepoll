import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../core/device_id_manager.dart';
import 'api_exceptions.dart';
import 'models/post.dart';

/// Single HTTP client instance with retry logic, header injection, and typed
/// responses. Communicates with the FeaturePoll backend using a publishable key.
class ApiClient {
  static ApiClient? _instance;

  /// Returns the initialized [ApiClient] instance.
  /// Throws [StateError] if [initialize] has not been called.
  static ApiClient get instance {
    if (_instance == null) {
      throw StateError(
        'ApiClient.initialize() must be called before accessing instance.',
      );
    }
    return _instance!;
  }

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

  /// Initialize the global [ApiClient] singleton.
  ///
  /// [publishableKey] is attached to every outgoing request.
  /// [baseUrl] overrides the default FeaturePoll backend URL (useful for tests).
  /// [httpClient] allows injecting a mock client for testing.
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

  /// Execute a request with retry logic for transient errors (5xx / timeout).
  ///
  /// Retries up to [_maxRetries] times with exponential backoff (1s, 2s, 4s).
  /// Does NOT retry on 4xx errors.
  Future<http.Response> _request(
    String method,
    String path, {
    Map<String, dynamic>? body,
    Map<String, String>? queryParams,
  }) async {
    final uri =
        Uri.parse('$_baseUrl/$path').replace(queryParameters: queryParams);
    int attempt = 0;

    while (true) {
      attempt++;
      try {
        final http.Response response;
        switch (method) {
          case 'GET':
            response =
                await _httpClient.get(uri, headers: _headers).timeout(_timeout);
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
        if (attempt >= _maxRetries) rethrow;
        await Future.delayed(Duration(seconds: 1 << (attempt - 1)));
      }
    }
  }

  /// Fetch board posts with pagination.
  Future<List<Post>> fetchBoard({int page = 1, int pageSize = 20}) async {
    final response = await _request('GET', 'board', queryParams: {
      'page': '$page',
      'page_size': '$pageSize',
    });
    _assertSuccess(response);
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return (data['posts'] as List)
        .map((j) => Post.fromJson(j as Map<String, dynamic>))
        .toList();
  }

  /// Submit a new feature request post.
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
    return Post.fromJson(data['post'] as Map<String, dynamic>);
  }

  /// Cast a vote on a post.
  Future<void> castVote({
    required String postId,
    required String deviceId,
  }) async {
    final response = await _request('POST', 'votes', body: {
      'post_id': postId,
      'device_id': deviceId,
    });
    _assertSuccess(response);
  }

  /// Remove a vote from a post.
  Future<void> removeVote({
    required String postId,
    required String deviceId,
  }) async {
    final response = await _request('DELETE', 'votes', body: {
      'post_id': postId,
      'device_id': deviceId,
    });
    _assertSuccess(response);
  }

  /// Register the current device with the backend (fire-and-forget).
  Future<void> registerDevice() async {
    final deviceId = DeviceIdManager.getDeviceId();
    await _request('POST', 'devices', body: {
      'device_id': deviceId,
    });
  }

  /// Throws typed exceptions for error status codes.
  void _assertSuccess(http.Response response) {
    if (response.statusCode == 429) {
      throw const RateLimitException();
    }
    if (response.statusCode >= 400) {
      throw ApiException(response.statusCode, response.body);
    }
  }
}
