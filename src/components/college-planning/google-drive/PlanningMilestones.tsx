import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, Mail, CheckCircle, AlertCircle } from "lucide-react";
import { format, differenceInDays, isPast } from "date-fns";
import { zhCN } from "date-fns/locale";

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  reminder_emails: string[];
  reminder_sent: boolean;
}

interface PlanningMilestonesProps {
  studentId: string;
  refreshTrigger?: number;
}

export default function PlanningMilestones({ studentId, refreshTrigger }: PlanningMilestonesProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMilestones();
  }, [studentId, refreshTrigger]);

  const loadMilestones = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('planning_milestones')
        .select('*')
        .eq('student_id', studentId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setMilestones(data || []);
    } catch (error) {
      console.error('Failed to load milestones:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (dueDate: string, reminderSent: boolean) => {
    const date = new Date(dueDate);
    const daysUntil = differenceInDays(date, new Date());

    if (isPast(date)) {
      return <Badge variant="destructive">已过期</Badge>;
    }
    if (daysUntil <= 7) {
      return <Badge variant="destructive">即将到期</Badge>;
    }
    if (daysUntil <= 14) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">临近</Badge>;
    }
    return <Badge variant="outline">未到期</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            规划节点
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            规划节点
          </CardTitle>
          <Badge variant="outline" className="text-sm px-3 py-1">{milestones.length} 个节点</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {milestones.length > 0 ? (
          <div className="space-y-4">
            {milestones.map((milestone) => {
              const dueDate = new Date(milestone.due_date);
              const daysUntil = differenceInDays(dueDate, new Date());
              const isOverdue = isPast(dueDate);

              return (
                <div
                  key={milestone.id}
                  className={`p-5 rounded-xl border-2 transition-colors ${
                    isOverdue 
                      ? 'border-destructive/50 bg-destructive/5' 
                      : daysUntil <= 7 
                        ? 'border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20'
                        : 'border-border hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold">{milestone.title}</h4>
                        {getStatusBadge(milestone.due_date, milestone.reminder_sent)}
                      </div>
                      {milestone.description && (
                        <p className="text-base text-muted-foreground mb-3">
                          {milestone.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          {format(dueDate, 'yyyy年M月d日', { locale: zhCN })}
                        </span>
                        {milestone.reminder_emails?.length > 0 && (
                          <span className="flex items-center gap-1.5">
                            <Mail className="h-4 w-4" />
                            {milestone.reminder_emails.length} 个收件人
                          </span>
                        )}
                        {milestone.reminder_sent && (
                          <span className="flex items-center gap-1.5 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            已发送提醒
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {!isOverdue && (
                        <span className={`text-base font-semibold ${
                          daysUntil <= 7 ? 'text-destructive' : 'text-muted-foreground'
                        }`}>
                          {daysUntil === 0 ? '今天' : `${daysUntil} 天后`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">
              暂无规划节点
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              选择规划文档后使用 AI 提取节点
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
