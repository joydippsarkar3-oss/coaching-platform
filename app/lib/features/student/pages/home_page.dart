import "package:cached_network_image/cached_network_image.dart";
import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";

import "../../../core/auth/auth_notifier.dart";
import "../../../core/navigation/routes.dart";
import "../../../core/theme/app_theme.dart";
import "../../../core/utils/date_utils.dart";
import "../../shared/widgets/loading_shimmer.dart";
import "../../shared/widgets/offline_banner.dart";
import "../../shared/widgets/empty_state.dart";
import "../providers/student_providers.dart";
import "../widgets/fee_due_card.dart";
import "../widgets/course_progress_card.dart";

class StudentHomePage extends ConsumerWidget {
  const StudentHomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(studentProfileProvider);
    final coursesAsync = ref.watch(studentCoursesProvider);
    final examsAsync = ref.watch(examListProvider);
    final announcementsAsync = ref.watch(announcementsProvider);
    final feesAsync = ref.watch(feeInstallmentsProvider);
    final auth = ref.watch(authNotifierProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(studentProfileProvider);
          ref.invalidate(studentCoursesProvider);
          ref.invalidate(examListProvider);
          ref.invalidate(feeInstallmentsProvider);
          ref.invalidate(announcementsProvider);
        },
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // App bar
            SliverAppBar(
              floating: true,
              backgroundColor: Colors.white,
              elevation: 0,
              title: profileAsync.when(
                data: (p) => Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "Hello, ${p.name.split(" ").first}!",
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF111827),
                      ),
                    ),
                    Text(
                      "Center: ${p.centerName}",
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF6B7280),
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                  ],
                ),
                loading: () => const Text("Loading…"),
                error: (_, __) => const Text("Brand Training"),
              ),
              actions: [
                profileAsync.when(
                  data: (p) => p.avatarUrl != null
                      ? Padding(
                          padding: const EdgeInsets.only(right: 12),
                          child: CircleAvatar(
                            radius: 18,
                            backgroundImage:
                                CachedNetworkImageProvider(p.avatarUrl!),
                          ),
                        )
                      : const Padding(
                          padding: EdgeInsets.only(right: 12),
                          child: CircleAvatar(
                            radius: 18,
                            backgroundColor: AppTheme.brandBlue,
                            child: Icon(Icons.person,
                                color: Colors.white, size: 20),
                          ),
                        ),
                  loading: () => const SizedBox.shrink(),
                  error: (_, __) => const SizedBox.shrink(),
                ),
              ],
            ),

            // Offline banner
            const SliverToBoxAdapter(child: OfflineBanner()),

            // Streak + next exam chips
            SliverToBoxAdapter(
              child: profileAsync.when(
                data: (p) => Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                  child: Row(
                    children: [
                      _Chip(
                        icon: Icons.local_fire_department,
                        label: "${p.streakDays} day streak",
                        color: AppTheme.brandAccent,
                      ),
                      const SizedBox(width: 8),
                      examsAsync.when(
                        data: (exams) {
                          final upcoming = exams
                              .where((e) =>
                                  e.status == "upcoming" ||
                                  e.status == "active")
                              .toList()
                            ..sort((a, b) =>
                                a.startTime.compareTo(b.startTime));
                          if (upcoming.isEmpty) {
                            return const SizedBox.shrink();
                          }
                          final next = upcoming.first;
                          return _Chip(
                            icon: Icons.quiz,
                            label:
                                "Next exam: ${AppDateUtils.humanDate(next.startTime)}",
                            color: AppTheme.brandBlue,
                          );
                        },
                        loading: () => const SizedBox.shrink(),
                        error: (_, __) => const SizedBox.shrink(),
                      ),
                    ],
                  ),
                ),
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
              ),
            ),

            // Fee due card (red if overdue)
            SliverToBoxAdapter(
              child: feesAsync.when(
                data: (fees) {
                  final overdue =
                      fees.where((f) => f.status == "overdue").toList();
                  if (overdue.isEmpty) return const SizedBox.shrink();
                  return Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                    child: FeeDueCard(
                      installment: overdue.first,
                      onPayTap: () => context.go(Routes.studentFees),
                    ),
                  );
                },
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
              ),
            ),

            // Today's classes section
            const SliverToBoxAdapter(
              child: _SectionHeader(title: "Today's Classes"),
            ),
            SliverToBoxAdapter(
              child: coursesAsync.when(
                data: (courses) => courses.isEmpty
                    ? const EmptyState(
                        message: "No classes today",
                        icon: Icons.event_busy,
                      )
                    : Column(
                        children: courses
                            .take(3)
                            .map((c) => CourseProgressCard(course: c))
                            .toList(),
                      ),
                loading: () => LoadingShimmer.list(count: 2, height: 72),
                error: (_, __) => const EmptyState(
                  message: "Could not load classes",
                  icon: Icons.error_outline,
                ),
              ),
            ),

            // Announcements horizontal scroll
            const SliverToBoxAdapter(
              child: _SectionHeader(title: "Announcements"),
            ),
            SliverToBoxAdapter(
              child: announcementsAsync.when(
                data: (items) => items.isEmpty
                    ? const SizedBox.shrink()
                    : SizedBox(
                        height: 100,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: items.length,
                          itemBuilder: (ctx, i) => _AnnouncementChip(
                            announcement: items[i],
                          ),
                        ),
                      ),
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
              ),
            ),

            // Quick action buttons
            const SliverToBoxAdapter(
              child: _SectionHeader(title: "Quick Actions"),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
              sliver: SliverGrid.count(
                crossAxisCount: 3,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 1.1,
                children: [
                  _QuickActionTile(
                    icon: Icons.menu_book,
                    label: "Materials",
                    color: const Color(0xFF6366F1),
                    onTap: () => context.go(Routes.studentCourses),
                  ),
                  _QuickActionTile(
                    icon: Icons.quiz,
                    label: "Exams",
                    color: AppTheme.brandBlue,
                    onTap: () => context.go(Routes.studentExamList),
                  ),
                  _QuickActionTile(
                    icon: Icons.workspace_premium,
                    label: "Certificates",
                    color: const Color(0xFFF59E0B),
                    onTap: () => context.go(Routes.studentCertificates),
                  ),
                ],
              ),
            ),
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
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
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

class _Chip extends StatelessWidget {
  const _Chip({
    required this.icon,
    required this.label,
    required this.color,
  });
  final IconData icon;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

class _AnnouncementChip extends StatelessWidget {
  const _AnnouncementChip({required this.announcement});
  final dynamic announcement;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 220,
      margin: const EdgeInsets.only(right: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            announcement.title as String,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 13,
              color: Color(0xFF111827),
            ),
          ),
          const SizedBox(height: 4),
          Expanded(
            child: Text(
              announcement.body as String,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
            ),
          ),
        ],
      ),
    );
  }
}

class _QuickActionTile extends StatelessWidget {
  const _QuickActionTile({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
