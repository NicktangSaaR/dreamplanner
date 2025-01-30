import { Button } from "@/components/ui/button";
import { Pin, Star, Edit } from "lucide-react";

interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  author_name?: string;
  is_pinned?: boolean;
  stars?: number;
}

interface NoteListItemProps {
  note: Note;
  onTogglePin: (note: Note) => void;
  onToggleStar: (note: Note) => void;
  onEdit: (note: Note) => void;
  canEdit: boolean;
}

export default function NoteListItem({
  note,
  onTogglePin,
  onToggleStar,
  onEdit,
  canEdit,
}: NoteListItemProps) {
  return (
    <div className="flex flex-col p-4 bg-gray-50 rounded-lg">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium">{note.title}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>{note.date}</span>
            {note.author_name && (
              <>
                <span>•</span>
                <span>{note.author_name}</span>
              </>
            )}
            {note.stars > 0 && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {note.stars}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex space-x-1">
          {canEdit && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(note)}
                className="h-8 w-8"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onTogglePin(note)}
                className={`h-8 w-8 ${note.is_pinned ? "text-primary" : ""}`}
              >
                <Pin className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleStar(note)}
            className="h-8 w-8"
          >
            <Star className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <p className="mt-2 text-sm text-gray-600">{note.content}</p>
    </div>
  );
}