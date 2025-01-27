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
    <Card className={note.is_pinned ? "border-primary" : ""}>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold">{note.title}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{note.date}</span>
              {note.author_name && (
                <span>by {note.author_name}</span>
              )}
              {note.stars > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {note.stars}
                </span>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(note)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onTogglePin(note)}
              className={note.is_pinned ? "text-primary" : ""}
            >
              <Pin className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleStar(note)}
            >
              <Star className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="whitespace-pre-wrap">{note.content}</p>
      </CardContent>
    </Card>
  );
}