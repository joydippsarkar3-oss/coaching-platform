import Link from "next/link";
import { useTranslations } from "next-intl";
import { MapPin, Phone, BookOpen, Users, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { Center } from "@/lib/api";

interface CenterCardProps {
  center: Center;
}

export function CenterCard({ center }: CenterCardProps) {
  const t = useTranslations("centers");

  return (
    <Card hover className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        {/* Logo/photo placeholder */}
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600 font-bold text-lg">
          {center.name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-gray-900">{center.name}</h3>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{center.city}, {center.state}</span>
          </div>
        </div>
        {center.isVerified && (
          <Badge variant="success" className="shrink-0">
            <ShieldCheck className="mr-1 size-3" />
            {t("verified")}
          </Badge>
        )}
      </div>

      <div className="flex gap-4 text-xs text-gray-600">
        <span className="flex items-center gap-1">
          <BookOpen className="size-3.5 text-gray-400" />
          {center.courses.length} {t("courses")}
        </span>
        {center.studentsCount && (
          <span className="flex items-center gap-1">
            <Users className="size-3.5 text-gray-400" />
            {center.studentsCount.toLocaleString("en-IN")} {t("students")}
          </span>
        )}
        {center.establishedYear && (
          <span className="text-gray-400">
            {t("established")} {center.establishedYear}
          </span>
        )}
      </div>

      {center.phone && (
        <a
          href={`tel:${center.phone}`}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-brand-600"
        >
          <Phone className="size-3.5" />
          {center.phone}
        </a>
      )}

      <Link
        href={`/c/${center.slug}`}
        className="mt-auto block rounded-lg border border-brand-600 px-4 py-2 text-center text-sm font-medium text-brand-600 hover:bg-brand-50 transition-colors"
      >
        {t("viewDetails")}
      </Link>
    </Card>
  );
}
