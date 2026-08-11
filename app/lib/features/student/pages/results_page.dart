import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";

import "../../../core/api/models/api_models.dart";
import "../../../core/theme/app_theme.dart";
import "../../../core/utils/date_utils.dart";
import "../../shared/widgets/empty_state.dart";
import "../../shared/widgets/loading_shimmer.dart";
import "../providers/student_providers.dart";

class ResultsPage extends ConsumerWidget {
  const ResultsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final resultsAsync = ref.watch(examResultsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text("Results")),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(examResultsProvider),
        child: resultsAsync.when(
          data: (results) => results.isEmpty
              ? const EmptyState(
                  message: "No results yet",
                  icon: Icons.bar_chart_outlined,
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: results.length,
                  itemBuilder: (ctx, i) => _ResultCard(result: results[i]),
                ),
          loading: () => LoadingShimmer.list(count: 4, height: 100),
          error: (e, _) => EmptyState(
            message: "Could not load results: $e",
            icon: Icons.error_outline,
          ),
        ),
      ),
    );
  }
}

class _ResultCard extends StatelessWidget {
  const _ResultCard({required this.result});
  final ExamResult result;

  @override
  Widget build(BuildContext context) {
    final passed = result.passed;
    final pctColor =
        passed ? AppTheme.successGreen : AppTheme.errorRed;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Row(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: pctColor.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Text(
              "${result.percentage.toStringAsFixed(0)}%",
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w800,
                color: pctColor,
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  result.examTitle,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                    color: Color(0xFF111827),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  "${result.marksObtained}/${result.totalMarks} marks",
                  style: const TextStyle(
                    fontSize: 13,
                    color: Color(0xFF6B7280),
                  ),
                ),
                Text(
                  AppDateUtils.formatDate(result.submittedAt),
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF9CA3AF),
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: pctColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  passed ? "Passed" : "Failed",
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: pctColor,
                  ),
                ),
              ),
              if (result.rankInBatch != null) ...[
                const SizedBox(height: 4),
                Text(
                  "Rank #${result.rankInBatch}",
                  style: const TextStyle(
                    fontSize: 11,
                    color: Color(0xFF6B7280),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}
