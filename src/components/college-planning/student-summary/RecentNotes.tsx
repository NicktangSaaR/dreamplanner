import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import NoteDialog from "@/components/college-planning/NoteDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Note {
  id: string;
  title: string;
  content: string;
  created_at?: string;
  author_name?: string;
}

interface RecentNotesProps {
  notes: Note[];
  studentId: string;
  onNotesChange?: () => void;
}

export default function RecentNotes({ notes, studentId, onNotesChange }: RecentNotesProps) {
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleCreateNote = async (data: { title: string; content: string }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Not authenticated");
      }

      const { error } = await supabase
        .from("notes")
        .insert([{
          title: data.title,
          content: data.content,
          author_id: user.id,
          author_name: user.email,
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Note created successfully",
      });

      setIsNoteDialogOpen(false);
      onNotesChange?.();
    } catch (error) {
      console.error("Error creating note:", error);
      toast({
        title: "Error",
        description: "Failed to create note",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Recent Notes</h3>
          <Button 
            size="sm"
            onClick={() => setIsNoteDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        </div>
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-4 rounded-lg border bg-card"
              >
                <h4 className="font-medium">{note.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{note.content}</p>
                <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                  <span>{note.created_at && new Date(note.created_at).toLocaleDateString()}</span>
                  {note.author_name && <span>By: {note.author_name}</span>}
                </div>
              </div>
            ))}
            {notes.length === 0 && (
              <p className="text-center text-muted-foreground">No notes found</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <NoteDialog
        open={isNoteDialogOpen}
        onOpenChange={setIsNoteDialogOpen}
        onSubmit={handleCreateNote}
        editingNote={null}
      />
    </Card>
  );
}