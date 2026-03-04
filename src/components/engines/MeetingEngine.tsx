import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Users, Plus, Sparkles, Mail, Copy, CheckCircle2 } from "lucide-react";
import { useMeetings, useActionItems } from "./hooks/useMeetings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface MeetingEngineProps {
  studentId: string;
  readOnly?: boolean;
}

function MeetingActionItems({ meetingId, readOnly }: { meetingId: string; readOnly: boolean }) {
  const { actionItems, createAction, toggleAction } = useActionItems(meetingId);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [newAssignedTo, setNewAssignedTo] = useState("");

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    createAction.mutate({
      meeting_id: meetingId,
      title: newTitle,
      priority: newPriority as any,
      due_date: newDueDate || null,
      assigned_to: newAssignedTo || null,
    });
    setNewTitle("");
    setNewDueDate("");
    setNewAssignedTo("");
  };

  const priorityColors: Record<string, string> = {
    urgent: "bg-red-100 text-red-700",
    high: "bg-orange-100 text-orange-700",
    medium: "bg-blue-100 text-blue-700",
    low: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="space-y-2">
      {actionItems.map((item) => (
        <div key={item.id} className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={item.completed}
            onCheckedChange={(checked) => toggleAction.mutate({ id: item.id, completed: !!checked })}
            disabled={readOnly}
          />
          <span className={item.completed ? "line-through text-muted-foreground" : ""}>{item.title}</span>
          <Badge className={`text-xs ${priorityColors[item.priority]}`}>{item.priority}</Badge>
          {item.assigned_to && <span className="text-xs text-muted-foreground">→ {item.assigned_to}</span>}
          {item.due_date && <span className="text-xs text-muted-foreground">截止: {item.due_date}</span>}
        </div>
      ))}
      {!readOnly && (
        <div className="flex gap-2 items-end mt-2">
          <Input
            placeholder="新行动项..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Select value={newPriority} onValueChange={setNewPriority}>
            <SelectTrigger className="w-24 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="urgent">紧急</SelectItem>
              <SelectItem value="high">高</SelectItem>
              <SelectItem value="medium">中</SelectItem>
              <SelectItem value="low">低</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} className="w-36 text-xs" />
          <Input placeholder="分配给" value={newAssignedTo} onChange={(e) => setNewAssignedTo(e.target.value)} className="w-24 text-xs" />
          <Button size="sm" onClick={handleAdd}>+</Button>
        </div>
      )}
    </div>
  );
}

