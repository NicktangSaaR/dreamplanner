import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, FolderOpen } from "lucide-react";
import NoteCard from "./NoteCard";
import { useNotes } from "@/hooks/useNotes";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";

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

interface FolderFormData {
  title: string;
  folder_url: string;
  description?: string;
}

interface NotesSectionProps {
  onNotesChange?: (notes: Note[]) => void;
}

export default function NotesSection({ onNotesChange }: NotesSectionProps) {
  const { notes, handleTogglePin, handleToggleStar, createNote, updateNote } = useNotes();
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const { toast } = useToast();
  
  const noteForm = useForm<NoteFormData>({
    defaultValues: {
      title: "",
      content: "",
    },
  });

  const folderForm = useForm<FolderFormData>();

  const { data: folder } = useQuery({
    queryKey: ['shared-folder'],
    queryFn: async () => {
      console.log('Fetching shared folder...');
      const { data, error } = await supabase
        .from('shared_folders')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching shared folder:', error);
        throw error;
      }

      console.log('Shared folder data:', data);
      return data;
    },
  });

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    noteForm.reset({
      title: note.title,
      content: note.content,
    });
    setIsNoteDialogOpen(true);
  };

  const handleCreateNote = () => {
    setEditingNote(null);
    noteForm.reset({
      title: "",
      content: "",
    });
    setIsNoteDialogOpen(true);
  };

  const onNoteSubmit = async (data: NoteFormData) => {
    if (editingNote) {
      await updateNote({ ...editingNote, ...data });
    } else {
      await createNote(data);
    }
    setIsNoteDialogOpen(false);
    noteForm.reset();
  };

  const onFolderSubmit = async (data: FolderFormData) => {
    try {
      const { error } = await supabase
        .from('shared_folders')
        .upsert([data]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Folder updated successfully",
      });
      
      setIsFolderDialogOpen(false);
      folderForm.reset();
    } catch (error) {
      console.error('Error updating shared folder:', error);
      toast({
        title: "Error",
        description: "Failed to update folder",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Notes</CardTitle>
          <Button onClick={handleCreateNote} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] w-full rounded-md border p-4">
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

      <Separator className="my-6" />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Shared Folder</CardTitle>
          <Button onClick={() => setIsFolderDialogOpen(true)} size="sm">
            {folder ? 'Edit Folder' : 'Add Folder'}
          </Button>
        </CardHeader>
        <CardContent>
          {folder ? (
            <div className="flex items-start space-x-4 p-4 bg-white rounded-lg border">
              <div className="flex-shrink-0">
                <FolderOpen className="h-6 w-6 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <a 
                  href={folder.folder_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-semibold hover:text-blue-500 transition-colors"
                >
                  {folder.title}
                </a>
                {folder.description && (
                  <p className="text-sm text-gray-500 mt-1">
                    {folder.description}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500">No shared folder added yet</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingNote ? "Edit Note" : "Create Note"}</DialogTitle>
          </DialogHeader>
          <Form {...noteForm}>
            <form onSubmit={noteForm.handleSubmit(onNoteSubmit)} className="space-y-4">
              <FormField
                control={noteForm.control}
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
                control={noteForm.control}
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

      <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Google Drive Folder</DialogTitle>
          </DialogHeader>
          <Form {...folderForm}>
            <form onSubmit={folderForm.handleSubmit(onFolderSubmit)} className="space-y-4">
              <FormField
                control={folderForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Folder Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., College Essays" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={folderForm.control}
                name="folder_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Google Drive Folder URL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://drive.google.com/..." />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={folderForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Brief description of the folder contents..." />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="submit">Save Folder</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}