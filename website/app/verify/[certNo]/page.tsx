import { redirect } from "next/navigation";

interface QRLandingPageProps {
  params: Promise<{ certNo: string }>;
}

/**
 * QR code landing — /verify/{certNo}
 * Redirects to the verify portal with the cert pre-populated.
 * The verify page auto-submits when the cert query param is present.
 */
export default async function QRLandingPage({ params }: QRLandingPageProps) {
  const { certNo } = await params;
  redirect(`/verify?cert=${encodeURIComponent(certNo)}`);
}
