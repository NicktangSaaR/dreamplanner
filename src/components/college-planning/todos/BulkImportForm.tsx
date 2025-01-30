import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "lucide-react";
import { toast } from "sonner";

interface BulkImportFormProps {
  onImport: (titles: string[]) => Promise<void>;
}

export default function BulkImportForm({ onImport }: BulkImportFormProps) {
  const [content, setContent] = useState("");

  const handleBulkImport = async () => {
    const todoTitles = content.split('\n').filter(title => title.trim());
    
    if (todoTitles.length === 0) {
      toast.error("Please enter at least one todo item");
      return;
    }

    try {
      await onImport(todoTitles);
      setContent("");
      toast.success(`Successfully imported ${todoTitles.length} todos!`);
    } catch (error) {
      console.error("Error importing todos:", error);
      toast.error("Failed to import todos. Please try again.");
    }
  };

  return (
    <div className="mb-4">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Paste multiple todos (one per line) for bulk import..."
        className="mb-2"
      />
      <Button 
        onClick={handleBulkImport}
        disabled={!content.trim()}
        className="w-full"
      >
        <Upload className="h-4 w-4 mr-2" />
        Bulk Import
      </Button>
    </div>
  );
}