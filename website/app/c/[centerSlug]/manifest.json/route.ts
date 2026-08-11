import { NextRequest, NextResponse } from "next/server";
import { getCenter } from "@/lib/api";

interface RouteParams {
  params: Promise<{ centerSlug: string }>;
}

/** Dynamic per-center PWA manifest — enables add-to-home-screen with center branding */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { centerSlug } = await params;
  const center = await getCenter(centerSlug);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.example.com";
  const centerName = center?.name ?? "CompuTrain Center";
  const startUrl = `/c/${centerSlug}`;

  const manifest = {
    name: `${centerName} — CompuTrain`,
    short_name: centerName.length > 12 ? "CompuTrain" : centerName,
    description: center
      ? `Courses at ${centerName}, ${center.city}`
      : "CompuTrain authorized training center",
    start_url: startUrl,
    scope: startUrl,
    display: "standalone",
    background_color: "#1e3a8a",
    theme_color: "#2563eb",
    icons: [
      {
        src: `${siteUrl}/icons/icon-192x192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable any",
      },
      {
        src: `${siteUrl}/icons/icon-512x512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable any",
      },
    ],
    categories: ["education"],
    lang: "en",
  };

  return new NextResponse(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
