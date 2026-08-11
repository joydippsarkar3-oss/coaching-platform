"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldCheck, AlertTriangle, ExternalLink } from "lucide-react";
import { VerificationResultCard } from "@/components/verify/VerificationResult";
import { StudentResultCard } from "@/components/verify/StudentResult";
import { CenterResult } from "@/components/verify/CenterResult";
import { cn } from "@/lib/utils";
import type { VerificationResult } from "@/lib/api";

type Tab = "certificate" | "student" | "center";

// p95 target: <1.5s — API response is proxied via /api/verify/[certNo]
// which calls the backend with server-side auth. No client secret exposed.

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>("certificate");
  const [certInput, setCertInput] = useState(searchParams.get("cert") ?? "");
  const [studentInput, setStudentInput] = useState("");
  const [centerInput, setCenterInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [certResult, setCertResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verifyCert = useCallback(async (no: string) => {
    if (!no.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/verify/${encodeURIComponent(no.trim())}`);
      if (res.status === 429) {
        setError("Rate limit reached. Please wait a moment and try again.");
        return;
      }
      if (!res.ok) throw new Error("Failed");
      const data = await res.json() as VerificationResult;
      setCertResult(data);
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-populate and auto-submit if cert param present (QR landing)
  useEffect(() => {
    const cert = searchParams.get("cert");
    if (cert) {
      setCertInput(cert);
      verifyCert(cert);
    }
  }, [searchParams, verifyCert]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "certificate", label: "Certificate" },
    { key: "student", label: "Student" },
    { key: "center", label: "Center" },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <ShieldCheck className="mx-auto mb-3 size-12 text-brand-600" />
        <h1 className="text-3xl font-extrabold text-gray-900">
          Certificate Verification
        </h1>
        <p className="mt-2 text-gray-600">
          Instantly verify the authenticity of any certificate issued by the
          CompuTrain network.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-1 mb-8">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
              activeTab === key
                ? "bg-white text-brand-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Certificate Tab */}
      {activeTab === "certificate" && (
        <div className="space-y-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              verifyCert(certInput);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={certInput}
              onChange={(e) => setCertInput(e.target.value)}
              placeholder="e.g. CT-2024-001234"
              className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm font-mono focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              aria-label="Certificate number"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={loading || !certInput.trim()}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-3 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? (
                <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <ShieldCheck className="size-4" />
              )}
              Verify
            </button>
          </form>

          <p className="flex items-center gap-2 text-xs text-gray-500">
            <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
            Verification is limited to 10 requests per minute to prevent abuse.
          </p>

          {error && (
            <p className="text-sm text-danger-500" role="alert">{error}</p>
          )}

          {certResult && <VerificationResultCard result={certResult} />}

          <a
            href="mailto:report@computrain.in?subject=Suspect Certificate Report"
            className="flex items-center gap-1.5 text-sm text-danger-600 hover:text-danger-700"
          >
            <ExternalLink className="size-4" />
            Report a suspect certificate
          </a>
        </div>
      )}

      {/* Student Tab */}
      {activeTab === "student" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Enter a student name or roll number to look up their enrollment record.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={studentInput}
              onChange={(e) => setStudentInput(e.target.value)}
              placeholder="e.g. Rahul Sharma or 2024CT001234"
              className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none"
            />
            <a
              href={`/results?q=${encodeURIComponent(studentInput)}`}
              className="rounded-lg bg-brand-600 px-5 py-3 text-sm font-medium text-white hover:bg-brand-700"
            >
              Lookup
            </a>
          </div>
        </div>
      )}

      {/* Center Tab */}
      {activeTab === "center" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Enter a center code to verify its authorization status.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={centerInput}
              onChange={(e) => setCenterInput(e.target.value)}
              placeholder="e.g. DL-001"
              className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none"
            />
            <a
              href={`/centers?q=${encodeURIComponent(centerInput)}`}
              className="rounded-lg bg-brand-600 px-5 py-3 text-sm font-medium text-white hover:bg-brand-700"
            >
              Verify
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
