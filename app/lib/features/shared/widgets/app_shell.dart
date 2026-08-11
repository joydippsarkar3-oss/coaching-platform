import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";

import "../../../core/auth/auth_state.dart";
import "../../../core/navigation/routes.dart";
import "package:go_router/go_router.dart";

class AppShell extends ConsumerWidget {
  const AppShell({
    super.key,
    required this.role,
    required this.child,
  });

  final UserRole role;
  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final location = GoRouterState.of(context).matchedLocation;

    if (role == UserRole.student) {
      return _StudentShell(location: location, child: child);
    } else {
      return _TeacherShell(location: location, child: child);
    }
  }
}

class _StudentShell extends StatelessWidget {
  const _StudentShell({required this.location, required this.child});
  final String location;
  final Widget child;

  int get _index {
    if (location.startsWith(Routes.studentCourses)) return 1;
    if (location.startsWith(Routes.studentExamList)) return 2;
    if (location.startsWith(Routes.studentFees)) return 3;
    if (location.startsWith(Routes.studentProfile)) return 4;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _index,
        onTap: (i) {
          switch (i) {
            case 0:
              context.go(Routes.studentHome);
            case 1:
              context.go(Routes.studentCourses);
            case 2:
              context.go(Routes.studentExamList);
            case 3:
              context.go(Routes.studentFees);
            case 4:
              context.go(Routes.studentProfile);
          }
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: "Home",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.menu_book_outlined),
            activeIcon: Icon(Icons.menu_book),
            label: "Courses",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.quiz_outlined),
            activeIcon: Icon(Icons.quiz),
            label: "Exams",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.account_balance_wallet_outlined),
            activeIcon: Icon(Icons.account_balance_wallet),
            label: "Fees",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: "Profile",
          ),
        ],
      ),
    );
  }
}

class _TeacherShell extends StatelessWidget {
  const _TeacherShell({required this.location, required this.child});
  final String location;
  final Widget child;

  int get _index {
    if (location.startsWith(Routes.teacherAttendance)) return 1;
    if (location.startsWith(Routes.teacherMarksEntry)) return 2;
    if (location.startsWith(Routes.teacherAnnouncements)) return 3;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _index,
        onTap: (i) {
          switch (i) {
            case 0:
              context.go(Routes.teacherToday);
            case 1:
              context.go(Routes.teacherAttendance);
            case 2:
              context.go(Routes.teacherMarksEntry);
            case 3:
              context.go(Routes.teacherAnnouncements);
          }
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.today_outlined),
            activeIcon: Icon(Icons.today),
            label: "Today",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.how_to_reg_outlined),
            activeIcon: Icon(Icons.how_to_reg),
            label: "Attendance",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.edit_note_outlined),
            activeIcon: Icon(Icons.edit_note),
            label: "Marks",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.campaign_outlined),
            activeIcon: Icon(Icons.campaign),
            label: "Announce",
          ),
        ],
      ),
    );
  }
}
