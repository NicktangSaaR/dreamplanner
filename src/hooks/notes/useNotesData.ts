
import { useState, useEffect } from "react";
import { Note } from "./types";
import { fetchNotes } from "./notesService";
import { useToast } from "@/components/ui/use-toast";

export function useNotesData(studentId?: string) {
  const [notes, setNotes] = useState<Note[]>([]);
  const { toast } = useToast();
  
  const refreshNotes = async () => {
    try {
      const notesData = await fetchNotes(studentId);
      setNotes(notesData);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast({
        title: "Error",
        description: "Failed to load notes",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    refreshNotes();
  }, [studentId]);

  return {
    notes,
    setNotes,
    refreshNotes,
  };
}
