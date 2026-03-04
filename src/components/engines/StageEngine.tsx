import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Compass, Target, Focus, FileCheck, AlertTriangle, Save } from "lucide-react";
import { useStudentPhase } from "./hooks/useStudentPhase";
import { PHASE_LABELS } from "./types";

interface StageEngineProps {
  studentId: string;
  grade?: string | null;
  readOnly?: boolean;
}

const PHASE_ICONS = {
  exploration: Compass,
  positioning: Target,
  consolidation: Focus,
  application: FileCheck,
};

const PHASE_COLORS = {
  exploration: "bg-blue-100 text-blue-800 border-blue-300",
  positioning: "bg-amber-100 text-amber-800 border-amber-300",
  consolidation: "bg-purple-100 text-purple-800 border-purple-300",
  application: "bg-green-100 text-green-800 border-green-300",
};

export default function StageEngine({ studentId, grade, readOnly = false }: StageEngineProps) {
  const { phase, isLoading, upsertPhase } = useStudentPhase(studentId);
  const [currentPhase, setCurrentPhase] = useState<string>("exploration");
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [compressionMode, setCompressionMode] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (phase) {
      setCurrentPhase(phase.current_phase);
      setStartDate(phase.phase_start_date);
      setCompressionMode(phase.compression_mode);
      setNotes(phase.phase_notes || "");
    }
  }, [phase]);

  // Grade-based auto-detection
  const gradeNum = grade ? parseInt(grade.replace(/\D/g, "")) : 0;
  const compressionWarning = gradeNum >= 10 && !compressionMode;
  const autoMergeWarning = gradeNum >= 11;

  const handleSave = () => {
    upsertPhase.mutate({
      student_id: studentId,
      current_phase: currentPhase as any,
      phase_start_date: startDate,
      compression_mode: compressionMode,
      phase_notes: notes || null,
    });
  };

  const PhaseIcon = PHASE_ICONS[currentPhase as keyof typeof PHASE_ICONS] || Compass;

  if (isLoading) return <Card><CardContent className="p-6">加载中...</CardContent></Card>;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <PhaseIcon className="h-5 w-5" />
          阶段引擎 Stage Engine
          <Badge className={PHASE_COLORS[currentPhase as keyof typeof PHASE_COLORS]}>
            {PHASE_LABELS[currentPhase]}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {compressionWarning && (
          <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              学生已达10年级，建议开启压缩模式以加速探索阶段。
            </AlertDescription>
          </Alert>
        )}
        {autoMergeWarning && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              学生已达11年级，建议直接进入"定位+聚焦"合并模式。
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>当前阶段 Current Phase</Label>
            <Select value={currentPhase} onValueChange={setCurrentPhase} disabled={readOnly}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PHASE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>阶段开始日期</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={readOnly} />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <Switch checked={compressionMode} onCheckedChange={setCompressionMode} disabled={readOnly} />
            <Label>压缩模式 Compression Mode</Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label>阶段备注</Label>
          <Textarea 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)} 
            placeholder="记录当前阶段的关键决策和方向..."
            disabled={readOnly}
            rows={2}
          />
        </div>

        {!readOnly && (
          <Button onClick={handleSave} disabled={upsertPhase.isPending} className="gap-2">
            <Save className="h-4 w-4" />
            保存阶段设置
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
