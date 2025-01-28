import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import InviteStudentForm from "./InviteStudentForm";

interface InviteStudentDialogProps {
  counselorId: string;
}

export default function InviteStudentDialog({ counselorId }: InviteStudentDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-green-500 text-white hover:bg-green-600"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Student
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Student</DialogTitle>
        </DialogHeader>
        <InviteStudentForm 
          counselorId={counselorId} 
          onSuccess={() => setOpen(false)} 
        />
      </DialogContent>
    </Dialog>
  );
}