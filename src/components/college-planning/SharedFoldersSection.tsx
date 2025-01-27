import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Folder, FolderOpen } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";

interface SharedFolder {
  id: string;
  title: string;
  folder_url: string;
  description?: string;
  created_at?: string;
}

interface FolderFormData {
  title: string;
  folder_url: string;
  description?: string;
}

export default function SharedFoldersSection() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const form = useForm<FolderFormData>();

  const { data: folders = [], refetch } = useQuery({
    queryKey: ['shared-folders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shared_folders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching shared folders:', error);
        throw error;
      }

      return data || [];
    },
  });

  const handleCreate = async (data: FolderFormData) => {
    try {
      const { error } = await supabase
        .from('shared_folders')
        .insert([data]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Folder shared successfully",
      });
      
      setIsDialogOpen(false);
      form.reset();
      refetch();
    } catch (error) {
      console.error('Error creating shared folder:', error);
      toast({
        title: "Error",
        description: "Failed to share folder",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Shared Folders</CardTitle>
          <Button onClick={() => setIsDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Share Folder
          </Button>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full rounded-md border p-4">
            <div className="space-y-4">
              {folders.map((folder) => (
                <Card key={folder.id} className="p-4">
                  <div className="flex items-start space-x-4">
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
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Google Drive Folder</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
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
              <Button type="submit">Share Folder</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}