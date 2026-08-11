import "package:dio/dio.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:retrofit/retrofit.dart";
import "package:riverpod_annotation/riverpod_annotation.dart";

import "client.dart";
import "models/api_models.dart";

part "api_service.g.dart";

@riverpod
ApiService apiService(ApiServiceRef ref) {
  final dio = ref.watch(dioClientProvider);
  return ApiService(dio);
}

@RestApi()
abstract class ApiService {
  factory ApiService(Dio dio, {String? baseUrl}) = _ApiService;

  // ── Auth ────────────────────────────────────────────────────────────────

  @POST("/auth/request-otp")
  Future<void> requestOtp({
    @Field("phone") required String phone,
  });

  @POST("/auth/verify-otp")
  Future<OtpVerifyResponse> verifyOtp({
    @Field("phone") required String phone,
    @Field("otp") required String otp,
  });

  // ── Student ─────────────────────────────────────────────────────────────

  @GET("/student/profile")
  Future<StudentProfile> getStudentProfile();

  @GET("/student/courses")
  Future<List<Course>> getStudentCourses();

  @GET("/student/exams")
  Future<List<ExamSummary>> getExamList();

  @POST("/student/exams/{examId}/start")
  Future<ExamSession> startExam(@Path("examId") String examId);

  @POST("/student/exams/{attemptId}/save-answers")
  Future<void> saveAnswers(
    @Path("attemptId") String attemptId,
    @Body() Map<String, dynamic> payload,
  );

  @POST("/student/exams/{attemptId}/submit")
  Future<ExamResult> submitExam(@Path("attemptId") String attemptId);

  @GET("/student/results")
  Future<List<ExamResult>> getResults();

  @GET("/student/fees")
  Future<List<FeeInstallment>> getFees();

  @GET("/student/fees/{installmentId}/payment-options")
  Future<PaymentOptions> getPaymentOptions(
      @Path("installmentId") String installmentId);

  @GET("/student/certificates")
  Future<List<Certificate>> getCertificates();

  @GET("/student/notifications")
  Future<List<AppNotification>> getNotifications();

  @POST("/student/notifications/{id}/read")
  Future<void> markNotificationRead(@Path("id") String id);

  // ── Center / Identity ────────────────────────────────────────────────────

  @POST("/onboarding/link-center")
  Future<void> linkCenter({
    @Field("center_code") required String centerCode,
    @Field("source") String source = "app",
  });

  @GET("/centers/verify/{certNo}")
  Future<Certificate> verifyCertificate(@Path("certNo") String certNo);

  // ── Teacher ──────────────────────────────────────────────────────────────

  @GET("/teacher/batches")
  Future<List<Batch>> getBatches();

  @GET("/teacher/batches/{batchId}/students")
  Future<List<RosterStudent>> getBatchStudents(@Path("batchId") String batchId);

  @POST("/teacher/attendance")
  Future<void> submitAttendance(@Body() Map<String, dynamic> payload);

  @GET("/teacher/assessments")
  Future<List<ExamSummary>> getAssessments();

  @POST("/teacher/marks")
  Future<void> submitMarks(@Body() Map<String, dynamic> payload);

  @GET("/teacher/announcements")
  Future<List<Announcement>> getAnnouncements();

  @POST("/teacher/announcements")
  Future<void> postAnnouncement(@Body() Map<String, dynamic> payload);

  // ── Wallet ───────────────────────────────────────────────────────────────

  @GET("/student/wallet")
  Future<WalletBalance> getWalletBalance();

  @GET("/student/wallet/transactions")
  Future<List<WalletTransaction>> getWalletTransactions();

  // ── Typing ───────────────────────────────────────────────────────────────

  @GET("/typing/leaderboard")
  Future<List<TypingLeaderboardEntry>> getTypingLeaderboard();

  // ── Doubts (student) ─────────────────────────────────────────────────────

  @GET("/student/doubts")
  Future<List<Doubt>> getDoubts();

  @POST("/student/doubts")
  Future<Doubt> postDoubt(@Field("question") String question);

  // ── Doubts (teacher) ─────────────────────────────────────────────────────

  @GET("/teacher/doubts")
  Future<List<Doubt>> getTeacherDoubts();

  @POST("/teacher/doubts/{id}/answer")
  Future<Doubt> answerDoubt(
    @Path("id") String id,
    @Field("answer") String answer,
  );

  // ── Homework (teacher) ───────────────────────────────────────────────────

  @GET("/teacher/homework")
  Future<List<HomeworkAssignment>> getTeacherHomework();

  @POST("/teacher/homework")
  Future<HomeworkAssignment> createHomework({
    @Field("title") required String title,
    @Field("description") required String description,
    @Field("due_date") required DateTime dueDate,
  });
}
