"use client";

import { useState } from "react";
import { buildMetadata } from "@/lib/metadata";
import { StudentResultCard } from "@/components/verify/StudentResult";
import { Search } from "lucide-react";
import type { StudentResult } from "@/lib/api";

// Metadata for this page must be exported from a separate server component
// when using "use client"; export from a sibling layout or use generateMetadata
// in a wrapper. For simplicity, metadata is defined in layout.

export default function ResultsPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<StudentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(
        `/api/results?q=${encodeURIComponent(query.trim())}`
      );
      if (!res.ok) throw new Error("Failed");
      const data = await res.json() as StudentResult;
      setResult(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900">
          Student Results
        </h1>
        <p className="mt-2 text-gray-600">
          Look up examination results by roll number or name
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter roll number e.g. 2024CT001234"
          className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          aria-label="Roll number or student name"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-3 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? (
            <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Search className="size-4" />
          )}
          Search
        </button>
      </form>

      {error && (
        <p className="mt-4 text-sm text-danger-500" role="alert">
          Unable to fetch results. Please try again.
        </p>
      )}

      {result && (
        <div className="mt-8">
          <StudentResultCard result={result} />
        </div>
      )}
    </div>
  );
}
