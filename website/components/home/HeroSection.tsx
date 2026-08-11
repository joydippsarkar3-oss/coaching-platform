import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function HeroSection() {
  const t = useTranslations("home.hero");

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 px-4 py-16 text-white sm:px-6 sm:py-24 lg:px-8">
      {/* Background pattern */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Text */}
          <div className="text-center lg:text-left">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
              <ShieldCheck className="size-4 text-green-300" aria-hidden="true" />
              {t("badge")}
            </div>

            <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl md:text-5xl lg:text-5xl">
              {t("title")}
            </h1>

            <p className="mt-4 text-lg leading-relaxed text-brand-200 sm:text-xl">
              {t("subtitle")}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Button asChild size="lg" variant="secondary">
                <Link href="/courses">
                  {t("ctaPrimary")} <ArrowRight className="size-5" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <Link href="/centers">
                  {t("ctaSecondary")}
                </Link>
              </Button>
            </div>

            {/* Trust indicators */}
            <p className="mt-6 text-sm text-brand-300">
              {t("trustedBy")} Delhi, Mumbai, Lucknow, Patna, Jaipur &amp; 100+ more cities
            </p>
          </div>

          {/* Hero image placeholder */}
          <div
            className="relative mx-auto aspect-[4/3] w-full max-w-lg overflow-hidden rounded-2xl bg-brand-700/50 shadow-2xl lg:mx-0"
            aria-hidden="true"
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-brand-300">
              {/* Replace with actual hero photograph */}
              <div className="size-16 rounded-full bg-brand-600" />
              <p className="text-sm font-medium">[Hero photo — replace before launch]</p>
              <p className="text-xs opacity-70">Recommended: 800×600px, students in class</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
