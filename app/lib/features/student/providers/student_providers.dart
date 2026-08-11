import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:riverpod_annotation/riverpod_annotation.dart";

import "../../../core/api/api_service.dart";
import "../../../core/api/models/api_models.dart";

part "student_providers.g.dart";

@riverpod
Future<StudentProfile> studentProfile(StudentProfileRef ref) =>
    ref.watch(apiServiceProvider).getStudentProfile();

@riverpod
Future<List<Course>> studentCourses(StudentCoursesRef ref) =>
    ref.watch(apiServiceProvider).getStudentCourses();

@riverpod
Future<List<ExamSummary>> examList(ExamListRef ref) =>
    ref.watch(apiServiceProvider).getExamList();

@riverpod
Future<List<ExamResult>> examResults(ExamResultsRef ref) =>
    ref.watch(apiServiceProvider).getResults();

@riverpod
Future<List<FeeInstallment>> feeInstallments(FeeInstallmentsRef ref) =>
    ref.watch(apiServiceProvider).getFees();

@riverpod
Future<List<Certificate>> certificates(CertificatesRef ref) =>
    ref.watch(apiServiceProvider).getCertificates();

@riverpod
Future<List<AppNotification>> notifications(NotificationsRef ref) =>
    ref.watch(apiServiceProvider).getNotifications();

@riverpod
Future<List<Announcement>> announcements(AnnouncementsRef ref) =>
    ref.watch(apiServiceProvider).getAnnouncements();
