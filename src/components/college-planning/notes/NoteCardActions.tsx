
import { Button } from "@/components/ui/button";
import { Pin, Star, Edit, Trash2 } from "lucide-react";
import { Note } from "@/hooks/notes/types";
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

interface NoteCardActionsProps {
  note: Note;
  onTogglePin: (note: Note) => void;
  onToggleStar: (note: Note) => void;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
  canEdit: boolean;
}

export default function NoteCardActions({ 
  note, 
  onTogglePin, 
  onToggleStar, 
  onEdit,
  onDelete,
  canEdit 
}: NoteCardActionsProps) {
  return (
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
  );
}
