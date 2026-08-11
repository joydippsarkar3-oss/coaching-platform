import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../auth/auth_notifier.dart';
import '../auth/auth_state.dart';
import '../../features/onboarding/pages/splash_page.dart';
import '../../features/onboarding/pages/login_page.dart';
import '../../features/onboarding/pages/link_identity_page.dart';
import '../../features/onboarding/pages/consent_page.dart';
import '../../features/student/pages/home_page.dart';
import '../../features/student/pages/courses_page.dart';
import '../../features/student/pages/exam_list_page.dart';
import '../../features/student/pages/exam_runner_page.dart';
import '../../features/student/pages/results_page.dart';
import '../../features/student/pages/fees_page.dart';
import '../../features/student/pages/certificates_page.dart';
import '../../features/student/pages/notifications_page.dart';
import '../../features/student/pages/profile_page.dart';
import '../../features/student/pages/typing_practice_page.dart';
import '../../features/student/pages/wallet_page.dart';
import '../../features/student/pages/doubts_page.dart';
import '../../features/teacher/pages/today_page.dart';
import '../../features/teacher/pages/attendance_page.dart';
import '../../features/teacher/pages/marks_entry_page.dart';
import '../../features/teacher/pages/announcements_page.dart';
import '../../features/teacher/pages/homework_page.dart';
import '../../features/teacher/pages/teacher_doubts_page.dart';
import '../../features/shared/widgets/app_shell.dart';
import 'routes.dart';

part 'router.g.dart';

@riverpod
GoRouter router(RouterRef ref) {
  final authState = ref.watch(authNotifierProvider);

  return GoRouter(
    initialLocation: Routes.splash,
    debugLogDiagnostics: false,
    redirect: (context, state) => _redirect(authState, state),
    routes: [
      GoRoute(
        path: Routes.splash,
        builder: (ctx, _) => const SplashPage(),
      ),
      GoRoute(
        path: Routes.login,
        builder: (ctx, _) => const LoginPage(),
      ),
      GoRoute(
        path: Routes.linkIdentity,
        builder: (ctx, _) => const LinkIdentityPage(),
      ),
      GoRoute(
        path: Routes.consent,
        builder: (ctx, _) => const ConsentPage(),
      ),

      // ── Student shell ──────────────────────────────────────────────────
      ShellRoute(
        builder: (ctx, state, child) =>
            AppShell(role: UserRole.student, child: child),
        routes: [
          GoRoute(
            path: Routes.studentHome,
            builder: (ctx, _) => const StudentHomePage(),
          ),
          GoRoute(
            path: Routes.studentCourses,
            builder: (ctx, _) => const CoursesPage(),
          ),
          GoRoute(
            path: Routes.studentExamList,
            builder: (ctx, _) => const ExamListPage(),
          ),
          GoRoute(
            path: Routes.studentResults,
            builder: (ctx, _) => const ResultsPage(),
          ),
          GoRoute(
            path: Routes.studentFees,
            builder: (ctx, _) => const FeesPage(),
          ),
          GoRoute(
            path: Routes.studentCertificates,
            builder: (ctx, _) => const CertificatesPage(),
          ),
          GoRoute(
            path: Routes.studentNotifications,
            builder: (ctx, _) => const NotificationsPage(),
          ),
          GoRoute(
            path: Routes.studentProfile,
            builder: (ctx, _) => const ProfilePage(),
          ),
          GoRoute(
            path: Routes.studentTyping,
            builder: (ctx, _) => const TypingPracticePage(),
          ),
          GoRoute(
            path: Routes.studentWallet,
            builder: (ctx, _) => const WalletPage(),
          ),
          GoRoute(
            path: Routes.studentDoubts,
            builder: (ctx, _) => const DoubtsPage(),
          ),
        ],
      ),

      // Exam runner is full-screen (outside shell)
      GoRoute(
        path: Routes.studentExamRunner,
        builder: (ctx, state) =>
            ExamRunnerPage(examId: state.pathParameters['examId']!),
      ),

      // ── Teacher shell ──────────────────────────────────────────────────
      ShellRoute(
        builder: (ctx, state, child) =>
            AppShell(role: UserRole.teacher, child: child),
        routes: [
          GoRoute(
            path: Routes.teacherToday,
            builder: (ctx, _) => const TodayPage(),
          ),
          GoRoute(
            path: Routes.teacherAttendance,
            builder: (ctx, _) => const AttendancePage(),
          ),
          GoRoute(
            path: Routes.teacherMarksEntry,
            builder: (ctx, _) => const MarksEntryPage(),
          ),
          GoRoute(
            path: Routes.teacherAnnouncements,
            builder: (ctx, _) => const AnnouncementsPage(),
          ),
          GoRoute(
            path: Routes.teacherHomework,
            builder: (ctx, _) => const HomeworkPage(),
          ),
          GoRoute(
            path: Routes.teacherDoubts,
            builder: (ctx, _) => const TeacherDoubtsPage(),
          ),
        ],
      ),

      // ── Deep links ─────────────────────────────────────────────────────
      GoRoute(
        path: Routes.deepExam,
        redirect: (ctx, state) =>
            '/student/exams/${state.pathParameters['examId']}/run',
      ),
      GoRoute(
        path: Routes.deepVerify,
        builder: (ctx, state) =>
            CertificatesPage(certNo: state.pathParameters['certNo']),
      ),
    ],
  );
}

String? _redirect(AuthState auth, GoRouterState state) {
  final loc = state.matchedLocation;
  final publicRoutes = {Routes.splash, Routes.login, Routes.consent};
  final isPublic = publicRoutes.contains(loc) ||
      loc == Routes.linkIdentity;

  if (auth.isLoading) return null;

  if (!auth.isAuthenticated && !isPublic) return Routes.login;

  if (auth.isAuthenticated) {
    if (loc == Routes.splash || loc == Routes.login) {
      return auth.isTeacher ? Routes.teacherToday : Routes.studentHome;
    }
    // Role guard: students can't access teacher routes
    if (auth.isStudent && loc.startsWith('/teacher')) {
      return Routes.studentHome;
    }
    if (auth.isTeacher && loc.startsWith('/student')) {
      return Routes.teacherToday;
    }
  }

  return null;
}
