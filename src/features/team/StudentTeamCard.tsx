import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProfile } from "@/hooks/useProfile";
import { useLanguage } from "@/i18n/LanguageProvider";
import { TEAM_ROLES, type TeamRole, roleLabelKey } from "./teamRoles";

type Staff = { id: string; full_name: string | null; email: string | null };
type Member = { id: string; role: string; collaborator_id: string; person: Staff | null };

/**
 * The student's service team: the lead counselor plus team members with a
 * role (follow-up, essays & interviews, research, other). Only the lead
 * counselor or an admin can change the team.
 */
export default function StudentTeamCard({ studentId }: { studentId: string }) {
  const { t } = useLanguage();
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [newId, setNewId] = useState("");
  const [newRole, setNewRole] = useState<TeamRole>("followup");
  const [busy, setBusy] = useState(false);
  const key = ["student-team", studentId];

  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const db = supabase as any;
      const [{ data: rel }, { data: members }] = await Promise.all([
        db.from("counselor_student_relationships").select("counselor_id").eq("student_id", studentId).maybeSingle(),
        db.from("counselor_collaborations").select("id, role, collaborator_id").eq("student_id", studentId),
      ]);
      const ids = [rel?.counselor_id, ...(members || []).map((m: Member) => m.collaborator_id)].filter(Boolean);
      // Counselors can't read each other's profiles directly; staff_directory returns names.
      const { data: people } = ids.length ? await db.rpc("staff_directory") : { data: [] };
      const byId = new Map<string, Staff>((people || []).map((p: Staff) => [p.id, p]));
      return {
        leadId: (rel?.counselor_id as string) || null,
        lead: rel?.counselor_id ? byId.get(rel.counselor_id) || null : null,
        members: ((members || []) as Member[]).map((m) => ({ ...m, person: byId.get(m.collaborator_id) || null })),
      };
    },
  });

  // Lead counselor, follow-up teachers on this team, and admins manage the team.
  const canManage =
    !!profile &&
    (profile.user_type === "admin" ||
      (!!data?.leadId && data.leadId === profile.id) ||
      (data?.members || []).some((m) => m.collaborator_id === profile.id && m.role === "followup"));

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff-list"],
    enabled: adding,
    queryFn: async () => {
      const { data: rows } = await (supabase as any).rpc("staff_directory");
      return ((rows || []) as (Staff & { user_type: string })[]).filter((r) => r.user_type === "counselor");
    },
  });
  const taken = new Set([data?.leadId, ...(data?.members || []).map((m) => m.collaborator_id)]);
  const available = staffList.filter((s) => !taken.has(s.id));

  const refresh = () => queryClient.invalidateQueries({ queryKey: key });

  const addMember = async () => {
    if (!newId || !data?.leadId) return;
    setBusy(true);
    const { error } = await (supabase as any).from("counselor_collaborations").insert({
      primary_counselor_id: data.leadId,
      collaborator_id: newId,
      student_id: studentId,
      role: newRole,
    });
    setBusy(false);
    if (error) {
      toast.error(t("team.saveFailed"));
      return;
    }
    setAdding(false);
    setNewId("");
    refresh();
  };

  const changeRole = async (id: string, role: string) => {
    const { error } = await (supabase as any).from("counselor_collaborations").update({ role }).eq("id", id);
    if (error) toast.error(t("team.saveFailed"));
    refresh();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("counselor_collaborations").delete().eq("id", id);
    if (error) toast.error(t("team.saveFailed"));
    refresh();
  };

  const name = (p: Staff | null) => p?.full_name || p?.email || "—";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-primary" aria-hidden="true" /> {t("team.title")}
        </CardTitle>
        {canManage && !adding && (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
            <UserPlus className="mr-1.5 h-4 w-4" /> {t("team.add")}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <ul className="divide-y">
            <li className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{data?.lead ? name(data.lead) : t("team.noLead")}</p>
                {data?.lead?.email && <p className="truncate text-xs text-muted-foreground">{data.lead.email}</p>}
              </div>
              <Badge>{t("team.role.lead")}</Badge>
            </li>
            {(data?.members || []).map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{name(m.person)}</p>
                  {m.person?.email && <p className="truncate text-xs text-muted-foreground">{m.person.email}</p>}
                </div>
                {canManage ? (
                  <div className="flex shrink-0 items-center gap-1">
                    <Select value={m.role} onValueChange={(v) => void changeRole(m.id, v)}>
                      <SelectTrigger className="h-8 w-[9.5rem] text-xs" aria-label={t("team.roleLabel")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TEAM_ROLES.map((r) => (
                          <SelectItem key={r} value={r} className="text-xs">{t(roleLabelKey(r))}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      aria-label={t("team.remove")} onClick={() => void remove(m.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Badge variant="secondary">{t(roleLabelKey(m.role))}</Badge>
                )}
              </li>
            ))}
          </ul>
        )}

        {adding && (
          <div className="mt-3 flex flex-col gap-2 rounded-md border bg-muted/30 p-3 sm:flex-row sm:items-center">
            <Select value={newId} onValueChange={setNewId}>
              <SelectTrigger className="sm:flex-1" aria-label={t("team.pickPerson")}>
                <SelectValue placeholder={t("team.pickPerson")} />
              </SelectTrigger>
              <SelectContent>
                {available.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{name(s)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={newRole} onValueChange={(v) => setNewRole(v as TeamRole)}>
              <SelectTrigger className="sm:w-[10rem]" aria-label={t("team.roleLabel")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEAM_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{t(roleLabelKey(r))}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button size="sm" disabled={!newId || busy} onClick={() => void addMember()}>{t("team.confirmAdd")}</Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>{t("team.cancel")}</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
