import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import NoteCard from "./NoteCard";
import { memo } from "react";

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
  canEditNote: (note: Note) => boolean;
}

const NotesList = memo(function NotesList({
  notes,
  onCreateNote,
  onTogglePin,
  onToggleStar,
  onEdit,
  canEditNote,
}: NotesListProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-lg font-semibold">Notes</h3>
        <Button onClick={onCreateNote} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Note
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] sm:h-[400px] w-full rounded-md border p-4">
          <div className="space-y-3">
            {notes.map((note) => (
              note && note.id ? (
                <NoteCard
                  key={note.id}
                  note={note}
                  onTogglePin={onTogglePin}
                  onToggleStar={onToggleStar}
                  onEdit={onEdit}
                  canEdit={canEditNote(note)}
                />
              ) : null
            ))}
            {notes.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No notes yet. Click "Add Note" to create one.
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
});

NotesList.displayName = "NotesList";

export default NotesList;