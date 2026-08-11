import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";

import "../../../core/auth/auth_notifier.dart";
import "../../../core/theme/app_theme.dart";
import "../../../core/utils/date_utils.dart";
import "../../shared/widgets/empty_state.dart";
import "../../shared/widgets/loading_shimmer.dart";
import "../providers/teacher_providers.dart";

class TodayPage extends ConsumerWidget {
  const TodayPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authNotifierProvider);
    final batchesAsync = ref.watch(teacherBatchesProvider);
    final assessmentsAsync = ref.watch(teacherAssessmentsProvider);
    final announcementsAsync = ref.watch(teacherAnnouncementsProvider);

    final now = DateTime.now();

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "Hello, ${(auth.displayName ?? "Teacher").split(" ").first}!",
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: Color(0xFF111827),
              ),
            ),
            Text(
              AppDateUtils.formatDate(now),
              style: const TextStyle(
                fontSize: 12,
                color: Color(0xFF6B7280),
                fontWeight: FontWeight.w400,
              ),
            ),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(teacherBatchesProvider);
          ref.invalidate(teacherAssessmentsProvider);
          ref.invalidate(teacherAnnouncementsProvider);
        },
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          children: [
            // My Batches
            const _SectionHeader(title: "My Batches"),
            batchesAsync.when(
              data: (batches) => batches.isEmpty
                  ? const EmptyState(
                      message: "No batches assigned",
                      icon: Icons.group_outlined,
                    )
                  : Column(
                      children: batches
                          .map((b) => _BatchCard(batch: b))
                          .toList(),
                    ),
              loading: () => LoadingShimmer.list(count: 2, height: 72),
              error: (e, _) => EmptyState(
                message: "Could not load batches: $e",
                icon: Icons.error_outline,
              ),
            ),

            // Upcoming Assessments
            const _SectionHeader(title: "Upcoming Assessments"),
            assessmentsAsync.when(
              data: (exams) {
                final upcoming = exams
                    .where((e) => e.status == "upcoming" || e.status == "active")
                    .take(3)
                    .toList();
                if (upcoming.isEmpty) {
                  return const EmptyState(
                    message: "No upcoming assessments",
                    icon: Icons.quiz_outlined,
                  );
                }
                return Column(
                  children: upcoming
                      .map(
                        (e) => ListTile(
                          leading: Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: AppTheme.brandBlue.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(Icons.quiz,
                                color: AppTheme.brandBlue, size: 22),
                          ),
                          title: Text(e.title,
                              style: const TextStyle(
                                  fontWeight: FontWeight.w600, fontSize: 14)),
                          subtitle: Text(AppDateUtils.formatDate(e.startTime),
                              style: const TextStyle(fontSize: 12)),
                          trailing: Text("${e.totalMarks}m",
                              style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.brandBlue)),
                        ),
                      )
                      .toList(),
                );
              },
              loading: () => LoadingShimmer.list(count: 2, height: 64),
              error: (_, __) => const SizedBox.shrink(),
            ),

            // Recent Announcements
            const _SectionHeader(title: "Recent Announcements"),
            announcementsAsync.when(
              data: (items) => items.isEmpty
                  ? const EmptyState(
                      message: "No announcements yet",
                      icon: Icons.campaign_outlined,
                    )
                  : Column(
                      children: items
                          .take(3)
                          .map((a) => ListTile(
                                leading: const CircleAvatar(
                                  backgroundColor: Color(0xFFFEF3C7),
                                  child: Icon(Icons.campaign,
                                      color: Color(0xFFD97706), size: 20),
                                ),
                                title: Text(a.title,
                                    style: const TextStyle(
                                        fontWeight: FontWeight.w600,
                                        fontSize: 14)),
                                subtitle: Text(
                                  AppDateUtils.humanDate(a.postedAt),
                                  style: const TextStyle(fontSize: 12),
                                ),
                              ))
                          .toList(),
                    ),
              loading: () => LoadingShimmer.list(count: 2, height: 60),
              error: (_, __) => const SizedBox.shrink(),
            ),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title});
  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 16, bottom: 8),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 17,
          fontWeight: FontWeight.w700,
          color: Color(0xFF111827),
        ),
      ),
    );
  }
}

class _BatchCard extends StatelessWidget {
  const _BatchCard({required this.batch});
  final dynamic batch;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppTheme.brandBlue.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.group, color: AppTheme.brandBlue, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  batch.name as String,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                    color: Color(0xFF111827),
                  ),
                ),
                Text(
                  batch.courseTitle as String,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF6B7280),
                  ),
                ),
              ],
            ),
          ),
          Text(
            "${batch.studentCount} students",
            style: const TextStyle(
              fontSize: 12,
              color: Color(0xFF6B7280),
            ),
          ),
        ],
      ),
    );
  }
}
