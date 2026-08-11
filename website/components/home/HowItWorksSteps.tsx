import { useTranslations } from "next-intl";
import { Search, MapPin, FileText, GraduationCap } from "lucide-react";

const STEP_ICONS = [Search, MapPin, FileText, GraduationCap];

export function HowItWorksSteps() {
  const t = useTranslations("home.howItWorks");

  const steps = [1, 2, 3, 4].map((n) => ({
    n,
    title: t(`step${n}Title` as "step1Title"),
    desc: t(`step${n}Desc` as "step1Desc"),
    Icon: STEP_ICONS[n - 1],
  }));

  return (
    <section className="bg-brand-50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">{t("title")}</h2>
          <p className="mt-2 text-gray-600">{t("subtitle")}</p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ n, title, desc, Icon }) => (
            <div key={n} className="relative flex flex-col items-center text-center">
              {/* Connector line (desktop) */}
              {n < 4 && (
                <div
                  aria-hidden="true"
                  className="absolute left-1/2 top-8 hidden h-0.5 w-full bg-brand-200 lg:block"
                />
              )}

              <div className="relative flex size-16 items-center justify-center rounded-full bg-brand-600 text-white shadow-md">
                <Icon className="size-7" />
                <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-accent-500 text-xs font-bold text-white">
                  {n}
                </span>
              </div>

              <h3 className="mt-4 text-base font-semibold text-gray-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
