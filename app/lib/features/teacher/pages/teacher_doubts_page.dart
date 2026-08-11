import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/api/api_service.dart';
import '../../../core/api/models/api_models.dart';
import '../../shared/widgets/loading_shimmer.dart';
import '../../shared/widgets/empty_state.dart';

part 'teacher_doubts_page.g.dart';

@riverpod
Future<List<Doubt>> teacherDoubts(TeacherDoubtsRef ref) =>
    ref.watch(apiServiceProvider).getTeacherDoubts();

// ── T5 Teacher Doubts ─────────────────────────────────────────────────────────

class TeacherDoubtsPage extends ConsumerStatefulWidget {
  const TeacherDoubtsPage({super.key});

  @override
  ConsumerState<TeacherDoubtsPage> createState() => _TeacherDoubtsPageState();
}

class _TeacherDoubtsPageState extends ConsumerState<TeacherDoubtsPage> {
  String _filter = 'UNANSWERED';

  @override
  Widget build(BuildContext context) {
    final doubtsAsync = ref.watch(teacherDoubtsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Student Doubts'),
        actions: [
          PopupMenuButton<String>(
            initialValue: _filter,
            onSelected: (v) => setState(() => _filter = v),
            itemBuilder: (_) => const [
              PopupMenuItem(value: 'UNANSWERED', child: Text('Unanswered')),
              PopupMenuItem(value: 'ANSWERED', child: Text('Answered')),
              PopupMenuItem(value: 'ALL', child: Text('All')),
            ],
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Row(
                children: [
                  Text(
                    _filter == 'ALL'
                        ? 'All'
                        : _filter == 'ANSWERED'
                            ? 'Answered'
                            : 'Unanswered',
                    style: const TextStyle(fontSize: 13),
                  ),
                  const Icon(Icons.arrow_drop_down),
                ],
              ),
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(teacherDoubtsProvider),
        child: doubtsAsync.when(
          loading: () => const LoadingShimmer(),
          error: (e, _) => EmptyState(
            icon: Icons.error_outline,
            title: 'Could not load doubts',
            subtitle: e.toString(),
          ),
          data: (all) {
            final items = _applyFilter(all, _filter);
            if (items.isEmpty) {
              return EmptyState(
                icon: Icons.help_outline,
                title: _filter == 'UNANSWERED'
                    ? 'No unanswered doubts 🎉'
                    : 'No doubts found',
                subtitle: 'Pull to refresh',
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: items.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (ctx, i) => _DoubtTile(
                doubt: items[i],
                onAnswered: () => ref.invalidate(teacherDoubtsProvider),
              ),
            );
          },
        ),
      ),
    );
  }

  List<Doubt> _applyFilter(List<Doubt> all, String filter) => switch (filter) {
        'ANSWERED' => all.where((d) => d.answer != null).toList(),
        'UNANSWERED' => all.where((d) => d.answer == null).toList(),
        _ => all,
      };
}

// ── Doubt tile with inline reply ──────────────────────────────────────────────

class _DoubtTile extends ConsumerStatefulWidget {
  final Doubt doubt;
  final VoidCallback onAnswered;
  const _DoubtTile({required this.doubt, required this.onAnswered});

  @override
  ConsumerState<_DoubtTile> createState() => _DoubtTileState();
}

class _DoubtTileState extends ConsumerState<_DoubtTile> {
  bool _expanded = false;
  final _ctrl = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final answered = widget.doubt.answer != null;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ListTile(
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
          title: Text(
            widget.doubt.question,
            maxLines: _expanded ? null : 2,
            overflow:
                _expanded ? TextOverflow.visible : TextOverflow.ellipsis,
          ),
          subtitle: Text(
            widget.doubt.studentName ?? 'Student',
            style: const TextStyle(fontSize: 12),
          ),
          trailing: TextButton(
            onPressed: () => setState(() => _expanded = !_expanded),
            child: Text(_expanded ? 'Collapse' : answered ? 'View' : 'Reply'),
          ),
        ),
        if (_expanded) ...[
          if (answered)
            Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.green.withOpacity(0.3)),
                ),
                child: Text(
                  widget.doubt.answer!,
                  style: const TextStyle(fontSize: 13),
                ),
              ),
            )
          else ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 4),
              child: TextField(
                controller: _ctrl,
                maxLines: 3,
                decoration: const InputDecoration(
                  hintText: 'Type your answer…',
                  border: OutlineInputBorder(),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
              child: FilledButton(
                onPressed: _saving ? null : _submit,
                child: _saving
                    ? const SizedBox(
                        height: 16,
                        width: 16,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Send Answer'),
              ),
            ),
          ],
        ],
      ],
    );
  }

  Future<void> _submit() async {
    final text = _ctrl.text.trim();
    if (text.isEmpty) return;
    setState(() => _saving = true);
    try {
      await ref
          .read(apiServiceProvider)
          .answerDoubt(widget.doubt.id, text);
      widget.onAnswered();
      _ctrl.clear();
      if (mounted) setState(() => _expanded = false);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Failed: $e'),
              behavior: SnackBarBehavior.floating),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }
}
