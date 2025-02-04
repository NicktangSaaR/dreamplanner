
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { CollegeFormValues } from "../collegeSchema";

interface BasicCollegeInfoProps {
  form: UseFormReturn<CollegeFormValues>;
}

export function BasicCollegeInfo({ form }: BasicCollegeInfoProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="college_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>College Name</FormLabel>
            <FormControl>
              <Input placeholder="Enter college name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="major"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Major</FormLabel>
            <FormControl>
              <Input placeholder="Enter major" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="degree"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Degree</FormLabel>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select degree type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Bachelor">Bachelor</SelectItem>
                <SelectItem value="Master">Master</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="category"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Category</FormLabel>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Hard Reach">Hard Reach</SelectItem>
                <SelectItem value="Reach">Reach</SelectItem>
                <SelectItem value="Hard Target">Hard Target</SelectItem>
                <SelectItem value="Target">Target</SelectItem>
                <SelectItem value="Safety">Safety</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
