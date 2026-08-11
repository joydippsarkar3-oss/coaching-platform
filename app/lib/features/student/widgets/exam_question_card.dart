import "package:flutter/material.dart";

import "../../../core/api/models/api_models.dart";
import "../../../core/theme/app_theme.dart";

class ExamQuestionCard extends StatelessWidget {
  const ExamQuestionCard({
    super.key,
    required this.question,
    required this.currentAnswer,
    required this.onAnswerSelected,
  });

  final ExamQuestion question;
  final dynamic currentAnswer; // String for MCQ/TF, List<String> for MCQ_MULTI
  final void Function(dynamic answer) onAnswerSelected;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Question text
          if (question.imageUrl != null) ...[
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: Image.network(
                question.imageUrl!,
                width: double.infinity,
                height: 180,
                fit: BoxFit.contain,
                errorBuilder: (_, __, ___) => const SizedBox.shrink(),
              ),
            ),
            const SizedBox(height: 16),
          ],
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE5E7EB)),
            ),
            child: Text(
              question.text,
              style: const TextStyle(
                fontSize: 16,
                height: 1.6,
                color: Color(0xFF111827),
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Marks badge
          Align(
            alignment: Alignment.centerRight,
            child: Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                "${question.marks} mark${question.marks > 1 ? "s" : ""}",
                style: const TextStyle(
                  fontSize: 12,
                  color: AppTheme.brandBlue,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Options
          if (question.type == "TF")
            _buildTrueFalseOptions()
          else if (question.type == "MCQ_MULTI")
            _buildMultiSelectOptions()
          else
            _buildSingleSelectOptions(),

          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildSingleSelectOptions() {
    return Column(
      children: question.options.map((opt) {
        final selected = currentAnswer == opt.id;
        return _OptionTile(
          label: opt.text,
          optionId: opt.id,
          selected: selected,
          onTap: () => onAnswerSelected(opt.id),
        );
      }).toList(),
    );
  }

  Widget _buildMultiSelectOptions() {
    final selected = currentAnswer is List
        ? List<String>.from(currentAnswer as List)
        : <String>[];
    return Column(
      children: question.options.map((opt) {
        final isSelected = selected.contains(opt.id);
        return _OptionTile(
          label: opt.text,
          optionId: opt.id,
          selected: isSelected,
          isMultiSelect: true,
          onTap: () {
            final updated = List<String>.from(selected);
            if (isSelected) {
              updated.remove(opt.id);
            } else {
              updated.add(opt.id);
            }
            onAnswerSelected(updated.isEmpty ? null : updated);
          },
        );
      }).toList(),
    );
  }

  Widget _buildTrueFalseOptions() {
    return Row(
      children: [
        Expanded(
          child: _OptionTile(
            label: "Yes / True",
            optionId: "true",
            selected: currentAnswer == "true",
            onTap: () => onAnswerSelected("true"),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _OptionTile(
            label: "No / False",
            optionId: "false",
            selected: currentAnswer == "false",
            onTap: () => onAnswerSelected("false"),
          ),
        ),
      ],
    );
  }
}

class _OptionTile extends StatelessWidget {
  const _OptionTile({
    required this.label,
    required this.optionId,
    required this.selected,
    required this.onTap,
    this.isMultiSelect = false,
  });

  final String label;
  final String optionId;
  final bool selected;
  final VoidCallback onTap;
  final bool isMultiSelect;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: selected ? AppTheme.brandBlue.withOpacity(0.08) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? AppTheme.brandBlue : const Color(0xFFD1D5DB),
            width: selected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            isMultiSelect
                ? AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    width: 22,
                    height: 22,
                    decoration: BoxDecoration(
                      color: selected ? AppTheme.brandBlue : Colors.transparent,
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(
                        color: selected
                            ? AppTheme.brandBlue
                            : const Color(0xFFD1D5DB),
                        width: 2,
                      ),
                    ),
                    child: selected
                        ? const Icon(Icons.check, color: Colors.white, size: 14)
                        : null,
                  )
                : AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    width: 22,
                    height: 22,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: selected ? AppTheme.brandBlue : Colors.transparent,
                      border: Border.all(
                        color: selected
                            ? AppTheme.brandBlue
                            : const Color(0xFFD1D5DB),
                        width: 2,
                      ),
                    ),
                    child: selected
                        ? const Icon(Icons.circle, color: Colors.white, size: 10)
                        : null,
                  ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight:
                      selected ? FontWeight.w600 : FontWeight.w400,
                  color: selected
                      ? AppTheme.brandBlue
                      : const Color(0xFF374151),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
