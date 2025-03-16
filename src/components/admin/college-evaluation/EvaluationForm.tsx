
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { EvaluationCriteria, StudentEvaluation, UniversityType } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import CriteriaField from "./components/CriteriaField";
import CommentsField from "./components/CommentsField";
import { calculateTotalScore } from "./utils/evaluationUtils";
import { ExportPDFButton } from "./components/ExportPDFButton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface EvaluationFormProps {
  studentId: string;
  studentName: string;
  onSuccess?: () => void;
}

export default function EvaluationForm({ studentId, studentName, onSuccess }: EvaluationFormProps) {
  const { profile } = useProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedEvaluation, setSubmittedEvaluation] = useState<StudentEvaluation | null>(null);
  const [universityType, setUniversityType] = useState<UniversityType>("ivyLeague");
  
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

  const handleSubmit = async (values: { criteria: EvaluationCriteria; comments: string }) => {
    if (!profile?.id) {
      toast.error("管理员身份验证失败");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const totalScore = calculateTotalScore(values.criteria);
      const evaluationDate = new Date().toISOString();
      
      const evaluationData = {
        student_id: studentId,
        student_name: studentName,
        evaluation_date: evaluationDate,
        academics_score: values.criteria.academics,
        extracurriculars_score: values.criteria.extracurriculars,
        athletics_score: values.criteria.athletics,
        personal_qualities_score: values.criteria.personalQualities,
        recommendations_score: values.criteria.recommendations,
        interview_score: values.criteria.interview,
        comments: values.comments,
        total_score: totalScore,
        admin_id: profile.id,
        university_type: universityType
      };
      
      const { data, error } = await supabase
        .from("student_evaluations")
        .insert(evaluationData)
        .select()
        .single();
      
      if (error) throw error;
      
      setSubmittedEvaluation(data as StudentEvaluation);
      toast.success("评估表已成功创建");
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error creating evaluation:", error);
      toast.error("创建评估表失败");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Helper function to get university type display name
  const getUniversityTypeLabel = (type: UniversityType): string => {
    switch (type) {
      case 'ivyLeague':
        return "常青藤大学";
      case 'top30':
        return "Top 20-30 大学";
      case 'ucSystem':
        return "UC系统大学";
      default:
        return "美国大学";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-bold">美国本科录取评估表</CardTitle>
            <CardDescription>
              为 <span className="font-medium">{studentName}</span> 创建评估（评分标准：1为最高，6为最低）
            </CardDescription>
          </div>
          {submittedEvaluation && (
            <ExportPDFButton evaluation={submittedEvaluation} />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <Label htmlFor="university-type">选择大学类型</Label>
          <Select
            value={universityType}
            onValueChange={(value: UniversityType) => setUniversityType(value)}
          >
            <SelectTrigger id="university-type" className="w-full">
              <SelectValue placeholder="选择大学类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ivyLeague">常青藤大学</SelectItem>
              <SelectItem value="top30">Top 20-30 大学</SelectItem>
              <SelectItem value="ucSystem">UC系统大学</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Academics Section */}
            <CriteriaField 
              form={form} 
              name="criteria.academics" 
              label="学术表现（Academics）" 
              criteriaKey="academics" 
              universityType={universityType}
            />

            {/* Extracurriculars Section */}
            <CriteriaField 
              form={form} 
              name="criteria.extracurriculars" 
              label="课外活动（Extracurriculars）" 
              criteriaKey="extracurriculars" 
              universityType={universityType}
            />

            {/* Athletics Section */}
            <CriteriaField 
              form={form} 
              name="criteria.athletics" 
              label="运动（Athletics）" 
              criteriaKey="athletics" 
              universityType={universityType}
            />

            {/* Personal Qualities Section */}
            <CriteriaField 
              form={form} 
              name="criteria.personalQualities" 
              label="个人特质（Personal Qualities）" 
              criteriaKey="personalQualities" 
              universityType={universityType}
            />

            {/* Recommendations Section */}
            <CriteriaField 
              form={form} 
              name="criteria.recommendations" 
              label={universityType === 'ucSystem' ? "个人陈述问题（PIQs）" : "推荐信（Recommendations）"} 
              criteriaKey="recommendations" 
              universityType={universityType}
            />

            {/* Interview Section */}
            <CriteriaField 
              form={form} 
              name="criteria.interview" 
              label={universityType === 'ucSystem' ? "沟通能力（申请材料）" : "面试（Interview）"} 
              criteriaKey="interview" 
              universityType={universityType}
            />

            {/* Comments Section */}
            <CommentsField form={form} />

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
