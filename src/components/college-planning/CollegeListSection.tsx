import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AddCollegeDialog from "./college-list/AddCollegeDialog";
import CollegeCard from "./college-list/CollegeCard";
import { getCollegeUrl } from "./college-list/useCollegeUrl";
import * as z from "zod";

export default function CollegeListSection() {
  const { toast } = useToast();
  const { studentId } = useParams();

  const { data: applications, refetch } = useQuery({
    queryKey: ["college-applications", studentId],
    queryFn: async () => {
      console.log("Fetching college applications for student:", studentId);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // If studentId is provided (counselor view), use that, otherwise use current user's id
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
      return data;
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      console.log("Submitting application:", values);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // If studentId is provided (counselor view), use that, otherwise use current user's id
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

      const { error } = await supabase
        .from("college_applications")
        .insert(applicationData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "College application added successfully",
      });
      
      refetch();
    } catch (error) {
      console.error("Error adding application:", error);
      toast({
        title: "Error",
        description: "Failed to add college application",
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">College List</h2>
        <AddCollegeDialog onSubmit={onSubmit} />
      </div>

      <div className="grid gap-4">
        {applications?.map((app) => (
          <CollegeCard
            key={app.id}
            id={app.id}
            collegeName={app.college_name}
            major={app.major}
            degree={app.degree}
            category={app.category}
            collegeUrl={app.college_url}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}