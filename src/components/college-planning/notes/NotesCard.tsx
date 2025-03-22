
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StickyNote, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotesList from "./NotesList";
import { Note } from "@/hooks/notes/types";

interface NotesCardProps {
  notes: Note[];
  onCreateNote: () => void;
  onTogglePin: (note: Note) => void;
  onToggleStar: (note: Note) => void;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
}

export default function NotesCard({
  notes,
  onCreateNote,
  onTogglePin,
  onToggleStar,
  onEdit,
  onDelete,
}: NotesCardProps) {
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
            onClick={onCreateNote}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <NotesList
          notes={notes}
          onTogglePin={onTogglePin}
          onToggleStar={onToggleStar}
          onEdit={onEdit}
          onDelete={onDelete}
          canEdit={true}
        />
      </CardContent>
    </Card>
  );
}
