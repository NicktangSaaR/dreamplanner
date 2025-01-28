import { Pin, Star, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  author_name?: string;
  is_pinned?: boolean;
  stars?: number;
}

interface NoteCardProps {
  note: Note;
  onTogglePin: (note: Note) => void;
  onToggleStar: (note: Note) => void;
  onEdit: (note: Note) => void;
}

export default function NoteCard({ note, onTogglePin, onToggleStar, onEdit }: NoteCardProps) {
  return (
    <Card className={`${note.is_pinned ? "border-primary" : "border-0"} bg-white/50 hover:bg-white/80 transition-colors`}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
          <div className="space-y-1">
            <h3 className="font-semibold text-base">{note.title}</h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm text-muted-foreground">
              <span>{note.date}</span>
              {note.author_name && (
                <span className="hidden sm:inline">•</span>
              )}
              {note.author_name && (
                <span>by {note.author_name}</span>
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
          </div>
          <div className="flex sm:space-x-1">
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
        <p className="mt-2 whitespace-pre-wrap text-sm">{note.content}</p>
      </CardContent>
    </Card>
  );
}