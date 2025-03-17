
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScoreValue, UniversityType } from "../types";
import { UseFormReturn } from "react-hook-form";
import { getUniversityCriteriaDescriptions } from "../evaluationConstants";

interface CriteriaFieldProps {
  form: UseFormReturn<any>;
  name: string;
  label: string;
  criteriaKey: string;
  universityType: UniversityType;
}

export default function CriteriaField({ 
  form, 
  name, 
  label, 
  criteriaKey,
  universityType 
}: CriteriaFieldProps) {
  const criteriaDescriptions = getUniversityCriteriaDescriptions(universityType);
  
  // Get the appropriate label based on university type
  const getAdjustedLabel = () => {
    if (universityType === 'ucSystem') {
      // Adjust labels for UC System
      if (criteriaKey === 'recommendations') {
        return "Personal Insight Questions (PIQs)";
      }
      if (criteriaKey === 'athletics') {
        return "Personal Talents";
      }
      // Remove interview for UC System
      if (criteriaKey === 'interview') {
        return "Not Applicable for UC System";
      }
    }
    return label;
  };

  const getCriteriaDescription = (score: ScoreValue): string => {
    return criteriaDescriptions[criteriaKey]?.[score] || "";
  };

  // Skip rendering if this is the interview field for UC System
  if (universityType === 'ucSystem' && criteriaKey === 'interview') {
    return null;
  }

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-lg font-semibold">{getAdjustedLabel()}</FormLabel>
          <Select
            value={field.value.toString()}
            onValueChange={(value) => field.onChange(parseInt(value) as ScoreValue)}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select Score" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6].map((score) => (
                <SelectItem key={score} value={score.toString()}>
                  Score: {score} {score === 1 ? "(Highest)" : score === 6 ? "(Lowest)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormDescription>
            {getCriteriaDescription(field.value as ScoreValue)}
          </FormDescription>
        </FormItem>
      )}
    />
  );
}
