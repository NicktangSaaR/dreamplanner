import { useLanguage } from "@/i18n/LanguageProvider";
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
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="mr-1.5 h-4 w-4" />
          {t("ch.invite")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("ch.invite")}</DialogTitle>
        </DialogHeader>
        <InviteStudentForm 
          counselorId={counselorId} 
          onSuccess={() => setOpen(false)} 
        />
      </DialogContent>
    </Dialog>
  );
}