export default function MeetingEngine({ studentId, readOnly = false }: MeetingEngineProps) {
  const { meetings, isLoading, createMeeting, updateMeeting } = useMeetings(studentId);
  const [isCreating, setIsCreating] = useState(false);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [newMeeting, setNewMeeting] = useState({
    core_goal: "",
    last_month_completion: "",
    current_risk: "",
    decisions: "",
    meeting_notes: "",
    next_meeting_date: "",
  });

  const handleCreate = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    createMeeting.mutate({
      student_id: studentId,
      created_by: user.id,
      core_goal: newMeeting.core_goal || null,
      last_month_completion: newMeeting.last_month_completion || null,
      current_risk: newMeeting.current_risk || null,
      decisions: newMeeting.decisions || null,
      meeting_notes: newMeeting.meeting_notes || null,
      next_meeting_date: newMeeting.next_meeting_date || null,
    });
    setIsCreating(false);
    setNewMeeting({ core_goal: "", last_month_completion: "", current_risk: "", decisions: "", meeting_notes: "", next_meeting_date: "" });
  };

  const handleGenerateAI = async (meetingId: string, type: "minutes" | "email") => {
    setIsGenerating(`${meetingId}-${type}`);
    try {
      const { data, error } = await supabase.functions.invoke("generate-meeting-content", {
        body: { meetingId, type, studentId },
      });
      if (error) throw error;
      const field = type === "minutes" ? "ai_generated_minutes" : "ai_generated_email";
      updateMeeting.mutate({ id: meetingId, [field]: data.content });
      toast.success(`${type === "minutes" ? "会议纪要" : "邮件正文"}已生成`);
    } catch (err: any) {
      toast.error(`生成失败: ${err.message}`);
    } finally {
      setIsGenerating(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("已复制到剪贴板");
  };

  if (isLoading) return <Card><CardContent className="p-6">加载中...</CardContent></Card>;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            会议引擎 Meeting Loop
            <Badge variant="outline">{meetings.length} 次会议</Badge>
          </CardTitle>
          {!readOnly && (
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1"><Plus className="h-3 w-3" /> 新建会议</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>新建月度会议</DialogTitle></DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>本月核心目标</Label>
                    <Textarea value={newMeeting.core_goal} onChange={(e) => setNewMeeting(p => ({ ...p, core_goal: e.target.value }))} rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label>上月完成度</Label>
                    <Textarea value={newMeeting.last_month_completion} onChange={(e) => setNewMeeting(p => ({ ...p, last_month_completion: e.target.value }))} rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label>当前风险</Label>
                    <Textarea value={newMeeting.current_risk} onChange={(e) => setNewMeeting(p => ({ ...p, current_risk: e.target.value }))} rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label>决策记录</Label>
                    <Textarea value={newMeeting.decisions} onChange={(e) => setNewMeeting(p => ({ ...p, decisions: e.target.value }))} rows={2} />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>会议备注</Label>
                    <Textarea value={newMeeting.meeting_notes} onChange={(e) => setNewMeeting(p => ({ ...p, meeting_notes: e.target.value }))} rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>下次会议日期</Label>
                    <Input type="datetime-local" value={newMeeting.next_meeting_date} onChange={(e) => setNewMeeting(p => ({ ...p, next_meeting_date: e.target.value }))} />
                  </div>
                </div>
                <Button onClick={handleCreate} disabled={createMeeting.isPending} className="w-full mt-4">
                  创建会议
                </Button>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {meetings.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无会议记录</p>
        ) : (
          <Accordion type="single" collapsible defaultValue={meetings[0]?.id}>
            {meetings.map((m) => (
              <AccordionItem key={m.id} value={m.id}>
                <AccordionTrigger className="text-sm">
                  <div className="flex items-center gap-2">
                    <span>{format(new Date(m.meeting_date), "yyyy-MM-dd")}</span>
                    {m.core_goal && <span className="text-muted-foreground truncate max-w-[300px]">- {m.core_goal}</span>}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {m.core_goal && <div><p className="font-medium">🎯 核心目标</p><p className="text-muted-foreground">{m.core_goal}</p></div>}
                    {m.last_month_completion && <div><p className="font-medium">✅ 上月完成度</p><p className="text-muted-foreground">{m.last_month_completion}</p></div>}
                    {m.current_risk && <div><p className="font-medium">⚠️ 当前风险</p><p className="text-muted-foreground">{m.current_risk}</p></div>}
                    {m.decisions && <div><p className="font-medium">📝 决策记录</p><p className="text-muted-foreground">{m.decisions}</p></div>}
                  </div>
                  {m.meeting_notes && (
                    <div className="text-sm"><p className="font-medium">📋 会议备注</p><p className="text-muted-foreground whitespace-pre-wrap">{m.meeting_notes}</p></div>
                  )}

                  {/* Action Items */}
                  <div>
                    <p className="font-medium text-sm mb-2">📌 行动清单</p>
                    <MeetingActionItems meetingId={m.id} readOnly={readOnly} />
                  </div>

                  {/* AI Generated Content */}
                  {m.ai_generated_minutes && (
                    <div className="bg-muted/30 rounded p-3 text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium">🤖 AI会议纪要</p>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(m.ai_generated_minutes!)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="whitespace-pre-wrap text-muted-foreground">{m.ai_generated_minutes}</p>
                    </div>
                  )}
                  {m.ai_generated_email && (
                    <div className="bg-muted/30 rounded p-3 text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium">📧 AI邮件正文</p>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(m.ai_generated_email!)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="whitespace-pre-wrap text-muted-foreground">{m.ai_generated_email}</p>
                    </div>
                  )}

                  {/* AI Generation buttons */}
                  {!readOnly && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" variant="outline" className="gap-1"
                        onClick={() => handleGenerateAI(m.id, "minutes")}
                        disabled={isGenerating === `${m.id}-minutes`}
                      >
                        <Sparkles className="h-3 w-3" /> 生成纪要
                      </Button>
                      <Button 
                        size="sm" variant="outline" className="gap-1"
                        onClick={() => handleGenerateAI(m.id, "email")}
                        disabled={isGenerating === `${m.id}-email`}
                      >
                        <Mail className="h-3 w-3" /> 生成邮件
                      </Button>
                    </div>
                  )}

                  {m.next_meeting_date && (
                    <p className="text-xs text-muted-foreground">
                      📅 下次会议: {format(new Date(m.next_meeting_date), "yyyy-MM-dd HH:mm")}
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
