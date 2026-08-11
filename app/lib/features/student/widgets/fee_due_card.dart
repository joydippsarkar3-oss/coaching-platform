import "package:flutter/material.dart";

import "../../../core/api/models/api_models.dart";
import "../../../core/theme/app_theme.dart";
import "../../../core/utils/money_formatter.dart";
import "../../../core/utils/date_utils.dart";

class FeeDueCard extends StatelessWidget {
  const FeeDueCard({
    super.key,
    required this.installment,
    required this.onPayTap,
  });

  final FeeInstallment installment;
  final VoidCallback onPayTap;

  @override
  Widget build(BuildContext context) {
    final isOverdue = installment.isOverdue;
    final cardColor =
        isOverdue ? const Color(0xFFFEF2F2) : const Color(0xFFFFFBEB);
    final borderColor = isOverdue ? AppTheme.feeOverdue : AppTheme.feePending;
    final labelColor = isOverdue ? AppTheme.feeOverdue : AppTheme.feePending;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor, width: 1.5),
      ),
      child: Row(
        children: [
          Icon(
            isOverdue ? Icons.warning_amber_rounded : Icons.schedule,
            color: labelColor,
            size: 28,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isOverdue ? "Fee Overdue" : "Fee Due",
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                    color: labelColor,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  installment.courseTitle,
                  style: const TextStyle(
                    fontSize: 13,
                    color: Color(0xFF374151),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  "Due ${AppDateUtils.humanDate(installment.dueDate)}",
                  style: TextStyle(fontSize: 12, color: labelColor),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                formatPaiseCompact(installment.amountPaise),
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 18,
                  color: labelColor,
                ),
              ),
              const SizedBox(height: 4),
              ElevatedButton(
                onPressed: onPayTap,
                style: ElevatedButton.styleFrom(
                  backgroundColor: labelColor,
                  minimumSize: const Size(80, 32),
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  textStyle: const TextStyle(
                      fontSize: 13, fontWeight: FontWeight.w700),
                ),
                child: const Text("Pay Now"),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
