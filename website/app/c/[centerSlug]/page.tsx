import { notFound } from "next/navigation";
import { getCenter } from "@/lib/api";
import { EnquiryForm } from "@/components/shared/EnquiryForm";
import { SchemaOrg } from "@/components/shared/SchemaOrg";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { buildLocalBusinessSchema } from "@/lib/schema-org";
import { buildCenterMetadata } from "@/lib/metadata";
import { buildWhatsAppUrl } from "@/lib/utils";
import type { Metadata } from "next";
import {
  ShieldCheck, Phone, Mail, MapPin, Clock, MessageCircle,
  Star, GraduationCap
} from "lucide-react";

interface CenterMicrositePageProps {
  params: Promise<{ centerSlug: string }>;
}

export async function generateMetadata({
  params,
}: CenterMicrositePageProps): Promise<Metadata> {
  const { centerSlug } = await params;
  const center = await getCenter(centerSlug);
  if (!center) return {};
  return buildCenterMetadata({
    centerName: center.name,
    city: center.city,
    state: center.state,
    slug: center.slug,
  });
}

export default async function CenterMicrositePage({
  params,
}: CenterMicrositePageProps) {
  const { centerSlug } = await params;
  const center = await getCenter(centerSlug);
  if (!center) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.example.com";

  const schema = buildLocalBusinessSchema({
    name: center.name,
    description: `Authorized CompuTrain training center in ${center.city}, ${center.state}`,
    url: `${siteUrl}/c/${center.slug}`,
    telephone: center.phone,
    address: {
      streetAddress: center.address,
      addressLocality: center.city,
      addressRegion: center.state,
      postalCode: center.pincode,
      addressCountry: "IN",
    },
    image: center.photoUrl,
    openingHours: ["Mo-Sa 09:00-18:00"],
    geo: center.latitude && center.longitude
      ? { latitude: center.latitude, longitude: center.longitude }
      : undefined,
  });

  const whatsappUrl = buildWhatsAppUrl(
    center.whatsapp ?? center.phone,
    `Hi ${center.name}, I found you on CompuTrain and would like to enquire about courses.`
  );

  return (
    <>
      <SchemaOrg data={schema} />

      {/* Hero */}
      <div className="bg-brand-900 py-10 px-4 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold sm:text-3xl">{center.name}</h1>
              {center.isVerified && (
                <Badge variant="success">
                  <ShieldCheck className="mr-1 size-3.5" />
                  Verified Authorized Center
                </Badge>
              )}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-brand-200">
              <MapPin className="size-4 shrink-0" />
              <span>{center.address}, {center.city}, {center.state} – {center.pincode}</span>
            </div>
          </div>
          <div className="flex gap-3">
            {center.phone && (
              <a
                href={`tel:${center.phone}`}
                className="flex items-center gap-2 rounded-lg border border-white/30 px-4 py-2 text-sm hover:bg-white/10"
              >
                <Phone className="size-4" /> Call
              </a>
            )}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium hover:bg-green-600"
            >
              <MessageCircle className="size-4" /> WhatsApp
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-10">

            {/* About */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">About This Center</h2>
              <p className="text-gray-600">
                {center.name} is an authorized CompuTrain partner center established
                {center.establishedYear ? ` in ${center.establishedYear}` : ""} in {center.city}, {center.state}.
                We offer quality computer and vocational training with government-recognized certificates.
              </p>
            </section>

            {/* Faculty */}
            {center.faculty.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Our Faculty</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {center.faculty.map((f) => (
                    <Card key={f.id} className="flex items-start gap-3">
                      <div className="flex size-10 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-bold shrink-0">
                        {f.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{f.name}</p>
                        <p className="text-sm text-gray-500">{f.qualification}</p>
                        <p className="text-xs text-brand-600">{f.subject}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Courses & Fees */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Courses & Fees</h2>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Course</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Duration</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Fee</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {center.courses.map((cc) => (
                      <tr key={cc.courseId}>
                        <td className="px-4 py-3 font-medium text-gray-900">{cc.courseName}</td>
                        <td className="px-4 py-3 text-gray-600">{cc.durationMonths} mo</td>
                        <td className="px-4 py-3 font-semibold text-brand-700">
                          ₹{cc.fee.toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3">
                          <a
                            href={`/c/${center.slug}/${cc.courseSlug}`}
                            className="text-xs font-medium text-brand-600 hover:text-brand-700"
                          >
                            Enquire →
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Batch Timings */}
            {center.batchTimings.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Batch Timings</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {center.batchTimings.map((bt) => (
                    <div key={bt.id} className="flex items-start gap-3 rounded-lg border border-gray-200 p-4">
                      <Clock className="mt-0.5 size-5 text-brand-500 shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">{bt.courseName}</p>
                        <p className="text-sm text-gray-500">{bt.days} · {bt.time}</p>
                        <p className="text-xs text-green-600">{bt.availableSeats} seats available</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Toppers / Results Wall */}
            {center.toppers.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Results & Toppers</h2>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                  {center.toppers.map((topper) => (
                    <Card key={topper.id} className="text-center p-3">
                      <GraduationCap className="mx-auto size-8 text-brand-400 mb-2" />
                      <p className="text-sm font-bold text-gray-900">{topper.studentName}</p>
                      <p className="text-xs text-gray-500">{topper.course}</p>
                      <p className="mt-1 text-sm font-semibold text-brand-700">
                        {topper.grade} · {topper.percentage}%
                      </p>
                      <p className="text-xs text-gray-400">{topper.year}</p>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Testimonials */}
            {center.testimonialsEnabled && center.testimonials.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Student Testimonials</h2>
                <div className="space-y-4">
                  {center.testimonials.map((t) => (
                    <Card key={t.id}>
                      <div className="flex gap-1 mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`size-4 ${i < t.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                        ))}
                      </div>
                      <p className="text-sm italic text-gray-700">&ldquo;{t.text}&rdquo;</p>
                      <p className="mt-2 text-xs font-semibold text-gray-500">— {t.studentName}, {t.course}</p>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Gallery */}
            {center.photos.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Gallery</h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {center.photos.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`${center.name} photo ${i + 1}`}
                      className="aspect-video rounded-lg object-cover"
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Map embed */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Location</h2>
              <div className="h-52 rounded-xl overflow-hidden bg-brand-50 flex items-center justify-center border border-brand-100">
                <p className="text-sm text-brand-400">[Google Maps embed — {center.address}]</p>
              </div>
            </section>

          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <EnquiryForm
              centerSlug={center.slug}
              centerName={center.name}
              className="sticky top-24"
            />

            {/* Contact card */}
            <Card>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact</h3>
              <div className="space-y-2 text-sm">
                {center.phone && (
                  <a href={`tel:${center.phone}`} className="flex items-center gap-2 text-brand-600 hover:underline">
                    <Phone className="size-4" /> {center.phone}
                  </a>
                )}
                {center.email && (
                  <a href={`mailto:${center.email}`} className="flex items-center gap-2 text-brand-600 hover:underline">
                    <Mail className="size-4" /> {center.email}
                  </a>
                )}
                <div className="flex items-start gap-2 text-gray-600">
                  <MapPin className="mt-0.5 size-4 shrink-0" />
                  <span>{center.address}, {center.city} – {center.pincode}</span>
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </>
  );
}
