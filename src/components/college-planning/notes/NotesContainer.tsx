
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StickyNote, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import NoteDialog from "../NoteDialog";
import NotesList from "./NotesList";
import { Note } from "@/hooks/notes/types";
import { useNotes } from "@/hooks/useNotes";
import SharedFolderSection from "../student-summary/SharedFolderSection";

interface NotesContainerProps {
  onNotesChange?: (notes: Note[]) => void;
  studentId?: string;
}

export default function NotesContainer({ onNotesChange, studentId: propStudentId }: NotesContainerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const effectiveStudentId = propStudentId;
  const { notes, createNote, updateNote, deleteNote, handleTogglePin, handleToggleStar } = useNotes(effectiveStudentId);

  console.log("NotesContainer - studentId:", effectiveStudentId);
  console.log("NotesContainer - notes:", notes);

  const handleCreateNote = async (data: { title: string; content: string }) => {
    if (!effectiveStudentId) return;
    
    await createNote(data, effectiveStudentId);
    setIsDialogOpen(false);
    if (onNotesChange) onNotesChange(notes);
  };

  const handleEditNote = async (data: { title: string; content: string }) => {
    if (!editingNote || !effectiveStudentId) return;
    
    await updateNote({
      ...editingNote,
      title: data.title,
      content: data.content,
    }, effectiveStudentId);
    
    setEditingNote(null);
    if (onNotesChange) onNotesChange(notes);
  };

  const handleDeleteNote = async (note: Note) => {
    if (!effectiveStudentId) return;
    await deleteNote(note.id);
    if (onNotesChange) onNotesChange(notes);
  };

  const handleTogglePinNote = async (note: Note) => {
    if (!effectiveStudentId) return;
    await handleTogglePin(note, effectiveStudentId);
    if (onNotesChange) onNotesChange(notes);
  };

  const handleToggleStarNote = async (note: Note) => {
    if (!effectiveStudentId) return;
    await handleToggleStar(note, effectiveStudentId);
    if (onNotesChange) onNotesChange(notes);
  };

  return (
    <div className="space-y-6">
      <NotesCard 
        notes={notes}
        onCreateNote={() => setIsDialogOpen(true)}
        onTogglePin={handleTogglePinNote}
        onToggleStar={handleToggleStarNote}
        onEdit={setEditingNote}
        onDelete={handleDeleteNote}
      />

      {/* Shared Folder Section - Always render if we have a student ID */}
      {effectiveStudentId && (
        <div className="mt-6">
          <SharedFolderSection studentId={effectiveStudentId} />
        </div>
      )}

      <NoteDialog
        open={isDialogOpen || !!editingNote}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingNote(null);
        }}
        onSubmit={editingNote ? handleEditNote : handleCreateNote}
        editingNote={editingNote}
      />
    </div>
  );
}
