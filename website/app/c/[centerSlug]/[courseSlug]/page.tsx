import { notFound } from "next/navigation";
import { getCenter, getCourse } from "@/lib/api";
import { EnquiryForm } from "@/components/shared/EnquiryForm";
import { SchemaOrg } from "@/components/shared/SchemaOrg";
import { buildCourseSchema, buildLocalBusinessSchema } from "@/lib/schema-org";
import { buildMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { MapPin, ShieldCheck, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

interface CenterCoursePageProps {
  params: Promise<{ centerSlug: string; courseSlug: string }>;
}

export async function generateMetadata({
  params,
}: CenterCoursePageProps): Promise<Metadata> {
  const { centerSlug, courseSlug } = await params;
  const [center, course] = await Promise.all([
    getCenter(centerSlug),
    getCourse(courseSlug),
  ]);
  if (!center || !course) return {};
  return buildMetadata({
    title: `${course.name} at ${center.name}, ${center.city}`,
    description: `Enroll in ${course.name} at ${center.name} in ${center.city}, ${center.state}. Government-recognized certificate. Enquire now.`,
    path: `/c/${centerSlug}/${courseSlug}`,
  });
}

export default async function CenterCoursePage({
  params,
}: CenterCoursePageProps) {
  const { centerSlug, courseSlug } = await params;
  const [center, course] = await Promise.all([
    getCenter(centerSlug),
    getCourse(courseSlug),
  ]);

  if (!center || !course) notFound();

  const centerCourse = center.courses.find((c) => c.courseSlug === courseSlug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.example.com";

  const courseSchema = buildCourseSchema({
    name: `${course.name} — ${center.name}`,
    description: course.shortDescription,
    provider: center.name,
    url: `${siteUrl}/c/${centerSlug}/${courseSlug}`,
    educationalCredentialAwarded: "Certificate",
    timeRequired: `P${course.durationMonths}M`,
  });

  const localSchema = buildLocalBusinessSchema({
    name: center.name,
    description: `Authorized CompuTrain center in ${center.city}`,
    url: `${siteUrl}/c/${center.slug}`,
    telephone: center.phone,
    address: {
      addressLocality: center.city,
      addressRegion: center.state,
      postalCode: center.pincode,
      addressCountry: "IN",
    },
  });

  return (
    <>
      <SchemaOrg data={[courseSchema, localSchema]} />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
          <Link href={`/c/${center.slug}`} className="flex items-center gap-1 hover:text-brand-600">
            <ArrowLeft className="size-4" /> {center.name}
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{course.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              {center.isVerified && (
                <Badge variant="success" className="mb-3">
                  <ShieldCheck className="mr-1 size-3.5" />
                  Verified Center
                </Badge>
              )}
              <h1 className="text-3xl font-extrabold text-gray-900">
                {course.name}
              </h1>
              <div className="mt-2 flex items-center gap-1.5 text-gray-500">
                <MapPin className="size-4 shrink-0" />
                <span>{center.name}, {center.city}, {center.state}</span>
              </div>
              <p className="mt-4 text-gray-600 leading-relaxed">{course.shortDescription}</p>
            </div>

            {/* Fee + Duration at this center */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {centerCourse && (
                <div className="rounded-xl bg-brand-50 p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Fee at this center</p>
                  <p className="text-xl font-bold text-brand-700">
                    ₹{centerCourse.fee.toLocaleString("en-IN")}
                  </p>
                </div>
              )}
              <div className="rounded-xl bg-gray-50 p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Duration</p>
                <p className="text-xl font-bold text-gray-900 flex items-center justify-center gap-1">
                  <Clock className="size-5 text-brand-500" />
                  {course.durationMonths} mo
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Eligibility</p>
                <p className="text-sm font-semibold text-gray-900">{course.eligibility}</p>
              </div>
            </div>

            {/* Batch timings for this course at this center */}
            {center.batchTimings.filter(b => b.courseName === course.name).length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">Available Batches</h2>
                <div className="space-y-2">
                  {center.batchTimings
                    .filter(b => b.courseName === course.name)
                    .map(bt => (
                      <div key={bt.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-sm">
                        <span>{bt.days} · {bt.time}</span>
                        <span className="text-green-600 font-medium">{bt.availableSeats} seats</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Career outcomes */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Career Outcomes</h2>
              <div className="flex flex-wrap gap-2">
                {course.careerOutcomes.map(o => (
                  <span key={o} className="rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-800">
                    {o}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside>
            <EnquiryForm
              defaultCourse={course.name}
              centerSlug={center.slug}
              centerName={center.name}
              className="sticky top-24"
            />
          </aside>
        </div>
      </div>
    </>
  );
}
