
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pin, Star, Edit, Trash2 } from "lucide-react";
import { Note } from "./types/note";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
          </div>
          <div className="flex sm:space-x-1">
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
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Note</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this note? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(note)}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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
        <p className="mt-2 whitespace-pre-wrap text-sm">{note.content}</p>
      </CardContent>
    </Card>
  );
}
