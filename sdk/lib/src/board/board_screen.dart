import 'package:flutter/material.dart';

import '../core/feature_poll_main.dart';
import 'board_controller.dart';

/// Full-screen board widget displaying feature requests.
class BoardScreen extends StatefulWidget {
  const BoardScreen({super.key});

  @override
  State<BoardScreen> createState() => _BoardScreenState();
}

class _BoardScreenState extends State<BoardScreen> {
  late final BoardController _controller;
  String _sortBy = 'Top';
  bool _showSortFilter = false;

  @override
  void initState() {
    super.initState();
    _controller = BoardController();
    _controller.loadBoard();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = FeaturePoll.config.theme ?? Theme.of(context);
    final accent = FeaturePoll.config.accentColor ?? theme.colorScheme.primary;

    return Theme(
      data: theme,
      child: Scaffold(
        backgroundColor: Colors.grey[50],
        appBar: AppBar(
          title: const Text('Feature Requests'),
          centerTitle: true,
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text('Done', style: TextStyle(color: accent)),
            ),
          ],
        ),
        body: ListenableBuilder(
          listenable: _controller,
          builder: (context, _) {
            if (_controller.error != null &&
                _controller.filteredPosts.isEmpty) {
              return _ErrorState(
                message: _controller.error!,
                onRetry: _controller.loadBoard,
              );
            }

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
                  child: Text(
                    'Feature Requests',
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),

                // Toolbar: Sort dropdown + search + notification + add button
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(
                    children: [
                      // Sort dropdown
                      GestureDetector(
                        onTap: () =>
                            setState(() => _showSortFilter = !_showSortFilter),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.grey.shade300),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(_sortBy,
                                  style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w500)),
                              const SizedBox(width: 4),
                              const Icon(Icons.keyboard_arrow_down, size: 18),
                            ],
                          ),
                        ),
                      ),
                      const Spacer(),
                      // Search icon
                      IconButton(
                        onPressed: () {},
                        icon: const Icon(Icons.search, size: 22),
                        style: IconButton.styleFrom(
                          side: BorderSide(color: Colors.grey.shade300),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8)),
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Notification icon
                      IconButton(
                        onPressed: () {},
                        icon:
                            const Icon(Icons.notifications_outlined, size: 22),
                        style: IconButton.styleFrom(
                          side: BorderSide(color: Colors.grey.shade300),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8)),
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Add button
                      IconButton(
                        onPressed: () => _showCreatePost(context),
                        icon: const Icon(Icons.add,
                            color: Colors.white, size: 22),
                        style: IconButton.styleFrom(
                          backgroundColor: accent,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8)),
                        ),
                      ),
                    ],
                  ),
                ),

                // Sort/Filter dropdown overlay
                if (_showSortFilter)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                              color: Colors.black.withValues(alpha: 0.1),
                              blurRadius: 12,
                              offset: const Offset(0, 4)),
                        ],
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Sort
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('SORT',
                                      style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w600,
                                          color: Colors.grey[600])),
                                  const SizedBox(height: 8),
                                  ...[
                                    'Top',
                                    'All'
                                  ].map((sort) => GestureDetector(
                                        onTap: () => setState(() {
                                          _sortBy = sort;
                                          _showSortFilter = false;
                                        }),
                                        child: Padding(
                                          padding: const EdgeInsets.symmetric(
                                              vertical: 6),
                                          child: Row(
                                            children: [
                                              if (_sortBy == sort)
                                                Container(
                                                    width: 6,
                                                    height: 6,
                                                    decoration: BoxDecoration(
                                                        color: accent,
                                                        shape:
                                                            BoxShape.circle)),
                                              if (_sortBy == sort)
                                                const SizedBox(width: 8),
                                              Text(sort,
                                                  style: TextStyle(
                                                      fontSize: 14,
                                                      fontWeight: _sortBy ==
                                                              sort
                                                          ? FontWeight.w600
                                                          : FontWeight.w400)),
                                            ],
                                          ),
                                        ),
                                      )),
                                ],
                              ),
                            ),
                          ),
                          // Filter
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('FILTER',
                                      style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w600,
                                          color: Colors.grey[600])),
                                  const SizedBox(height: 8),
                                  ...[
                                    ('open', 'Pending'),
                                    ('planned', 'Approved'),
                                    ('in_progress', 'In Progress'),
                                    ('shipped', 'Done'),
                                    ('declined', 'Rejected'),
                                  ].map((entry) => GestureDetector(
                                        onTap: () {
                                          _controller.setFilter(entry.$1);
                                          setState(
                                              () => _showSortFilter = false);
                                        },
                                        child: Padding(
                                          padding: const EdgeInsets.symmetric(
                                              vertical: 6),
                                          child: Text(entry.$2,
                                              style: TextStyle(
                                                fontSize: 14,
                                                fontWeight:
                                                    _controller.activeFilter ==
                                                            entry.$1
                                                        ? FontWeight.w600
                                                        : FontWeight.w400,
                                              )),
                                        ),
                                      )),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                const SizedBox(height: 12),

                // Post list
                Expanded(
                  child: _controller.isLoading
                      ? const Center(child: CircularProgressIndicator())
                      : RefreshIndicator(
                          onRefresh: _controller.loadBoard,
                          child: _controller.filteredPosts.isEmpty
                              ? const _EmptyState()
                              : ListView.builder(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 20),
                                  itemCount: _controller.filteredPosts.length,
                                  itemBuilder: (ctx, i) {
                                    final post = _controller.filteredPosts[i];
                                    return Container(
                                      margin: const EdgeInsets.only(bottom: 8),
                                      decoration: BoxDecoration(
                                        border: Border.all(
                                            color: Colors.grey.shade200),
                                        borderRadius: BorderRadius.circular(12),
                                        color: Colors.white,
                                      ),
                                      child: _PostListTile(
                                        title: post.title,
                                        description: post.description,
                                        voteCount: post.voteCount,
                                        status: post.status,
                                        isVoted: post.votedByCurrentDevice,
                                        accentColor: accent,
                                        onVote: () =>
                                            _controller.toggleVote(post),
                                      ),
                                    );
                                  },
                                ),
                        ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  void _showCreatePost(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => _CreatePostPage(
          onSubmit: (title, description) async {
            await _controller.submitPost(
                title: title, description: description);
          },
        ),
      ),
    );
  }
}

