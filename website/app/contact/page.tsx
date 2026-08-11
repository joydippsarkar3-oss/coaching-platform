"use client";

import { useState } from "react";
import { buildMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import { Phone, Mail, MapPin, Clock, Send } from "lucide-react";

// Note: metadata export is handled in a server wrapper; "use client" here
// means metadata must be set in the parent layout or a parallel server component.
// For simplicity in this scaffold, metadata is provided via layout title template.

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, sourceUrl: window.location.href }),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("success");
      (e.target as HTMLFormElement).reset();
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Contact Us</h1>
        <p className="mt-2 text-gray-600">
          Have a question? We typically respond within one business day.
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Form */}
        <div>
          {status === "success" ? (
            <div className="rounded-xl bg-success-50 border border-success-500/30 p-6 text-center">
              <p className="font-semibold text-success-700">
                Message sent! We will get back to you soon.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {[
                { name: "name", label: "Your Name", type: "text", required: true },
                { name: "email", label: "Email Address", type: "email", required: true },
                { name: "phone", label: "Phone Number", type: "tel", required: false },
                { name: "subject", label: "Subject", type: "text", required: true },
              ].map(({ name, label, type, required }) => (
                <div key={name} className="flex flex-col gap-1">
                  <label htmlFor={`contact-${name}`} className="text-sm font-medium text-gray-700">
                    {label}{required && <span className="text-danger-500 ml-1">*</span>}
                  </label>
                  <input
                    id={`contact-${name}`}
                    name={name}
                    type={type}
                    required={required}
                    className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              ))}

              <div className="flex flex-col gap-1">
                <label htmlFor="contact-message" className="text-sm font-medium text-gray-700">
                  Your Message <span className="text-danger-500">*</span>
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={5}
                  required
                  className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              {status === "error" && (
                <p className="text-sm text-danger-500" role="alert">
                  Failed to send. Please try again.
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {loading ? (
                  <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Send className="size-4" />
                )}
                {loading ? "Sending..." : "Send Message"}
              </button>
            </form>
          )}
        </div>

        {/* Contact info */}
        <div className="space-y-6">
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-6 space-y-5">
            {[
              { icon: Phone, label: "Phone", value: "1800-000-0000 (Toll Free)", href: "tel:+911800000000" },
              { icon: Mail, label: "Email", value: "info@computrain.in", href: "mailto:info@computrain.in" },
              { icon: MapPin, label: "Head Office", value: "New Delhi, India", href: undefined },
              { icon: Clock, label: "Office Hours", value: "Mon–Sat, 9:00 AM – 6:00 PM", href: undefined },
            ].map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                  <Icon className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
                  {href ? (
                    <a href={href} className="text-sm text-brand-600 hover:underline">{value}</a>
                  ) : (
                    <p className="text-sm text-gray-700">{value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-brand-50 border border-brand-100 p-5">
            <p className="text-sm text-brand-800">
              <strong>For franchise inquiries</strong>, please visit our{" "}
              <a href="/franchise" className="underline hover:text-brand-700">
                Franchise page
              </a>{" "}
              and fill the dedicated form.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
