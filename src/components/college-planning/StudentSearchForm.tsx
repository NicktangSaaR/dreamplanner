import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { StudentSearchFormData } from "./types/student-management";

interface StudentSearchFormProps {
  onSubmit: (data: StudentSearchFormData) => Promise<void>;
  isLoading: boolean;
}

export default function StudentSearchForm({ onSubmit, isLoading }: StudentSearchFormProps) {
  const form = useForm<StudentSearchFormData>({
    defaultValues: {
      email: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student Email</FormLabel>
              <FormControl>
                <Input {...field} type="email" placeholder="student@example.com" />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Searching..." : "Search Student"}
        </Button>
      </form>
    </Form>
  );
}