/// A single post in the list — matches the reference screenshot design.
class _PostListTile extends StatelessWidget {
  final String title;
  final String? description;
  final int voteCount;
  final String status;
  final bool isVoted;
  final Color accentColor;
  final VoidCallback onVote;

  const _PostListTile({
    required this.title,
    this.description,
    required this.voteCount,
    required this.status,
    required this.isVoted,
    required this.accentColor,
    required this.onVote,
  });

  String get _statusLabel {
    switch (status) {
      case 'planned':
        return 'Approved';
      case 'in_progress':
        return 'In Progress';
      case 'shipped':
        return 'Done';
      case 'declined':
        return 'Rejected';
      default:
        return 'Pending';
    }
  }

  Color get _statusColor {
    switch (status) {
      case 'planned':
        return Colors.blue;
      case 'in_progress':
        return Colors.orange;
      case 'shipped':
        return Colors.green;
      case 'declined':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Content (title + description + meta)
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                      fontSize: 15, fontWeight: FontWeight.w600),
                ),
                if (description != null && description!.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    description!,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                        fontSize: 13, color: Colors.grey[600], height: 1.4),
                  ),
                ],
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(Icons.chat_bubble_outline,
                        size: 14, color: Colors.grey[400]),
                    const SizedBox(width: 4),
                    Text('0',
                        style:
                            TextStyle(fontSize: 12, color: Colors.grey[500])),
                    const SizedBox(width: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: _statusColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        _statusLabel,
                        style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: _statusColor),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(width: 12),

          // Vote button (right side)
          GestureDetector(
            onTap: onVote,
            child: Container(
              width: 48,
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                border: Border.all(
                    color: isVoted ? accentColor : Colors.grey.shade300),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                children: [
                  Icon(
                    Icons.keyboard_arrow_up,
                    size: 20,
                    color: isVoted ? accentColor : Colors.grey[500],
                  ),
                  Text(
                    '$voteCount',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: isVoted ? accentColor : Colors.grey[700],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Full-page create post screen matching the reference screenshot.
class _CreatePostPage extends StatefulWidget {
  final Future<void> Function(String title, String? description) onSubmit;

  const _CreatePostPage({required this.onSubmit});

  @override
  State<_CreatePostPage> createState() => _CreatePostPageState();
}

class _CreatePostPageState extends State<_CreatePostPage> {
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final title = _titleController.text.trim();
    if (title.isEmpty) return;

    setState(() => _submitting = true);
    try {
      await widget.onSubmit(
          title,
          _descController.text.trim().isEmpty
              ? null
              : _descController.text.trim());
      if (mounted) Navigator.of(context).pop();
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to create post')),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final accent =
        FeaturePoll.config.accentColor ?? Theme.of(context).colorScheme.primary;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Feature Requests'),
        centerTitle: true,
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text('Done', style: TextStyle(color: accent)),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Create a Post',
                    style: Theme.of(context)
                        .textTheme
                        .titleLarge
                        ?.copyWith(fontWeight: FontWeight.bold)),
                TextButton.icon(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Text('SEE ALL POSTS',
                      style:
                          TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                  label: const Icon(Icons.arrow_forward, size: 16),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Title field
            Text('TITLE',
                style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Colors.grey[600])),
            const SizedBox(height: 8),
            TextField(
              controller: _titleController,
              decoration: InputDecoration(
                hintText: 'Short, descriptive title',
                hintStyle: TextStyle(color: Colors.grey[400]),
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: BorderSide(color: Colors.grey.shade300)),
                enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: BorderSide(color: Colors.grey.shade300)),
                focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: BorderSide(color: accent)),
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
              ),
            ),
            const SizedBox(height: 20),

            // Details field
            Text('DETAILS',
                style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Colors.grey[600])),
            const SizedBox(height: 8),
            TextField(
              controller: _descController,
              maxLines: 4,
              decoration: InputDecoration(
                hintText: 'Any additional details...',
                hintStyle: TextStyle(color: Colors.grey[400]),
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: BorderSide(color: Colors.grey.shade300)),
                enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: BorderSide(color: Colors.grey.shade300)),
                focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: BorderSide(color: accent)),
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
              ),
            ),
            const SizedBox(height: 20),

            // Create Post button
            Align(
              alignment: Alignment.centerRight,
              child: FilledButton(
                onPressed: _submitting ? null : _submit,
                style: FilledButton.styleFrom(
                  backgroundColor: accent,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8)),
                ),
                child: Text(_submitting ? 'Creating...' : 'CREATE POST',
                    style: const TextStyle(
                        fontWeight: FontWeight.w600, letterSpacing: 0.5)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Error state.
class _ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorState({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.cloud_off_rounded,
                size: 48, color: Theme.of(context).colorScheme.error),
            const SizedBox(height: 16),
            Text(message,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyLarge),
            const SizedBox(height: 16),
            FilledButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh),
                label: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}

/// Empty state.
class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: [
        const SizedBox(height: 64),
        Icon(Icons.lightbulb_outline_rounded,
            size: 48, color: Theme.of(context).colorScheme.onSurfaceVariant),
        const SizedBox(height: 16),
        Text(
          'No feature requests yet.\nBe the first to suggest one!',
          textAlign: TextAlign.center,
          style: Theme.of(context)
              .textTheme
              .bodyLarge
              ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
        ),
      ],
    );
  }
}
