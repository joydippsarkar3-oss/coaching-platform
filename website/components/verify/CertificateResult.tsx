import { useTranslations } from "next-intl";
import { ShieldCheck, ShieldX } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { VerificationResult } from "@/lib/api";

interface CertificateResultProps {
  result: VerificationResult;
}

export function CertificateResult({ result }: CertificateResultProps) {
  const t = useTranslations("verify.result");
  if (!result.certificate) return null;
  const cert = result.certificate;

  return (
    <div className="space-y-4">
      <div className={`flex items-center gap-3 rounded-xl p-4 ${cert.isValid ? "bg-success-50 border border-success-500/30" : "bg-danger-50 border border-danger-200"}`}>
        {cert.isValid ? (
          <ShieldCheck className="size-8 text-success-700" />
        ) : (
          <ShieldX className="size-8 text-danger-500" />
        )}
        <div>
          <p className="font-semibold">{cert.isValid ? t("valid") : t("invalid")}</p>
          <p className="text-sm text-gray-600">{cert.certNo}</p>
        </div>
        <Badge variant={cert.isValid ? "success" : "danger"} className="ml-auto">
          {cert.isValid ? "GENUINE" : "NOT FOUND"}
        </Badge>
      </div>

      {cert.isValid && (
        <Card>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-gray-500">{t("name")}</p><p className="font-semibold">{cert.studentName}</p></div>
            <div><p className="text-gray-500">{t("course")}</p><p className="font-semibold">{cert.course}</p></div>
            <div><p className="text-gray-500">{t("grade")}</p><p className="font-semibold">{cert.grade} ({cert.percentage}%)</p></div>
            <div><p className="text-gray-500">{t("issueDate")}</p><p className="font-semibold">{new Date(cert.issueDate).toLocaleDateString("en-IN")}</p></div>
            <div className="col-span-2"><p className="text-gray-500">{t("center")}</p><p className="font-semibold">{cert.centerName} ({cert.centerCode})</p></div>
          </div>
        </Card>
      )}
    </div>
  );
}
