import { useTranslations } from "next-intl";
import { ShieldCheck, ShieldX, Calendar, Building2, User, Hash } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { VerificationResult } from "@/lib/api";
import { formatDate } from "@/lib/utils";

interface VerificationResultCardProps {
  result: VerificationResult;
}

export function VerificationResultCard({ result }: VerificationResultCardProps) {
  const t = useTranslations("verify.result");

  if (!result.found || !result.certificate) {
    return (
      <Card className="border-danger-200 bg-danger-50">
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <ShieldX className="size-14 text-danger-500" />
          <div>
            <p className="text-lg font-semibold text-danger-700">{t("invalid")}</p>
            <p className="mt-1 text-sm text-danger-600">{t("invalidDesc")}</p>
          </div>
        </div>
      </Card>
    );
  }

  const cert = result.certificate;

  return (
    <Card className="border-success-500/30 bg-success-50">
      <div className="flex items-start gap-4">
        <ShieldCheck className="size-10 shrink-0 text-success-700" />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-lg font-bold text-success-700">{t("valid")}</p>
            <Badge variant="success">{cert.isValid ? "VALID" : "REVOKED"}</Badge>
          </div>
          <p className="mt-1 text-sm text-success-600">{t("validDesc")}</p>
        </div>
      </div>

      {cert.studentPhotoUrl && (
        <div className="mt-4 flex justify-center">
          <img
            src={cert.studentPhotoUrl}
            alt={cert.studentName}
            className="size-20 rounded-full object-cover border-2 border-success-500/30"
          />
        </div>
      )}

      <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          { icon: User, label: t("name"), value: cert.studentName },
          { icon: Hash, label: t("certNo"), value: cert.certNo },
          { icon: Building2, label: t("course"), value: cert.course },
          { icon: ShieldCheck, label: t("grade"), value: `${cert.grade} (${cert.percentage}%)` },
          { icon: Calendar, label: t("issueDate"), value: formatDate(cert.issueDate) },
          { icon: Building2, label: t("center"), value: cert.centerName },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-2">
            <Icon className="mt-0.5 size-4 shrink-0 text-success-600" />
            <div>
              <dt className="text-xs font-medium text-gray-500">{label}</dt>
              <dd className="text-sm font-semibold text-gray-900">{value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </Card>
  );
}
