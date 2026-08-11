import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../core/api/api_service.dart';
import '../../../core/api/models/api_models.dart';
import '../../shared/widgets/loading_shimmer.dart';
import '../../shared/widgets/empty_state.dart';

part 'homework_page.g.dart';

@riverpod
Future<List<HomeworkAssignment>> teacherHomework(TeacherHomeworkRef ref) =>
    ref.watch(apiServiceProvider).getTeacherHomework();

// ── T4 Teacher Homework ───────────────────────────────────────────────────────

class HomeworkPage extends ConsumerStatefulWidget {
  const HomeworkPage({super.key});

  @override
  ConsumerState<HomeworkPage> createState() => _HomeworkPageState();
}

class _HomeworkPageState extends ConsumerState<HomeworkPage> {
  @override
  Widget build(BuildContext context) {
    final hwAsync = ref.watch(teacherHomeworkProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Homework')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAssignSheet,
        icon: const Icon(Icons.add),
        label: const Text('Assign'),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(teacherHomeworkProvider),
        child: hwAsync.when(
          loading: () => const LoadingShimmer(),
          error: (e, _) => EmptyState(
            icon: Icons.error_outline,
            title: 'Could not load homework',
            subtitle: e.toString(),
          ),
          data: (items) => items.isEmpty
              ? const EmptyState(
                  icon: Icons.assignment_outlined,
                  title: 'No homework assigned',
                  subtitle: 'Tap + to assign a task to your batch',
                )
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(0, 8, 0, 80),
                  itemCount: items.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (ctx, i) =>
                      _HomeworkTile(hw: items[i], onRefresh: () {
                        ref.invalidate(teacherHomeworkProvider);
                      }),
                ),
        ),
      ),
    );
  }

  void _showAssignSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => _AssignHomeworkSheet(onSaved: () {
        ref.invalidate(teacherHomeworkProvider);
      }),
    );
  }
}

class _HomeworkTile extends StatelessWidget {
  final HomeworkAssignment hw;
  final VoidCallback onRefresh;
  const _HomeworkTile({required this.hw, required this.onRefresh});

  @override
  Widget build(BuildContext context) {
    final overdue =
        hw.dueDate.isBefore(DateTime.now()) && hw.status != 'CLOSED';
    return ListTile(
      leading: CircleAvatar(
        backgroundColor: overdue
            ? Colors.red.withOpacity(0.1)
            : Colors.blue.withOpacity(0.1),
        child: Icon(
          Icons.assignment_outlined,
          color: overdue ? Colors.red : Colors.blue,
          size: 18,
        ),
      ),
      title: Text(hw.title, maxLines: 1, overflow: TextOverflow.ellipsis),
      subtitle: Text(
        '${hw.batchName} · Due ${hw.dueDate.toLocal().toString().substring(0, 10)}',
        style: TextStyle(
          fontSize: 12,
          color: overdue ? Colors.red[700] : null,
        ),
      ),
      trailing: Chip(
        label: Text(hw.status, style: const TextStyle(fontSize: 11)),
        padding: EdgeInsets.zero,
        visualDensity: VisualDensity.compact,
      ),
    );
  }
}

class _AssignHomeworkSheet extends ConsumerStatefulWidget {
  final VoidCallback onSaved;
  const _AssignHomeworkSheet({required this.onSaved});

  @override
  ConsumerState<_AssignHomeworkSheet> createState() =>
      _AssignHomeworkSheetState();
}

class _AssignHomeworkSheetState extends ConsumerState<_AssignHomeworkSheet> {
  final _formKey = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  DateTime? _dueDate;
  bool _saving = false;

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Assign Homework',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _titleCtrl,
              decoration: const InputDecoration(
                  labelText: 'Title', border: OutlineInputBorder()),
              validator: (v) =>
                  (v == null || v.isEmpty) ? 'Required' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _descCtrl,
              maxLines: 3,
              decoration: const InputDecoration(
                  labelText: 'Description', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: _pickDate,
              icon: const Icon(Icons.calendar_today, size: 16),
              label: Text(_dueDate == null
                  ? 'Set due date'
                  : 'Due: ${_dueDate!.toString().substring(0, 10)}'),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: _saving ? null : _save,
                child: _saving
                    ? const SizedBox(
                        height: 18,
                        width: 18,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Assign'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _pickDate() async {
    final d = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 3)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (d != null) setState(() => _dueDate = d);
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    if (_dueDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please set a due date')),
      );
      return;
    }
    setState(() => _saving = true);
    try {
      await ref.read(apiServiceProvider).createHomework(
            title: _titleCtrl.text.trim(),
            description: _descCtrl.text.trim(),
            dueDate: _dueDate!,
          );
      widget.onSaved();
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }
}
