import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:qr_code_scanner/qr_code_scanner.dart";
import "dart:convert";

import "../../../core/api/api_service.dart";
import "../../../core/api/models/api_models.dart";
import "../../../core/db/app_database.dart";
import "../../../core/theme/app_theme.dart";
import "../../shared/widgets/empty_state.dart";
import "../../shared/widgets/loading_shimmer.dart";
import "../../shared/widgets/offline_banner.dart";
import "../providers/teacher_providers.dart";
import "../widgets/batch_roster_row.dart";
import "../widgets/attendance_quick_mark.dart";

class AttendancePage extends ConsumerStatefulWidget {
  const AttendancePage({super.key});

  @override
  ConsumerState<AttendancePage> createState() => _AttendancePageState();
}

class _AttendancePageState extends ConsumerState<AttendancePage> {
  String? _selectedBatchId;
  // studentId -> true=present, false=absent
  Map<String, bool> _attendance = {};
  bool _scanMode = false;
  bool _submitting = false;
  String? _successMsg;

  final _qrKey = GlobalKey(debugLabel: "attendance_qr");

  void _initAttendance(List<RosterStudent> students) {
    if (_attendance.isNotEmpty) return;
    final map = <String, bool>{};
    for (final s in students) {
      map[s.id] = true; // default present
    }
    setState(() => _attendance = map);
  }

  void _markAllPresent(List<RosterStudent> students) {
    final map = <String, bool>{};
    for (final s in students) {
      map[s.id] = true;
    }
    setState(() => _attendance = map);
  }

  void _onQrDetect(Barcode barcode) {
    final code = barcode.code;
    if (code == null) return;
    // Student ID QR — mark present
    if (_attendance.containsKey(code)) {
      setState(() {
        _attendance[code] = true;
        _scanMode = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Student marked present"),
          backgroundColor: AppTheme.successGreen,
          duration: Duration(seconds: 1),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _submit(List<RosterStudent> students) async {
    if (_selectedBatchId == null) return;
    setState(() => _submitting = true);

    final payload = {
      "batch_id": _selectedBatchId,
      "date": DateTime.now().toIso8601String().split("T").first,
      "records": students
          .map((s) => {
                "student_id": s.id,
                "present": _attendance[s.id] ?? true,
              })
          .toList(),
    };

    try {
      await ref.read(apiServiceProvider).submitAttendance(payload);
      final absentCount =
          _attendance.values.where((v) => !v).length;
      if (mounted) {
        setState(() {
          _submitting = false;
          _successMsg =
              "Attendance recorded. $absentCount student(s) absent — notifying guardians…";
        });
      }
    } catch (e) {
      // Queue for offline sync
      final db = ref.read(appDatabaseProvider);
      await db.insertPendingOp(
        PendingSyncOpsCompanion.insert(
          opType: "attendance",
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
    final batchesAsync = ref.watch(teacherBatchesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text("Attendance"),
        actions: [
          if (_selectedBatchId != null)
            IconButton(
              onPressed: () => setState(() => _scanMode = !_scanMode),
              icon: Icon(
                _scanMode ? Icons.list : Icons.qr_code_scanner,
                color: _scanMode ? AppTheme.brandBlue : null,
              ),
              tooltip: "Scan Mode",
            ),
        ],
      ),
      body: Column(
        children: [
          const OfflineBanner(),

          // Batch selector
          batchesAsync.when(
            data: (batches) => Padding(
              padding: const EdgeInsets.all(16),
              child: DropdownButtonFormField<String>(
                value: _selectedBatchId,
                decoration: const InputDecoration(
                  labelText: "Select Batch",
                  prefixIcon: Icon(Icons.group),
                ),
                items: batches
                    .map(
                      (b) => DropdownMenuItem(
                        value: b.id,
                        child: Text(
                          "${b.name} (${b.studentCount} students)",
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    )
                    .toList(),
                onChanged: (id) {
                  setState(() {
                    _selectedBatchId = id;
                    _attendance = {};
                    _successMsg = null;
                  });
                },
              ),
            ),
            loading: () => const Padding(
              padding: EdgeInsets.all(16),
              child: LinearProgressIndicator(),
            ),
            error: (_, __) => const SizedBox.shrink(),
          ),

          if (_successMsg != null) ...[
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFBBF7D0)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.check_circle,
                      color: AppTheme.successGreen),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      _successMsg!,
                      style: const TextStyle(
                          color: Color(0xFF166534), fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
          ],

          // Roster / Scanner
          if (_selectedBatchId != null)
            Expanded(
              child: _scanMode
                  ? _buildScanner()
                  : _buildRoster(),
            ),
        ],
      ),
      floatingActionButton: _selectedBatchId != null && !_scanMode
          ? Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                FloatingActionButton.extended(
                  heroTag: "mark_all",
                  onPressed: () {
                    final studentsAsync =
                        ref.read(batchStudentsProvider(_selectedBatchId!));
                    studentsAsync.whenData(_markAllPresent);
                  },
                  icon: const Icon(Icons.done_all),
                  label: const Text("Mark All Present"),
                  backgroundColor: AppTheme.successGreen,
                ),
              ],
            )
          : null,
    );
  }

  Widget _buildRoster() {
    final studentsAsync =
        ref.watch(batchStudentsProvider(_selectedBatchId!));

    return studentsAsync.when(
      data: (students) {
        _initAttendance(students);
        return Column(
          children: [
            Expanded(
              child: ListView.builder(
                itemCount: students.length,
                itemBuilder: (ctx, i) {
                  final s = students[i];
                  return BatchRosterRow(
                    student: s,
                    present: _attendance[s.id] ?? true,
                    onToggle: (val) =>
                        setState(() => _attendance[s.id] = val),
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: ElevatedButton(
                onPressed: _submitting
                    ? null
                    : () => _submit(students),
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size.fromHeight(52),
                ),
                child: _submitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white),
                      )
                    : const Text("Submit Attendance"),
              ),
            ),
          ],
        );
      },
      loading: () => LoadingShimmer.list(count: 8, height: 60),
      error: (e, _) => EmptyState(
        message: "Could not load students: $e",
        icon: Icons.error_outline,
      ),
    );
  }

  Widget _buildScanner() {
    return Stack(
      children: [
        QRView(
          key: _qrKey,
          onQRViewCreated: (controller) {
            controller.scannedDataStream.listen(_onQrDetect);
          },
          overlay: QrScannerOverlayShape(
            borderColor: AppTheme.brandBlue,
            borderRadius: 12,
            borderLength: 30,
            borderWidth: 6,
            cutOutSize: MediaQuery.of(context).size.width * 0.65,
          ),
        ),
        const Align(
          alignment: Alignment.bottomCenter,
          child: Padding(
            padding: EdgeInsets.only(bottom: 48),
            child: Text(
              "Scan student ID QR code",
              style: TextStyle(color: Colors.white, fontSize: 16),
            ),
          ),
        ),
      ],
    );
  }
}
