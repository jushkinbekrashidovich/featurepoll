/// Exception thrown when the FeaturePoll API returns an error response.
class ApiException implements Exception {
  /// The HTTP status code of the response.
  final int statusCode;

  /// The raw response body.
  final String body;

  /// Creates an [ApiException].
  const ApiException(this.statusCode, this.body);

  @override
  String toString() => 'ApiException($statusCode): $body';
}

/// Exception thrown when the API returns HTTP 429 (rate limit exceeded).
class RateLimitException extends ApiException {
  /// Creates a [RateLimitException].
  const RateLimitException() : super(429, 'Rate limit exceeded');
}
