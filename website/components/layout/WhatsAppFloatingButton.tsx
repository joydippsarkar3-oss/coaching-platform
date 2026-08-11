"use client";

import { buildWhatsAppUrl } from "@/lib/utils";
import { MessageCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";

interface WhatsAppFloatingButtonProps {
  centerPhone?: string;
  centerName?: string;
}

const HO_PHONE = process.env.NEXT_PUBLIC_HO_WHATSAPP ?? "919876543210";

export function WhatsAppFloatingButton({
  centerPhone,
  centerName,
}: WhatsAppFloatingButtonProps) {
  const searchParams = useSearchParams();
  // Center phone can also be injected via URL param (for center microsites)
  const phone =
    centerPhone ??
    searchParams.get("waPhone") ??
    HO_PHONE;

  const message = centerName
    ? `Hi, I found ${centerName} on CompuTrain and I would like to enquire about courses.`
    : "Hi, I found CompuTrain online and would like to enquire about courses.";

  const href = buildWhatsAppUrl(phone, message);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-transform hover:scale-110 hover:bg-green-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2"
    >
      <MessageCircle className="size-7" fill="currentColor" />
      <span className="sr-only">Chat on WhatsApp</span>
    </a>
  );
}
