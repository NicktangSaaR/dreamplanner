import { useState } from "react";
import { UserPlus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { LinkCounselorDialog } from "@/features/student-home/LinkCounselor";

interface SelectCounselorDialogProps {
  studentId: string;
  onCounselorSelected: () => void;
}

/** "Select counselor" button on the profile pages; the picker is shared with the student home page. */
export default function SelectCounselorDialog({ studentId, onCounselorSelected }: SelectCounselorDialogProps) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlus className="mr-2 h-4 w-4" />
        Select Counselor
      </Button>
      <LinkCounselorDialog
        studentId={studentId}
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) {
            qc.invalidateQueries();
            onCounselorSelected();
          }
        }}
      />
    </>
  );
}
