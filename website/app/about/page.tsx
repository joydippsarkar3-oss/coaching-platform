import { buildMetadata } from "@/lib/metadata";
import { SchemaOrg } from "@/components/shared/SchemaOrg";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({
  title: "About Us",
  description:
    "Learn about CompuTrain — our mission to make quality computer education accessible across India.",
  path: "/about",
});

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "CompuTrain",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.example.com",
  description:
    "CompuTrain provides government-recognized computer and vocational training through a network of 500+ authorized centers across India.",
  foundingDate: "2010",
  areaServed: "IN",
  numberOfEmployees: { "@type": "QuantitativeValue", value: "5000+" },
};

export default function AboutPage() {
  return (
    <>
      <SchemaOrg data={orgSchema} />

      {/* Hero */}
      <section className="bg-brand-900 py-16 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold sm:text-4xl">About CompuTrain</h1>
          <p className="mt-4 text-brand-200 text-lg">
            Empowering India&apos;s youth with digital skills since 2010.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 space-y-14">

        {/* Mission / Vision */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl bg-brand-50 p-6 border border-brand-100">
            <h2 className="text-lg font-bold text-brand-900 mb-2">Our Mission</h2>
            <p className="text-gray-700 leading-relaxed">
              To make quality computer and vocational education accessible to every student
              in India — regardless of geography, language, or economic background.
            </p>
          </div>
          <div className="rounded-xl bg-accent-50 p-6 border border-accent-100">
            <h2 className="text-lg font-bold text-accent-900 mb-2">Our Vision</h2>
            <p className="text-gray-700 leading-relaxed">
              A digitally skilled India where every young person has the tools to
              participate confidently in the modern economy.
            </p>
          </div>
        </div>

        {/* Story */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Story</h2>
          <div className="prose prose-gray max-w-none">
            <p>
              CompuTrain was founded in 2010 with a single training center and a vision
              to bring affordable, certified computer education to tier-2 and tier-3
              cities. Starting with just three courses, we have grown to offer 20+
              certified programs across 500+ authorized centers in 28 states.
            </p>
            <p>
              Our franchise model enables local entrepreneurs to become education
              providers in their communities, while our centralized platform ensures
              consistent curriculum quality, secure certificate issuance, and real-time
              verification for students and employers alike.
            </p>
            <p>
              Over 50,000 students have completed courses under the CompuTrain network,
              with thousands finding employment, launching freelancing careers, or
              advancing in government and private sector roles.
            </p>
          </div>
        </section>

        {/* Accreditations */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Accreditations &amp; Affiliations
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {["NIELIT", "NSDC", "ISO 9001:2015", "Ministry of Skill Development"].map((org) => (
              <div
                key={org}
                className="flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-4 py-5 text-center text-sm font-semibold text-gray-700"
              >
                {org}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-400">
            [Replace with actual logos and official accreditation links before launch]
          </p>
        </section>

        {/* Leadership placeholder */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Leadership Team</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "Arun Sharma", title: "Founder & CEO" },
              { name: "Priya Nair", title: "Director, Academics" },
              { name: "Vikram Singh", title: "Director, Franchise" },
            ].map((member) => (
              <div key={member.name} className="flex items-center gap-3 rounded-xl border border-gray-200 p-4">
                <div className="flex size-12 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-bold text-lg shrink-0">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-500">{member.title}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-400">[Replace with actual team profiles]</p>
        </section>
      </div>
    </>
  );
}
