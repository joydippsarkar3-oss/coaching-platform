import { useTranslations } from "next-intl";
import Link from "next/link";
import type { Center } from "@/lib/api";
import { CenterCard } from "@/components/centers/CenterCard";

interface FeaturedCentersMapProps {
  centers: Center[];
}

export function FeaturedCentersMap({ centers }: FeaturedCentersMapProps) {
  const t = useTranslations("home.featuredCenters");

  return (
    <section className="bg-gray-50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              {t("title")}
            </h2>
            <p className="mt-1 text-gray-600">{t("subtitle")}</p>
          </div>
          <Link
            href="/centers"
            className="shrink-0 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            {t("viewAll")} →
          </Link>
        </div>

        {/* Map placeholder */}
        <div className="mt-8 h-48 overflow-hidden rounded-xl bg-brand-100 flex items-center justify-center text-brand-400 border border-brand-200">
          <p className="text-sm font-medium">[Interactive map embed — configure NEXT_PUBLIC_MAPS_API_KEY]</p>
        </div>

        {/* Center cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {centers.slice(0, 6).map((center) => (
            <CenterCard key={center.id} center={center} />
          ))}
        </div>
      </div>
    </section>
  );
}
