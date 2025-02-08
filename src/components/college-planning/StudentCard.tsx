
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { User, Plus } from "lucide-react";
import AddCollaboratorDialog from "./AddCollaboratorDialog";
import { useState } from "react";

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

  const handleViewSummary = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the card's onClick from firing
    console.log("Navigating to student view with ID:", student.id);
    navigate(`/counselor-dashboard/student/${student.id}`);
  };

  const handleAddCollaborator = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the card's onClick from firing
    setShowCollaboratorDialog(true);
  };

  return (
    <>
      <Card onClick={onClick}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{student.full_name}</h3>
                <p className="text-sm text-muted-foreground">
                  {student.grade || "Grade not set"} • {student.school || "School not set"}
                </p>
                {student.interested_majors && student.interested_majors.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Interested in: {student.interested_majors.join(", ")}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddCollaborator}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Collaborator
              </Button>
              <Button 
                onClick={handleViewSummary}
              >
                View Summary
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
