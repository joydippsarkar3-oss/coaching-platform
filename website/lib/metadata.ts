import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.example.com";
const SITE_NAME = "CompuTrain";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.jpg`;

interface MetadataParams {
  title: string;
  description: string;
  path?: string;
  ogImage?: string;
  noIndex?: boolean;
}

export function buildMetadata({
  title,
  description,
  path = "",
  ogImage = DEFAULT_OG_IMAGE,
  noIndex = false,
}: MetadataParams): Metadata {
  const url = `${SITE_URL}${path}`;
  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: url,
      languages: {
        en: url,
        hi: `${SITE_URL}/hi${path}`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

/** For course detail pages — targets "DCA course in {city}" search pattern */
export function buildCourseMetadata(params: {
  courseName: string;
  description: string;
  slug: string;
  city?: string;
}): Metadata {
  const cityStr = params.city ? ` in ${params.city}` : " near you";
  return buildMetadata({
    title: `${params.courseName} Course${cityStr} — Certified Training`,
    description: params.description,
    path: `/courses/${params.slug}`,
  });
}

/** For center microsite pages */
export function buildCenterMetadata(params: {
  centerName: string;
  city: string;
  state: string;
  slug: string;
}): Metadata {
  return buildMetadata({
    title: `${params.centerName} — Authorized Training Center in ${params.city}`,
    description: `Join ${params.centerName}, an authorized CompuTrain center in ${params.city}, ${params.state}. Computer and vocational courses with government-recognized certificates.`,
    path: `/c/${params.slug}`,
  });
}

/** For blog post pages */
export function buildBlogMetadata(params: {
  title: string;
  excerpt: string;
  slug: string;
  coverImage?: string;
}): Metadata {
  return buildMetadata({
    title: params.title,
    description: params.excerpt,
    path: `/blog/${params.slug}`,
    ogImage: params.coverImage,
  });
}
