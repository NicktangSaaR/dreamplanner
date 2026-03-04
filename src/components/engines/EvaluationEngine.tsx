import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BarChart3, Plus, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { useEngineScores } from "./hooks/useEngineScores";

interface EvaluationEngineProps {
  studentId: string;
  readOnly?: boolean;
}

const SCORE_FIELDS = [
  { key: "ari_score", label: "ARI 学术竞争力指数", autoKey: "ari_auto", description: "学术背景、标化、GPA综合评估" },
  { key: "narrative_index", label: "Narrative Index 叙事指数", autoKey: "narrative_auto", description: "个人故事线连贯性和独特性" },
  { key: "compound_growth", label: "Compound Growth 复合成长", autoKey: "compound_auto", description: "活动深度与角色递进" },
  { key: "game_risk", label: "Game Risk 博弈风险", autoKey: "game_risk_auto", description: "选校策略与竞争态势" },
];

export default function EvaluationEngine({ studentId, readOnly = false }: EvaluationEngineProps) {
  const { scores, isLoading, createScore, latestScore, hasStrategyAlert } = useEngineScores(studentId);
  const [isOpen, setIsOpen] = useState(false);
  const [newScore, setNewScore] = useState({
    ari_score: 5,
    narrative_index: 5,
    compound_growth: 5,
    game_risk: 5,
    counselor_adjustment_notes: "",
  });

  const handleCreate = () => {
    createScore.mutate({
      student_id: studentId,
      ari_score: newScore.ari_score,
      narrative_index: newScore.narrative_index,
      compound_growth: newScore.compound_growth,
      game_risk: newScore.game_risk,
      counselor_adjustment_notes: newScore.counselor_adjustment_notes || null,
      strategy_alert: false,
    });
    setIsOpen(false);
  };

  if (isLoading) return <Card><CardContent className="p-6">加载中...</CardContent></Card>;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5" />
          评分引擎 Evaluation Engine
          {latestScore && (
            <Badge variant="secondary">
              总分: {latestScore.total_score}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasStrategyAlert && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              ⚠️ 评分变化超过2分，建议触发战略调整会议！
            </AlertDescription>
          </Alert>
        )}

        {latestScore ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {SCORE_FIELDS.map(({ key, label }) => {
              const value = (latestScore as any)[key] || 0;
              const prevValue = scores[1] ? (scores[1] as any)[key] || 0 : value;
              const diff = value - prevValue;
              return (
                <div key={key} className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className="text-2xl font-bold">{value}</p>
                  {scores.length > 1 && (
                    <div className={`flex items-center justify-center text-xs mt-1 ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                      {diff > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : diff < 0 ? <TrendingDown className="h-3 w-3 mr-1" /> : null}
                      {diff > 0 ? `+${diff}` : diff === 0 ? '-' : diff}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">暂无评分记录</p>
        )}

        {latestScore?.counselor_adjustment_notes && (
          <div className="bg-muted/30 rounded p-3">
            <p className="text-xs font-medium mb-1">顾问备注</p>
            <p className="text-sm">{latestScore.counselor_adjustment_notes}</p>
          </div>
        )}

        {/* Score history */}
        {scores.length > 1 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">历史记录 ({scores.length}次评估)</p>
            <div className="flex gap-2 flex-wrap">
              {scores.slice(0, 6).map((s) => (
                <Badge key={s.id} variant="outline" className="text-xs">
                  {s.evaluation_date}: {s.total_score}分
                </Badge>
              ))}
            </div>
          </div>
        )}

        {!readOnly && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-3 w-3" /> 新增评估
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新增季度评估</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {SCORE_FIELDS.map(({ key, label, description }) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-sm">{label}</Label>
                    <p className="text-xs text-muted-foreground">{description}</p>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      step={0.5}
                      value={(newScore as any)[key]}
                      onChange={(e) => setNewScore(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                ))}
                <div className="space-y-1">
                  <Label>顾问调整备注</Label>
                  <Textarea
                    value={newScore.counselor_adjustment_notes}
                    onChange={(e) => setNewScore(prev => ({ ...prev, counselor_adjustment_notes: e.target.value }))}
                    placeholder="手动调整的原因说明..."
                    rows={2}
                  />
                </div>
                <Button onClick={handleCreate} disabled={createScore.isPending} className="w-full">
                  保存评估
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
