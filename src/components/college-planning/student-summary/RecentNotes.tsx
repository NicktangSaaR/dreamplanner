import { useState } from "react";
import { Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import NoteDialog from "@/components/college-planning/NoteDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  author_name?: string;
}

interface RecentNotesProps {
  notes: Note[];
  studentId: string;
  onNotesChange?: () => void;
}

export default function RecentNotes({ studentId, onNotesChange }: RecentNotesProps) {
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: studentNotes, refetch: refetchNotes } = useQuery({
    queryKey: ['student-notes', studentId],
    queryFn: async () => {
      console.log("Fetching notes for student:", studentId);
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('author_id', studentId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching notes:", error);
        throw error;
      }

      console.log("Fetched notes:", data);
      return data || [];
    },
  });

  const handleCreateNote = async (data: { title: string; content: string }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Not authenticated");
      }

      console.log("Creating note for student:", studentId);
      const { error } = await supabase
        .from('notes')
        .insert([{
          title: data.title,
          content: data.content,
          author_id: studentId,
          author_name: user.email,
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Note created successfully",
      });

      setIsNoteDialogOpen(false);
      refetchNotes();
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
    <div className="rounded-lg border bg-card">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Notes</h3>
          <Button onClick={() => setIsNoteDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        </div>

        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {(studentNotes || []).map((note) => (
              <div
                key={note.id}
                className="p-4 rounded-lg border bg-card"
              >
                <h4 className="font-medium">{note.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{note.content}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <span>{formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}</span>
                  {note.author_name && (
                    <>
                      <span>•</span>
                      <span>{note.author_name}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
            {(!studentNotes || studentNotes.length === 0) && (
              <p className="text-center text-muted-foreground">No notes found</p>
            )}
          </div>
        </ScrollArea>
      </div>

      <NoteDialog
        open={isNoteDialogOpen}
        onOpenChange={setIsNoteDialogOpen}
        onSubmit={handleCreateNote}
        editingNote={null}
      />
    </div>
  );
}