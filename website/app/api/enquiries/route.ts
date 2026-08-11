import { NextRequest, NextResponse } from "next/server";
import type { EnquiryPayload } from "@/lib/api";

/**
 * POST /api/enquiries
 * Proxies enquiry submissions to the backend API.
 * Keeps API_SECRET_KEY server-side only — never exposed to the client.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: EnquiryPayload;

  try {
    body = await request.json() as EnquiryPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Basic server-side validation
  if (!body.name || !body.phone) {
    return NextResponse.json(
      { error: "name and phone are required" },
      { status: 422 }
    );
  }

  const phone = body.phone.replace(/\D/g, "");
  if (!/^[6-9]\d{9}$/.test(phone)) {
    return NextResponse.json(
      { error: "Invalid phone number" },
      { status: 422 }
    );
  }

  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.example.com/v1";

  try {
    const res = await fetch(`${apiBase}/enquiries`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.API_SECRET_KEY
          ? { Authorization: `Bearer ${process.env.API_SECRET_KEY}` }
          : {}),
      },
      body: JSON.stringify({ ...body, phone }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Upstream error" },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true, message: "Enquiry submitted" });
  } catch {
    return NextResponse.json(
      { error: "Service unavailable" },
      { status: 503 }
    );
  }
}
