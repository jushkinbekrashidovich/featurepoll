import 'package:hive_ce/hive.dart';
import 'package:uuid/uuid.dart';

import '../cache/hive_boxes.dart';

/// Manages the anonymous device identifier.
///
/// Generates a v4 UUID on first launch and persists it across sessions.
class DeviceIdManager {
  DeviceIdManager._();

  static const _key = 'device_id';

  /// Ensure a device ID exists. Generates one on first call, persists it.
  /// Returns the device ID.
  static Future<String> ensureDeviceId() async {
    final box = Hive.box(HiveBoxes.deviceInfo);
    final existing = box.get(_key) as String?;
    if (existing != null) return existing;

    final newId = const Uuid().v4();
    await box.put(_key, newId);
    return newId;
  }

  /// Get the persisted device ID.
  /// Must call [ensureDeviceId] first (during init).
  static String getDeviceId() {
    final box = Hive.box(HiveBoxes.deviceInfo);
    return box.get(_key) as String;
  }
}
