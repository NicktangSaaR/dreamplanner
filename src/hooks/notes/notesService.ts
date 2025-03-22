
import { supabase } from "@/integrations/supabase/client";
import { Note, NoteFormData } from "./types";

export async function fetchNotes(studentId?: string) {
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
  
  return notesData.map(note => ({
    ...note,
    id: note.id,
    date: new Date(note.created_at).toLocaleDateString(),
  }));
}

export async function createNoteApi(data: NoteFormData, authorId: string, authorName?: string) {
  const { error } = await supabase
    .from('notes')
    .insert([{
      title: data.title,
      content: data.content,
      author_id: authorId,
      author_name: authorName
    }]);

  if (error) throw error;
}

export async function updateNoteApi(note: Note) {
  const { error } = await supabase
    .from('notes')
    .update({
      title: note.title,
      content: note.content,
    })
    .eq('id', note.id);

  if (error) throw error;
}

export async function deleteNoteApi(noteId: string) {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId);

  if (error) throw error;
}

export async function toggleNotePinApi(noteId: string, isPinned: boolean) {
  const { error } = await supabase
    .from('notes')
    .update({ is_pinned: !isPinned })
    .eq('id', noteId);

  if (error) throw error;
}

export async function starNoteApi(noteId: string, currentStars: number) {
  const newStars = (currentStars || 0) + 1;
  const { error } = await supabase
    .from('notes')
    .update({ stars: newStars })
    .eq('id', noteId);

  if (error) throw error;
  
  return newStars;
}
