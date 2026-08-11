import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/verify/[certNo]
 *
 * Proxies certificate verification to the backend.
 * p95 target: <1.5s — backend must respond within ~1s for this to hold.
 *
 * Rate limiting: 10 requests per minute per IP (enforced at middleware/edge level).
 * The VERIFY_RATE_LIMIT_RPM env var documents the expected limit; actual enforcement
 * should be implemented via Vercel Edge Middleware or a Redis-backed rate limiter.
 */

interface RouteParams {
  params: Promise<{ certNo: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { certNo } = await params;

  if (!certNo || certNo.trim().length < 4) {
    return NextResponse.json(
      { error: "Invalid certificate number" },
      { status: 400 }
    );
  }

  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.example.com/v1";

  try {
    const res = await fetch(
      `${apiBase}/verify/certificate/${encodeURIComponent(certNo.trim())}`,
      {
        headers: {
          ...(process.env.API_SECRET_KEY
            ? { Authorization: `Bearer ${process.env.API_SECRET_KEY}` }
            : {}),
        },
        // No caching — always real-time
        cache: "no-store",
      }
    );

    if (res.status === 404) {
      return NextResponse.json({ found: false });
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: "Verification service error" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Service unavailable" },
      { status: 503 }
    );
  }
}
