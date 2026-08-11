import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:riverpod_annotation/riverpod_annotation.dart";

import "../../../core/api/api_service.dart";
import "../../../core/api/models/api_models.dart";

part "teacher_providers.g.dart";

@riverpod
Future<List<Batch>> teacherBatches(TeacherBatchesRef ref) =>
    ref.watch(apiServiceProvider).getBatches();

@riverpod
Future<List<RosterStudent>> batchStudents(
  BatchStudentsRef ref,
  String batchId,
) =>
    ref.watch(apiServiceProvider).getBatchStudents(batchId);

@riverpod
Future<List<ExamSummary>> teacherAssessments(TeacherAssessmentsRef ref) =>
    ref.watch(apiServiceProvider).getAssessments();

@riverpod
Future<List<Announcement>> teacherAnnouncements(
        TeacherAnnouncementsRef ref) =>
    ref.watch(apiServiceProvider).getAnnouncements();

@riverpod
Future<List<ScheduleEntry>> teacherSchedule(TeacherScheduleRef ref) =>
    ref.watch(apiServiceProvider).getTeacherSchedule();

@riverpod
Future<TeacherProfile> teacherProfile(TeacherProfileRef ref) =>
    ref.watch(apiServiceProvider).getTeacherProfile();
