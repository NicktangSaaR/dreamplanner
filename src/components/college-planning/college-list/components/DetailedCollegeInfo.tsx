
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
              <Input placeholder="Enter college URL" {...field} value={field.value || ''} />
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
                value={field.value || ''}
                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Average SAT Score */}
      <FormField
        control={form.control}
        name="avg_sat"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Average SAT Score</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                placeholder="Enter average SAT" 
                {...field}
                value={field.value || ''}
                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Average ACT Score */}
      <FormField
        control={form.control}
        name="avg_act"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Average ACT Score</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                placeholder="Enter average ACT" 
                {...field}
                value={field.value || ''}
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
