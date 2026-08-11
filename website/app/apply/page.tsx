import { buildMetadata } from "@/lib/metadata";
import { EnquiryForm } from "@/components/shared/EnquiryForm";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({
  title: "Apply for Admission",
  description:
    "Apply online for computer and vocational training courses. Admission open at 500+ centers across India.",
  path: "/apply",
});

export default function ApplyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Apply for Admission
        </h1>
        <p className="mt-3 text-lg text-gray-600">
          Fill in your details and our team will contact you within 24 hours to
          confirm your seat.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Form */}
        <div className="md:col-span-2">
          <EnquiryForm />
        </div>
      </div>

      {/* Steps reminder */}
      <div className="mt-12 rounded-xl bg-brand-50 p-6">
        <h2 className="text-base font-semibold text-brand-900 mb-3">
          What happens next?
        </h2>
        <ol className="space-y-2 text-sm text-brand-800">
          <li className="flex items-start gap-2">
            <span className="flex size-5 items-center justify-center rounded-full bg-brand-600 text-white text-xs font-bold shrink-0">1</span>
            Our admissions team calls you within 24 hours to confirm details.
          </li>
          <li className="flex items-start gap-2">
            <span className="flex size-5 items-center justify-center rounded-full bg-brand-600 text-white text-xs font-bold shrink-0">2</span>
            We help you find the nearest center and suitable batch timing.
          </li>
          <li className="flex items-start gap-2">
            <span className="flex size-5 items-center justify-center rounded-full bg-brand-600 text-white text-xs font-bold shrink-0">3</span>
            Visit the center, complete enrolment, and start learning!
          </li>
        </ol>
      </div>
    </div>
  );
}
