
import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { formSchema, CollegeFormValues } from "./collegeSchema";
import { CollegeApplication } from "./types";

interface AddCollegeDialogProps {
  onSubmit: (values: CollegeFormValues, applicationId?: string) => Promise<void>;
  applicationData?: CollegeApplication;
}

export default function AddCollegeDialog({ onSubmit, applicationData }: AddCollegeDialogProps) {
  const [open, setOpen] = useState(false);
  const form = useForm<CollegeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      college_name: applicationData?.college_name || "",
      major: applicationData?.major || "",
      degree: (applicationData?.degree as "Bachelor" | "Master") || undefined,
      category: applicationData?.category as any || undefined,
    },
  });

  useEffect(() => {
    if (applicationData) {
      form.reset({
        college_name: applicationData.college_name,
        major: applicationData.major,
        degree: applicationData.degree as "Bachelor" | "Master",
        category: applicationData.category as any,
      });
    }
  }, [applicationData, form]);

  const handleSubmit = async (values: CollegeFormValues) => {
    await onSubmit(values, applicationData?.id);
    setOpen(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {applicationData ? 'Edit College' : 'Add College'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{applicationData ? 'Edit College Application' : 'Add College Application'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
            <Button type="submit" className="w-full">
              {applicationData ? 'Save Changes' : 'Add College'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
