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
};

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
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    full_name: profile.full_name || "",
    status: profile.status || "G9",
    school: profile.school || "",
    majors: (profile.interested_majors || []).join(", "),
    graduation_school: profile.graduation_school || "",
    background_intro: profile.background_intro || "",
  });
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
    if (canChangeStatus && form.status !== profile.status) {
      update.status = form.status;
      update.grade = form.status;
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
