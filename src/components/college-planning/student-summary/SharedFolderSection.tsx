import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SharedFolderCard from "../SharedFolderCard";
import SharedFolderDialog from "../SharedFolderDialog";

export default function SharedFolderSection({ studentId }: { studentId: string }) {
  const [isEditingFolder, setIsEditingFolder] = useState(false);
  const queryClient = useQueryClient();

  const { data: sharedFolder } = useQuery({
    queryKey: ["shared-folder", studentId],
    queryFn: async () => {
      if (!studentId) return null;
      
      const { data, error } = await supabase
        .from("shared_folders")
        .select("*")
        .eq("created_by", studentId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const handleSaveFolder = async (data: { title: string; folder_url: string; description?: string }) => {
    try {
      if (!studentId) throw new Error("No student ID provided");

      const { error } = await supabase
        .from("shared_folders")
        .upsert({
          created_by: studentId,
          ...data,
        });

      if (error) throw error;

      toast.success("Folder saved successfully");
      setIsEditingFolder(false);
      queryClient.invalidateQueries({ queryKey: ["shared-folder", studentId] });
    } catch (error) {
      console.error("Error saving folder:", error);
      toast.error("Failed to save folder");
    }
  };

  return (
    <>
      <SharedFolderCard
        folder={sharedFolder}
        onEditClick={() => setIsEditingFolder(true)}
      />
      <SharedFolderDialog
        open={isEditingFolder}
        onOpenChange={setIsEditingFolder}
        onSubmit={handleSaveFolder}
      />
    </>
  );
}