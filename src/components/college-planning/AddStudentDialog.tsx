import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { useStudentManagement } from "@/hooks/useStudentManagement";
import StudentSearchForm from "./StudentSearchForm";
import { AddStudentDialogProps, StudentSearchFormData } from "./types/student-management";

export default function AddStudentDialog({ counselorId, onStudentAdded }: AddStudentDialogProps) {
  const [open, setOpen] = useState(false);
  const { isLoading, searchStudent, addStudent } = useStudentManagement(counselorId);

  const handleSubmit = async (data: StudentSearchFormData) => {
    const result = await searchStudent(data.email);
    
    if (result.error) {
      return;
    }

    if (result.user) {
      const success = await addStudent(result.user.id);
      if (success) {
        setOpen(false);
        onStudentAdded();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Student</DialogTitle>
        </DialogHeader>
        <StudentSearchForm onSubmit={handleSubmit} isLoading={isLoading} />
      </DialogContent>
    </Dialog>
  );
}