import { useLanguage } from "@/i18n/LanguageProvider";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import InviteStudentForm from "./InviteStudentForm";
import CreateStudentForm from "@/features/accounts/CreateStudentForm";

interface InviteStudentDialogProps {
  counselorId: string;
}

/** Add a student: create their account directly, or email them a sign-up invitation. */
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("ch.invite")}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="create">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">{t("acct.tabCreate")}</TabsTrigger>
            <TabsTrigger value="invite">{t("acct.tabInvite")}</TabsTrigger>
          </TabsList>
          <TabsContent value="create" className="pt-2">
            <CreateStudentForm onDone={() => setOpen(false)} />
          </TabsContent>
          <TabsContent value="invite" className="pt-2">
            <InviteStudentForm counselorId={counselorId} onSuccess={() => setOpen(false)} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
