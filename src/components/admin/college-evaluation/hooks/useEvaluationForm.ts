
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
  onError?: (message: string) => void;
}

export function useEvaluationForm({ studentId, studentName, onSuccess, onError }: UseEvaluationFormProps) {
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
        interview: 3,
        // New admission factors with default values
        academicExcellence: 3,
        impactLeadership: 3,
        uniqueNarrative: 3
      },
      comments: ""
    }
  });

  const handleSubmit = async (values: { criteria: EvaluationCriteria; comments: string }) => {
    if (!profile?.id) {
      toast.error("管理员身份验证失败");
      if (onError) onError("管理员身份验证失败");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // For UC System, set interview score to a neutral value as it's not used
      if (universityType === 'ucSystem') {
        values.criteria.interview = 3; // Set to neutral value since it's not displayed
      }
      
      // Calculate total score using the selected university type
      const totalScore = calculateTotalScore(values.criteria, universityType);
      const evaluationDate = new Date().toISOString();
      
      // Create base evaluation data - includes only standard fields
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
        university_type: universityType,
        // Add core admission factors to the initial insert
        academic_excellence_score: values.criteria.academicExcellence,
        impact_leadership_score: values.criteria.impactLeadership,
        unique_narrative_score: values.criteria.uniqueNarrative
      };
      
      console.log("Saving evaluation with university type:", universityType);
      console.log("Saving full evaluation data:", evaluationData);
      
      // Attempt to insert with all fields first
      let result = await supabase
        .from("student_evaluations")
        .insert(evaluationData)
        .select()
        .single();
      
      // If there's an error related to missing columns
      if (result.error && result.error.message.includes('column') && result.error.message.includes('does not exist')) {
        console.log("Database schema does not have core factor columns, trying with base fields only");
        
        // Create a copy of evaluation data without the core factors
        const baseEvaluationData = { ...evaluationData };
        delete baseEvaluationData.academic_excellence_score;
        delete baseEvaluationData.impact_leadership_score;
        delete baseEvaluationData.unique_narrative_score;
        
        // Try again with just base fields
        result = await supabase
          .from("student_evaluations")
          .insert(baseEvaluationData)
          .select()
          .single();
      }
      
      // Handle final result
      if (!result.error) {
        console.log("Successfully saved evaluation");
        const evaluationWithType = result.data as StudentEvaluation;
        setSubmittedEvaluation(evaluationWithType);
        toast.success("评估创建成功");
        
        if (onSuccess) onSuccess();
      } else {
        console.error("Failed to insert evaluation:", result.error);
        toast.error("创建评估失败: " + result.error.message);
        if (onError) onError("创建评估失败: " + result.error.message);
      }
    } catch (error) {
      console.error("Error creating evaluation:", error);
      toast.error("创建评估失败");
      if (onError) onError("创建评估失败: " + (error instanceof Error ? error.message : String(error)));
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
