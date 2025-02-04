
import { useParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import AddCollegeDialog from "./college-list/AddCollegeDialog";
import { getCollegeUrl } from "./college-list/useCollegeUrl";
import { CollegeFormValues } from "./college-list/collegeSchema";
import ExportButtons from "./college-list/ExportButtons";
import CollegeTable from "./college-list/CollegeTable";
import PrintStyles from "./college-list/PrintStyles";
import { CollegeApplication } from "./college-list/types";

export default function CollegeListSection() {
  const { toast } = useToast();
  const { studentId } = useParams();

  const { data: profile } = useQuery({
    queryKey: ["student-profile", studentId],
    queryFn: async () => {
      if (!studentId) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, grade, school, interested_majors")
        .eq("id", studentId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });

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

  const onSubmit = async (values: CollegeFormValues, applicationId?: string) => {
    try {
      console.log("Submitting application:", values, "ID:", applicationId);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const targetStudentId = studentId || user.id;
      const collegeUrl = await getCollegeUrl(values.college_name);
      
      const applicationData = {
        college_name: values.college_name,
        major: values.major,
        degree: values.degree,
        category: values.category,
        college_url: collegeUrl,
        student_id: targetStudentId
      };

      let error;
      if (applicationId) {
        // Update existing application
        ({ error } = await supabase
          .from("college_applications")
          .update(applicationData)
          .eq("id", applicationId));
      } else {
        // Insert new application
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

  return (
    <div className="space-y-6 print:space-y-2">
      <div className="flex justify-between items-center print:hidden">
        <h2 className="text-2xl font-bold">College List</h2>
        <div className="flex items-center gap-2">
          <ExportButtons 
            applications={applications} 
            profile={profile}
          />
          <AddCollegeDialog onSubmit={onSubmit} />
        </div>
      </div>

      <CollegeTable 
        applications={applications}
        profile={profile}
        onDelete={handleDelete}
        onEdit={(application) => {
          const dialog = document.createElement('dialog');
          dialog.innerHTML = `<add-college-dialog></add-college-dialog>`;
          document.body.appendChild(dialog);
          const addCollegeDialog = dialog.querySelector('add-college-dialog');
          if (addCollegeDialog) {
            // Pass the application data to initialize the form
            (addCollegeDialog as any).applicationData = application;
            (addCollegeDialog as any).onSubmit = (values: CollegeFormValues) => 
              onSubmit(values, application.id);
          }
          dialog.showModal();
        }}
      />

      <PrintStyles />
    </div>
  );
}
