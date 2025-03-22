
import { useParams } from "react-router-dom";
import NotesContainer from "./notes/NotesContainer";
import { Note } from "@/hooks/notes/types";

interface NotesSectionProps {
  onNotesChange?: (notes: Note[]) => void;
  studentId?: string;
}

export default function NotesSection({ onNotesChange, studentId: propStudentId }: NotesSectionProps) {
  const { studentId: urlStudentId } = useParams();
  const effectiveStudentId = propStudentId || urlStudentId;

  console.log("NotesSection - studentId:", effectiveStudentId);

  return (
    <NotesContainer 
      studentId={effectiveStudentId}
      onNotesChange={onNotesChange}
    />
  );
}
