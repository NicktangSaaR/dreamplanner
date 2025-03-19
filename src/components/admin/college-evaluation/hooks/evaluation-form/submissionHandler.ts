
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EvaluationCriteria, UniversityType, StudentEvaluation } from "../../types";
import { calculateTotalScore } from "../../utils/evaluationUtils";

interface SubmitEvaluationParams {
  values: { criteria: EvaluationCriteria; comments: string };
  studentId: string;
  studentName: string;
  universityType: UniversityType;
  profileId: string;
  existingEvaluation?: StudentEvaluation;
  isEditing: boolean;
}

export const submitEvaluation = async ({
  values,
  studentId,
  studentName,
  universityType,
  profileId,
  existingEvaluation,
  isEditing
}: SubmitEvaluationParams): Promise<StudentEvaluation> => {
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
    admin_id: isEditing ? (existingEvaluation?.admin_id || profileId) : profileId,
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
  
  if (result.error) {
    console.error(isEditing ? "Failed to update evaluation:" : "Failed to insert evaluation:", result.error);
    throw new Error(result.error.message);
  }
  
  return result.data as StudentEvaluation;
};
