import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  author_id?: string;
  author_name?: string;
  is_pinned?: boolean;
  stars?: number;
}

interface NotesSectionProps {
  onNotesChange?: (notes: Note[]) => void;
}

export default function NotesSection({ onNotesChange }: NotesSectionProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    onNotesChange?.(notes);
  }, [notes, onNotesChange]);

  const fetchNotes = async () => {
    try {
      const { data: notesData, error } = await supabase
        .from('notes')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

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

  const handleTogglePin = async (note: Note) => {
    try {
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

  const handleToggleStar = async (note: Note) => {
    try {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full rounded-md border p-4">
          <div className="space-y-4">
            {notes.map((note) => (
              <Card key={note.id} className={note.is_pinned ? "border-primary" : ""}>
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
                        onClick={() => handleTogglePin(note)}
                        className={note.is_pinned ? "text-primary" : ""}
                      >
                        <Pin className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleStar(note)}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap">{note.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}