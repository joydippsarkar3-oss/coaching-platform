import "package:flutter/material.dart";

import "../../../core/api/models/api_models.dart";
import "../../../core/theme/app_theme.dart";

class QuestionPalette extends StatelessWidget {
  const QuestionPalette({
    super.key,
    required this.questions,
    required this.answers,
    required this.markedForReview,
    required this.currentIndex,
    required this.onJump,
  });

  final List<ExamQuestion> questions;
  final Map<String, dynamic> answers;
  final Set<String> markedForReview;
  final int currentIndex;
  final void Function(int index) onJump;

  Color _colorFor(ExamQuestion q, int index) {
    if (index == currentIndex) return AppTheme.examCurrent;
    if (markedForReview.contains(q.id)) return AppTheme.examMarkedReview;
    if (answers.containsKey(q.id)) return AppTheme.examAnswered;
    return AppTheme.examSkipped;
  }

  @override
  Widget build(BuildContext context) {
    final answered = answers.length;
    final marked = markedForReview.length;
    final skipped = questions.length - answered;

    return Drawer(
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 8, 12),
              child: Row(
                children: [
                  const Expanded(
                    child: Text(
                      "Question Palette",
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF111827),
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
            ),

            // Legend
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Wrap(
                spacing: 12,
                runSpacing: 6,
                children: [
                  _LegendDot(
                      color: AppTheme.examAnswered, label: "Answered ($answered)"),
                  _LegendDot(
                      color: AppTheme.examMarkedReview,
                      label: "Review ($marked)"),
                  _LegendDot(color: AppTheme.examSkipped, label: "Skipped ($skipped)"),
                  _LegendDot(
                      color: AppTheme.examCurrent, label: "Current"),
                ],
              ),
            ),

            const Divider(height: 24),

            // Grid
            Expanded(
              child: GridView.builder(
                padding: const EdgeInsets.all(16),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 5,
                  mainAxisSpacing: 10,
                  crossAxisSpacing: 10,
                  childAspectRatio: 1,
                ),
                itemCount: questions.length,
                itemBuilder: (ctx, i) {
                  final q = questions[i];
                  final color = _colorFor(q, i);
                  final isCurrent = i == currentIndex;
                  return GestureDetector(
                    onTap: () {
                      Navigator.pop(context);
                      onJump(i);
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      decoration: BoxDecoration(
                        color: color,
                        shape: BoxShape.circle,
                        border: isCurrent
                            ? Border.all(color: Colors.white, width: 2)
                            : null,
                        boxShadow: isCurrent
                            ? [
                                BoxShadow(
                                  color: AppTheme.examCurrent.withOpacity(0.4),
                                  blurRadius: 6,
                                  spreadRadius: 1,
                                ),
                              ]
                            : null,
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        "${i + 1}",
                        style: TextStyle(
                          color:
                              color == AppTheme.examSkipped ? const Color(0xFF374151) : Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LegendDot extends StatelessWidget {
  const _LegendDot({required this.color, required this.label});
  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: const TextStyle(fontSize: 11, color: Color(0xFF6B7280)),
        ),
      ],
    );
  }
}
