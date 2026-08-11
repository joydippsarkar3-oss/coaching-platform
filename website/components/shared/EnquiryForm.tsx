"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useState } from "react";

const enquirySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  courseInterest: z.string().optional(),
  message: z.string().max(500).optional(),
});

type EnquiryFormValues = z.infer<typeof enquirySchema>;

interface EnquiryFormProps {
  /** Pre-fill course interest */
  defaultCourse?: string;
  /** Attribute enquiry to a specific center */
  centerSlug?: string;
  centerName?: string;
  className?: string;
}

export function EnquiryForm({
  defaultCourse,
  centerSlug,
  centerName,
  className,
}: EnquiryFormProps) {
  const t = useTranslations("enquiryForm");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EnquiryFormValues>({
    resolver: zodResolver(enquirySchema),
    defaultValues: { courseInterest: defaultCourse ?? "" },
  });

  const onSubmit = async (data: EnquiryFormValues) => {
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          centerSlug,
          sourceUrl: window.location.href,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("success");
      reset();
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-xl bg-success-50 border border-success-500/30 p-6 text-center">
        <p className="font-semibold text-success-700">{t("success")}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={`space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm ${className ?? ""}`}
      noValidate
    >
      <h3 className="text-base font-semibold text-gray-900">
        {t("title")}
        {centerName && <span className="text-brand-600"> — {centerName}</span>}
      </h3>

      <Input
        label={t("name")}
        placeholder="Rahul Sharma"
        fullWidth
        required
        {...register("name")}
        error={errors.name?.message}
      />

      <Input
        label={t("phone")}
        placeholder="9876543210"
        type="tel"
        inputMode="numeric"
        fullWidth
        required
        {...register("phone")}
        error={errors.phone?.message}
      />

      <Input
        label={t("email")}
        placeholder="rahul@email.com"
        type="email"
        fullWidth
        {...register("email")}
        error={errors.email?.message}
      />

      <Input
        label={t("course")}
        placeholder="DCA, Tally, Python..."
        fullWidth
        {...register("courseInterest")}
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="enquiry-message" className="text-sm font-medium text-gray-700">
          {t("message")}
        </label>
        <textarea
          id="enquiry-message"
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          placeholder="Any questions or preferred batch timing..."
          {...register("message")}
        />
      </div>

      {status === "error" && (
        <p className="text-sm text-danger-500" role="alert">{t("error")}</p>
      )}

      <Button
        type="submit"
        loading={isSubmitting}
        fullWidth
      >
        {isSubmitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
