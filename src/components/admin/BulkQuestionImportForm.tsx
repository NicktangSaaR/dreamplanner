import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "lucide-react";
import { toast } from "sonner";

interface BulkQuestionImportFormProps {
  bankId: string;
  onImport: (questions: { title: string; description?: string }[]) => Promise<void>;
}

export default function BulkQuestionImportForm({ bankId, onImport }: BulkQuestionImportFormProps) {
  const [content, setContent] = useState("");

  const handleBulkImport = async () => {
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      toast.error("Please enter at least one question");
      return;
    }

    const questions = lines.map(line => ({
      title: line,
      description: ""
    }));

    try {
      await onImport(questions);
      setContent("");
      toast.success(`Successfully imported ${questions.length} questions!`);
    } catch (error) {
      console.error("Error importing questions:", error);
      toast.error("Failed to import questions. Please try again.");
    }
  };

  return (
    <div className="mb-4">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Paste multiple questions (one per line) for bulk import..."
        className="mb-2"
      />
      <Button 
        onClick={handleBulkImport}
        disabled={!content.trim()}
        className="w-full"
      >
        <Upload className="h-4 w-4 mr-2" />
        Bulk Import Questions
      </Button>
    </div>
  );
}