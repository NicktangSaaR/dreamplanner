import { Note } from "../types/note";
import NoteCard from "../NoteCard";

interface NotesListProps {
  notes: Note[];
  onTogglePin: (note: Note) => void;
  onToggleStar: (note: Note) => void;
  onEdit: (note: Note) => void;
  canEdit: boolean;
}

export default function NotesList({ 
  notes,
  onTogglePin,
  onToggleStar,
  onEdit,
  canEdit
}: NotesListProps) {
  const pinnedNotes = notes.filter(note => note.is_pinned);
  const unpinnedNotes = notes.filter(note => !note.is_pinned);
  
  return (
    <div className="space-y-4">
      {pinnedNotes.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Pinned Notes</h3>
          <div className="grid gap-2">
            {pinnedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onTogglePin={onTogglePin}
                onToggleStar={onToggleStar}
                onEdit={onEdit}
                canEdit={canEdit}
              />
            ))}
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        {pinnedNotes.length > 0 && (
          <h3 className="text-sm font-medium text-muted-foreground">Other Notes</h3>
        )}
        <div className="grid gap-2">
          {unpinnedNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onTogglePin={onTogglePin}
              onToggleStar={onToggleStar}
              onEdit={onEdit}
              canEdit={canEdit}
            />
          ))}
        </div>
      </div>
      
      {notes.length === 0 && (
        <p className="text-center text-muted-foreground">No notes found</p>
      )}
    </div>
  );
}