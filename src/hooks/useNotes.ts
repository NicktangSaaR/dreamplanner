
import { Note, NoteFormData } from "./notes/types";
import { useNotesData } from "./notes/useNotesData";
import { useNoteOperations } from "./notes/useNoteOperations";

export function useNotes(studentId?: string) {
  const { notes, refreshNotes } = useNotesData(studentId);
  const { 
    createNote, 
    updateNote, 
    deleteNote, 
    handleTogglePin, 
    handleToggleStar 
  } = useNoteOperations(refreshNotes);

  return {
    notes,
    createNote,
    deleteNote,
    updateNote,
    handleTogglePin,
    handleToggleStar,
  };
}

// Re-export the types for backwards compatibility
export type { Note, NoteFormData };
