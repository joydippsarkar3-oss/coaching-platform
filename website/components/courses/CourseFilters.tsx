"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useCallback } from "react";

const CATEGORIES = [
  { value: "", label: "allCategories" },
  { value: "office", label: "Office Applications" },
  { value: "accounting", label: "Accounting & Finance" },
  { value: "typing", label: "Typing & DTP" },
  { value: "programming", label: "Programming" },
  { value: "hardware", label: "Hardware & Networking" },
  { value: "design", label: "Graphic Design" },
] as const;

const LEVELS = [
  { value: "", label: "allLevels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const;

export function CourseFilters() {
  const t = useTranslations("courses.filter");
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/courses?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-wrap gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-48">
        <Search className="pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-gray-400" />
        <input
          type="search"
          placeholder={t("search")}
          defaultValue={searchParams.get("q") ?? ""}
          onChange={(e) => updateParam("q", e.target.value)}
          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </div>

      {/* Category */}
      <select
        value={searchParams.get("category") ?? ""}
        onChange={(e) => updateParam("category", e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        aria-label={t("allCategories")}
      >
        {CATEGORIES.map(({ value, label }) => (
          <option key={value} value={value}>
            {value === "" ? t("allCategories") : label}
          </option>
        ))}
      </select>

      {/* Level */}
      <select
        value={searchParams.get("level") ?? ""}
        onChange={(e) => updateParam("level", e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        aria-label={t("allLevels")}
      >
        {LEVELS.map(({ value, label }) => (
          <option key={value} value={value}>
            {value === "" ? t("allLevels") : label}
          </option>
        ))}
      </select>
    </div>
  );
}
