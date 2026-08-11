import "package:flutter/foundation.dart";

@immutable
class OtpVerifyResponse {
  const OtpVerifyResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.userId,
    required this.role,
    required this.displayName,
    this.centerCode,
  });

  final String accessToken;
  final String refreshToken;
  final String userId;
  final String role; // "student" | "teacher"
  final String displayName;
  final String? centerCode;

  factory OtpVerifyResponse.fromJson(Map<String, dynamic> json) =>
      OtpVerifyResponse(
        accessToken: json["access_token"] as String,
        refreshToken: json["refresh_token"] as String,
        userId: json["user_id"] as String,
        role: json["role"] as String,
        displayName: json["display_name"] as String,
        centerCode: json["center_code"] as String?,
      );
}

@immutable
class StudentProfile {
  const StudentProfile({
    required this.id,
    required this.name,
    required this.phone,
    required this.centerCode,
    required this.centerName,
    this.avatarUrl,
    required this.enrolledCourseIds,
    required this.streakDays,
  });

  final String id;
  final String name;
  final String phone;
  final String centerCode;
  final String centerName;
  final String? avatarUrl;
  final List<String> enrolledCourseIds;
  final int streakDays;

  factory StudentProfile.fromJson(Map<String, dynamic> json) => StudentProfile(
        id: json["id"] as String,
        name: json["name"] as String,
        phone: json["phone"] as String,
        centerCode: json["center_code"] as String,
        centerName: json["center_name"] as String,
        avatarUrl: json["avatar_url"] as String?,
        enrolledCourseIds:
            List<String>.from(json["enrolled_course_ids"] as List),
        streakDays: json["streak_days"] as int? ?? 0,
      );
}

@immutable
class Course {
  const Course({
    required this.id,
    required this.title,
    required this.thumbnailUrl,
    required this.progressPercent,
    required this.totalUnits,
    required this.completedUnits,
  });

  final String id;
  final String title;
  final String thumbnailUrl;
  final double progressPercent;
  final int totalUnits;
  final int completedUnits;

  factory Course.fromJson(Map<String, dynamic> json) => Course(
        id: json["id"] as String,
        title: json["title"] as String,
        thumbnailUrl: json["thumbnail_url"] as String,
        progressPercent: (json["progress_percent"] as num).toDouble(),
        totalUnits: json["total_units"] as int,
        completedUnits: json["completed_units"] as int,
      );
}

@immutable
class ExamOption {
  const ExamOption({required this.id, required this.text});
  final String id;
  final String text;
  factory ExamOption.fromJson(Map<String, dynamic> json) =>
      ExamOption(id: json["id"] as String, text: json["text"] as String);
}

@immutable
class ExamQuestion {
  const ExamQuestion({
    required this.id,
    required this.questionNo,
    required this.text,
    required this.type,
    required this.options,
    this.imageUrl,
    required this.marks,
  });

  final String id;
  final int questionNo;
  final String text;
  final String type; // "MCQ" | "MCQ_MULTI" | "TF"
  final List<ExamOption> options;
  final String? imageUrl;
  final int marks;

  factory ExamQuestion.fromJson(Map<String, dynamic> json) => ExamQuestion(
        id: json["id"] as String,
        questionNo: json["question_no"] as int,
        text: json["text"] as String,
        type: json["type"] as String,
        options: (json["options"] as List)
            .map((o) => ExamOption.fromJson(o as Map<String, dynamic>))
            .toList(),
        imageUrl: json["image_url"] as String?,
        marks: json["marks"] as int,
      );
}

@immutable
class ExamSummary {
  const ExamSummary({
    required this.id,
    required this.title,
    required this.courseId,
    required this.durationMinutes,
    required this.totalMarks,
    required this.startTime,
    required this.endTime,
    required this.status,
    this.attemptId,
  });

  final String id;
  final String title;
  final String courseId;
  final int durationMinutes;
  final int totalMarks;
  final DateTime startTime;
  final DateTime endTime;
  final String status; // "upcoming" | "active" | "completed" | "result_pending"
  final String? attemptId;

  factory ExamSummary.fromJson(Map<String, dynamic> json) => ExamSummary(
        id: json["id"] as String,
        title: json["title"] as String,
        courseId: json["course_id"] as String,
        durationMinutes: json["duration_minutes"] as int,
        totalMarks: json["total_marks"] as int,
        startTime: DateTime.parse(json["start_time"] as String),
        endTime: DateTime.parse(json["end_time"] as String),
        status: json["status"] as String,
        attemptId: json["attempt_id"] as String?,
      );
}

@immutable
class ExamSession {
  const ExamSession({
    required this.attemptId,
    required this.examId,
    required this.title,
    required this.serverEndTime,
    required this.questions,
    required this.instructions,
  });

  final String attemptId;
  final String examId;
  final String title;
  final DateTime serverEndTime;
  final List<ExamQuestion> questions;
  final String instructions;

