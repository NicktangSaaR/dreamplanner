import { useNotes } from "@/hooks/useNotes";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import NotesList from "./NotesList";
import NoteDialog from "./NoteDialog";
import SharedFolderCard from "./SharedFolderCard";
import SharedFolderDialog from "./SharedFolderDialog";
import { useProfile } from "@/hooks/useProfile";

interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  author_name?: string;
  author_id?: string;
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
  const { profile } = useProfile();

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

  const canEditNote = (note: Note) => {
    if (!profile) return false;
    return profile.is_admin || note.author_id === profile.id;
  };

  const handleEdit = (note: Note) => {
    if (!canEditNote(note)) {
      toast({
        title: "Permission Denied",
        description: "You can only edit your own notes",
        variant: "destructive",
      });
      return;
    }
    setEditingNote(note);
    setIsNoteDialogOpen(true);
  };

  const handleCreateNote = () => {
    setEditingNote(null);
    setIsNoteDialogOpen(true);
  };

  const onNoteSubmit = async (data: { title: string; content: string }) => {
    if (editingNote && !canEditNote(editingNote)) {
      toast({
        title: "Permission Denied",
        description: "You can only edit your own notes",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingNote) {
        await updateNote({ ...editingNote, ...data });
      } else {
        await createNote(data);
      }
      setIsNoteDialogOpen(false);
    } catch (error) {
      console.error('Error submitting note:', error);
      toast({
        title: "Error",
        description: "Failed to save note",
        variant: "destructive",
      });
    }
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

  // Call onNotesChange whenever notes change
  useEffect(() => {
    console.log("Notes updated in NotesSection:", notes);
    onNotesChange?.(notes);
  }, [notes, onNotesChange]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 relative">
      <div className="flex-1 bg-[#E5DEFF] p-4 sm:p-6 rounded-lg">
        <NotesList
          notes={notes}
          onCreateNote={handleCreateNote}
          onTogglePin={handleTogglePin}
          onToggleStar={handleToggleStar}
          onEdit={handleEdit}
          canEditNote={canEditNote}
        />
      </div>

      <Separator 
        orientation="vertical" 
        className="hidden lg:block h-auto bg-white my-4" 
      />

      <div className="flex-1 bg-[#FEC6A1] p-4 sm:p-6 rounded-lg">
        <SharedFolderCard
          folder={folder}
          onEditClick={() => setIsFolderDialogOpen(true)}
        />
      </div>

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
