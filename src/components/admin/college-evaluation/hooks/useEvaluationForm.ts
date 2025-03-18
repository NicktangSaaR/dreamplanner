
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
        university_type: universityType
      };
      
      console.log("Saving evaluation with university type:", universityType);
      
      // Try first without the new core factors fields in case the DB schema hasn't been updated
      let result = await supabase
        .from("student_evaluations")
        .insert(evaluationData)
        .select()
        .single();
      
      // If the insert was successful
      if (!result.error) {
        console.log("Successfully saved evaluation with standard fields");
        
        // Now let's try to update with the core admission factors
        // This approach allows us to work with both old and new DB schemas
        const coreFactorsData = {
          academic_excellence_score: values.criteria.academicExcellence,
          impact_leadership_score: values.criteria.impactLeadership,
          unique_narrative_score: values.criteria.uniqueNarrative
        };
        
        console.log("Updating with core factors:", coreFactorsData);
        
        // Try to update with the core factors (will fail silently if columns don't exist)
        const updateResult = await supabase
          .from("student_evaluations")
          .update(coreFactorsData)
          .eq("id", result.data.id)
          .select();
          
        console.log("Core factors update result:", updateResult);
        
        const evaluationWithType = result.data as StudentEvaluation;
        setSubmittedEvaluation(evaluationWithType);
        toast.success("评估创建成功");
        
        if (onSuccess) onSuccess();
      } else {
        console.error("Failed to insert evaluation:", result.error);
        toast.error("创建评估失败: " + result.error.message);
      }
    } catch (error) {
      console.error("Error creating evaluation:", error);
      toast.error("创建评估失败");
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
