
import { useState } from "react";
import { useForm } from "react-hook-form";
import { EvaluationCriteria, StudentEvaluation, UniversityType } from "../types";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { calculateTotalScore } from "../utils/evaluationUtils";

interface UseEvaluationFormProps {
  studentId: string;
  studentName: string;
  onSuccess?: () => void;
}

export function useEvaluationForm({ studentId, studentName, onSuccess }: UseEvaluationFormProps) {
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
      // For UC System, set interview score to a neutral value as it's not used
      if (universityType === 'ucSystem') {
        values.criteria.interview = 3; // Set to neutral value since it's not displayed
      }
      
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
        university_type: universityType  // Store university type in the database
      };
      
      const { data, error } = await supabase
        .from("student_evaluations")
        .insert(evaluationData)
        .select()
        .single();
      
      if (error) throw error;
      
      // Add universityType to submitted evaluation for PDF export
      const evaluationWithType = {
        ...data as StudentEvaluation,
        university_type: universityType
      };
      
      setSubmittedEvaluation(evaluationWithType);
      toast.success("评估表已成功创建");
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error creating evaluation:", error);
      toast.error("创建评估表失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    isSubmitting,
    universityType,
    setUniversityType,
    submittedEvaluation,
    handleSubmit
  };
}
