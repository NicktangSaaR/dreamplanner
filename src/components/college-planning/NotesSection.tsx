import { useNotes } from "@/hooks/useNotes";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import NotesList from "./NotesList";
import NoteDialog from "./NoteDialog";
import SharedFolderCard from "./SharedFolderCard";
import SharedFolderDialog from "./SharedFolderDialog";

interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  author_name?: string;
  is_pinned?: boolean;
  stars?: number;
}

interface NotesSectionProps {
  onNotesChange?: (notes: Note[]) => void;
}

export default function NotesSection({ onNotesChange }: NotesSectionProps) {
  const { notes, handleTogglePin, handleToggleStar, createNote, updateNote } = useNotes();
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const { toast } = useToast();

  const { data: folder } = useQuery({
    queryKey: ['shared-folder'],
    queryFn: async () => {
      console.log('Fetching shared folder...');
      const { data, error } = await supabase
        .from('shared_folders')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching shared folder:', error);
        throw error;
      }

      console.log('Shared folder data:', data);
      return data;
    },
  });

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setIsNoteDialogOpen(true);
  };

  const handleCreateNote = () => {
    setEditingNote(null);
    setIsNoteDialogOpen(true);
  };

  const onNoteSubmit = async (data: { title: string; content: string }) => {
    if (editingNote) {
      await updateNote({ ...editingNote, ...data });
    } else {
      await createNote(data);
    }
    setIsNoteDialogOpen(false);
  };

  const onFolderSubmit = async (data: { title: string; folder_url: string; description?: string }) => {
    try {
      const { error } = await supabase
        .from('shared_folders')
        .upsert([data]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Folder updated successfully",
      });
      
      setIsFolderDialogOpen(false);
    } catch (error) {
      console.error('Error updating shared folder:', error);
      toast({
        title: "Error",
        description: "Failed to update folder",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <NotesList
        notes={notes}
        onCreateNote={handleCreateNote}
        onTogglePin={handleTogglePin}
        onToggleStar={handleToggleStar}
        onEdit={handleEdit}
      />

      <Separator className="my-6" />

      <SharedFolderCard
        folder={folder}
        onEditClick={() => setIsFolderDialogOpen(true)}
      />

      <NoteDialog
        open={isNoteDialogOpen}
        onOpenChange={setIsNoteDialogOpen}
        onSubmit={onNoteSubmit}
        editingNote={editingNote}
      />

      <SharedFolderDialog
        open={isFolderDialogOpen}
        onOpenChange={setIsFolderDialogOpen}
        onSubmit={onFolderSubmit}
      />
    </div>
  );
}