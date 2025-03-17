
import { UseFormReturn } from "react-hook-form";
import CriteriaField from "./CriteriaField";
import { UniversityType } from "../types";
import { Separator } from "@/components/ui/separator";

interface EvaluationCriteriaFieldsProps {
  form: UseFormReturn<any>;
  universityType: UniversityType;
  criteriaType?: "core" | "traditional" | "all";
}

export default function EvaluationCriteriaFields({ 
  form, 
  universityType,
  criteriaType = "all"
}: EvaluationCriteriaFieldsProps) {
  // Render core admission criteria (the three main factors)
  if (criteriaType === "core" || criteriaType === "all") {
    return (
      <>
        {criteriaType === "all" && (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">核心录取三要素评估</h3>
              <p className="text-sm text-gray-500 mb-3">These three factors are critical for Ivy League admissions</p>
            </div>
          </>
        )}
        
        {/* Academic Excellence */}
        <CriteriaField 
          form={form} 
          name="criteria.academicExcellence" 
          label="Academic Excellence (学术卓越)" 
          criteriaKey="academicExcellence" 
          universityType={universityType}
        />

        {/* Impact & Leadership */}
        <CriteriaField 
          form={form} 
          name="criteria.impactLeadership" 
          label="Impact & Leadership (影响力和领导力)" 
          criteriaKey="impactLeadership" 
          universityType={universityType}
        />

        {/* Unique Personal Narrative */}
        <CriteriaField 
          form={form} 
          name="criteria.uniqueNarrative" 
          label="Unique Personal Narrative (个人特色和独特故事)" 
          criteriaKey="uniqueNarrative" 
          universityType={universityType}
        />
        
        {criteriaType === "all" && <Separator className="my-6" />}
      </>
    );
  }

  // Render traditional evaluation criteria
  if (criteriaType === "traditional" || criteriaType === "all") {
    return (
      <>
        {criteriaType === "all" && (
          <>
            <div className="mb-2">
              <h3 className="text-lg font-semibold mb-2">传统评估要素</h3>
              <p className="text-sm text-gray-500 mb-3">Traditional evaluation criteria</p>
            </div>
          </>
        )}

        {/* Academics Section */}
        <CriteriaField 
          form={form} 
          name="criteria.academics" 
          label="Academics" 
          criteriaKey="academics" 
          universityType={universityType}
        />

        {/* Extracurriculars Section */}
        <CriteriaField 
          form={form} 
          name="criteria.extracurriculars" 
          label="Extracurriculars" 
          criteriaKey="extracurriculars" 
          universityType={universityType}
        />

        {/* Athletics Section - for UC System, this becomes Personal Talents */}
        <CriteriaField 
          form={form} 
          name="criteria.athletics" 
          label={universityType === 'ucSystem' ? "Personal Talents" : "Athletics"} 
          criteriaKey="athletics" 
          universityType={universityType}
        />

        {/* Personal Qualities Section */}
        <CriteriaField 
          form={form} 
          name="criteria.personalQualities" 
          label="Personal Qualities" 
          criteriaKey="personalQualities" 
          universityType={universityType}
        />

        {/* Recommendations Section */}
        <CriteriaField 
          form={form} 
          name="criteria.recommendations" 
          label={universityType === 'ucSystem' ? "Personal Insight Questions (PIQs)" : "Recommendations"} 
          criteriaKey="recommendations" 
          universityType={universityType}
        />

        {/* Interview Section - don't show for UC System */}
        <CriteriaField 
          form={form} 
          name="criteria.interview" 
          label="Interview" 
          criteriaKey="interview" 
          universityType={universityType}
        />
      </>
    );
  }

  return null;
}
