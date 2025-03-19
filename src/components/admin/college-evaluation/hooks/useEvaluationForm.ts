
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { UniversityType, StudentEvaluation } from "../types";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { createInitialFormValues } from "./evaluation-form/formUtils";
import { submitEvaluation } from "./evaluation-form/submissionHandler";
import { UseEvaluationFormProps } from "./evaluation-form/types";

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
  const form = useForm({
    defaultValues: createInitialFormValues(existingEvaluation)
  });

  // Update form values when existingEvaluation changes
  useEffect(() => {
    if (existingEvaluation && isEditing) {
      form.reset(createInitialFormValues(existingEvaluation));
      
      // Set the university type
      if (existingEvaluation.university_type) {
        setUniversityType(existingEvaluation.university_type as UniversityType);
      }
    }
  }, [existingEvaluation, isEditing, form]);

  const handleSubmit = async (values: { criteria: any; comments: string }) => {
    if (!profile?.id) {
      toast.error("管理员身份验证失败");
      if (onError) onError("管理员身份验证失败");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const evaluation = await submitEvaluation({
        values,
        studentId,
        studentName,
        universityType,
        profileId: profile.id,
        existingEvaluation,
        isEditing
      });
      
      console.log("Successfully saved evaluation");
      setSubmittedEvaluation(evaluation);
      toast.success(isEditing ? "评估已更新成功" : "评估创建成功");
      
      if (onSuccess) onSuccess();
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
