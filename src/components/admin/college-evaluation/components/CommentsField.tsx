
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
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
        <FormItem className="space-y-2">
          <FormLabel className="text-lg font-semibold">Evaluation Comments</FormLabel>
          <FormDescription>
            Enter detailed observations and recommendations for this student's application
          </FormDescription>
          <FormControl>
            <Textarea
              placeholder="Enter an overall evaluation and recommendations for this student's application..."
              className="min-h-32 resize-y"
              {...field}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
}
