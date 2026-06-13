import 'package:flutter/material.dart';

import '../core/feature_poll_main.dart';
import 'board_controller.dart';
import 'post_tile.dart';
import 'status_tabs.dart';
import 'submit_sheet.dart';

/// Full-screen board widget displaying feature requests.
///
/// Creates a [BoardController] on init, uses [ListenableBuilder] for reactive
/// updates, and integrates [StatusTabs], [PostTile], [SubmitSheet], and
/// pull-to-refresh via [RefreshIndicator].
class BoardScreen extends StatefulWidget {
  /// Creates a [BoardScreen].
  const BoardScreen({super.key});

  @override
  State<BoardScreen> createState() => _BoardScreenState();
}

class _BoardScreenState extends State<BoardScreen> {
  late final BoardController _controller;

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
        appBar: AppBar(title: const Text('Feature Requests')),
        body: ListenableBuilder(
          listenable: _controller,
          builder: (context, _) {
            // Error state with retry when no cached posts available
            if (_controller.error != null &&
                _controller.filteredPosts.isEmpty) {
              return _ErrorState(
                message: _controller.error!,
                onRetry: _controller.loadBoard,
              );
            }

            return Column(
              children: [
                StatusTabs(
                  activeFilter: _controller.activeFilter,
                  onChanged: _controller.setFilter,
                ),
                Expanded(
                  child: _controller.isLoading
                      ? const Center(child: CircularProgressIndicator())
                      : RefreshIndicator(
                          onRefresh: _controller.loadBoard,
                          child: _controller.filteredPosts.isEmpty
                              ? const _EmptyState()
                              : ListView.builder(
                                  itemCount: _controller.filteredPosts.length,
                                  itemBuilder: (ctx, i) => PostTile(
                                    post: _controller.filteredPosts[i],
                                    accentColor: accent,
                                    onVote: () => _controller.toggleVote(
                                      _controller.filteredPosts[i],
                                    ),
                                  ),
                                ),
                        ),
                ),
              ],
            );
          },
        ),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: () => _showSubmitSheet(context),
          label: const Text('Suggest a feature'),
          icon: const Icon(Icons.add),
        ),
      ),
    );
  }

  void _showSubmitSheet(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (_) => SubmitSheet(
        onSubmit: (title, description) async {
          await _controller.submitPost(
            title: title,
            description: description,
          );
        },
      ),
    );
  }
}

/// Displays an error message with a retry button.
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
            Icon(
              Icons.cloud_off_rounded,
              size: 48,
              color: Theme.of(context).colorScheme.error,
            ),
            const SizedBox(height: 16),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}

/// Empty state shown when no posts match the current filter.
class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: [
        const SizedBox(height: 64),
        Icon(
          Icons.lightbulb_outline_rounded,
          size: 48,
          color: Theme.of(context).colorScheme.onSurfaceVariant,
        ),
        const SizedBox(height: 16),
        Text(
          'No feature requests yet.\nBe the first to suggest one!',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
        ),
      ],
    );
  }
}
