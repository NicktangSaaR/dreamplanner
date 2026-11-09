import { useLanguage } from "@/i18n/LanguageProvider";
import { Card, CardContent } from "@/components/ui/card";
import StudentKindBadge, { KIND_STYLE } from "@/components/StudentKindBadge";
import { cn } from "@/lib/utils";
import { studentKind } from "@/shared/planning";

interface StudentProfileProps {
  profile: {
    full_name: string | null;
    grade: string | null;
    school: string | null;
    interested_majors: string[] | null;
    graduation_school: string | null;
    background_intro: string | null;
    status?: string | null;
    applicant_type?: string | null;
  };
  /** Replaces the status line, e.g. the graduate summary. */
  statusText?: string;
}

export default function StudentProfile({ profile, statusText }: StudentProfileProps) {
  const { t } = useLanguage();
  const kind = studentKind(profile);
  return (
    <Card className={cn("overflow-hidden border-l-4", KIND_STYLE[kind].card)}>
      <CardContent className={cn("p-6", KIND_STYLE[kind].band)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold">{profile.full_name}</h2>
              <StudentKindBadge kind={kind} />
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">{t("st.statusShort")}：</span> {statusText || profile.status || profile.grade || t("st.notSet")}</p>
              <p><span className="font-medium">{t("st.school")}：</span> {profile.school || t("st.notSet")}</p>
              {profile.interested_majors && profile.interested_majors.length > 0 && (
                <p><span className="font-medium">{t("st.majors")}：</span> {profile.interested_majors.join(", ")}</p>
              )}
              {profile.graduation_school && (
                <p><span className="font-medium">{t("st.target")}：</span> {profile.graduation_school}</p>
              )}
            </div>
          </div>
          <div>
            {profile.background_intro && (
              <div>
                <h3 className="font-medium mb-2">{t("st.background")}</h3>
                <p className="text-sm text-muted-foreground">{profile.background_intro}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}