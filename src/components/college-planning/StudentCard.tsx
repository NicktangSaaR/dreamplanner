
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { User, Plus, X } from "lucide-react";
import AddCollaboratorDialog from "./AddCollaboratorDialog";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StudentCardProps {
  student: {
    id: string;
    full_name: string | null;
    grade: string | null;
    school: string | null;
    interested_majors: string[] | null;
  };
  onClick?: () => void;
}

export default function StudentCard({ student, onClick }: StudentCardProps) {
  const navigate = useNavigate();
  const [showCollaboratorDialog, setShowCollaboratorDialog] = useState(false);
  const [isPrimaryCounselor, setIsPrimaryCounselor] = useState(false);
  const [isCollaborator, setIsCollaborator] = useState(false);

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
  }, [student.id]);

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

      const { error } = await supabase
        .from("counselor_collaborations")
        .delete()
        .eq('collaborator_id', user.id)
        .eq('student_id', student.id);

      if (error) {
        console.error("Error removing collaborator:", error);
        toast.error("Failed to remove collaborator");
        return;
      }

      toast.success("Removed from collaboration");
      // Refresh the page to update the UI
      window.location.reload();
    } catch (error) {
      console.error("Error in handleRemoveCollaborator:", error);
      toast.error("Failed to remove collaborator");
    }
  };

  return (
    <>
      <Card 
        onClick={onClick}
        className="hover:shadow-md transition-shadow duration-200"
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="font-semibold text-base text-gray-900 truncate">
                  {student.full_name}
                </h3>
                <p className="text-sm text-gray-600 truncate">
                  {student.grade || "Grade not set"} • {student.school || "School not set"}
                </p>
                {student.interested_majors && student.interested_majors.length > 0 && (
                  <p className="text-sm text-gray-500 truncate">
                    Interested in: {student.interested_majors.join(", ")}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
              {isPrimaryCounselor && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddCollaborator}
                  className="whitespace-nowrap px-2"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              )}
              {isCollaborator && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveCollaborator}
                  className="whitespace-nowrap px-2 text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                  Remove
                </Button>
              )}
              <Button 
                onClick={handleViewSummary}
                size="sm"
                className="whitespace-nowrap px-2"
              >
                View
              </Button>
            </div>
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
