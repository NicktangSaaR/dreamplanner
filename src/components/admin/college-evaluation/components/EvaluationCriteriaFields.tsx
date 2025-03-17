
import { UseFormReturn } from "react-hook-form";
import CriteriaField from "./CriteriaField";
import { UniversityType } from "../types";

interface EvaluationCriteriaFieldsProps {
  form: UseFormReturn<any>;
  universityType: UniversityType;
}

export default function EvaluationCriteriaFields({ form, universityType }: EvaluationCriteriaFieldsProps) {
  return (
    <>
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

      {/* Athletics Section - for UC System, this becomes Personal Talents */}
      <CriteriaField 
        form={form} 
        name="criteria.athletics" 
        label={universityType === 'ucSystem' ? "个人特长（Personal Talents）" : "运动（Athletics）"} 
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

      {/* Interview Section - don't show for UC System */}
      <CriteriaField 
        form={form} 
        name="criteria.interview" 
        label="面试（Interview）" 
        criteriaKey="interview" 
        universityType={universityType}
      />
    </>
  );
}
