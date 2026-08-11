import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";

import "../../../core/api/models/api_models.dart";
import "../../../core/theme/app_theme.dart";
import "../../shared/widgets/empty_state.dart";
import "../../shared/widgets/loading_shimmer.dart";
import "../providers/student_providers.dart";
import "../widgets/course_progress_card.dart";

class CoursesPage extends ConsumerWidget {
  const CoursesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final coursesAsync = ref.watch(studentCoursesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text("My Courses")),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(studentCoursesProvider),
        child: coursesAsync.when(
          data: (courses) => courses.isEmpty
              ? const EmptyState(
                  message: "No courses enrolled",
                  icon: Icons.menu_book_outlined,
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: courses.length,
                  itemBuilder: (ctx, i) => CourseProgressCard(course: courses[i]),
                ),
          loading: () => LoadingShimmer.list(count: 5, height: 88),
          error: (e, _) => EmptyState(
            message: "Could not load courses: $e",
            icon: Icons.error_outline,
          ),
        ),
      ),
    );
  }
}
