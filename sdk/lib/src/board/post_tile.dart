import 'package:flutter/material.dart';

import '../api/models/post.dart';

/// A single post card in the board list.
class PostTile extends StatefulWidget {
  final Post post;
  final Color accentColor;
  final VoidCallback onVote;

  const PostTile({
    super.key,
    required this.post,
    required this.accentColor,
    required this.onVote,
  });

  @override
  State<PostTile> createState() => _PostTileState();
}

class _PostTileState extends State<PostTile>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.3).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  void _handleVote() {
    _animController.forward().then((_) => _animController.reverse());
    widget.onVote();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isShipped = widget.post.status == 'shipped';
    final isVoted = widget.post.votedByCurrentDevice;

    return Card(
      color: isShipped ? theme.colorScheme.surfaceContainerHighest : null,
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            // Vote button with scale animation
            GestureDetector(
              onTap: _handleVote,
              child: ScaleTransition(
                scale: _scaleAnimation,
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: isVoted
                        ? widget.accentColor.withValues(alpha: 0.1)
                        : theme.colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    children: [
                      Icon(
                        Icons.arrow_upward_rounded,
                        size: 18,
                        color: isVoted
                            ? widget.accentColor
                            : theme.colorScheme.onSurfaceVariant,
                      ),
                      Text(
                        '${widget.post.voteCount}',
                        style: theme.textTheme.labelMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: isVoted
                              ? widget.accentColor
                              : theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            // Title and shipped status
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.post.title,
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w500,
                      decoration: isShipped ? TextDecoration.lineThrough : null,
                    ),
                  ),
                  if (isShipped)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Row(
                        children: [
                          Icon(
                            Icons.check_circle,
                            size: 14,
                            color: theme.colorScheme.primary,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            'Shipped',
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: theme.colorScheme.primary,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
