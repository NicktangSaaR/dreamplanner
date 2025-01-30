import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  author_name?: string;
  is_pinned?: boolean;
  stars?: number;
}

interface NoteFormData {
  title: string;
  content: string;
}

export function useNotes(studentId?: string) {
  const [notes, setNotes] = useState<Note[]>([]);
  const { toast } = useToast();

  const fetchNotes = async () => {
    try {
      const query = supabase
        .from('notes')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (studentId) {
        query.eq('author_id', studentId);
      }

      const { data: notesData, error } = await query;

      if (error) throw error;
      
      setNotes(notesData.map(note => ({
        ...note,
        id: note.id,
        date: new Date(note.created_at).toLocaleDateString(),
      })));
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast({
        title: "Error",
        description: "Failed to load notes",
        variant: "destructive",
      });
    }
  };

  const createNote = async (data: NoteFormData, forStudentId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('notes')
        .insert([{
          title: data.title,
          content: data.content,
          author_id: forStudentId || user.id,
          author_name: user.email
        }]);

      if (error) throw error;

      fetchNotes();
      toast({
        title: "Success",
        description: "Note created successfully",
      });
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        title: "Error",
        description: "Failed to create note",
        variant: "destructive",
      });
    }
  };

  const updateNote = async (note: Note, forStudentId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('notes')
        .update({
          title: note.title,
          content: note.content,
        })
        .eq('id', note.id);

      if (error) throw error;

      fetchNotes();
      toast({
        title: "Success",
        description: "Note updated successfully",
      });
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive",
      });
    }
  };

  const handleTogglePin = async (note: Note, forStudentId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('notes')
        .update({ is_pinned: !note.is_pinned })
        .eq('id', note.id);

      if (error) throw error;

      setNotes(
        notes.map((n) =>
          n.id === note.id ? { ...n, is_pinned: !n.is_pinned } : n
        )
      );
      toast({
        title: "Success",
        description: `Note ${note.is_pinned ? 'unpinned' : 'pinned'} successfully`,
      });
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive",
      });
    }
  };

  const handleToggleStar = async (note: Note, forStudentId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const newStars = (note.stars || 0) + 1;
      const { error } = await supabase
        .from('notes')
        .update({ stars: newStars })
        .eq('id', note.id);

      if (error) throw error;

      setNotes(
        notes.map((n) =>
          n.id === note.id ? { ...n, stars: newStars } : n
        )
      );
      toast({
        title: "Success",
        description: "Note starred successfully",
      });
    } catch (error) {
      console.error('Error starring note:', error);
      toast({
        title: "Error",
        description: "Failed to star note",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [studentId]);

  return {
    notes,
    createNote,
    updateNote,
    handleTogglePin,
    handleToggleStar,
  };
}