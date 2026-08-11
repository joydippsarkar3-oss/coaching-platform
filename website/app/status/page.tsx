"use client";

import { useEffect, useState, useCallback } from "react";
import type { Metadata } from "next";
import type { StatusResponse, ServiceStatus } from "@/app/api/status/route";

// Metadata cannot be exported from a "use client" component; it is set via
// the title template in layout.tsx. The <title> tag is also set manually below.

const REFRESH_INTERVAL_MS = 60_000;

interface Incident {
  id: string;
  date: string;
  title: string;
  description: string;
}

const INCIDENTS: Incident[] = [];

function statusLabel(status: ServiceStatus): string {
  switch (status) {
    case "operational": return "Operational";
    case "degraded":    return "Degraded";
    case "outage":      return "Outage";
    case "unknown":     return "Unknown";
  }
}

function statusColors(status: ServiceStatus): {
  dot: string;
  badge: string;
  text: string;
} {
  switch (status) {
    case "operational":
      return {
        dot: "bg-green-500",
        badge: "bg-green-50 border-green-200",
        text: "text-green-700",
      };
    case "degraded":
      return {
        dot: "bg-yellow-400",
        badge: "bg-yellow-50 border-yellow-200",
        text: "text-yellow-700",
      };
    case "outage":
      return {
        dot: "bg-red-500",
        badge: "bg-red-50 border-red-200",
        text: "text-red-700",
      };
    case "unknown":
    default:
      return {
        dot: "bg-gray-400",
        badge: "bg-gray-50 border-gray-200",
        text: "text-gray-600",
      };
  }
}

function overallStatus(services: StatusResponse["services"]): {
  label: string;
  classes: string;
  barColor: string;
} {
  if (services.some((s) => s.status === "outage")) {
    return {
      label: "Partial Outage",
      classes: "bg-red-50 border-red-200 text-red-800",
      barColor: "bg-red-500",
    };
  }
  if (services.some((s) => s.status === "degraded" || s.status === "unknown")) {
    return {
      label: "Degraded Performance",
      classes: "bg-yellow-50 border-yellow-200 text-yellow-800",
      barColor: "bg-yellow-400",
    };
  }
  return {
    label: "All Systems Operational",
    classes: "bg-green-50 border-green-200 text-green-800",
    barColor: "bg-green-500",
  };
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function StatusPage() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_MS / 1000);

  const fetchStatus = useCallback(async () => {
    try {
      setError(false);
      const res = await fetch("/api/status", { cache: "no-store" });
      if (!res.ok) throw new Error("Non-2xx response");
      const json: StatusResponse = await res.json();
      setData(json);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setCountdown(REFRESH_INTERVAL_MS / 1000);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const refreshTimer = setInterval(fetchStatus, REFRESH_INTERVAL_MS);
    return () => clearInterval(refreshTimer);
  }, [fetchStatus]);

  // Countdown ticker
  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1_000);
    return () => clearInterval(tick);
  }, []);

  const overall = data ? overallStatus(data.services) : null;

  return (
    <>
      <title>System Status — CompuTrain</title>

      {/* Hero */}
      <section className="bg-brand-900 py-14 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold sm:text-4xl">System Status</h1>
          <p className="mt-3 text-brand-200">
            Live health overview of CompuTrain platform services.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">

        {/* Overall status banner */}
        {loading && (
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
            <span className="size-3 rounded-full bg-gray-300 animate-pulse" />
            <span className="text-sm font-medium text-gray-500">Checking service health…</span>
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
            <span className="size-3 rounded-full bg-red-500" />
            <span className="text-sm font-medium text-red-700">
              Unable to fetch status. Will retry in {countdown}s.
            </span>
          </div>
        )}

        {!loading && !error && overall && (
          <div className={`flex items-center justify-between gap-3 rounded-xl border px-5 py-4 ${overall.classes}`}>
            <div className="flex items-center gap-3">
              <span className={`size-3 rounded-full ${overall.barColor}`} />
              <span className="text-sm font-semibold">{overall.label}</span>
            </div>
            {data && (
              <span className="text-xs opacity-70">
                Updated at {formatTime(data.generatedAt)}
              </span>
            )}
          </div>
        )}

        {/* Services */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Services</h2>
            <button
              onClick={() => { setLoading(true); fetchStatus(); }}
              className="text-xs text-brand-600 hover:text-brand-700 hover:underline"
              aria-label="Refresh status"
            >
              Refresh ({countdown}s)
            </button>
          </div>

          {loading && (
            <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 overflow-hidden">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="flex items-center justify-between px-5 py-4 bg-white animate-pulse">
                  <div className="flex items-center gap-3">
                    <span className="size-2.5 rounded-full bg-gray-200" />
                    <span className="h-4 w-32 rounded bg-gray-200" />
                  </div>
                  <div className="flex gap-6">
                    <span className="h-4 w-16 rounded bg-gray-200" />
                    <span className="h-4 w-24 rounded bg-gray-200" />
                    <span className="h-6 w-20 rounded-full bg-gray-200" />
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!loading && data && (
            <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 overflow-hidden">
              {data.services.map((svc) => {
                const colors = statusColors(svc.status);
                return (
                  <li
                    key={svc.id}
                    className="flex flex-col gap-2 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`size-2.5 rounded-full shrink-0 ${colors.dot}`} aria-hidden="true" />
                      <span className="font-medium text-gray-900">{svc.name}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 pl-5 sm:pl-0">
                      <span className="text-sm text-gray-500">
                        Uptime{" "}
                        <span className="font-semibold text-gray-700">
                          {svc.uptime.toFixed(1)}%
                        </span>
                      </span>
                      <span className="text-sm text-gray-400">
                        Checked {formatTime(svc.lastChecked)}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${colors.badge} ${colors.text}`}
                      >
                        {statusLabel(svc.status)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Incident history */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Incident History</h2>
          {INCIDENTS.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-8 text-center">
              <p className="text-sm text-gray-500">No incidents in the past 90 days.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {INCIDENTS.map((incident) => (
                <li
                  key={incident.id}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-4"
                >
                  <p className="text-xs text-gray-400 mb-1">{formatDate(incident.date)}</p>
                  <p className="font-semibold text-gray-900">{incident.title}</p>
                  <p className="mt-1 text-sm text-gray-600">{incident.description}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400">
          Auto-refreshes every 60 seconds. For urgent issues, contact{" "}
          <a href="mailto:info@computrain.in" className="text-brand-600 hover:underline">
            info@computrain.in
          </a>
          .
        </p>
      </div>
    </>
  );
}
