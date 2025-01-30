import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import NoteDialog from "./NoteDialog";
import { useNotes } from "@/hooks/useNotes";
import NoteListItem from "./notes/NoteListItem";

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
  const [open, setOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const { notes = [], createNote, updateNote, handleTogglePin, handleToggleStar } = useNotes();

  const handleCreateNote = useCallback(async (data: { title: string; content: string }) => {
    try {
      await createNote(data);
      setOpen(false);
    } catch (error) {
      console.error("Error creating note:", error);
    }
  }, [createNote]);

  const handleEditNote = useCallback((note: Note) => {
    if (note && note.id) {
      setEditingNote(note);
      setOpen(true);
    }
  }, []);

  const handleUpdateNote = useCallback(async (data: { title: string; content: string }) => {
    if (!editingNote?.id) return;

    try {
      await updateNote({
        ...editingNote,
        title: data.title,
        content: data.content,
      });
      setOpen(false);
      setEditingNote(null);
    } catch (error) {
      console.error("Error updating note:", error);
    }
  }, [editingNote, updateNote]);

  const canEditNote = useCallback((note: Note) => {
    return Boolean(note?.id);
  }, []);

  useEffect(() => {
    if (!onNotesChange || !Array.isArray(notes)) return;
    console.log("Notes changed:", notes);
    onNotesChange(notes);
  }, [notes, onNotesChange]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-lg font-semibold">Notes</h3>
        <Button onClick={() => setOpen(true)} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Note
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] sm:h-[400px] w-full rounded-md border p-4">
          <div className="space-y-3">
            {Array.isArray(notes) && notes.map((note) => (
              note && note.id ? (
                <NoteListItem
                  key={note.id}
                  note={note}
                  onTogglePin={handleTogglePin}
                  onToggleStar={handleToggleStar}
                  onEdit={handleEditNote}
                  canEdit={canEditNote(note)}
                />
              ) : null
            ))}
            {(!Array.isArray(notes) || notes.length === 0) && (
              <div className="text-center text-muted-foreground py-8">
                No notes yet. Click "Add Note" to create one.
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <NoteDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={editingNote ? handleUpdateNote : handleCreateNote}
        editingNote={editingNote}
      />
    </Card>
  );
}