
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { Slider } from "@/components/ui/slider";
import { EvaluationCriteria, UniversityType } from "../types";
import { Badge } from "@/components/ui/badge";

interface EvaluationCriteriaFieldsProps {
  form: UseFormReturn<{
    criteria: EvaluationCriteria;
    comments: string;
  }>;
  universityType: UniversityType;
  criteriaType: "core" | "traditional";
}

export default function EvaluationCriteriaFields({
  form,
  universityType,
  criteriaType
}: EvaluationCriteriaFieldsProps) {
  // Determine which criteria fields to show based on the type
  const renderCoreCriteria = criteriaType === "core";
  const renderTraditionalCriteria = criteriaType === "traditional";
  
  // Map score to label (1 is highest, 6 is lowest)
  const getScoreLabel = (value: number) => {
    switch (value) {
      case 1: return "Outstanding";
      case 2: return "Excellent";
      case 3: return "Very Good";
      case 4: return "Good";
      case 5: return "Average";
      case 6: return "Below Average";
      default: return "Not Rated";
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Core Admission Factors */}
      {renderCoreCriteria && (
        <>
          <FormField
            control={form.control}
            name="criteria.academicExcellence"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between">
                  <FormLabel>
                    Academic Excellence <Badge className="ml-1">学术卓越</Badge>
                  </FormLabel>
                  <span className="text-sm font-medium">
                    {field.value}: {getScoreLabel(field.value)}
                  </span>
                </div>
                <FormControl>
                  <Slider
                    min={1}
                    max={6}
                    step={1}
                    defaultValue={[field.value]}
                    onValueChange={(values) => field.onChange(values[0])}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="criteria.impactLeadership"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between">
                  <FormLabel>
                    Impact & Leadership <Badge className="ml-1">影响力和领导力</Badge>
                  </FormLabel>
                  <span className="text-sm font-medium">
                    {field.value}: {getScoreLabel(field.value)}
                  </span>
                </div>
                <FormControl>
                  <Slider
                    min={1}
                    max={6}
                    step={1}
                    defaultValue={[field.value]}
                    onValueChange={(values) => field.onChange(values[0])}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="criteria.uniqueNarrative"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between">
                  <FormLabel>
                    Unique Personal Narrative <Badge className="ml-1">个人特色和独特故事</Badge>
                  </FormLabel>
                  <span className="text-sm font-medium">
                    {field.value}: {getScoreLabel(field.value)}
                  </span>
                </div>
                <FormControl>
                  <Slider
                    min={1}
                    max={6}
                    step={1}
                    defaultValue={[field.value]}
                    onValueChange={(values) => field.onChange(values[0])}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </>
      )}
      
      {/* Traditional Criteria */}
      {renderTraditionalCriteria && (
        <>
          <FormField
            control={form.control}
            name="criteria.academics"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between">
                  <FormLabel>Academics</FormLabel>
                  <span className="text-sm font-medium">
                    {field.value}: {getScoreLabel(field.value)}
                  </span>
                </div>
                <FormControl>
                  <Slider
                    min={1}
                    max={6}
                    step={1}
                    defaultValue={[field.value]}
                    onValueChange={(values) => field.onChange(values[0])}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="criteria.extracurriculars"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between">
                  <FormLabel>Extracurriculars</FormLabel>
                  <span className="text-sm font-medium">
                    {field.value}: {getScoreLabel(field.value)}
                  </span>
                </div>
                <FormControl>
                  <Slider
                    min={1}
                    max={6}
                    step={1}
                    defaultValue={[field.value]}
                    onValueChange={(values) => field.onChange(values[0])}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="criteria.athletics"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between">
                  <FormLabel>
                    {universityType === 'ucSystem' ? 'Personal Talents' : 'Athletics'}
                  </FormLabel>
                  <span className="text-sm font-medium">
                    {field.value}: {getScoreLabel(field.value)}
                  </span>
                </div>
                <FormControl>
                  <Slider
                    min={1}
                    max={6}
                    step={1}
                    defaultValue={[field.value]}
                    onValueChange={(values) => field.onChange(values[0])}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="criteria.personalQualities"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between">
                  <FormLabel>Personal Qualities</FormLabel>
                  <span className="text-sm font-medium">
                    {field.value}: {getScoreLabel(field.value)}
                  </span>
                </div>
                <FormControl>
                  <Slider
                    min={1}
                    max={6}
                    step={1}
                    defaultValue={[field.value]}
                    onValueChange={(values) => field.onChange(values[0])}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="criteria.recommendations"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between">
                  <FormLabel>
                    {universityType === 'ucSystem' ? 'Personal Insight Questions (PIQs)' : 'Recommendations'}
                  </FormLabel>
                  <span className="text-sm font-medium">
                    {field.value}: {getScoreLabel(field.value)}
                  </span>
                </div>
                <FormControl>
                  <Slider
                    min={1}
                    max={6}
                    step={1}
                    defaultValue={[field.value]}
                    onValueChange={(values) => field.onChange(values[0])}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          {/* Only show Interview for non-UC System universities */}
          {universityType !== 'ucSystem' && (
            <FormField
              control={form.control}
              name="criteria.interview"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between">
                    <FormLabel>Interview</FormLabel>
                    <span className="text-sm font-medium">
                      {field.value}: {getScoreLabel(field.value)}
                    </span>
                  </div>
                  <FormControl>
                    <Slider
                      min={1}
                      max={6}
                      step={1}
                      defaultValue={[field.value]}
                      onValueChange={(values) => field.onChange(values[0])}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          )}
        </>
      )}
    </div>
  );
}
