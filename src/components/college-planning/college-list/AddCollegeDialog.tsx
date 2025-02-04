
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
  const { form, isLoadingCollegeInfo, handleSubmit } = useCollegeForm(applicationData, onSubmit);

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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BasicCollegeInfo form={form} />
              
              {(applicationData || isLoadingCollegeInfo) && (
                <>
                  <DetailedCollegeInfo form={form} />
                  <LocationInfo form={form} />
                </>
              )}
              
              <div className="col-span-2">
                <Form.Field
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>Notes</Form.Label>
                      <Form.Control>
                        <textarea 
                          {...field} 
                          className="w-full min-h-[100px] p-2 border rounded-md" 
                          placeholder="Add any notes about this college..."
                        />
                      </Form.Control>
                      <Form.Message />
                    </Form.Item>
                  )}
                />
              </div>
            </div>
            <Button type="submit" className="w-full">
              {applicationData ? 'Save Changes' : 'Add College'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
