
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CollegeApplication } from "../types";
import { getCollegeInfo } from "../useCollegeInfo";
import { CollegeFormValues } from "../collegeSchema";

export const useCollegeApplications = (studentId: string | undefined) => {
  const { toast } = useToast();

  const { data: applications = [], refetch } = useQuery({
    queryKey: ["college-applications", studentId],
    queryFn: async () => {
      console.log("Fetching college applications for student:", studentId);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const targetStudentId = studentId || user.id;

      const { data, error } = await supabase
        .from("college_applications")
        .select("*")
        .eq("student_id", targetStudentId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching applications:", error);
        throw error;
      }

      console.log("College applications:", data);
      return data as CollegeApplication[];
    },
  });

  const handleSubmit = async (values: CollegeFormValues, applicationId?: string) => {
    try {
      console.log("Submitting application:", values, "ID:", applicationId);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const targetStudentId = studentId || user.id;

      // Check for duplicate college when adding new application
      if (!applicationId) {
        const isDuplicate = applications.some(
          app => app.college_name.toLowerCase() === values.college_name.toLowerCase()
        );

        if (isDuplicate) {
          toast({
            title: "Error",
            description: "This college has already been added to your list",
            variant: "destructive",
          });
          return;
        }
      }
      
      let applicationData;
      
      // Only get college info from AI when adding a new college
      if (!applicationId) {
        const collegeInfo = await getCollegeInfo(values.college_name);
        applicationData = {
          college_name: values.college_name,
          major: values.major,
          degree: values.degree,
          category: values.category,
          college_url: collegeInfo.website_url || `https://www.${values.college_name.toLowerCase().replace(/ /g, '')}.edu`,
          student_id: targetStudentId,
          avg_gpa: collegeInfo.avg_gpa,
          avg_sat: collegeInfo.avg_sat,
          avg_act: collegeInfo.avg_act,
          institution_type: collegeInfo.institution_type,
          state: collegeInfo.state,
          city: collegeInfo.city,
          test_optional: values.test_optional,
          notes: values.notes
        };
      } else {
        // For editing, just use the values directly
        applicationData = {
          college_name: values.college_name,
          major: values.major,
          degree: values.degree,
          category: values.category,
          college_url: values.college_url,
          student_id: targetStudentId,
          avg_gpa: values.avg_gpa,
          avg_sat: values.avg_sat,
          avg_act: values.avg_act,
          institution_type: values.institution_type,
          state: values.state,
          city: values.city,
          test_optional: values.test_optional,
          notes: values.notes
        };
      }

      let error;
      if (applicationId) {
        ({ error } = await supabase
          .from("college_applications")
          .update(applicationData)
          .eq("id", applicationId));
      } else {
        ({ error } = await supabase
          .from("college_applications")
          .insert(applicationData));
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: `College application ${applicationId ? 'updated' : 'added'} successfully`,
      });
      
      refetch();
    } catch (error) {
      console.error("Error saving application:", error);
      toast({
        title: "Error",
        description: `Failed to ${applicationId ? 'update' : 'add'} college application`,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      console.log("Deleting application:", id);
      const { error } = await supabase
        .from("college_applications")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "College application removed successfully",
      });
      
      refetch();
    } catch (error) {
      console.error("Error deleting application:", error);
      toast({
        title: "Error",
        description: "Failed to remove college application",
        variant: "destructive",
      });
    }
  };

  return {
    applications,
    handleSubmit,
    handleDelete
  };
};
