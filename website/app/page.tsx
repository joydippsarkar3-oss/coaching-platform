import { Suspense } from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { StatsStrip } from "@/components/home/StatsStrip";
import { CourseGrid } from "@/components/home/CourseGrid";
import { HowItWorksSteps } from "@/components/home/HowItWorksSteps";
import { FeaturedCentersMap } from "@/components/home/FeaturedCentersMap";
import { TestimonialsCarousel } from "@/components/home/TestimonialsCarousel";
import { VerificationStrip } from "@/components/home/VerificationStrip";
import { FranchiseCTABand } from "@/components/home/FranchiseCTABand";
import { HomeFaqSection } from "@/components/home/FaqAccordion";
import { SchemaOrg } from "@/components/shared/SchemaOrg";
import { buildWebSiteSchema, buildFAQSchema } from "@/lib/schema-org";
import { getStats, getCenters } from "@/lib/api";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CompuTrain — Computer & Vocational Training Courses in India",
  description:
    "Find government-recognized computer and vocational training courses near you. 500+ authorized centers across India. Apply online today.",
};

// Stats are revalidated daily — see getStats() which sets revalidate: 86400
export default async function HomePage() {
  const [stats, featuredCenters] = await Promise.all([
    getStats(),
    getCenters({ featured: true }),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.example.com";

  const websiteSchema = buildWebSiteSchema({
    name: "CompuTrain",
    url: siteUrl,
    description:
      "Government-recognized computer and vocational training courses across India.",
  });

  const faqSchema = buildFAQSchema([
    {
      question: "Are CompuTrain certificates recognized by the government?",
      answer:
        "Yes. All certificates issued through the CompuTrain network are government-recognized and valid for employment and higher education.",
    },
    {
      question: "How long do courses take?",
      answer:
        "Course durations range from 1 month (short skill courses) to 12 months (diploma programs).",
    },
    {
      question: "How do I verify my certificate?",
      answer:
        "Visit the Verify section on computrain.in, enter your certificate number, and the system will confirm authenticity in real time.",
    },
  ]);

  return (
    <>
      <SchemaOrg data={[websiteSchema, faqSchema]} />

      <HeroSection />

      <Suspense fallback={<div className="h-24 bg-gray-50 animate-pulse" />}>
        <StatsStrip stats={stats} />
      </Suspense>

      <CourseGrid />
      <HowItWorksSteps />

      <Suspense fallback={<div className="h-96 bg-gray-50 animate-pulse" />}>
        <FeaturedCentersMap centers={featuredCenters} />
      </Suspense>

      {/* TestimonialsCarousel only renders when consentGranted=true */}
      <TestimonialsCarousel
        testimonials={[]}
        consentGranted={false}
      />

      <VerificationStrip />
      <FranchiseCTABand />
      <HomeFaqSection />
    </>
  );
}
