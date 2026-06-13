/// Data model representing a feature request post.
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

  Post copyWith({
    int? voteCount,
    bool? votedByCurrentDevice,
    String? status,
  }) =>
      Post(
        id: id,
        title: title,
        description: description,
        status: status ?? this.status,
        voteCount: voteCount ?? this.voteCount,
        createdAt: createdAt,
        votedByCurrentDevice: votedByCurrentDevice ?? this.votedByCurrentDevice,
      );
}
