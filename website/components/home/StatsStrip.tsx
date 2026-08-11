import { useTranslations } from "next-intl";
import { formatNumber } from "@/lib/utils";
import { Users, Building2, BookOpen, MapPin, Briefcase } from "lucide-react";
import type { ApiStats } from "@/lib/api";

interface StatsStripProps {
  stats: ApiStats;
}

export function StatsStrip({ stats }: StatsStripProps) {
  const t = useTranslations("home.stats");

  const items = [
    { icon: Users, value: stats.studentsEnrolled, label: t("students") },
    { icon: Building2, value: stats.centersCount, label: t("centers") },
    { icon: BookOpen, value: stats.coursesCount, label: t("courses") },
    { icon: MapPin, value: stats.statesCount, label: t("states") },
    { icon: Briefcase, value: stats.placementsAssisted, label: t("placements") },
  ];

  return (
    <section className="border-y border-gray-200 bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {items.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex flex-col items-center gap-1 text-center">
              <Icon className="mb-1 size-6 text-brand-600" />
              <dt className="text-2xl font-extrabold text-brand-900 sm:text-3xl">
                {formatNumber(value)}+
              </dt>
              <dd className="text-xs font-medium uppercase tracking-wide text-gray-500 sm:text-sm">
                {label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
