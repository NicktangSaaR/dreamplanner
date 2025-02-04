
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { formSchema, CollegeFormValues } from "./collegeSchema";
import { CollegeApplication } from "./types";
import { useEffect, useState } from "react";
import { getCollegeInfo } from "./useCollegeInfo";
import { BasicCollegeInfo } from "./components/BasicCollegeInfo";
import { DetailedCollegeInfo } from "./components/DetailedCollegeInfo";
import { LocationInfo } from "./components/LocationInfo";

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
  const [isLoadingCollegeInfo, setIsLoadingCollegeInfo] = useState(false);
  
  const form = useForm<CollegeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      college_name: "",
      major: "",
      degree: undefined,
      category: undefined,
      college_url: "",
      avg_gpa: null,
      avg_sat: null,
      avg_act: null,
      institution_type: null,
      state: null,
      city: null,
      test_optional: null,
      notes: null,
    },
  });

  useEffect(() => {
    if (applicationData) {
      form.reset({
        college_name: applicationData.college_name,
        major: applicationData.major,
        degree: applicationData.degree as "Bachelor" | "Master",
        category: applicationData.category as any,
        college_url: applicationData.college_url,
        avg_gpa: applicationData.avg_gpa || null,
        avg_sat: applicationData.avg_sat || null,
        avg_act: applicationData.avg_act || null,
        institution_type: applicationData.institution_type as "Public" | "Private" || null,
        state: applicationData.state || null,
        city: applicationData.city || null,
        test_optional: applicationData.test_optional || null,
        notes: applicationData.notes || null,
      });
    }
  }, [applicationData, form]);

  useEffect(() => {
    const subscription = form.watch(async (value, { name }) => {
      if (name === 'college_name' && value.college_name && !applicationData) {
        setIsLoadingCollegeInfo(true);
        try {
          const collegeInfo = await getCollegeInfo(value.college_name);
          form.setValue('test_optional', collegeInfo.test_optional || null);
          form.setValue('avg_gpa', collegeInfo.avg_gpa || null);
          form.setValue('avg_sat', collegeInfo.avg_sat || null);
          form.setValue('avg_act', collegeInfo.avg_act || null);
          form.setValue('institution_type', collegeInfo.institution_type || null);
          form.setValue('state', collegeInfo.state || null);
          form.setValue('city', collegeInfo.city || null);
          form.setValue('college_url', collegeInfo.website_url || null);
        } catch (error) {
          console.error('Error fetching college info:', error);
        } finally {
          setIsLoadingCollegeInfo(false);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, applicationData]);

  const handleSubmit = async (values: CollegeFormValues) => {
    await onSubmit(values, applicationData?.id);
    form.reset();
  };

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
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <textarea 
                        {...field} 
                        className="w-full min-h-[100px] p-2 border rounded-md" 
                        placeholder="Add any notes about this college..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
