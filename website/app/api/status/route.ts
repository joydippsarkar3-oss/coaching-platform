import { NextResponse } from "next/server";

export type ServiceStatus = "operational" | "degraded" | "outage" | "unknown";

export interface ServiceInfo {
  id: string;
  name: string;
  status: ServiceStatus;
  uptime: number; // percentage, e.g. 99.9
  lastChecked: string; // ISO timestamp
}

export interface StatusResponse {
  services: ServiceInfo[];
  generatedAt: string;
}

const BASE_SERVICES: Omit<ServiceInfo, "status" | "lastChecked">[] = [
  { id: "api", name: "API", uptime: 99.9 },
  { id: "database", name: "Database", uptime: 99.9 },
  { id: "payment", name: "Payment Gateway", uptime: 99.9 },
  { id: "sms", name: "SMS / WhatsApp", uptime: 99.9 },
  { id: "cdn", name: "CDN", uptime: 99.9 },
];

/**
 * GET /api/status
 * Checks backend health and returns structured service status.
 */
export async function GET(): Promise<NextResponse<StatusResponse>> {
  const now = new Date().toISOString();
  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  // No backend configured — return all operational
  if (!apiBase) {
    return NextResponse.json({
      services: BASE_SERVICES.map((svc) => ({
        ...svc,
        status: "operational",
        lastChecked: now,
      })),
      generatedAt: now,
    });
  }

  try {
    const res = await fetch(`${apiBase}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });

    if (!res.ok) {
      // Backend responded but reported unhealthy
      return NextResponse.json({
        services: BASE_SERVICES.map((svc) => ({
          ...svc,
          status: (["api", "database"].includes(svc.id)
            ? "outage"
            : "degraded") as ServiceStatus,
          lastChecked: now,
        })),
        generatedAt: now,
      });
    }

    return NextResponse.json({
      services: BASE_SERVICES.map((svc) => ({
        ...svc,
        status: "operational" as ServiceStatus,
        lastChecked: now,
      })),
      generatedAt: now,
    });
  } catch {
    // Backend unreachable
    return NextResponse.json({
      services: BASE_SERVICES.map((svc) => ({
        ...svc,
        status: (["api", "database"].includes(svc.id)
          ? "outage"
          : "unknown") as ServiceStatus,
        lastChecked: now,
      })),
      generatedAt: now,
    });
  }
}
