"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
      {items.map((item, i) => (
        <div key={i}>
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="flex w-full items-center justify-between px-5 py-4 text-left"
            aria-expanded={openIndex === i}
          >
            <span className="text-sm font-medium text-gray-900 sm:text-base">
              {item.question}
            </span>
            <ChevronDown
              className={cn(
                "ml-4 size-5 shrink-0 text-gray-400 transition-transform duration-200",
                openIndex === i && "rotate-180"
              )}
            />
          </button>
          {openIndex === i && (
            <div className="px-5 pb-4 text-sm leading-relaxed text-gray-600">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function HomeFaqSection() {
  const t = useTranslations("home.faq");

  const faqs = [1, 2, 3, 4, 5, 6].map((n) => ({
    question: t(`q${n}` as "q1"),
    answer: t(`a${n}` as "a1"),
  }));

  return (
    <section className="py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
          {t("title")}
        </h2>
        <div className="mt-8">
          <FaqAccordion items={faqs} />
        </div>
      </div>
    </section>
  );
}
