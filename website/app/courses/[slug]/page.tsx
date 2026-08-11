import { notFound } from "next/navigation";
import { getCourse, getCenters } from "@/lib/api";
import { EnquiryForm } from "@/components/shared/EnquiryForm";
import { SchemaOrg } from "@/components/shared/SchemaOrg";
import { CenterCard } from "@/components/centers/CenterCard";
import { Badge } from "@/components/ui/Badge";
import { buildCourseSchema } from "@/lib/schema-org";
import { buildCourseMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { Clock, GraduationCap, Users, ChevronDown, AlertCircle } from "lucide-react";

interface CourseDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CourseDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) return {};
  return buildCourseMetadata({
    courseName: course.name,
    description: course.shortDescription,
    slug: course.slug,
  });
}

export default async function CourseDetailPage({
  params,
}: CourseDetailPageProps) {
  const { slug } = await params;
  const [course, allCenters] = await Promise.all([
    getCourse(slug),
    getCenters(),
  ]);

  if (!course) notFound();

  // Centers offering this course
  const centersOffering = allCenters.filter((c) =>
    c.courses.some((cc) => cc.courseSlug === slug)
  );

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.example.com";

  const schema = buildCourseSchema({
    name: course.name,
    description: course.shortDescription,
    provider: "CompuTrain",
    url: `${siteUrl}/courses/${course.slug}`,
    educationalCredentialAwarded: "Certificate",
    timeRequired: `P${course.durationMonths}M`,
  });

  const levelVariant: Record<typeof course.level, "primary" | "warning" | "danger"> = {
    beginner: "primary",
    intermediate: "warning",
    advanced: "danger",
  };

  return (
    <>
      <SchemaOrg data={schema} />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Header */}
            <div>
              <Badge variant={levelVariant[course.level]} className="mb-3">
                {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
              </Badge>
              <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                {course.name}
              </h1>
              <p className="mt-3 text-lg text-gray-600">{course.shortDescription}</p>

              <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-700">
                <span className="flex items-center gap-1.5">
                  <Clock className="size-4 text-brand-500" />
                  <strong>Duration:</strong> {course.durationMonths}{" "}
                  {course.durationMonths === 1 ? "month" : "months"}
                </span>
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="size-4 text-brand-500" />
                  <strong>Eligibility:</strong> {course.eligibility}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="size-4 text-brand-500" />
                  <strong>Centers:</strong> {course.centersCount}+
                </span>
              </div>

              {/* Fees note — [DECIDE] */}
              {course.feesFrom && (
                <div className="mt-4 inline-flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                  <p className="text-sm text-amber-800">
                    <strong>Fees from ₹{course.feesFrom.toLocaleString("en-IN")}.</strong>{" "}
                    {/* [DECIDE] Final fee structure to be confirmed with franchise operations team before launch */}
                    Contact your nearest center for exact fee structure.
                  </p>
                </div>
              )}
            </div>

            {/* Syllabus accordion */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Syllabus</h2>
              <div className="divide-y divide-gray-200 rounded-xl border border-gray-200">
                {course.syllabusUnits.map((unit, i) => (
                  <details key={unit.id} className="group" open={i === 0}>
                    <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-medium text-gray-900 hover:bg-gray-50">
                      <span>Unit {i + 1}: {unit.title}</span>
                      <ChevronDown className="size-4 text-gray-400 group-open:rotate-180 transition-transform" />
                    </summary>
                    <ul className="px-5 pb-4 space-y-1">
                      {unit.topics.map((topic, j) => (
                        <li key={j} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="mt-1.5 size-1.5 rounded-full bg-brand-400 shrink-0" />
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            </section>

            {/* Career outcomes */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Career Outcomes</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {course.careerOutcomes.map((outcome) => (
                  <div
                    key={outcome}
                    className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800"
                  >
                    <span className="size-1.5 rounded-full bg-brand-500 shrink-0" />
                    {outcome}
                  </div>
                ))}
              </div>
            </section>

            {/* Certificate sample */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Certificate Sample</h2>
              <div className="relative rounded-xl overflow-hidden border border-gray-200">
                {/* Watermark overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10 pointer-events-none">
                  <p className="rotate-[-30deg] text-3xl font-bold text-gray-400/60 uppercase tracking-widest select-none">
                    SAMPLE
                  </p>
                </div>
                <div className="h-48 bg-brand-50 flex items-center justify-center text-brand-400">
                  {course.certificateImageUrl ? (
                    <img
                      src={course.certificateImageUrl}
                      alt={`${course.name} certificate sample`}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <p className="text-sm">[Certificate image placeholder]</p>
                  )}
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Sample only — actual certificate issued after successful completion
              </p>
            </section>

            {/* Centers offering this course */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Centers Offering This Course
              </h2>
              {centersOffering.length === 0 ? (
                <p className="text-gray-500">Check back soon — enrollment opening near you.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {centersOffering.slice(0, 6).map((center) => (
                    <CenterCard key={center.id} center={center} />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <EnquiryForm
              defaultCourse={course.name}
              className="sticky top-24"
            />
          </aside>
        </div>
      </div>
    </>
  );
}
