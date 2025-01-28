import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import NoteCard from "./NoteCard";

interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  author_name?: string;
  is_pinned?: boolean;
  stars?: number;
}

interface NotesListProps {
  notes: Note[];
  onCreateNote: () => void;
  onTogglePin: (note: Note) => void;
  onToggleStar: (note: Note) => void;
  onEdit: (note: Note) => void;
}

export default function NotesList({
  notes,
  onCreateNote,
  onTogglePin,
  onToggleStar,
  onEdit,
}: NotesListProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Notes</CardTitle>
        <Button onClick={onCreateNote} size="sm" className="whitespace-nowrap">
          <Plus className="h-4 w-4 mr-2" />
          Add Note
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] sm:h-[400px] w-full rounded-md border p-2 sm:p-4">
          <div className="space-y-4">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onTogglePin={onTogglePin}
                onToggleStar={onToggleStar}
                onEdit={onEdit}
              />
            ))}
            {notes.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No notes yet. Click "Add Note" to create one.
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}