
import React from "react";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";

interface CommentsFieldProps {
  form: UseFormReturn<any>;
}

export default function CommentsField({ form }: CommentsFieldProps) {
  return (
    <FormField
      control={form.control}
      name="comments"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-lg font-semibold">Evaluation Comments</FormLabel>
          <FormControl>
            <Textarea
              placeholder="Enter an overall evaluation and recommendations for this student's application..."
              className="min-h-32"
              {...field}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
}
