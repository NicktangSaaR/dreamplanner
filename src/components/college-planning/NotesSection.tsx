import { Card } from "@/components/ui/card";
import { useNotes } from "@/hooks/useNotes";
import NoteDialog from "./NoteDialog";
import NotesList from "./NotesList";
import { useCallback, useEffect, useState, memo } from "react";

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  
  const {
    notes,
    createNote,
    updateNote,
    handleTogglePin,
    handleToggleStar,
  } = useNotes();

  // Memoize the canEditNote function
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

  const handleCreateNote = useCallback(() => {
    setEditingNote(null);
    setIsDialogOpen(true);
  }, []);

  const handleEditNote = useCallback((note: Note) => {
    setEditingNote(note);
    setIsDialogOpen(true);
  }, []);

  const handleDialogClose = useCallback(() => {
    setIsDialogOpen(false);
    setEditingNote(null);
  }, []);

  const handleSubmit = useCallback(async (data: { title: string; content: string }) => {
    try {
      if (editingNote) {
        await updateNote({ ...editingNote, ...data });
      } else {
        await createNote(data);
      }
      handleDialogClose();
    } catch (error) {
      console.error('Error handling note submission:', error);
    }
  }, [editingNote, createNote, updateNote, handleDialogClose]);

  return (
    <Card className="w-full">
      <NotesList
        notes={notes}
        onCreateNote={handleCreateNote}
        onTogglePin={handleTogglePin}
        onToggleStar={handleToggleStar}
        onEdit={handleEditNote}
        canEditNote={canEditNote}
      />
      <NoteDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleSubmit}
        editingNote={editingNote}
      />
    </Card>
  );
}