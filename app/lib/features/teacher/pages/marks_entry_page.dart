import "package:flutter/material.dart";
import "package:flutter/services.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "dart:convert";

import "../../../core/api/api_service.dart";
import "../../../core/api/models/api_models.dart";
import "../../../core/db/app_database.dart";
import "../../../core/theme/app_theme.dart";
import "../../shared/widgets/empty_state.dart";
import "../../shared/widgets/loading_shimmer.dart";
import "../../shared/widgets/offline_banner.dart";
import "../providers/teacher_providers.dart";

class MarksEntryPage extends ConsumerStatefulWidget {
  const MarksEntryPage({super.key});

  @override
  ConsumerState<MarksEntryPage> createState() => _MarksEntryPageState();
}

class _MarksEntryPage extends StatelessWidget {
  const _MarksEntryPage();

  @override
  Widget build(BuildContext context) => const MarksEntryPage();
}

class _MarksEntryPageState extends ConsumerState<MarksEntryPage> {
  String? _selectedExamId;
  // studentId -> {theory, practical, viva}
  final Map<String, Map<String, TextEditingController>> _ctrlMap = {};
  bool _submitting = false;
  bool _submitted = false;

  @override
  void dispose() {
    for (final ctrls in _ctrlMap.values) {
      ctrls.values.forEach((c) => c.dispose());
    }
    super.dispose();
  }

  void _initControllers(List<RosterStudent> students) {
    for (final s in students) {
      if (!_ctrlMap.containsKey(s.id)) {
        _ctrlMap[s.id] = {
          "theory": TextEditingController(),
          "practical": TextEditingController(),
          "viva": TextEditingController(),
        };
      }
    }
  }

  Future<void> _bulkPaste(List<RosterStudent> students) async {
    final data = await Clipboard.getData(Clipboard.kTextPlain);
    if (data?.text == null) return;
    // Expected format: rows separated by newline, columns by tab
    // Each row: studentId\ttheory\tpractical\tviva
    final rows = data!.text!.trim().split("\n");
    for (var i = 0; i < rows.length && i < students.length; i++) {
      final cols = rows[i].split("\t");
      final sid = students[i].id;
      if (_ctrlMap.containsKey(sid)) {
        if (cols.length > 1) _ctrlMap[sid]!["theory"]!.text = cols[1].trim();
        if (cols.length > 2) _ctrlMap[sid]!["practical"]!.text = cols[2].trim();
        if (cols.length > 3) _ctrlMap[sid]!["viva"]!.text = cols[3].trim();
      }
    }
    if (mounted) setState(() );
  }

