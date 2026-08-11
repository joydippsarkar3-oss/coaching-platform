import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/api/api_service.dart';
import '../../../core/api/models/api_models.dart';
import '../../shared/widgets/loading_shimmer.dart';
import '../../shared/widgets/empty_state.dart';

part 'doubts_page.g.dart';

@riverpod
Future<List<Doubt>> doubts(DoubtsRef ref) =>
    ref.watch(apiServiceProvider).getDoubts();

// ── S10 Student Doubts ────────────────────────────────────────────────────────

class DoubtsPage extends ConsumerStatefulWidget {
  const DoubtsPage({super.key});

  @override
  ConsumerState<DoubtsPage> createState() => _DoubtsPageState();
}

class _DoubtsPageState extends ConsumerState<DoubtsPage> {
  final _controller = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final doubtsAsync = ref.watch(doubtsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Ask a Doubt')),
      body: Column(
        children: [
          // Ask box
          Container(
            color: Theme.of(context).colorScheme.surface,
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    maxLines: 3,
                    minLines: 1,
                    decoration: const InputDecoration(
                      hintText: 'Type your question…',
                      border: OutlineInputBorder(),
                      contentPadding: EdgeInsets.symmetric(
                          horizontal: 12, vertical: 10),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                FilledButton(
                  onPressed: _submitting ? null : _submit,
                  child: _submitting
                      ? const SizedBox(
                          height: 18,
                          width: 18,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white),
                        )
                      : const Text('Ask'),
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Doubts feed
          Expanded(
            child: doubtsAsync.when(
              loading: () => const LoadingShimmer(),
              error: (e, _) => EmptyState(
                icon: Icons.error_outline,
                title: 'Could not load doubts',
                subtitle: e.toString(),
              ),
              data: (items) => items.isEmpty
                  ? const EmptyState(
                      icon: Icons.help_outline,
                      title: 'No doubts yet',
                      subtitle: 'Be the first to ask!',
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      itemCount: items.length,
                      separatorBuilder: (_, __) => const Divider(height: 1),
                      itemBuilder: (ctx, i) => _DoubtTile(doubt: items[i]),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _submit() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    setState(() => _submitting = true);
    try {
      await ref.read(apiServiceProvider).postDoubt(text);
      _controller.clear();
      ref.invalidate(doubtsProvider);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e'), behavior: SnackBarBehavior.floating),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }
}

class _DoubtTile extends StatelessWidget {
  final Doubt doubt;
  const _DoubtTile({required this.doubt});

  @override
  Widget build(BuildContext context) {
    final answered = doubt.answer != null;
    return ListTile(
      isThreeLine: answered,
      leading: CircleAvatar(
        backgroundColor: answered
            ? Colors.green.withOpacity(0.1)
            : Colors.orange.withOpacity(0.1),
        child: Icon(
          answered ? Icons.check_circle_outline : Icons.help_outline,
          color: answered ? Colors.green : Colors.orange,
          size: 18,
        ),
      ),
      title: Text(doubt.question, maxLines: 2, overflow: TextOverflow.ellipsis),
      subtitle: answered
          ? Text(
              doubt.answer!,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 12),
            )
          : const Text('Awaiting answer',
              style: TextStyle(fontSize: 12, color: Colors.grey)),
      trailing: Text(
        doubt.createdAt.toLocal().toString().substring(0, 10),
        style: const TextStyle(fontSize: 11, color: Colors.grey),
      ),
    );
  }
}
