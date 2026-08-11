import { buildMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { BookOpen, Briefcase, FileText, Award, GraduationCap } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = buildMetadata({
  title: "Student Corner",
  description:
    "Resources for CompuTrain students — job board, resume builder, study material, results and certificates.",
  path: "/student-corner",
});

const SECTIONS = [
  {
    icon: Briefcase,
    title: "Job Board",
    desc: "Browse job openings from our partner employers. Filter by course and location.",
    cta: "View Jobs",
    href: "#jobs",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: FileText,
    title: "Resume Builder",
    desc: "Create a professional resume in minutes using our guided templates.",
    cta: "Build Resume",
    href: "#resume",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: BookOpen,
    title: "Study Material",
    desc: "Download notes, practice papers, and revision guides for your course.",
    cta: "Download",
    href: "#study",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: Award,
    title: "My Certificate",
    desc: "Access and download your issued certificates. Share a verification link with employers.",
    cta: "My Certificates",
    href: "/verify",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: GraduationCap,
    title: "My Results",
    desc: "Check your exam results and grade reports.",
    cta: "View Results",
    href: "/results",
    color: "bg-red-50 text-red-600",
  },
];

export default function StudentCornerPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Student Corner
        </h1>
        <p className="mt-3 text-lg text-gray-600">
          Everything you need to succeed — during and after your course.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map(({ icon: Icon, title, desc, cta, href, color }) => (
          <div
            key={title}
            className="flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className={`mb-4 flex size-12 items-center justify-center rounded-xl ${color}`}>
              <Icon className="size-6" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            <p className="mt-1 flex-1 text-sm text-gray-600 leading-relaxed">{desc}</p>
            <Link
              href={href}
              className="mt-4 rounded-lg border border-brand-600 px-4 py-2 text-center text-sm font-medium text-brand-600 hover:bg-brand-50 transition-colors"
            >
              {cta}
            </Link>
          </div>
        ))}
      </div>

      {/* Login notice */}
      <div className="mt-10 rounded-xl bg-brand-50 border border-brand-100 p-6 text-center">
        <p className="text-sm text-brand-800">
          <strong>Student portal login</strong> coming soon. For now, use your
          certificate number or roll number on the{" "}
          <Link href="/verify" className="underline hover:text-brand-700">
            Verify
          </Link>{" "}
          or{" "}
          <Link href="/results" className="underline hover:text-brand-700">
            Results
          </Link>{" "}
          pages.
        </p>
      </div>
    </div>
  );
}
