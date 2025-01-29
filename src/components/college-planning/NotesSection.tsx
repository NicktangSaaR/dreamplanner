import { useNotes } from "@/hooks/useNotes";
import NoteDialog from "./NoteDialog";
import NotesList from "./NotesList";
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

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

  console.log("NotesSection - Current notes:", notes);

  useEffect(() => {
    if (notes && onNotesChange) {
      console.log("NotesSection - Calling onNotesChange with:", notes);
      onNotesChange(notes);
    }
  }, [notes, onNotesChange]);

  const canEditNote = useCallback((note: Note) => {
    return true; // For now, allow editing of all notes
  }, []);

  const handleCreateNote = useCallback(() => {
    console.log("NotesSection - Opening dialog for new note");
    setEditingNote(null);
    setIsDialogOpen(true);
  }, []);

  const handleEditNote = useCallback((note: Note) => {
    console.log("NotesSection - Opening dialog to edit note:", note);
    setEditingNote(note);
    setIsDialogOpen(true);
  }, []);

  const handleDialogClose = useCallback(() => {
    console.log("NotesSection - Closing dialog");
    setIsDialogOpen(false);
    setEditingNote(null);
  }, []);

  const handleSubmit = useCallback(async (data: { title: string; content: string }) => {
    try {
      console.log("NotesSection - Submitting note:", data);
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
        notes={notes || []}
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