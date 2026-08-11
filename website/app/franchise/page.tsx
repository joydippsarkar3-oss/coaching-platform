import { buildMetadata } from "@/lib/metadata";
import { EnquiryForm } from "@/components/shared/EnquiryForm";
import { SchemaOrg } from "@/components/shared/SchemaOrg";
import type { Metadata } from "next";
import {
  CheckCircle2, BarChart3, BookOpen, HeadphonesIcon,
  Users, Building2, Clock, TrendingUp
} from "lucide-react";

export const metadata: Metadata = buildMetadata({
  title: "Franchise Opportunity",
  description:
    "Start your own computer training center. Join 500+ CompuTrain franchise partners across India. Low investment, proven model, full support.",
  path: "/franchise",
});

const BENEFITS = [
  {
    icon: Building2,
    title: "Established Brand",
    desc: "Leverage a recognized brand with 500+ centers and 50,000+ alumni.",
  },
  {
    icon: BookOpen,
    title: "Ready Curriculum",
    desc: "Comprehensive, updated course material and assessment system provided.",
  },
  {
    icon: BarChart3,
    title: "Technology Platform",
    desc: "Admit, grade, verify, and manage everything from our online portal.",
  },
  {
    icon: HeadphonesIcon,
    title: "Full Support",
    desc: "Marketing support, faculty training, and a dedicated franchise manager.",
  },
  {
    icon: Users,
    title: "Growing Network",
    desc: "Benefit from cross-referrals and brand campaigns across the national network.",
  },
  {
    icon: TrendingUp,
    title: "Proven ROI",
    desc: "Average franchise recovers investment within 18–24 months of operations.",
  },
];

const STEPS = [
  "Fill the franchise inquiry form",
  "Attend a virtual orientation call",
  "Sign the franchise agreement",
  "Set up your center with our support",
  "Start enrolling students",
];

const franchiseSchema = {
  "@context": "https://schema.org",
  "@type": "Offer",
  name: "CompuTrain Franchise Opportunity",
  description:
    "Start your own authorized computer training center under the CompuTrain brand.",
  url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.example.com"}/franchise`,
  seller: {
    "@type": "Organization",
    name: "CompuTrain",
  },
};

export default function FranchisePage() {
  return (
    <>
      <SchemaOrg data={franchiseSchema} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-accent-700 to-accent-500 py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold sm:text-4xl md:text-5xl">
            Become a Franchise Partner
          </h1>
          <p className="mt-4 text-lg text-accent-100">
            Start your own computer training center under our trusted brand.
            Low investment. Proven model. Full support.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm font-medium">
            {["500+ Partners", "₹2L Min Investment", "90-Day Setup", "18-24 Mo ROI"].map((stat) => (
              <span
                key={stat}
                className="rounded-full bg-white/20 px-5 py-2 backdrop-blur-sm"
              >
                {stat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl mb-10">
            Why Partner With Us?
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                  <Icon className="size-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{title}</h3>
                  <p className="mt-1 text-sm text-gray-600 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Investment Overview */}
      <section className="bg-gray-50 py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Investment Overview
          </h2>
          {/* [DECIDE] Final investment tiers to be confirmed by management before publishing */}
          <p className="text-center text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-8 max-w-lg mx-auto">
            Note: Final investment tiers are subject to management approval before publication.
          </p>
          <div className="grid gap-4 sm:grid-cols-3 text-center">
            {[
              { label: "Minimum Investment", value: "₹2,00,000" },
              { label: "Setup Timeline", value: "90 Days" },
              { label: "Avg. ROI Period", value: "18–24 Months" },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
                <p className="text-2xl font-extrabold text-accent-600">{value}</p>
                <p className="mt-1 text-sm text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Apply */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            How to Apply
          </h2>
          <div className="space-y-4">
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-500 text-white font-bold text-sm">
                  {i + 1}
                </div>
                <p className="text-gray-700">{step}</p>
                <CheckCircle2 className="ml-auto size-5 text-gray-300 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enquiry form */}
      <section className="bg-brand-50 py-16">
        <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
            Apply for Franchise
          </h2>
          <EnquiryForm
            defaultCourse="Franchise Inquiry"
          />
        </div>
      </section>
    </>
  );
}