  factory ExamSession.fromJson(Map<String, dynamic> json) => ExamSession(
        attemptId: json["attempt_id"] as String,
        examId: json["exam_id"] as String,
        title: json["title"] as String,
        serverEndTime: DateTime.parse(json["server_end_time"] as String),
        questions: (json["questions"] as List)
            .map((q) => ExamQuestion.fromJson(q as Map<String, dynamic>))
            .toList(),
        instructions: json["instructions"] as String? ?? "",
      );
}

@immutable
class ExamResult {
  const ExamResult({
    required this.attemptId,
    required this.examId,
    required this.examTitle,
    required this.marksObtained,
    required this.totalMarks,
    required this.percentage,
    required this.passed,
    required this.submittedAt,
    this.rankInBatch,
  });

  final String attemptId;
  final String examId;
  final String examTitle;
  final int marksObtained;
  final int totalMarks;
  final double percentage;
  final bool passed;
  final DateTime submittedAt;
  final int? rankInBatch;

  factory ExamResult.fromJson(Map<String, dynamic> json) => ExamResult(
        attemptId: json["attempt_id"] as String,
        examId: json["exam_id"] as String,
        examTitle: json["exam_title"] as String,
        marksObtained: json["marks_obtained"] as int,
        totalMarks: json["total_marks"] as int,
        percentage: (json["percentage"] as num).toDouble(),
        passed: json["passed"] as bool,
        submittedAt: DateTime.parse(json["submitted_at"] as String),
        rankInBatch: json["rank_in_batch"] as int?,
      );
}

@immutable
class FeeInstallment {
  const FeeInstallment({
    required this.id,
    required this.courseId,
    required this.courseTitle,
    required this.amountPaise,
    required this.dueDate,
    required this.status,
    this.paidAt,
    this.receiptUrl,
  });

  final String id;
  final String courseId;
  final String courseTitle;
  final int amountPaise;
  final DateTime dueDate;
  final String status; // "paid" | "upcoming" | "overdue"
  final DateTime? paidAt;
  final String? receiptUrl;

  bool get isOverdue => status == "overdue";
  bool get isPaid => status == "paid";

  factory FeeInstallment.fromJson(Map<String, dynamic> json) => FeeInstallment(
        id: json["id"] as String,
        courseId: json["course_id"] as String,
        courseTitle: json["course_title"] as String,
        amountPaise: json["amount_paise"] as int,
        dueDate: DateTime.parse(json["due_date"] as String),
        status: json["status"] as String,
        paidAt: json["paid_at"] != null
            ? DateTime.parse(json["paid_at"] as String)
            : null,
        receiptUrl: json["receipt_url"] as String?,
      );
}

@immutable
class Certificate {
  const Certificate({
    required this.certNo,
    required this.courseTitle,
    required this.studentName,
    required this.issuedAt,
    required this.verifyUrl,
    this.pdfUrl,
  });

  final String certNo;
  final String courseTitle;
  final String studentName;
  final DateTime issuedAt;
  final String verifyUrl;
  final String? pdfUrl;

  factory Certificate.fromJson(Map<String, dynamic> json) => Certificate(
        certNo: json["cert_no"] as String,
        courseTitle: json["course_title"] as String,
        studentName: json["student_name"] as String,
        issuedAt: DateTime.parse(json["issued_at"] as String),
        verifyUrl: json["verify_url"] as String,
        pdfUrl: json["pdf_url"] as String?,
      );
}

@immutable
class AppNotification {
  const AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.createdAt,
    required this.isRead,
    this.deepLink,
  });

  final String id;
  final String title;
  final String body;
  final DateTime createdAt;
  final bool isRead;
  final String? deepLink;

  factory AppNotification.fromJson(Map<String, dynamic> json) =>
      AppNotification(
        id: json["id"] as String,
        title: json["title"] as String,
        body: json["body"] as String,
        createdAt: DateTime.parse(json["created_at"] as String),
        isRead: json["is_read"] as bool? ?? false,
        deepLink: json["deep_link"] as String?,
      );
}

@immutable
class RosterStudent {
  const RosterStudent({
    required this.id,
    required this.name,
    required this.rollNo,
    this.avatarUrl,
  });

  final String id;
  final String name;
  final String rollNo;
  final String? avatarUrl;

  factory RosterStudent.fromJson(Map<String, dynamic> json) => RosterStudent(
        id: json["id"] as String,
        name: json["name"] as String,
        rollNo: json["roll_no"] as String,
        avatarUrl: json["avatar_url"] as String?,
      );
}

@immutable
class Batch {
  const Batch({
    required this.id,
    required this.name,
    required this.courseTitle,
    required this.studentCount,
  });

  final String id;
  final String name;
  final String courseTitle;
  final int studentCount;

  factory Batch.fromJson(Map<String, dynamic> json) => Batch(
        id: json["id"] as String,
        name: json["name"] as String,
        courseTitle: json["course_title"] as String,
        studentCount: json["student_count"] as int,
      );
}

