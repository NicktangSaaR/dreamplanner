import { Card } from "@/components/ui/card";
import { useNotes } from "@/hooks/useNotes";
import NoteDialog from "./NoteDialog";
import NotesList from "./NotesList";
import { useCallback, useEffect } from "react";

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
  const {
    notes,
    createNote,
    updateNote,
    handleTogglePin,
    handleToggleStar,
  } = useNotes();

  // Memoize the canEditNote function to prevent unnecessary re-renders
  const canEditNote = useCallback((note: Note) => {
    return true; // For now, allow editing of all notes
  }, []);

  // Only trigger onNotesChange when notes actually change
  useEffect(() => {
    console.log("Notes updated in NotesSection:", notes);
    if (onNotesChange) {
      onNotesChange(notes);
    }
  }, [notes, onNotesChange]);

  return (
    <Card className="w-full">
      <NotesList
        notes={notes}
        onCreateNote={() => {
          // Dialog handling is done in NoteDialog
        }}
        onTogglePin={handleTogglePin}
        onToggleStar={handleToggleStar}
        onEdit={updateNote}
        canEditNote={canEditNote}
      />
      <NoteDialog
        onSubmit={async (data) => {
          await createNote(data);
        }}
      />
    </Card>
  );
}