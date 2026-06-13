import 'package:flutter/material.dart';

/// Horizontal filter chips for board status filtering.
class StatusTabs extends StatelessWidget {
  static const _filters = ['open', 'planned', 'in_progress', 'shipped'];
  static const _labels = ['Open', 'Planned', 'In Progress', 'Shipped'];

  final String activeFilter;
  final ValueChanged<String> onChanged;

  const StatusTabs({
    super.key,
    required this.activeFilter,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(
        children: List.generate(_filters.length, (i) {
          final isActive = _filters[i] == activeFilter;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: FilterChip(
              label: Text(_labels[i]),
              selected: isActive,
              onSelected: (_) => onChanged(_filters[i]),
            ),
          );
        }),
      ),
    );
  }
}
