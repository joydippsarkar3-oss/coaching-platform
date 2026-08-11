import "package:flutter/material.dart";
import "package:shimmer/shimmer.dart";

class LoadingShimmer extends StatelessWidget {
  const LoadingShimmer({
    super.key,
    this.height = 80,
    this.borderRadius = 12,
    this.margin = const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
  });

  final double height;
  final double borderRadius;
  final EdgeInsets margin;

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: const Color(0xFFE5E7EB),
      highlightColor: const Color(0xFFF9FAFB),
      child: Container(
        height: height,
        margin: margin,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(borderRadius),
        ),
      ),
    );
  }

  static Widget list({int count = 5, double height = 80}) => Column(
        children: List.generate(
          count,
          (_) => LoadingShimmer(height: height),
        ),
      );
}
