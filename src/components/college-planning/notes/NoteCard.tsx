
import { Card, CardContent } from "@/components/ui/card";
import { Note } from "@/hooks/notes/types";
import NoteCardActions from "./NoteCardActions";
import NoteMetadata from "./NoteMetadata";

interface NoteCardProps {
  note: Note;
  onTogglePin: (note: Note) => void;
  onToggleStar: (note: Note) => void;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
  canEdit: boolean;
}

export default function NoteCard({ 
  note, 
  onTogglePin, 
  onToggleStar, 
  onEdit,
  onDelete,
  canEdit 
}: NoteCardProps) {
  return (
    <Card className={`${note.is_pinned ? "border-primary" : "border-0"} bg-white/50 hover:bg-white/80 transition-colors`}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
          <div className="space-y-1">
            <h3 className="font-semibold text-base">{note.title}</h3>
            <NoteMetadata note={note} />
          </div>
          <NoteCardActions 
            note={note}
            onTogglePin={onTogglePin}
            onToggleStar={onToggleStar}
            onEdit={onEdit}
            onDelete={onDelete}
            canEdit={canEdit}
          />
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm">{note.content}</p>
      </CardContent>
    </Card>
  );
}
