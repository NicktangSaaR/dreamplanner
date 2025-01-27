import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import NoteCard from "./NoteCard";
import { useNotes } from "@/hooks/useNotes";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";

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

interface NotesSectionProps {
  onNotesChange?: (notes: Note[]) => void;
}

export default function NotesSection({ onNotesChange }: NotesSectionProps) {
  const { notes, handleTogglePin, handleToggleStar, createNote, updateNote } = useNotes();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  
  const form = useForm<NoteFormData>({
    defaultValues: {
      title: "",
      content: "",
    },
  });

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    form.reset({
      title: note.title,
      content: note.content,
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingNote(null);
    form.reset({
      title: "",
      content: "",
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: NoteFormData) => {
    if (editingNote) {
      await updateNote({ ...editingNote, ...data });
    } else {
      await createNote(data);
    }
    setIsDialogOpen(false);
    form.reset();
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Notes</CardTitle>
          <Button onClick={handleCreate} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full rounded-md border p-4">
            <div className="space-y-4">
              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onTogglePin={handleTogglePin}
                  onToggleStar={handleToggleStar}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingNote ? "Edit Note" : "Create Note"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="submit">{editingNote ? "Save Changes" : "Create Note"}</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}