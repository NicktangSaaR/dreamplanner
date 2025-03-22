
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StickyNote, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import NoteDialog from "./NoteDialog";
import NotesList from "./notes/NotesList";
import { useNotes } from "@/hooks/useNotes";
import { Note } from "./types/note";
import { useParams } from "react-router-dom";
import SharedFolderSection from "./student-summary/SharedFolderSection";

interface NotesSectionProps {
  onNotesChange?: (notes: Note[]) => void;
}

export default function NotesSection({ onNotesChange }: NotesSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const { studentId } = useParams();
  const { notes, createNote, updateNote, deleteNote, handleTogglePin, handleToggleStar } = useNotes(studentId);

  console.log("NotesSection - studentId:", studentId);
  console.log("NotesSection - notes:", notes);

  const handleCreateNote = async (data: { title: string; content: string }) => {
    if (!studentId) return;
    
    await createNote(data, studentId);
    setIsDialogOpen(false);
    if (onNotesChange) onNotesChange(notes);
  };

  const handleEditNote = async (data: { title: string; content: string }) => {
    if (!editingNote || !studentId) return;
    
    await updateNote({
      ...editingNote,
      title: data.title,
      content: data.content,
    }, studentId);
    
    setEditingNote(null);
    if (onNotesChange) onNotesChange(notes);
  };

  const handleDeleteNote = async (note: Note) => {
    if (!studentId) return;
    await deleteNote(note.id);
    if (onNotesChange) onNotesChange(notes);
  };

  const handleTogglePinNote = async (note: Note) => {
    if (!studentId) return;
    await handleTogglePin(note, studentId);
    if (onNotesChange) onNotesChange(notes);
  };

  const handleToggleStarNote = async (note: Note) => {
    if (!studentId) return;
    await handleToggleStar(note, studentId);
    if (onNotesChange) onNotesChange(notes);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StickyNote className="h-5 w-5" />
              <CardTitle>Notes</CardTitle>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsDialogOpen(true)}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <NotesList
            notes={notes}
            onTogglePin={handleTogglePinNote}
            onToggleStar={handleToggleStarNote}
            onEdit={setEditingNote}
            onDelete={handleDeleteNote}
            canEdit={true}
          />
        </CardContent>
      </Card>

      {/* Add Shared Folder Section with the current studentId */}
      {studentId && (
        <SharedFolderSection studentId={studentId} />
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
