import "package:cached_network_image/cached_network_image.dart";
import "package:flutter/material.dart";

import "../../../core/api/models/api_models.dart";
import "../../../core/theme/app_theme.dart";

class CourseProgressCard extends StatelessWidget {
  const CourseProgressCard({super.key, required this.course});
  final Course course;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: CachedNetworkImage(
              imageUrl: course.thumbnailUrl,
              width: 52,
              height: 52,
              fit: BoxFit.cover,
              errorWidget: (_, __, ___) => Container(
                width: 52,
                height: 52,
                color: const Color(0xFFE0E7FF),
                child: const Icon(Icons.menu_book,
                    color: AppTheme.brandBlue, size: 28),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  course.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                    color: Color(0xFF111827),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  "${course.completedUnits}/${course.totalUnits} units",
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF6B7280),
                  ),
                ),
                const SizedBox(height: 6),
                LinearProgressIndicator(
                  value: course.progressPercent / 100,
                  minHeight: 5,
                  borderRadius: BorderRadius.circular(4),
                  backgroundColor: const Color(0xFFE5E7EB),
                  color: AppTheme.brandBlue,
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Text(
            "${course.progressPercent.toStringAsFixed(0)}%",
            style: const TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 14,
              color: AppTheme.brandBlue,
            ),
          ),
        ],
      ),
    );
  }
}
