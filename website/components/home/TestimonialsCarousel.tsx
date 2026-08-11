"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import type { Testimonial } from "@/lib/api";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

interface TestimonialsCarouselProps {
  testimonials: Testimonial[];
  /** Only renders if consent flag is true (GDPR / minor-protection) */
  consentGranted: boolean;
}

export function TestimonialsCarousel({
  testimonials,
  consentGranted,
}: TestimonialsCarouselProps) {
  const t = useTranslations("home.testimonials");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!consentGranted || testimonials.length === 0) return;
    const interval = setInterval(
      () => setIndex((i) => (i + 1) % testimonials.length),
      5000
    );
    return () => clearInterval(interval);
  }, [consentGranted, testimonials.length]);

  if (!consentGranted || testimonials.length === 0) return null;

  const current = testimonials[index];

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
          {t("title")}
        </h2>
        <p className="mt-1 text-center text-gray-600">{t("subtitle")}</p>

        <div className="mt-10 relative">
          <div className="rounded-2xl bg-brand-50 p-8 text-center">
            {/* Stars */}
            <div className="flex justify-center gap-1 mb-4" aria-label={`Rating: ${current.rating} out of 5`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`size-5 ${i < current.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
                />
              ))}
            </div>

            <blockquote className="text-base italic text-gray-700 leading-relaxed sm:text-lg">
              &ldquo;{current.text}&rdquo;
            </blockquote>

            <div className="mt-6">
              <p className="font-semibold text-gray-900">{current.studentName}</p>
              <p className="text-sm text-gray-500">{current.course}</p>
              {current.graduationYear && (
                <p className="text-xs text-gray-400">Class of {current.graduationYear}</p>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              onClick={() =>
                setIndex((i) => (i - 1 + testimonials.length) % testimonials.length)
              }
              className="rounded-full border border-gray-200 p-2 hover:bg-gray-100"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="size-5" />
            </button>

            <div className="flex gap-1.5">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  aria-label={`Go to testimonial ${i + 1}`}
                  className={`size-2 rounded-full transition-colors ${
                    i === index ? "bg-brand-600" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => setIndex((i) => (i + 1) % testimonials.length)}
              className="rounded-full border border-gray-200 p-2 hover:bg-gray-100"
              aria-label="Next testimonial"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
