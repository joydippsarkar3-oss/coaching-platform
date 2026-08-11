import "package:flutter/material.dart";

import "../../../core/theme/app_theme.dart";

class AttendanceQuickMark extends StatelessWidget {
  const AttendanceQuickMark({
    super.key,
    required this.present,
    required this.onToggle,
  });

  final bool present;
  final void Function(bool) onToggle;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        _MarkBtn(
          label: "P",
          active: present,
          activeColor: AppTheme.successGreen,
          onTap: () => onToggle(true),
        ),
        const SizedBox(width: 6),
        _MarkBtn(
          label: "A",
          active: !present,
          activeColor: AppTheme.errorRed,
          onTap: () => onToggle(false),
        ),
      ],
    );
  }
}

class _MarkBtn extends StatelessWidget {
  const _MarkBtn({
    required this.label,
    required this.active,
    required this.activeColor,
    required this.onTap,
  });

  final String label;
  final bool active;
  final Color activeColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: active ? activeColor : const Color(0xFFF3F4F6),
          shape: BoxShape.circle,
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 14,
            color: active ? Colors.white : const Color(0xFF9CA3AF),
          ),
        ),
      ),
    );
  }
}
