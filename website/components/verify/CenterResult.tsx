import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ShieldCheck, MapPin, Phone, BookOpen } from "lucide-react";
import type { Center } from "@/lib/api";

interface CenterResultProps {
  center: Center | null;
}

export function CenterResult({ center }: CenterResultProps) {
  const t = useTranslations("centers");

  if (!center) {
    return (
      <div className="rounded-xl bg-gray-50 border border-gray-200 p-6 text-center">
        <p className="text-gray-600">No center found for this code.</p>
      </div>
    );
  }

  return (
    <Card>
      <div className="flex items-start gap-3 mb-4">
        <div className="flex size-12 items-center justify-center rounded-lg bg-brand-100 text-brand-700 font-bold text-lg shrink-0">
          {center.name.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900">{center.name}</h3>
            {center.isVerified && (
              <Badge variant="success">
                <ShieldCheck className="mr-1 size-3" />
                {t("verified")}
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500">{center.code}</p>
        </div>
      </div>
      <dl className="space-y-2 text-sm">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-4 text-gray-400 shrink-0" />
          <span>{center.address}, {center.city}, {center.state} – {center.pincode}</span>
        </div>
        {center.phone && (
          <div className="flex items-center gap-2">
            <Phone className="size-4 text-gray-400 shrink-0" />
            <a href={`tel:${center.phone}`} className="text-brand-600 hover:underline">{center.phone}</a>
          </div>
        )}
        <div className="flex items-center gap-2">
          <BookOpen className="size-4 text-gray-400 shrink-0" />
          <span>{center.courses.length} courses offered</span>
        </div>
      </dl>
    </Card>
  );
}
