
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { User, Plus, X, CheckCircle } from "lucide-react";
import AddCollaboratorDialog from "./AddCollaboratorDialog";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  // Helper function to get status color
  const getStatusColor = (statusValue: string) => {
    switch (statusValue) {
      case "Pre-9":
        return "bg-blue-100 text-blue-800";
      case "G9":
        return "bg-purple-100 text-purple-800";
      case "G10":
        return "bg-indigo-100 text-indigo-800";
      case "G11":
        return "bg-orange-100 text-orange-800";
      case "College Bound":
        return "bg-pink-100 text-pink-800";
      case "Completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
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
            <div className="flex gap-3 flex-1 min-w-0">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-base text-gray-900 truncate">
                    {student.full_name}
                  </h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(status)}`}>
                    {status}
                  </span>
                </div>
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
            <div className="flex flex-col gap-2">
              {isPrimaryCounselor && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddCollaborator}
                    className="whitespace-nowrap"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveCollaborator}
                    className="whitespace-nowrap text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                  <Select 
                    value={status} 
                    onValueChange={handleStatusChange} 
                    onOpenChange={(open) => {
                      // Prevent card click when opening the select
                      if (open) {
                        event?.stopPropagation();
                      }
                    }}
                  >
                    <SelectTrigger 
                      className="h-8 w-full text-xs" 
                      onClick={(e) => e.stopPropagation()}
                    >
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pre-9">Pre-9</SelectItem>
                      <SelectItem value="G9">G9</SelectItem>
                      <SelectItem value="G10">G10</SelectItem>
                      <SelectItem value="G11">G11</SelectItem>
                      <SelectItem value="College Bound">College Bound</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
              <Button 
                onClick={handleViewSummary}
                size="sm"
                className="whitespace-nowrap"
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
