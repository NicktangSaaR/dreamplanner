
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AddCollaboratorDialog from "./AddCollaboratorDialog";
import { StudentInfo } from "./components/StudentInfo";
import { StudentCardActions } from "./components/StudentCardActions";

interface StudentCardProps {
  student: {
    id: string;
    full_name: string | null;
    grade: string | null;
    school: string | null;
    interested_majors: string[] | null;
    status?: string | null;
  };
  onClick?: () => void;
  onStatusChange?: (studentId: string, status: string) => void;
}

export default function StudentCard({ student, onClick, onStatusChange }: StudentCardProps) {
  const navigate = useNavigate();
  const [showCollaboratorDialog, setShowCollaboratorDialog] = useState(false);
  const [isPrimaryCounselor, setIsPrimaryCounselor] = useState(false);
  const [isCollaborator, setIsCollaborator] = useState(false);
  const [status, setStatus] = useState(student.status || "G9");

  useEffect(() => {
    const checkCounselorStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if primary counselor
      const { data: primaryData, error: primaryError } = await supabase
        .from("counselor_student_relationships")
        .select()
        .eq('counselor_id', user.id)
        .eq('student_id', student.id)
        .maybeSingle();

      if (primaryError) {
        console.error("Error checking primary counselor status:", primaryError);
        return;
      }

      // Check if collaborator
      const { data: collabData, error: collabError } = await supabase
        .from("counselor_collaborations")
        .select()
        .eq('collaborator_id', user.id)
        .eq('student_id', student.id)
        .maybeSingle();

      if (collabError) {
        console.error("Error checking collaborator status:", collabError);
        return;
      }

      setIsPrimaryCounselor(!!primaryData);
      setIsCollaborator(!!collabData);
    };

    checkCounselorStatus();
    // Initialize status from the student prop
    if (student.status) {
      setStatus(student.status);
    }
  }, [student.id, student.status]);

  const handleViewSummary = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Navigating to student view with ID:", student.id);
    navigate(`/counselor-dashboard/student/${student.id}`);
  };

  const handleAddCollaborator = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowCollaboratorDialog(true);
  };

  const handleRemoveCollaborator = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("No authenticated user found");
        return;
      }

      // Only allow primary counselor to remove collaborators
      const { data: primaryData, error: primaryError } = await supabase
        .from("counselor_student_relationships")
        .select()
        .eq('counselor_id', user.id)
        .eq('student_id', student.id)
        .maybeSingle();

      if (primaryError || !primaryData) {
        toast.error("Only the primary counselor can remove collaborators");
        return;
      }

      const { error } = await supabase
        .from("counselor_collaborations")
        .delete()
        .eq('student_id', student.id);

      if (error) {
        console.error("Error removing collaborator:", error);
        toast.error("Failed to remove collaborator");
        return;
      }

      toast.success("Collaborator removed successfully");
      // Refresh the page to update the UI
      window.location.reload();
    } catch (error) {
      console.error("Error in handleRemoveCollaborator:", error);
      toast.error("Failed to remove collaborator");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    
    try {
      // Update the student's status in the profiles table
      const { error } = await supabase
        .from("profiles")
        .update({ status: newStatus })
        .eq("id", student.id);

      if (error) {
        console.error("Error updating student status:", error);
        toast.error("Failed to update student status");
        return;
      }

      toast.success(`Student status updated to ${newStatus}`);
      
      // Call the onStatusChange callback if provided
      if (onStatusChange) {
        onStatusChange(student.id, newStatus);
      }
    } catch (error) {
      console.error("Error in handleStatusChange:", error);
      toast.error("Failed to update student status");
    }
  };

  return (
    <>
      <Card 
        onClick={onClick}
        className="hover:shadow-md transition-shadow duration-200"
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <StudentInfo student={student} status={status} />
            <StudentCardActions
              isPrimaryCounselor={isPrimaryCounselor}
              status={status}
              onStatusChange={handleStatusChange}
              onAddCollaborator={handleAddCollaborator}
              onRemoveCollaborator={handleRemoveCollaborator}
              onViewSummary={handleViewSummary}
            />
          </div>
        </CardContent>
      </Card>

      <AddCollaboratorDialog
        studentId={student.id}
        open={showCollaboratorDialog}
        onOpenChange={setShowCollaboratorDialog}
      />
    </>
  );
}
