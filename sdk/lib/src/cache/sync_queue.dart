import 'dart:convert';

import 'package:hive_ce/hive.dart';

import '../api/api_exceptions.dart';
import 'hive_boxes.dart';

/// The type of operation stored in the sync queue.
enum SyncOperationType { vote, unvote, createPost }

/// A single pending network operation to be flushed when online.
class SyncOperation {
  /// Unique identifier for this operation.
  final String id;

  /// The type of operation (vote, unvote, or createPost).
  final SyncOperationType type;

  /// JSON-serializable payload containing the operation data.
  final Map<String, dynamic> payload;

  /// When this operation was enqueued.
  final DateTime createdAt;

  /// Creates a [SyncOperation].
  SyncOperation({
    required this.id,
    required this.type,
    required this.payload,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  /// Deserializes a [SyncOperation] from JSON.
  factory SyncOperation.fromJson(Map<String, dynamic> json) => SyncOperation(
        id: json['id'] as String,
        type: SyncOperationType.values.byName(json['type'] as String),
        payload: json['payload'] as Map<String, dynamic>,
        createdAt: DateTime.parse(json['created_at'] as String),
      );

  /// Serializes this [SyncOperation] to JSON.
  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type.name,
        'payload': payload,
        'created_at': createdAt.toIso8601String(),
      };
}

/// Persistent FIFO queue for offline operations.
///
/// Operations are stored in a Hive box as a JSON-encoded list and
/// processed in order when connectivity is available.
class SyncQueue {
  SyncQueue._();

  static bool _isFlushing = false;

  /// Add an operation to the queue (persisted to Hive).
  static Future<void> enqueue(SyncOperation operation) async {
    final box = Hive.box(HiveBoxes.syncQueue);
    final queue = _readQueue(box);
    queue.add(operation);
    await _writeQueue(box, queue);
  }

  /// Read all pending operations in FIFO order.
  static List<SyncOperation> pending() {
    final box = Hive.box(HiveBoxes.syncQueue);
    return _readQueue(box);
  }

  /// Remove an operation by ID after successful processing or permanent failure.
  static Future<void> remove(String operationId) async {
    final box = Hive.box(HiveBoxes.syncQueue);
    final queue = _readQueue(box);
    queue.removeWhere((op) => op.id == operationId);
    await _writeQueue(box, queue);
  }

  /// Flush all pending operations in FIFO order.
  ///
  /// [executor] processes each operation (typically calls the API).
  /// [onPermanentFailure] is called when an operation fails with a
  /// non-retryable error (HTTP 4xx excluding 429).
  ///
  /// Stops flushing on transient failure (5xx, 429, network error)
  /// so the queue can be retried later. Removes and notifies on
  /// permanent failure (4xx excluding 429).
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
          if (e.statusCode >= 400 &&
              e.statusCode < 500 &&
              e.statusCode != 429) {
            // Permanent failure — remove and notify
            await remove(op.id);
            onPermanentFailure?.call(op);
          } else {
            // Transient or rate-limited — stop flushing, retry later
            break;
          }
        } catch (_) {
          // Network error or other — stop flushing
          break;
        }
      }
    } finally {
      _isFlushing = false;
    }
  }

  static List<SyncOperation> _readQueue(Box box) {
    final raw = box.get('operations') as String?;
    if (raw == null) return [];
    final list = jsonDecode(raw) as List;
    return list
        .map((j) => SyncOperation.fromJson(j as Map<String, dynamic>))
        .toList();
  }

  static Future<void> _writeQueue(
    Box box,
    List<SyncOperation> queue,
  ) async {
    await box.put(
      'operations',
      jsonEncode(queue.map((o) => o.toJson()).toList()),
    );
  }
}
