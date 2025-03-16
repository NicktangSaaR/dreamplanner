
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
          <FormLabel className="text-lg font-semibold">评估意见</FormLabel>
          <FormControl>
            <Textarea
              placeholder="请输入对该学生申请情况的整体评估和建议..."
              className="min-h-32"
              {...field}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
}
