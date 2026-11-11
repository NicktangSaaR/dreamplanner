import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
const SEEN_KEY = "dreamplanner.linkCounselor.prompted";

/** The signed-in student's lead counselor name, or null when not linked yet. */
export function useMyCounselor(studentId: string) {
  return useQuery({
    queryKey: ["my-counselor", studentId],
    queryFn: async () => {
      const { data, error } = await db.rpc("my_counselor_name");
      if (error) throw error;
      return (data as string | null) || null;
    },
  });
}

/**
 * Shown to a student who has no counselor yet: a banner on the home page,
 * and — the first time they arrive — the picker opens by itself.
 */
export default function LinkCounselorPrompt({ studentId }: { studentId: string }) {
  const { lang } = useLanguage();
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const { data: counselor, isLoading, isError } = useMyCounselor(studentId);
  const [open, setOpen] = useState(false);
  const unlinked = !isLoading && !isError && !counselor;

  useEffect(() => {
    if (!unlinked) return;
    let seen = false;
    try {
      seen = window.sessionStorage.getItem(SEEN_KEY) === "1";
      window.sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* storage unavailable: still prompt */
    }
    if (!seen) setOpen(true);
  }, [unlinked]);

  if (!unlinked) return null;
  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-brass/40 bg-brass/10 px-4 py-3" data-tour="link-counselor">
        <UserPlus className="h-5 w-5 shrink-0 text-brass" />
        <div className="min-w-0 flex-1">
          <p className="font-medium">{L("先关联你的顾问", "Link your counselor first")}</p>
          <p className="text-sm text-muted-foreground">
            {L("关联后，顾问才能看到你的进度、给你安排任务和规划。", "Once linked, your counselor can see your progress and plan with you.")}
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>{L("选择我的顾问", "Choose my counselor")}</Button>
      </div>
      <LinkCounselorDialog studentId={studentId} open={open} onOpenChange={setOpen} />
    </>
  );
}

export function LinkCounselorDialog({ studentId, open, onOpenChange }: { studentId: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { lang } = useLanguage();
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: counselors = [], isLoading } = useQuery({
    queryKey: ["counselors-for-student"],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await db.rpc("list_counselors_for_student");
      if (error) throw error;
      return (data || []) as { id: string; full_name: string }[];
    },
  });
  const list = useMemo(
    () => counselors.filter((c) => !search.trim() || c.full_name.toLowerCase().includes(search.trim().toLowerCase())),
    [counselors, search],
  );
  const pickedName = counselors.find((c) => c.id === picked)?.full_name;

  const confirm = async () => {
    if (!picked) return;
    setSaving(true);
    try {
      const { error } = await db.rpc("link_my_counselor", { p_counselor_id: picked });
      if (error) throw error;
      toast.success(L(`已关联顾问 ${pickedName}`, `Linked with ${pickedName}`));
      qc.invalidateQueries({ queryKey: ["my-counselor", studentId] });
      onOpenChange(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String((e as { message?: string })?.message || "");
      toast.error(/already linked/.test(msg) ? L("你已经关联过顾问了", "You already have a counselor") : L("没能关联，请稍后再试", "Couldn't link. Please try again."));
      qc.invalidateQueries({ queryKey: ["my-counselor", studentId] });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{L("选择你的顾问", "Choose your counselor")}</DialogTitle>
          <DialogDescription>
            {L("请选择正在为你服务的顾问老师。选错了可以联系老师修改。", "Pick the counselor who works with you. If you pick the wrong one, ask your counselor to change it.")}
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={L("搜索老师姓名", "Search by name")} aria-label={L("搜索老师姓名", "Search by name")} />
        </div>
        <div className="max-h-72 overflow-y-auto rounded-md border" role="listbox" aria-label={L("顾问列表", "Counselors")}>
          {isLoading ? (
            <div className="flex justify-center p-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : list.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">{L("没有找到这位老师。", "No counselor found.")}</p>
          ) : (
            <ul className="divide-y">
              {list.map((c) => (
                <li key={c.id}>
                  <button role="option" aria-selected={picked === c.id} onClick={() => setPicked(c.id)}
                    className={cn("flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-muted/50", picked === c.id && "bg-primary/10 font-medium text-primary")}>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium uppercase text-foreground">{c.full_name.slice(0, 1)}</span>
                    <span className="flex-1">{c.full_name}</span>
                    {picked === c.id && <Check className="h-4 w-4" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>{L("稍后再说", "Later")}</Button>
          <Button onClick={() => void confirm()} disabled={!picked || saving}>
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}{pickedName ? L(`确认关联 ${pickedName}`, `Link ${pickedName}`) : L("确认关联", "Link")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
