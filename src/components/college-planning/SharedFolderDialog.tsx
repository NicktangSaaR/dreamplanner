import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";

interface FolderFormData {
  title: string;
  folder_url: string;
  description?: string;
}

interface SharedFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FolderFormData) => Promise<void>;
}

export default function SharedFolderDialog({ 
  open, 
  onOpenChange, 
  onSubmit 
}: SharedFolderDialogProps) {
  const form = useForm<FolderFormData>();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Google Drive Folder</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
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
              control={form.control}
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
              control={form.control}
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
  );
}