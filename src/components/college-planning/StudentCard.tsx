
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
    e.stopPropagation();
    console.log("Navigating to student view with ID:", student.id);
    navigate(`/counselor-dashboard/student/${student.id}`);
  };

  const handleAddCollaborator = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowCollaboratorDialog(true);
  };

  return (
    <>
      <Card 
        onClick={onClick}
        className="hover:shadow-md transition-shadow duration-200"
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div className="flex flex-col gap-1.5">
                <h3 className="font-semibold text-lg text-gray-900">
                  {student.full_name}
                </h3>
                <p className="text-sm text-gray-600">
                  {student.grade || "Grade not set"} • {student.school || "School not set"}
                </p>
                {student.interested_majors && student.interested_majors.length > 0 && (
                  <p className="text-sm text-gray-500">
                    Interested in: {student.interested_majors.join(", ")}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddCollaborator}
                className="whitespace-nowrap"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Collaborator
              </Button>
              <Button 
                onClick={handleViewSummary}
                size="sm"
                className="whitespace-nowrap"
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
