import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import QuestionBankForm from "./QuestionBankForm";

const QuestionBankDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Create Question Bank
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Question Bank</DialogTitle>
        </DialogHeader>
        <QuestionBankForm />
      </DialogContent>
    </Dialog>
  );
};

export default QuestionBankDialog;