
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SharedFolderCard from "../SharedFolderCard";
import SharedFolderDialog from "../SharedFolderDialog";
import { checkCounselorAccess } from "@/hooks/student/utils/counselorAccess";

export default function SharedFolderSection({ studentId }: { studentId: string }) {
  const [isEditingFolder, setIsEditingFolder] = useState(false);
  const queryClient = useQueryClient();
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const hasAccess = await checkCounselorAccess(studentId, user.id);
      setHasAccess(hasAccess);
    };

    checkAccess();
  }, [studentId]);

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

      toast.success("文件夹保存成功");
      setIsEditingFolder(false);
      queryClient.invalidateQueries({ queryKey: ["shared-folder", studentId] });
    } catch (error) {
      console.error("Error saving folder:", error);
      toast.error("保存文件夹失败");
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
