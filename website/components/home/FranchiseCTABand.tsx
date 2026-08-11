import { useTranslations } from "next-intl";
import Link from "next/link";
import { TrendingUp, Handshake, Clock, ArrowRight } from "lucide-react";

export function FranchiseCTABand() {
  const t = useTranslations("home.franchise");

  const stats = [
    { icon: Handshake, label: t("stat1") },
    { icon: TrendingUp, label: t("stat2") },
    { icon: Clock, label: t("stat3") },
  ];

  return (
    <section className="bg-gradient-to-r from-accent-600 to-accent-500 py-14 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">{t("title")}</h2>
            <p className="mt-2 text-accent-100">{t("subtitle")}</p>

            <div className="mt-6 flex flex-wrap gap-6">
              {stats.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="size-5 text-accent-200" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <Link
              href="/franchise"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-accent-700 shadow-lg hover:bg-accent-50 transition-colors"
            >
              {t("cta")} <ArrowRight className="size-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
