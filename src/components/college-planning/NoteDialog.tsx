import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";

interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
}

interface NoteFormData {
  title: string;
  content: string;
}

interface NoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: NoteFormData) => Promise<void>;
  editingNote: Note | null;
}

export default function NoteDialog({ 
  open, 
  onOpenChange, 
  onSubmit,
  editingNote 
}: NoteDialogProps) {
  const form = useForm<NoteFormData>({
    defaultValues: {
      title: editingNote?.title || "",
      content: editingNote?.content || "",
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <Button type="submit">
              {editingNote ? "Save Changes" : "Create Note"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}