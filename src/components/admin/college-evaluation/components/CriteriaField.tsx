
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScoreValue } from "../types";
import { UseFormReturn } from "react-hook-form";
import { CRITERIA_DESCRIPTIONS } from "../evaluationConstants";

interface CriteriaFieldProps {
  form: UseFormReturn<any>;
  name: string;
  label: string;
  criteriaKey: keyof typeof CRITERIA_DESCRIPTIONS;
}

export default function CriteriaField({ form, name, label, criteriaKey }: CriteriaFieldProps) {
  const getCriteriaDescription = (score: ScoreValue): string => {
    return CRITERIA_DESCRIPTIONS[criteriaKey][score] || "";
  };

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-lg font-semibold">{label}</FormLabel>
          <Select
            value={field.value.toString()}
            onValueChange={(value) => field.onChange(parseInt(value) as ScoreValue)}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="选择分数" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6].map((score) => (
                <SelectItem key={score} value={score.toString()}>
                  {score} 分{score === 1 ? "（最高）" : score === 6 ? "（最低）" : ""}
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
