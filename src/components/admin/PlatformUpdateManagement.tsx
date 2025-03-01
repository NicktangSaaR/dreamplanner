
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Edit, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

interface PlatformUpdate {
  id: string;
  title: string;
  content: string;
  date: string;
}

export default function PlatformUpdateManagement() {
  const [updates, setUpdates] = useState<PlatformUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [currentUpdate, setCurrentUpdate] = useState<Partial<PlatformUpdate>>({
    title: "",
    content: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchUpdates();
  }, []);

  async function fetchUpdates() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("platform_updates")
        .select("id, title, content, date")
        .order("date", { ascending: false });

      if (error) throw error;
      setUpdates(data || []);
    } catch (error) {
      console.error("Error fetching updates:", error);
      toast.error("Failed to load platform updates");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!currentUpdate.title?.trim() || !currentUpdate.content?.trim()) {
      toast.error("Please provide both title and content");
      return;
    }

    setIsSubmitting(true);
    try {
      let response;

      if (isEditing && currentUpdate.id) {
        // Update existing record
        response = await supabase
          .from("platform_updates")
          .update({
            title: currentUpdate.title,
            content: currentUpdate.content,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentUpdate.id);
      } else {
        // Insert new record
        response = await supabase.from("platform_updates").insert([
          {
            title: currentUpdate.title,
            content: currentUpdate.content,
            date: new Date().toISOString(),
          },
        ]);
      }

      if (response.error) throw response.error;

      toast.success(
        isEditing ? "Update modified successfully" : "Update added successfully"
      );
      setShowDialog(false);
      resetForm();
      fetchUpdates();
    } catch (error) {
      console.error("Error saving update:", error);
      toast.error("Failed to save update");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this update?")) return;

    try {
      const { error } = await supabase
        .from("platform_updates")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Update deleted successfully");
      fetchUpdates();
    } catch (error) {
      console.error("Error deleting update:", error);
      toast.error("Failed to delete update");
    }
  }

  function handleEdit(update: PlatformUpdate) {
    setCurrentUpdate({
      id: update.id,
      title: update.title,
      content: update.content,
    });
    setIsEditing(true);
    setShowDialog(true);
  }

  function handleAddNew() {
    resetForm();
    setIsEditing(false);
    setShowDialog(true);
  }

  function resetForm() {
    setCurrentUpdate({
      title: "",
      content: "",
    });
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Platform Updates</h2>
        <Button onClick={handleAddNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add New Update
        </Button>
      </div>

      {loading ? (
        <div className="py-10 text-center">Loading updates...</div>
      ) : updates.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground">
          No platform updates found. Add your first update using the button
          above.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Content</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {updates.map((update) => (
              <TableRow key={update.id}>
                <TableCell>{formatDate(update.date)}</TableCell>
                <TableCell className="font-medium">{update.title}</TableCell>
                <TableCell className="max-w-md">
                  <div className="line-clamp-2">{update.content}</div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(update)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(update.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Platform Update" : "Add Platform Update"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label
                htmlFor="title"
                className="text-sm font-medium leading-none"
              >
                Title
              </label>
              <Input
                id="title"
                placeholder="Update title"
                value={currentUpdate.title}
                onChange={(e) =>
                  setCurrentUpdate((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="content"
                className="text-sm font-medium leading-none"
              >
                Content
              </label>
              <Textarea
                id="content"
                placeholder="Update content"
                value={currentUpdate.content}
                onChange={(e) =>
                  setCurrentUpdate((prev) => ({
                    ...prev,
                    content: e.target.value,
                  }))
                }
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="ml-2"
            >
              {isSubmitting
                ? "Saving..."
                : isEditing
                ? "Save Changes"
                : "Add Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
