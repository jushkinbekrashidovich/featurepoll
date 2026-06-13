/// Data model representing a vote on a post.
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
