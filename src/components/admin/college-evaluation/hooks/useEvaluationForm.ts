
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { EvaluationCriteria, StudentEvaluation, UniversityType } from "../types";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { calculateTotalScore } from "../utils/evaluationUtils";

interface UseEvaluationFormProps {
  studentId: string;
  studentName: string;
  existingEvaluation?: StudentEvaluation;
  isEditing?: boolean;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

export function useEvaluationForm({ 
  studentId, 
  studentName, 
  existingEvaluation,
  isEditing = false,
  onSuccess, 
  onError 
}: UseEvaluationFormProps) {
  const { profile } = useProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedEvaluation, setSubmittedEvaluation] = useState<StudentEvaluation | null>(null);
  const [universityType, setUniversityType] = useState<UniversityType>(
    (existingEvaluation?.university_type as UniversityType) || "ivyLeague"
  );
  
  // Initialize the form with default values or existing evaluation data
  const form = useForm<{
    criteria: EvaluationCriteria;
    comments: string;
  }>({
    defaultValues: {
      criteria: {
        academics: existingEvaluation?.academics_score || 3,
        extracurriculars: existingEvaluation?.extracurriculars_score || 3,
        athletics: existingEvaluation?.athletics_score || 3,
        personalQualities: existingEvaluation?.personal_qualities_score || 3,
        recommendations: existingEvaluation?.recommendations_score || 3,
        interview: existingEvaluation?.interview_score || 3,
        // Core admission factors
        academicExcellence: existingEvaluation?.academic_excellence_score || 3,
        impactLeadership: existingEvaluation?.impact_leadership_score || 3,
        uniqueNarrative: existingEvaluation?.unique_narrative_score || 3
      },
      comments: existingEvaluation?.comments || ""
    }
  });

  // Update form values when existingEvaluation changes
  useEffect(() => {
    if (existingEvaluation && isEditing) {
      form.reset({
        criteria: {
          academics: existingEvaluation.academics_score,
          extracurriculars: existingEvaluation.extracurriculars_score,
          athletics: existingEvaluation.athletics_score,
          personalQualities: existingEvaluation.personal_qualities_score,
          recommendations: existingEvaluation.recommendations_score,
          interview: existingEvaluation.interview_score,
          // Core admission factors
          academicExcellence: existingEvaluation.academic_excellence_score || 3,
          impactLeadership: existingEvaluation.impact_leadership_score || 3,
          uniqueNarrative: existingEvaluation.unique_narrative_score || 3
        },
        comments: existingEvaluation.comments || ""
      });
      
      // Set the university type
      if (existingEvaluation.university_type) {
        setUniversityType(existingEvaluation.university_type as UniversityType);
      }
    }
  }, [existingEvaluation, isEditing, form]);

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
      
      // Create evaluation data
      const evaluationData = {
        student_id: studentId,
        student_name: studentName,
        evaluation_date: isEditing ? (existingEvaluation?.evaluation_date || evaluationDate) : evaluationDate,
        academics_score: values.criteria.academics,
        extracurriculars_score: values.criteria.extracurriculars,
        athletics_score: values.criteria.athletics,
        personal_qualities_score: values.criteria.personalQualities,
        recommendations_score: values.criteria.recommendations,
        interview_score: values.criteria.interview,
        comments: values.comments,
        total_score: totalScore,
        admin_id: isEditing ? (existingEvaluation?.admin_id || profile.id) : profile.id,
        university_type: universityType,
        // Core admission factors
        academic_excellence_score: values.criteria.academicExcellence,
        impact_leadership_score: values.criteria.impactLeadership,
        unique_narrative_score: values.criteria.uniqueNarrative
      };
      
      let result;
      
      if (isEditing && existingEvaluation) {
        console.log("Updating evaluation with id:", existingEvaluation.id);
        console.log("Update data:", evaluationData);
        
        // Update existing evaluation
        result = await supabase
          .from("student_evaluations")
          .update(evaluationData)
          .eq("id", existingEvaluation.id)
          .select()
          .single();
      } else {
        console.log("Creating new evaluation with university type:", universityType);
        console.log("New evaluation data:", evaluationData);
        
        // Insert new evaluation
        result = await supabase
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
      }
      
      // Handle final result
      if (!result.error) {
        console.log("Successfully saved evaluation");
        const evaluationWithType = result.data as StudentEvaluation;
        setSubmittedEvaluation(evaluationWithType);
        toast.success(isEditing ? "评估已更新成功" : "评估创建成功");
        
        if (onSuccess) onSuccess();
      } else {
        console.error(isEditing ? "Failed to update evaluation:" : "Failed to insert evaluation:", result.error);
        toast.error(isEditing ? "更新评估失败: " + result.error.message : "创建评估失败: " + result.error.message);
        if (onError) onError(isEditing ? "更新评估失败: " + result.error.message : "创建评估失败: " + result.error.message);
      }
    } catch (error) {
      console.error(isEditing ? "Error updating evaluation:" : "Error creating evaluation:", error);
      toast.error(isEditing ? "更新评估失败" : "创建评估失败");
      if (onError) onError(isEditing ? "更新评估失败: " + (error instanceof Error ? error.message : String(error)) : "创建评估失败: " + (error instanceof Error ? error.message : String(error)));
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
