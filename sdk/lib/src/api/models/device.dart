/// Data model representing a registered device.
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
