import 'dart:convert';

import 'package:hive_ce/hive.dart';

import '../api/models/post.dart';
import 'hive_boxes.dart';

/// Manages cached board data using a stale-while-revalidate pattern.
class CacheManager {
  CacheManager._();

  /// Read cached posts. Returns null if no cache exists.
  static List<Post>? getCachedBoard() {
    final box = Hive.box(HiveBoxes.boardCache);
    final raw = box.get('posts') as String?;
    if (raw == null) return null;
    final list = jsonDecode(raw) as List;
    return list.map((j) => Post.fromJson(j as Map<String, dynamic>)).toList();
  }

  /// Persist board data to cache, replacing previous state.
  static Future<void> setCachedBoard(List<Post> posts) async {
    final box = Hive.box(HiveBoxes.boardCache);
    await box.put(
      'posts',
      jsonEncode(posts.map((p) => p.toJson()).toList()),
    );
  }

  /// Clear the board cache.
  static Future<void> clear() async {
    final box = Hive.box(HiveBoxes.boardCache);
    await box.clear();
  }
}
