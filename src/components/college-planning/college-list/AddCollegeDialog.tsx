
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { CollegeFormValues } from "./collegeSchema";
import { CollegeApplication } from "./types";
import { BasicCollegeInfo } from "./components/BasicCollegeInfo";
import { DetailedCollegeInfo } from "./components/DetailedCollegeInfo";
import { LocationInfo } from "./components/LocationInfo";
import { useCollegeForm } from "./hooks/useCollegeForm";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

interface AddCollegeDialogProps {
  onSubmit: (values: CollegeFormValues, applicationId?: string) => Promise<void>;
  applicationData?: CollegeApplication | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddCollegeDialog({ 
  onSubmit, 
  applicationData,
  open,
  onOpenChange
}: AddCollegeDialogProps) {
  const { form, isLoadingCollegeInfo, handleSubmit, isSubmitting, hasCollegeInfo } = useCollegeForm(applicationData, onSubmit, () => {
    if (onOpenChange) {
      onOpenChange(false);
    }
  });
  const [isManualMode, setIsManualMode] = useState(false);

  // Reset form when dialog is closed
  useEffect(() => {
    if (!open) {
      form.reset();
      setIsManualMode(false);
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add College
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{applicationData ? 'Edit College Application' : 'Add College Application'}</DialogTitle>
        </DialogHeader>
        
        {!applicationData && (
          <div className="flex items-center justify-between mb-4 p-2 bg-gray-50 rounded">
            <span className="text-sm text-gray-700">
              {isManualMode ? '手动模式：自行填写所有信息' : '自动模式：AI自动获取大学信息'}
            </span>
            <div className="flex items-center space-x-2">
              <Switch
                checked={isManualMode}
                onCheckedChange={setIsManualMode}
              />
            </div>
          </div>
        )}

        {isLoadingCollegeInfo && (
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>正在获取大学信息...</span>
              <span>50%</span>
            </div>
            <Progress value={50} />
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BasicCollegeInfo form={form} />
              
              {(applicationData || isManualMode || hasCollegeInfo) && (
                <>
                  <DetailedCollegeInfo form={form} />
                  <LocationInfo form={form} />
                </>
              )}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ''}
                      placeholder="Add any additional notes or important information about this college application..."
                      className="min-h-[100px]"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (applicationData ? 'Save Changes' : 'Add College')}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

