/// Route path constants.
class Routes {
  Routes._();

  // Onboarding
  static const splash = '/';
  static const login = '/login';
  static const linkIdentity = '/link-identity';
  static const consent = '/consent';

  // Student
  static const studentHome = '/student/home';
  static const studentCourses = '/student/courses';
  static const studentExamList = '/student/exams';
  static const studentExamRunner = '/student/exams/:examId/run';
  static const studentResults = '/student/results';
  static const studentFees = '/student/fees';
  static const studentCertificates = '/student/certificates';
  static const studentNotifications = '/student/notifications';
  static const studentProfile = '/student/profile';
  static const studentTyping = '/student/typing';   // S6
  static const studentWallet = '/student/wallet';   // S8
  static const studentDoubts = '/student/doubts';   // S10

  // Teacher
  static const teacherToday = '/teacher/today';
  static const teacherAttendance = '/teacher/attendance';
  static const teacherMarksEntry = '/teacher/marks';
  static const teacherAnnouncements = '/teacher/announcements';
  static const teacherHomework = '/teacher/homework';        // T4
  static const teacherDoubts = '/teacher/doubts';            // T5

  // Deep links
  static const deepExam = '/exam/:examId';
  static const deepVerify = '/verify/:certNo';
}
