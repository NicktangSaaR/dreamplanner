
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { EvaluationCriteria, ScoreValue } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

interface EvaluationFormProps {
  studentId: string;
  studentName: string;
  onSuccess?: () => void;
}

export default function EvaluationForm({ studentId, studentName, onSuccess }: EvaluationFormProps) {
  const { profile } = useProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<{
    criteria: EvaluationCriteria;
    comments: string;
  }>({
    defaultValues: {
      criteria: {
        academics: 3,
        extracurriculars: 3,
        awards: 3,
        personalQualities: 3,
        essays: 3
      },
      comments: ""
    }
  });

  const calculateTotalScore = (criteria: EvaluationCriteria): number => {
    return Object.values(criteria).reduce((sum, score) => sum + score, 0);
  };

  const handleSubmit = async (values: { criteria: EvaluationCriteria; comments: string }) => {
    if (!profile?.id) {
      toast.error("管理员身份验证失败");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const totalScore = calculateTotalScore(values.criteria);
      
      const { error } = await supabase
        .from("student_evaluations")
        .insert({
          student_id: studentId,
          student_name: studentName,
          evaluation_date: new Date().toISOString(),
          academics_score: values.criteria.academics,
          extracurriculars_score: values.criteria.extracurriculars,
          awards_score: values.criteria.awards,
          personal_qualities_score: values.criteria.personalQualities,
          essays_score: values.criteria.essays,
          comments: values.comments,
          total_score: totalScore,
          admin_id: profile.id
        });
      
      if (error) throw error;
      
      toast.success("评估表已成功创建");
      form.reset();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error creating evaluation:", error);
      toast.error("创建评估表失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCriteriaDescription = (criterion: keyof EvaluationCriteria, score: ScoreValue): string => {
    const descriptions = {
      academics: {
        1: "学术表现远低于藤校录取要求。GPA较低（<3.0），课程难度低，标准化考试成绩不理想（SAT<1300，ACT<27）。",
        2: "学术表现低于藤校平均水平。GPA中等偏下（<3.5），选修了一些高级课程但成绩一般，SAT/ACT成绩平平（SAT 1300-1400）。",
        3: "达到藤校录取的学术最低门槛。GPA尚可（约3.5左右），修过一定数量的荣誉或AP/IB课程，标准化成绩中等偏上（SAT ~1400-1480）。",
        4: "学术具有竞争力，达到藤校要求。GPA优秀（3.7+），选课难度高，标准化考试成绩优秀（SAT 1500+或ACT 33+）。",
        5: "学术非常有竞争力，接近藤校录取者平均水平。GPA接近满分，课程难度极大，标准化成绩接近满分（SAT 1550+）。",
        6: "学术表现属顶尖申请者水平，极有可能被录取。GPA满分且排名年级顶尖，选课难度最大且成绩卓越，标准化考试近乎满分。"
      },
      extracurriculars: {
        1: "课外活动几乎没有，或参与度极低。没有展现热情，无担任职务。",
        2: "课外活动经历有限，低于藤校要求。参加过一些社团但缺乏长期投入和领导力。",
        3: "课外活动达到基本门槛，但不突出。持续参与一些活动，无明显领导角色。",
        4: "课外活动有竞争力，展现良好投入。有深入参与并可能担任中级领导职务。",
        5: "课外活动非常有竞争力。展现显著领导力，在多个领域有突出参与。",
        6: "课外活动表现卓越，属顶尖水平。在一个或多个领域有不寻常成就和领导地位，有全国/国际影响力。"
      },
      awards: {
        1: "几乎没有任何像样的奖项或竞赛成果。",
        2: "奖项成绩低于藤校录取者水平。有少量校内奖励或小型竞赛参与。",
        3: "有一些基本奖项或竞赛成绩。在校级或地区级比赛中获奖。",
        4: "奖项具有竞争力，达到藤校要求。在州级比赛获奖或全国性竞赛中等奖项。",
        5: "奖项非常有竞争力。拥有国家级赛事高名次或国际赛事入围经历。",
        6: "奖项荣誉处于顶尖行列。在全国/国际级竞赛中取得卓越成绩。"
      },
      personalQualities: {
        1: "个人特质远低于标准。推荐信可能有负面评价，缺乏领导力和合作精神。",
        2: "个人特质低于平均水平。推荐信平淡，未展示明显领导潜力或个性亮点。",
        3: "个人特质达到基本要求。推荐信正面但中规中矩，展现良好品行但不突出。",
        4: "个人特质有竞争力。推荐信积极评价其责任心和领导潜能，有独特背景。",
        5: "个人特质非常有竞争力。推荐信高度赞扬，强调卓越领导力和影响力。",
        6: "个人特质属顶尖水平。推荐信给予最强烈赞美，非凡品格和领导魅力，影响深远。"
      },
      essays: {
        1: "文书远低于录取标准。主题空洞，缺乏个人特色，写作质量差。",
        2: "文书质量低于平均。缺乏深度，内容陈套，不够生动有说服力。",
        3: "文书达到基本要求。能回答提示，结构清晰，但整体较普通。",
        4: "文书具有竞争力。主题明确，体现个性和思考，写作质量良好。",
        5: "文书非常有竞争力。主题深刻有特色，故事生动，视角独特，表达流畅感人。",
        6: "文书属顶尖水平。主题创意独特，内容发人深省，写作极其出色，打动读者。"
      }
    };

    return descriptions[criterion][score] || "";
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">藤校（Ivy League）本科录取评估表</CardTitle>
        <CardDescription>
          为 <span className="font-medium">{studentName}</span> 创建大学申请评估
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Academics Section */}
            <FormField
              control={form.control}
              name="criteria.academics"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">学术表现（Academics）</FormLabel>
                  <Select
                    value={field.value.toString()}
                    onValueChange={(value) => field.onChange(parseInt(value) as ScoreValue)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择分数" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((score) => (
                        <SelectItem key={score} value={score.toString()}>
                          {score} 分
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {getCriteriaDescription("academics", field.value as ScoreValue)}
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* Extracurriculars Section */}
            <FormField
              control={form.control}
              name="criteria.extracurriculars"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">课外活动（Extracurriculars）</FormLabel>
                  <Select
                    value={field.value.toString()}
                    onValueChange={(value) => field.onChange(parseInt(value) as ScoreValue)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择分数" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((score) => (
                        <SelectItem key={score} value={score.toString()}>
                          {score} 分
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {getCriteriaDescription("extracurriculars", field.value as ScoreValue)}
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* Awards Section */}
            <FormField
              control={form.control}
              name="criteria.awards"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">奖项/竞赛（Awards/Competitions）</FormLabel>
                  <Select
                    value={field.value.toString()}
                    onValueChange={(value) => field.onChange(parseInt(value) as ScoreValue)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择分数" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((score) => (
                        <SelectItem key={score} value={score.toString()}>
                          {score} 分
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {getCriteriaDescription("awards", field.value as ScoreValue)}
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* Personal Qualities Section */}
            <FormField
              control={form.control}
              name="criteria.personalQualities"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">个人特质（Personal Qualities）</FormLabel>
                  <Select
                    value={field.value.toString()}
                    onValueChange={(value) => field.onChange(parseInt(value) as ScoreValue)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择分数" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((score) => (
                        <SelectItem key={score} value={score.toString()}>
                          {score} 分
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {getCriteriaDescription("personalQualities", field.value as ScoreValue)}
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* Essays Section */}
            <FormField
              control={form.control}
              name="criteria.essays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">论文（Essays）</FormLabel>
                  <Select
                    value={field.value.toString()}
                    onValueChange={(value) => field.onChange(parseInt(value) as ScoreValue)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择分数" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((score) => (
                        <SelectItem key={score} value={score.toString()}>
                          {score} 分
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {getCriteriaDescription("essays", field.value as ScoreValue)}
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* Comments Section */}
            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">评估意见</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="请输入对该学生申请情况的整体评估和建议..."
                      className="min-h-32"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="pt-4">
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "提交中..." : "提交评估"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
