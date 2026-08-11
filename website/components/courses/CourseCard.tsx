import Link from "next/link";
import { useTranslations } from "next-intl";
import { Clock, BarChart2, Building2, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { Course } from "@/lib/api";

interface CourseCardProps {
  course: Course;
}

const levelVariant: Record<Course["level"], "primary" | "warning" | "danger"> = {
  beginner: "primary",
  intermediate: "warning",
  advanced: "danger",
};

export function CourseCard({ course }: CourseCardProps) {
  const t = useTranslations("courses.card");

  return (
    <Card hover className="flex flex-col">
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-gray-900 leading-snug">
            {course.name}
          </h3>
          <Badge variant={levelVariant[course.level]} className="shrink-0">
            {t(course.level)}
          </Badge>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
          {course.shortDescription}
        </p>

        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />
            {course.durationMonths}{" "}
            {course.durationMonths === 1 ? "month" : "months"}
          </span>
          <span className="flex items-center gap-1">
            <Building2 className="size-3.5" />
            {t("offeredAt", { count: course.centersCount })}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        {course.feesFrom && (
          <p className="text-sm font-semibold text-gray-900">
            From <span className="text-brand-600">₹{course.feesFrom.toLocaleString("en-IN")}</span>
          </p>
        )}
        <Link
          href={`/courses/${course.slug}`}
          className="ml-auto flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          {t("learnMore")} <ArrowRight className="size-4" />
        </Link>
      </div>
    </Card>
  );
}
