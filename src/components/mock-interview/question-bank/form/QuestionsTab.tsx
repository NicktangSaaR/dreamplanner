import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { FormData } from "../types";

interface QuestionsTabProps {
  form: UseFormReturn<FormData>;
}

const QuestionsTab = ({ form }: QuestionsTabProps) => {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="questions"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Questions (One per line)</FormLabel>
            <FormControl>
              <Textarea 
                {...field} 
                placeholder="Enter questions here..."
                rows={10}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default QuestionsTab;