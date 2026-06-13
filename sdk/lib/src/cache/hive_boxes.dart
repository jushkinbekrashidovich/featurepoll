import 'package:hive_ce_flutter/hive_flutter.dart';

/// Constants and initialization for all Hive boxes used by the SDK.
class HiveBoxes {
  HiveBoxes._();

  /// Board posts cache box name.
  static const boardCache = 'board_cache';

  /// Device identity storage box name.
  static const deviceInfo = 'device_info';

  /// Offline sync queue box name.
  static const syncQueue = 'sync_queue';

  /// Initialize Hive and open all required boxes.
  static Future<void> initialize() async {
    await Hive.initFlutter();
    await Future.wait([
      Hive.openBox(boardCache),
      Hive.openBox(deviceInfo),
      Hive.openBox(syncQueue),
    ]);
  }
}
