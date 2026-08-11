import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ShieldCheck, ShieldX } from "lucide-react";
import type { StudentResult } from "@/lib/api";

interface StudentResultCardProps {
  result: StudentResult;
}

export function StudentResultCard({ result }: StudentResultCardProps) {
  const t = useTranslations("results");

  if (!result.found || !result.student) {
    return (
      <div className="rounded-xl bg-gray-50 border border-gray-200 p-6 text-center">
        <p className="text-gray-600">{t("noResults")}</p>
      </div>
    );
  }

  const student = result.student;
  const isPass = student.result === "PASS";

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">{student.name}</h3>
        <Badge variant={isPass ? "success" : "danger"}>
          {isPass ? (
            <><ShieldCheck className="mr-1 size-3" />{t("resultCard.pass")}</>
          ) : (
            <><ShieldX className="mr-1 size-3" />{t("resultCard.fail")}</>
          )}
        </Badge>
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-gray-500">{t("resultCard.rollNo")}</dt><dd className="font-semibold">{student.rollNo}</dd></div>
        <div><dt className="text-gray-500">{t("resultCard.course")}</dt><dd className="font-semibold">{student.course}</dd></div>
        <div><dt className="text-gray-500">{t("resultCard.grade")}</dt><dd className="font-semibold">{student.grade}</dd></div>
        <div><dt className="text-gray-500">{t("resultCard.percentage")}</dt><dd className="font-semibold">{student.percentage}%</dd></div>
        <div className="col-span-2"><dt className="text-gray-500">{t("resultCard.center")}</dt><dd className="font-semibold">{student.center}</dd></div>
      </dl>
    </Card>
  );
}