  Future<void> _submit(List<RosterStudent> students) async {
    if (_selectedExamId == null) return;
    setState(() => _submitting = true);

    final records = students
        .map((s) => {
              "student_id": s.id,
              "theory": int.tryParse(_ctrlMap[s.id]?["theory"]?.text ?? "") ?? 0,
              "practical": int.tryParse(_ctrlMap[s.id]?["practical"]?.text ?? "") ?? 0,
              "viva": int.tryParse(_ctrlMap[s.id]?["viva"]?.text ?? "") ?? 0,
            })
        .toList();

    final payload = {
      "exam_id": _selectedExamId,
      "records": records,
    };

    try {
      await ref.read(apiServiceProvider).submitMarks(payload);
      if (mounted) setState(() {
        _submitting = false;
        _submitted = true;
      });
    } catch (e) {
      final db = ref.read(appDatabaseProvider);
      await db.insertPendingOp(
        PendingSyncOpsCompanion.insert(
          opType: "marks",
          payload: jsonEncode(payload),
          createdAt: DateTime.now().millisecondsSinceEpoch,
        ),
      );
      if (mounted) {
        setState(() => _submitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Saved offline — will sync when reconnected"),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final examsAsync = ref.watch(teacherAssessmentsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text("Marks Entry")),
      body: Column(
        children: [
          const OfflineBanner(),

          // Exam selector
          examsAsync.when(
            data: (exams) => Padding(
              padding: const EdgeInsets.all(16),
              child: DropdownButtonFormField<String>(
                value: _selectedExamId,
                decoration: const InputDecoration(
                  labelText: "Select Exam / Assessment",
                  prefixIcon: Icon(Icons.quiz),
                ),
                items: exams
                    .map(
                      (e) => DropdownMenuItem(
                        value: e.id,
                        child: Text(
                          e.title,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    )
                    .toList(),
                onChanged: (id) => setState(() {
                  _selectedExamId = id;
                  _submitted = false;
                  _ctrlMap.clear();
                }),
              ),
            ),
            loading: () => const Padding(
              padding: EdgeInsets.all(16),
              child: LinearProgressIndicator(),
            ),
            error: (_, __) => const SizedBox.shrink(),
          ),

          if (_submitted)
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFBBF7D0)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.hourglass_top, color: AppTheme.warningOrange),
                  SizedBox(width: 10),
                  Text(
                    "Submitted — moderation pending",
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF166534),
                    ),
                  ),
                ],
              ),
            ),

          if (_selectedExamId != null && !_submitted) ...[
            // Bulk paste + header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  const Expanded(
                    child: Text(
                      "Student",
                      style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                          color: Color(0xFF9CA3AF)),
                    ),
                  ),
                  const SizedBox(
                    width: 64,
                    child: Text("Theory",
                        textAlign: TextAlign.center,
                        style: TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 11,
                            color: Color(0xFF9CA3AF))),
                  ),
                  const SizedBox(
                    width: 64,
                    child: Text("Practical",
                        textAlign: TextAlign.center,
                        style: TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 11,
                            color: Color(0xFF9CA3AF))),
                  ),
                  const SizedBox(
                    width: 52,
                    child: Text("Viva",
                        textAlign: TextAlign.center,
                        style: TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 11,
                            color: Color(0xFF9CA3AF))),
                  ),
                ],
              ),
            ),
            Expanded(
              child: _buildRoster(),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildRoster() {
    // Use first batch's students for the selected exam
    // In a real app this would be exam-specific
    final batchesAsync = ref.watch(teacherBatchesProvider);
    return batchesAsync.when(
      data: (batches) {
        if (batches.isEmpty) {
          return const EmptyState(
            message: "No batches found",
            icon: Icons.group_outlined,
          );
        }
        final studentsAsync =
            ref.watch(batchStudentsProvider(batches.first.id));
        return studentsAsync.when(
          data: (students) {
            _initControllers(students);
            return Column(
              children: [
                Expanded(
                  child: ListView.builder(
                    itemCount: students.length,
                    itemBuilder: (ctx, i) {
                      final s = students[i];
                      final ctrls = _ctrlMap[s.id]!;
                      return Padding(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 4),
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(
                                s.name,
                                style: const TextStyle(
                                    fontSize: 13,
                                    color: Color(0xFF111827)),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            _MarksInput(ctrl: ctrls["theory"]!),
                            const SizedBox(width: 4),
                            _MarksInput(ctrl: ctrls["practical"]!),
                            const SizedBox(width: 4),
                            _MarksInput(ctrl: ctrls["viva"]!),
                          ],
                        ),
                      );
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _bulkPaste(students),
                          icon: const Icon(Icons.content_paste, size: 16),
                          label: const Text("Bulk Paste"),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: _submitting ? null : () => _submit(students),
                          child: _submitting
                              ? const SizedBox(
                                  height: 18,
                                  width: 18,
                                  child: CircularProgressIndicator(
                                      strokeWidth: 2, color: Colors.white))
                              : const Text("Submit Marks"),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            );
          },
          loading: () => LoadingShimmer.list(count: 6, height: 48),
          error: (e, _) => EmptyState(
            message: "Could not load students: $e",
            icon: Icons.error_outline,
          ),
        );
      },
      loading: () => LoadingShimmer.list(count: 4, height: 48),
      error: (_, __) => const SizedBox.shrink(),
    );
  }
}

class _MarksInput extends StatelessWidget {
  const _MarksInput({required this.ctrl});
  final TextEditingController ctrl;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 52,
      child: TextField(
        controller: ctrl,
        keyboardType: TextInputType.number,
        textAlign: TextAlign.center,
        inputFormatters: [
          FilteringTextInputFormatter.digitsOnly,
          LengthLimitingTextInputFormatter(3),
        ],
        style: const TextStyle(fontSize: 13),
        decoration: InputDecoration(
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: Color(0xFFD1D5DB)),
          ),
          isDense: true,
        ),
      ),
    );
  }
}
