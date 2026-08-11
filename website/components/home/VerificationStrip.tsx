import { useTranslations } from "next-intl";
import Link from "next/link";
import { ShieldCheck, ArrowRight } from "lucide-react";

export function VerificationStrip() {
  const t = useTranslations("home.verification");

  return (
    <section className="bg-brand-900 py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          <ShieldCheck className="size-12 shrink-0 text-green-400" />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white sm:text-xl">{t("title")}</h2>
            <p className="mt-1 text-sm text-brand-200">{t("subtitle")}</p>
          </div>
          <Link
            href="/verify"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50 transition-colors"
          >
            {t("cta")} <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
