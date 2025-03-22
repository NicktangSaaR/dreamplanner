
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Note, NoteFormData } from "./types";
import { 
  createNoteApi, 
  updateNoteApi, 
  deleteNoteApi, 
  toggleNotePinApi, 
  starNoteApi 
} from "./notesService";

export function useNoteOperations(refreshNotes: () => Promise<void>) {
  const { toast } = useToast();

  const createNote = async (data: NoteFormData, forStudentId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      await createNoteApi(data, forStudentId || user.id, user.email);
      await refreshNotes();
      
      toast({
        title: "Success",
        description: "Note created successfully",
      });
      
      return true;
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        title: "Error",
        description: "Failed to create note",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateNote = async (note: Note, forStudentId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      await updateNoteApi(note);
      await refreshNotes();
      
      toast({
        title: "Success",
        description: "Note updated successfully",
      });
      
      return true;
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      await deleteNoteApi(noteId);
      
      toast({
        title: "Success",
        description: "Note deleted successfully",
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleTogglePin = async (note: Note, forStudentId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      await toggleNotePinApi(note.id, !!note.is_pinned);
      await refreshNotes();
      
      toast({
        title: "Success",
        description: `Note ${note.is_pinned ? 'unpinned' : 'pinned'} successfully`,
      });
      
      return true;
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleToggleStar = async (note: Note, forStudentId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      await starNoteApi(note.id, note.stars || 0);
      await refreshNotes();
      
      toast({
        title: "Success",
        description: "Note starred successfully",
      });
      
      return true;
    } catch (error) {
      console.error('Error starring note:', error);
      toast({
        title: "Error",
        description: "Failed to star note",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    createNote,
    updateNote,
    deleteNote,
    handleTogglePin,
    handleToggleStar,
  };
}
