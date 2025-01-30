import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StickyNote, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import NoteDialog from "./NoteDialog";
import NotesList from "./notes/NotesList";
import { useNotes } from "@/hooks/useNotes";
import { Note } from "./types/note";

interface NotesSectionProps {
  onNotesChange?: (notes: Note[]) => void;
}

export default function NotesSection({ onNotesChange }: NotesSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const { notes, createNote, updateNote, handleTogglePin, handleToggleStar } = useNotes();

  const handleCreateNote = async (data: { title: string; content: string }) => {
    await createNote(data);
    setIsDialogOpen(false);
    if (onNotesChange) onNotesChange(notes);
  };

  const handleEditNote = async (data: { title: string; content: string }) => {
    if (!editingNote) return;
    
    await updateNote({
      ...editingNote,
      title: data.title,
      content: data.content,
    });
    
    setEditingNote(null);
    if (onNotesChange) onNotesChange(notes);
  };

  const handleTogglePinNote = async (note: Note) => {
    await handleTogglePin(note);
    if (onNotesChange) onNotesChange(notes);
  };

  const handleToggleStarNote = async (note: Note) => {
    await handleToggleStar(note);
    if (onNotesChange) onNotesChange(notes);
  };

  return (
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
          canEdit={true}
        />
      </CardContent>

      <NoteDialog
        open={isDialogOpen || !!editingNote}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingNote(null);
        }}
        onSubmit={editingNote ? handleEditNote : handleCreateNote}
        editingNote={editingNote}
      />
    </Card>
  );
}