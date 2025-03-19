
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { Slider } from "@/components/ui/slider";
import { EvaluationCriteria, UniversityType, ScoreValue } from "../types";
import { Badge } from "@/components/ui/badge";
import { getUniversityCriteriaDescriptions } from "../evaluationConstants";
import { getCriteriaKeyFromColumn } from "../utils/pdf/criteriaUtils";

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
  
  // Load criteria descriptions based on university type
  const criteriaDescriptions = getUniversityCriteriaDescriptions(universityType);
  
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
  
  // Get description for a specific criteria and score
  const getDescription = (criteriaKey: string, score: ScoreValue): string => {
    return criteriaDescriptions[criteriaKey]?.[score] || "";
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
                    Academic Excellence <Badge className="ml-1">Academic Excellence</Badge>
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
                <FormDescription className="text-xs mt-1 text-foreground/70">
                  {getDescription('academicExcellence', field.value as ScoreValue)}
                </FormDescription>
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
                    Impact & Leadership <Badge className="ml-1">Impact & Leadership</Badge>
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
                <FormDescription className="text-xs mt-1 text-foreground/70">
                  {getDescription('impactLeadership', field.value as ScoreValue)}
                </FormDescription>
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
                    Unique Personal Narrative <Badge className="ml-1">Unique Narrative</Badge>
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
                <FormDescription className="text-xs mt-1 text-foreground/70">
                  {getDescription('uniqueNarrative', field.value as ScoreValue)}
                </FormDescription>
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
                <FormDescription className="text-xs mt-1 text-foreground/70">
                  {getDescription('academics', field.value as ScoreValue)}
                </FormDescription>
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
                <FormDescription className="text-xs mt-1 text-foreground/70">
                  {getDescription('extracurriculars', field.value as ScoreValue)}
                </FormDescription>
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
                    Talents & Abilities
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
                <FormDescription className="text-xs mt-1 text-foreground/70">
                  {getDescription('athletics', field.value as ScoreValue)}
                </FormDescription>
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
                <FormDescription className="text-xs mt-1 text-foreground/70">
                  {getDescription('personalQualities', field.value as ScoreValue)}
                </FormDescription>
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
                <FormDescription className="text-xs mt-1 text-foreground/70">
                  {getDescription('recommendations', field.value as ScoreValue)}
                </FormDescription>
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
                  <FormDescription className="text-xs mt-1 text-foreground/70">
                    {getDescription('interview', field.value as ScoreValue)}
                  </FormDescription>
                </FormItem>
              )}
            />
          )}
        </>
      )}
    </div>
  );
}
