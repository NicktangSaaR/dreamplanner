import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Question } from "../types";
import QuestionBankForm from "./QuestionBankForm";

interface QuestionBankDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionToEdit: Question | null;
  onClose: () => void;
}

const QuestionBankDialog = ({
  open,
  onOpenChange,
  questionToEdit,
  onClose,
}: QuestionBankDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {questionToEdit ? "Edit Question Bank" : "Create Question Bank"}
          </DialogTitle>
        </DialogHeader>
        <QuestionBankForm
          questionToEdit={questionToEdit}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default QuestionBankDialog;