import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/i18n/LanguageProvider";
import { GRAD_DEGREE_LABEL, GRAD_STATUSES, GRAD_STATUS_LABEL } from "@/shared/planning";

export const GRADE_OPTIONS = ["Pre-9", "G9", "G10", "G11", "G12"];
export const SERVICE_OPTIONS = ["College Bound", "Transfer Student", "Completed"];

type StudentProfile = {
  id: string;
  full_name: string | null;
  status: string | null;
  school: string | null;
  interested_majors: string[] | null;
  graduation_school: string | null;
  background_intro: string | null;
  applicant_type?: string | null;
  grad_status?: string | null;
  grad_degree?: string | null;
  target_entry_year?: number | null;
  target_entry_term?: string | null;
};

const ENTRY_YEARS = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 1 + i);

/**
 * Edit a student's profile from the counselor side. Grade / service status
 * is shown only to the lead counselor, follow-up teachers and admins.
 */
export default function StudentStatusDialog({
  open, onOpenChange, profile, canChangeStatus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: StudentProfile;
  canChangeStatus: boolean;
}) {
  const { t, lang } = useLanguage();
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    full_name: profile.full_name || "",
    status: profile.status || "G9",
    school: profile.school || "",
    majors: (profile.interested_majors || []).join(", "),
    graduation_school: profile.graduation_school || "",
    background_intro: profile.background_intro || "",
    applicant_type: profile.applicant_type === "graduate" ? "graduate" : "undergrad",
    grad_status: profile.grad_status || "",
    grad_degree: profile.grad_degree || "",
    entry_year: profile.target_entry_year ? String(profile.target_entry_year) : "",
    entry_term: profile.target_entry_term || "fall",
  });
  const isGrad = form.applicant_type === "graduate";
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    const update: Record<string, unknown> = {
      full_name: form.full_name.trim() || null,
      school: form.school.trim() || null,
      interested_majors: form.majors.split(/[,，]/).map((m) => m.trim()).filter(Boolean),
      graduation_school: form.graduation_school.trim() || null,
      background_intro: form.background_intro.trim() || null,
    };
    if (canChangeStatus) {
      if (isGrad) {
        const gradStatus = form.status === "Completed" ? "Completed" : "Graduate";
        Object.assign(update, {
          applicant_type: "graduate",
          status: gradStatus,
          grad_status: form.grad_status || null,
          grad_degree: form.grad_degree || null,
          target_entry_year: form.entry_year ? Number(form.entry_year) : null,
          target_entry_term: form.entry_year ? form.entry_term : null,
        });
      } else {
        update.applicant_type = "undergrad";
        if (form.status !== profile.status || profile.applicant_type === "graduate") {
          const st = form.status === "Graduate" ? "G9" : form.status;
          update.status = st;
          update.grade = st;
        }
      }
    }
    // .select() makes a blocked update show up as zero rows instead of a silent no-op.
    const { data, error } = await supabase.from("profiles").update(update as never).eq("id", profile.id).select("id");
    setSaving(false);
    if (error || !data?.length) {
      toast.error(t("st.saveFailed"));
      return;
    }
    toast.success(t("st.saved"));
    queryClient.invalidateQueries({ queryKey: ["student-profile", profile.id] });
    queryClient.invalidateQueries({ queryKey: ["counselor-home"] });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("st.title")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="st-name">{t("st.name")}</Label>
            <Input id="st-name" value={form.full_name} onChange={(e) => set("full_name")(e.target.value)} />
          </div>
          {canChangeStatus && (
            <div className="grid gap-1.5">
              <Label>{L("申请类型", "Applying for")}</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["undergrad", "graduate"] as const).map((k) => (
                  <button key={k} type="button" aria-pressed={form.applicant_type === k}
                    onClick={() => setForm((f) => ({ ...f, applicant_type: k, status: k === "graduate" ? (f.status === "Completed" ? "Completed" : "Graduate") : (f.status === "Graduate" ? "G9" : f.status) }))}
                    className={`rounded-md border px-3 py-2 text-sm ${form.applicant_type === k ? "border-primary bg-primary/5 font-medium" : "hover:bg-muted/50"}`}>
                    {k === "undergrad" ? L("本科（高中生）", "Undergraduate") : L("研究生（硕士 / MBA）", "Graduate (Master's / MBA)")}
                  </button>
                ))}
              </div>
            </div>
          )}
          {canChangeStatus && isGrad && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>{L("目前状态", "Current status")}</Label>
                  <Select value={form.grad_status} onValueChange={set("grad_status")}>
                    <SelectTrigger><SelectValue placeholder={L("请选择", "Choose")} /></SelectTrigger>
                    <SelectContent>{GRAD_STATUSES.map((g) => <SelectItem key={g} value={g}>{L(GRAD_STATUS_LABEL[g].zh, GRAD_STATUS_LABEL[g].en)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>{L("申请方向", "Degree")}</Label>
                  <Select value={form.grad_degree} onValueChange={set("grad_degree")}>
                    <SelectTrigger><SelectValue placeholder={L("请选择", "Choose")} /></SelectTrigger>
                    <SelectContent>{(["masters", "mba"] as const).map((g) => <SelectItem key={g} value={g}>{L(GRAD_DEGREE_LABEL[g].zh, GRAD_DEGREE_LABEL[g].en)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>{L("计划入学时间", "Planned start")}</Label>
                <div className="flex gap-2">
                  <Select value={form.entry_year || "none"} onValueChange={(v) => set("entry_year")(v === "none" ? "" : v)}>
                    <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{L("还不确定", "Not set")}</SelectItem>
                      {ENTRY_YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={form.entry_term} onValueChange={set("entry_term")} disabled={!form.entry_year}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fall">{L("秋季", "Fall")}</SelectItem>
                      <SelectItem value="spring">{L("春季", "Spring")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">{L("规划阶段以入学时间为终点自动倒推：入学前 16 个月进入材料准备，前 12 个月申请，前 8 个月录取。", "Stages count back from this date: materials 16 months before, applications 12, admissions 8.")}</p>
              </div>
              <div className="grid gap-1.5">
                <Label>{L("服务状态", "Service status")}</Label>
                <Select value={form.status === "Completed" ? "Completed" : "Graduate"} onValueChange={set("status")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Graduate">{L("服务中", "Active")}</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          {canChangeStatus && !isGrad && (
            <div className="grid gap-1.5">
              <Label htmlFor="st-status">{t("st.status")}</Label>
              <Select value={form.status} onValueChange={set("status")}>
                <SelectTrigger id="st-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>{t("st.grades")}</SelectLabel>
                    {GRADE_OPTIONS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>{t("st.service")}</SelectLabel>
                    {SERVICE_OPTIONS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t("st.statusHint")}</p>
            </div>
          )}
          <div className="grid gap-1.5">
            <Label htmlFor="st-school">{t("st.school")}</Label>
            <Input id="st-school" value={form.school} onChange={(e) => set("school")(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="st-majors">{t("st.majors")}</Label>
            <Input id="st-majors" value={form.majors} onChange={(e) => set("majors")(e.target.value)} placeholder={t("st.majorsHint")} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="st-target">{t("st.target")}</Label>
            <Input id="st-target" value={form.graduation_school} onChange={(e) => set("graduation_school")(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="st-bg">{t("st.background")}</Label>
            <Textarea id="st-bg" rows={4} value={form.background_intro} onChange={(e) => set("background_intro")(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t("team.cancel")}</Button>
          <Button onClick={() => void save()} disabled={saving}>{t("st.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
