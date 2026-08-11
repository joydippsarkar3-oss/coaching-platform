import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  Monitor,
  Calculator,
  Keyboard,
  Code2,
  Cpu,
  Palette,
} from "lucide-react";

const CATEGORIES = [
  {
    key: "office",
    slug: "office",
    Icon: Monitor,
    color: "bg-blue-50 text-blue-600",
  },
  {
    key: "accounting",
    slug: "accounting",
    Icon: Calculator,
    color: "bg-green-50 text-green-600",
  },
  {
    key: "typing",
    slug: "typing",
    Icon: Keyboard,
    color: "bg-purple-50 text-purple-600",
  },
  {
    key: "programming",
    slug: "programming",
    Icon: Code2,
    color: "bg-orange-50 text-orange-600",
  },
  {
    key: "hardware",
    slug: "hardware",
    Icon: Cpu,
    color: "bg-red-50 text-red-600",
  },
  {
    key: "design",
    slug: "design",
    Icon: Palette,
    color: "bg-pink-50 text-pink-600",
  },
] as const;

export function CourseGrid() {
  const t = useTranslations("home.categories");

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">{t("title")}</h2>
          <p className="mt-2 text-gray-600">{t("subtitle")}</p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map(({ key, slug, Icon, color }) => (
            <Link
              key={key}
              href={`/courses?category=${slug}`}
              className="group flex flex-col items-center gap-3 rounded-xl border border-gray-100 bg-white p-5 text-center shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
            >
              <span className={`flex size-12 items-center justify-center rounded-xl ${color}`}>
                <Icon className="size-6" />
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-900 group-hover:text-brand-600">
                  {t(key as "office")}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {t(`${key}Desc` as "officeDesc")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
