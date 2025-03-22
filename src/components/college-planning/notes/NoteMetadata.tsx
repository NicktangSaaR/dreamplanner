
import { Star } from "lucide-react";
import { Note } from "@/hooks/notes/types";

interface NoteMetadataProps {
  note: Note;
}

export default function NoteMetadata({ note }: NoteMetadataProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm text-muted-foreground">
      <span>{note.date}</span>
      {note.author_name && (
        <>
          <span className="hidden sm:inline">•</span>
          <span>{note.author_name}</span>
        </>
      )}
      {note.stars > 0 && (
        <>
          <span className="hidden sm:inline">•</span>
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {note.stars}
          </span>
        </>
      )}
    </div>
  );
}