@immutable
class Announcement {
  const Announcement({
    required this.id,
    required this.title,
    required this.body,
    required this.postedAt,
    required this.targetAudience,
  });

  final String id;
  final String title;
  final String body;
  final DateTime postedAt;
  final String targetAudience; // "all" | "students" | "teachers"

  factory Announcement.fromJson(Map<String, dynamic> json) => Announcement(
        id: json["id"] as String,
        title: json["title"] as String,
        body: json["body"] as String,
        postedAt: DateTime.parse(json["posted_at"] as String),
        targetAudience: json["target_audience"] as String,
      );
}

// ── Wallet ────────────────────────────────────────────────────────────────────

@immutable
class WalletBalance {
  const WalletBalance({required this.id, required this.balancePaise});
  final String id;
  final int balancePaise;
  factory WalletBalance.fromJson(Map<String, dynamic> json) => WalletBalance(
        id: json['id'] as String,
        balancePaise: json['balance_paise'] as int,
      );
}

@immutable
class WalletTransaction {
  const WalletTransaction({
    required this.id,
    required this.type,
    required this.amountPaise,
    required this.createdAt,
    this.description,
  });
  final String id;
  final String type; // CREDIT | DEBIT | REFUND
  final int amountPaise;
  final DateTime createdAt;
  final String? description;
  factory WalletTransaction.fromJson(Map<String, dynamic> json) =>
      WalletTransaction(
        id: json['id'] as String,
        type: json['type'] as String,
        amountPaise: json['amount_paise'] as int,
        createdAt: DateTime.parse(json['created_at'] as String),
        description: json['description'] as String?,
      );
}

// ── Typing ────────────────────────────────────────────────────────────────────

@immutable
class TypingLeaderboardEntry {
  const TypingLeaderboardEntry({
    required this.rank,
    required this.studentName,
    required this.netWpm,
    required this.accuracy,
    required this.preset,
    required this.achievedAt,
  });
  final int rank;
  final String studentName;
  final double netWpm;
  final double accuracy;
  final String preset;
  final DateTime achievedAt;
  factory TypingLeaderboardEntry.fromJson(Map<String, dynamic> json) =>
      TypingLeaderboardEntry(
        rank: json['rank'] as int,
        studentName: json['student_name'] as String,
        netWpm: (json['net_wpm'] as num).toDouble(),
        accuracy: (json['accuracy'] as num).toDouble(),
        preset: json['preset'] as String,
        achievedAt: DateTime.parse(json['achieved_at'] as String),
      );
}

// ── Doubts ────────────────────────────────────────────────────────────────────

@immutable
class Doubt {
  const Doubt({
    required this.id,
    required this.question,
    required this.createdAt,
    this.studentName,
    this.answer,
    this.answeredAt,
  });
  final String id;
  final String question;
  final DateTime createdAt;
  final String? studentName;
  final String? answer;
  final DateTime? answeredAt;
  factory Doubt.fromJson(Map<String, dynamic> json) => Doubt(
        id: json['id'] as String,
        question: json['question'] as String,
        createdAt: DateTime.parse(json['created_at'] as String),
        studentName: json['student_name'] as String?,
        answer: json['answer'] as String?,
        answeredAt: json['answered_at'] != null
            ? DateTime.parse(json['answered_at'] as String)
            : null,
      );
}

// ── Homework ──────────────────────────────────────────────────────────────────

@immutable
class HomeworkAssignment {
  const HomeworkAssignment({
    required this.id,
    required this.title,
    required this.batchName,
    required this.dueDate,
    required this.status,
    this.description,
  });
  final String id;
  final String title;
  final String batchName;
  final DateTime dueDate;
  final String status; // OPEN | CLOSED
  final String? description;
  factory HomeworkAssignment.fromJson(Map<String, dynamic> json) =>
      HomeworkAssignment(
        id: json['id'] as String,
        title: json['title'] as String,
        batchName: json['batch_name'] as String,
        dueDate: DateTime.parse(json['due_date'] as String),
        status: json['status'] as String,
        description: json['description'] as String?,
      );
}

// ── Payment ───────────────────────────────────────────────────────────────────

@immutable
class PaymentOptions {
  const PaymentOptions({
    required this.upiDeepLink,
    required this.qrImageUrl,
    required this.gatewayUrl,
    required this.amountPaise,
    required this.orderId,
  });

  final String upiDeepLink;
  final String qrImageUrl;
  final String gatewayUrl;
  final int amountPaise;
  final String orderId;

  factory PaymentOptions.fromJson(Map<String, dynamic> json) => PaymentOptions(
        upiDeepLink: json["upi_deep_link"] as String,
        qrImageUrl: json["qr_image_url"] as String,
        gatewayUrl: json["gateway_url"] as String,
        amountPaise: json["amount_paise"] as int,
        orderId: json["order_id"] as String,
      );
}
