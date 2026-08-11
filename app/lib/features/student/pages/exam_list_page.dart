import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";

import "../../../core/api/models/api_models.dart";
import "../../../core/navigation/routes.dart";
import "../../../core/theme/app_theme.dart";
import "../../../core/utils/date_utils.dart";
import "../../shared/widgets/empty_state.dart";
import "../../shared/widgets/loading_shimmer.dart";
import "../providers/student_providers.dart";

class ExamListPage extends ConsumerWidget {
  const ExamListPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final examsAsync = ref.watch(examListProvider);

    return Scaffold(
      appBar: AppBar(title: const Text("Exams")),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(examListProvider),
        child: examsAsync.when(
          data: (exams) => exams.isEmpty
              ? const EmptyState(
                  message: "No exams scheduled",
                  icon: Icons.quiz_outlined,
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: exams.length,
                  itemBuilder: (ctx, i) => _ExamCard(exam: exams[i]),
                ),
          loading: () => LoadingShimmer.list(count: 4, height: 100),
          error: (e, _) => EmptyState(
            message: "Could not load exams: $e",
            icon: Icons.error_outline,
          ),
        ),
      ),
    );
  }
}

class _ExamCard extends StatelessWidget {
  const _ExamCard({required this.exam});
  final ExamSummary exam;

  Color get _statusColor {
    switch (exam.status) {
      case "active":
        return AppTheme.successGreen;
      case "upcoming":
        return AppTheme.brandBlue;
      case "completed":
        return const Color(0xFF6B7280);
      case "result_pending":
        return AppTheme.warningOrange;
      default:
        return const Color(0xFF6B7280);
    }
  }

  String get _statusLabel {
    switch (exam.status) {
      case "active":
        return "Active";
      case "upcoming":
        return "Upcoming";
      case "completed":
        return "Completed";
      case "result_pending":
        return "Result Pending";
      default:
        return exam.status;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  exam.title,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                    color: Color(0xFF111827),
                  ),
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: _statusColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  _statusLabel,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: _statusColor,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.access_time, size: 14, color: Color(0xFF6B7280)),
              const SizedBox(width: 4),
              Text(
                "${exam.durationMinutes} min",
                style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
              ),
              const SizedBox(width: 16),
              const Icon(Icons.star_outline, size: 14, color: Color(0xFF6B7280)),
              const SizedBox(width: 4),
              Text(
                "${exam.totalMarks} marks",
                style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
              ),
              const SizedBox(width: 16),
              const Icon(Icons.calendar_today, size: 14, color: Color(0xFF6B7280)),
              const SizedBox(width: 4),
              Text(
                AppDateUtils.formatDate(exam.startTime),
                style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
              ),
            ],
          ),
          if (exam.status == "active" || exam.status == "upcoming") ...[
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: exam.status == "active"
                    ? () => context.go(
                          "/student/exams/${exam.id}/run",
                        )
                    : null,
                child: Text(
                  exam.status == "active" ? "Start Exam" : "Not yet open",
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
