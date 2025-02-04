
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { CollegeListHeader } from "./college-list/components/CollegeListHeader";
import CollegeTable from "./college-list/CollegeTable";
import PrintStyles from "./college-list/PrintStyles";
import { CollegeApplication } from "./college-list/types";
import { useCollegeApplications } from "./college-list/hooks/useCollegeApplications";

export default function CollegeListSection() {
  const { studentId } = useParams();
  const [editApplication, setEditApplication] = useState<CollegeApplication | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  const { applications, handleSubmit, handleDelete } = useCollegeApplications(studentId);

  return (
    <div className="space-y-6 print:space-y-2">
      <CollegeListHeader 
        applications={applications}
        profile={profile}
        onSubmit={handleSubmit}
        editApplication={editApplication}
        isDialogOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onEditReset={() => setEditApplication(null)}
      />

      <CollegeTable 
        applications={applications}
        profile={profile}
        onDelete={handleDelete}
        onEdit={(application) => {
          setEditApplication(application);
          setIsDialogOpen(true);
        }}
      />

      <PrintStyles />
    </div>
  );
}
