
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { CollegeFormValues } from "../collegeSchema";

interface DetailedCollegeInfoProps {
  form: UseFormReturn<CollegeFormValues>;
}

export function DetailedCollegeInfo({ form }: DetailedCollegeInfoProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="college_url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>College URL</FormLabel>
            <FormControl>
              <Input placeholder="Enter college URL" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* GPA Information */}
      <FormField
        control={form.control}
        name="avg_gpa"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Average GPA</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                step="0.01" 
                placeholder="Enter average GPA" 
                {...field}
                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* SAT 75th Percentile */}
      <FormField
        control={form.control}
        name="sat_75th"
        render={({ field }) => (
          <FormItem>
            <FormLabel>SAT (75th Percentile)</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                placeholder="Enter 75th percentile SAT" 
                {...field}
                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* ACT 75th Percentile */}
      <FormField
        control={form.control}
        name="act_75th"
        render={({ field }) => (
          <FormItem>
            <FormLabel>ACT (75th Percentile)</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                placeholder="Enter 75th percentile ACT" 
                {...field}
                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
