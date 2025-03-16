
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
        athletics: 3,
        personalQualities: 3,
        recommendations: 3,
        interview: 3
      },
      comments: ""
    }
  });

  const calculateTotalScore = (criteria: EvaluationCriteria): number => {
    // Note: Lower score is better in Harvard's system (1 is best, 6 is worst)
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
          athletics_score: values.criteria.athletics,
          personal_qualities_score: values.criteria.personalQualities,
          recommendations_score: values.criteria.recommendations,
          interview_score: values.criteria.interview,
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
        1: "学术顶尖，极具竞争力。GPA 4.0+（未加权），最具挑战性的课程（最多AP/IB课程），SAT 1580+/ACT 35-36，可能有学术论文、国际科研奖项或奥赛金牌。",
        2: "学术非常强。GPA 3.9-4.0，AP/IB课程9+，SAT 1550+/ACT 34+，在全国级学术竞赛中有优秀成绩或有科研经历。",
        3: "学术优秀，符合哈佛录取标准。GPA 3.8-3.9，AP/IB课程7+，SAT 1500+/ACT 33+，可能在州级学术竞赛中获奖或有较强的学术活动。",
        4: "学术具备竞争力，但未达顶尖水平。GPA 3.7-3.8，修过一定数量的高级课程，SAT 1450+/ACT 31+，但没有学术竞赛或研究经历。",
        5: "学术低于哈佛平均录取者水平。GPA 3.5-3.7，课程挑战性一般，SAT 1300-1450，学术表现一般，缺乏学术突破。",
        6: "学术远低于录取标准。GPA <3.5，课程挑战性低，SAT <1300，无学术亮点。"
      },
      extracurriculars: {
        1: "全国或国际级影响力。创办或领导全国性组织，在国际级比赛（ISEF、奥赛等）获奖，或在社交/公益/创业方面有广泛社会影响。",
        2: "州级或全国级影响力。担任重要领导职位（如全国性组织创始人、学生会主席），在全国竞赛中获奖（DECA、FBLA、AMC 10/12 金奖）。",
        3: "学校或地区级影响力。担任学生组织主席或领导（如校报主编、体育队长），或在州级比赛中获奖（州级科学展、州级辩论赛冠军）。",
        4: "持续参与但影响力有限。在学校组织中积极参与但未担任领导角色，或在地方性竞赛有一定成绩。",
        5: "参与度较低。加入了一些俱乐部或志愿活动但无长期投入或领导力。",
        6: "课外活动无亮点。几乎无活动参与，或仅在高年级加入一些俱乐部但未投入。"
      },
      athletics: {
        1: "NCAA级别运动员，有哈佛体育教练推荐。可能是全国或州级冠军，被哈佛体育队认可。",
        2: "优秀运动员，在州级或全国比赛中表现突出。可能是全州最佳球员，或在全国性体育赛事中获得奖项。",
        3: "高中校队主力选手，在地方比赛中有成绩。",
        4: "普通校队成员，未获显著奖项。",
        5: "参加过体育活动，但无正式校队经验。",
        6: "无运动参与。"
      },
      personalQualities: {
        1: "极具人格魅力、领导力、影响力。可能是社区变革者、创新者，在推荐信和个人文书中展现出色的使命感和社会责任感。",
        2: "展现卓越的领导力和人格魅力。推荐信和个人文书高度评价其影响力和团队合作精神。",
        3: "良好的人格品质和领导力。展现出较强的责任心和团队合作能力。",
        4: "普通个性，无明显领导力或影响力。推荐信评价较好，但缺乏突出特点。",
        5: "个性较弱，缺乏领导力或影响力。推荐信普通，没有展现出个人特色。",
        6: "个性存在问题。推荐信可能有负面评价，表现出不成熟或缺乏团队精神。"
      },
      recommendations: {
        1: "教师认为申请者是他们职业生涯中最杰出的学生之一。推荐信极力称赞，给出具体例证。",
        2: "推荐信非常强烈。展现申请者的领导力、人格魅力，给予高度评价。",
        3: "推荐信良好。对申请者给予正面评价，但缺乏独特性。",
        4: "推荐信普通。评价虽正面，但没有强调申请者的卓越之处。",
        5: "推荐信较弱。仅为一般评价，未能体现申请者亮点。",
        6: "推荐信有负面信息或非常普通。"
      },
      interview: {
        1: "面试表现极其出色。展现极强的沟通能力、亲和力、思辨能力，给人留下深刻印象。",
        2: "面试表现优秀。展现领导力、热情和对哈佛的极大兴趣。",
        3: "面试表现良好。交流流畅，但未特别突出。",
        4: "面试表现一般。未展现特别的个人魅力或优势。",
        5: "面试表现较差。未能有效表达自己，或对学校缺乏了解。",
        6: "面试表现糟糕。可能出现不尊重面试官、缺乏热情或沟通不畅等问题。"
      }
    };

    return descriptions[criterion][score] || "";
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">哈佛大学本科录取评估表</CardTitle>
        <CardDescription>
          为 <span className="font-medium">{studentName}</span> 创建评估（评分标准：1为最高，6为最低）
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
                          {score} 分{score === 1 ? "（最高）" : score === 6 ? "（最低）" : ""}
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
                          {score} 分{score === 1 ? "（最高）" : score === 6 ? "（最低）" : ""}
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

            {/* Athletics Section */}
            <FormField
              control={form.control}
              name="criteria.athletics"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">运动（Athletics）</FormLabel>
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
                          {score} 分{score === 1 ? "（最高）" : score === 6 ? "（最低）" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {getCriteriaDescription("athletics", field.value as ScoreValue)}
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
                          {score} 分{score === 1 ? "（最高）" : score === 6 ? "（最低）" : ""}
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

            {/* Recommendations Section */}
            <FormField
              control={form.control}
              name="criteria.recommendations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">推荐信（Recommendations）</FormLabel>
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
                          {score} 分{score === 1 ? "（最高）" : score === 6 ? "（最低）" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {getCriteriaDescription("recommendations", field.value as ScoreValue)}
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* Interview Section */}
            <FormField
              control={form.control}
              name="criteria.interview"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">面试（Interview）</FormLabel>
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
                          {score} 分{score === 1 ? "（最高）" : score === 6 ? "（最低）" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {getCriteriaDescription("interview", field.value as ScoreValue)}
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
