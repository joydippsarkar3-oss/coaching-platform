import "package:flutter/material.dart";

import "../../../core/api/models/api_models.dart";
import "../../../core/theme/app_theme.dart";

class BatchRosterRow extends StatelessWidget {
  const BatchRosterRow({
    super.key,
    required this.student,
    required this.present,
    required this.onToggle,
  });

  final RosterStudent student;
  final bool present;
  final void Function(bool) onToggle;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 3),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: present
              ? const Color(0xFFBBF7D0)
              : const Color(0xFFFECACA),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 18,
            backgroundColor: present
                ? AppTheme.successGreen.withOpacity(0.15)
                : AppTheme.errorRed.withOpacity(0.12),
            child: Text(
              student.name.isNotEmpty ? student.name[0].toUpperCase() : "?",
              style: TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 14,
                color: present ? AppTheme.successGreen : AppTheme.errorRed,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  student.name,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                    color: Color(0xFF111827),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  student.rollNo,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF6B7280),
                  ),
                ),
              ],
            ),
          ),
          AttendanceQuickMark(
            present: present,
            onToggle: onToggle,
          ),
        ],
      ),
    );
  }
}
