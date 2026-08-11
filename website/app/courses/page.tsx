import { Suspense } from "react";
import { getCourses } from "@/lib/api";
import { CourseCard } from "@/components/courses/CourseCard";
import { CourseFilters } from "@/components/courses/CourseFilters";
import { SchemaOrg } from "@/components/shared/SchemaOrg";
import { buildMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import type { CourseCategory } from "@/lib/api";

export const metadata: Metadata = buildMetadata({
  title: "All Courses",
  description:
    "Browse DCA, Tally, Typing, Programming, Hardware, and Design courses. Government-recognized certificates. Find a center near you.",
  path: "/courses",
});

interface CoursesPageProps {
  searchParams: Promise<{
    category?: string;
    level?: string;
    q?: string;
  }>;
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const params = await searchParams;

  const courses = await getCourses({
    category: params.category as CourseCategory | undefined,
    level: params.level,
  });

  // Client-side text filter applied after server fetch
  const filtered = params.q
    ? courses.filter(
        (c) =>
          c.name.toLowerCase().includes(params.q!.toLowerCase()) ||
          c.shortDescription.toLowerCase().includes(params.q!.toLowerCase())
      )
    : courses;

  const catalogSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "CompuTrain Course Catalog",
    itemListElement: filtered.map((course, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/courses/${course.slug}`,
      name: course.name,
    })),
  };

  return (
    <>
      <SchemaOrg data={catalogSchema} />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">All Courses</h1>
          <p className="mt-2 text-gray-600">
            Browse our complete catalog of certified training programs
          </p>
        </div>

        {/* Filters — client component */}
        <Suspense>
          <CourseFilters />
        </Suspense>

        {/* Results */}
        <div className="mt-8">
          {filtered.length === 0 ? (
            <p className="text-gray-500">No courses found for the selected filters.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
