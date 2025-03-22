import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SharedFolderCard from "../SharedFolderCard";
import SharedFolderDialog from "../SharedFolderDialog";
import { checkCounselorAccess } from "@/hooks/student/utils/counselorAccess";
import { useProfile } from "@/hooks/useProfile";

export default function SharedFolderSection({ studentId }: { studentId: string }) {
  const [isEditingFolder, setIsEditingFolder] = useState(false);
  const queryClient = useQueryClient();
  const [hasAccess, setHasAccess] = useState(false);
  const { profile } = useProfile();

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // If the user is viewing their own profile, they should have access
      if (studentId === user.id) {
        setHasAccess(true);
        return;
      }

      // Otherwise, check if they are a counselor with access
      const hasCounselorAccess = await checkCounselorAccess(studentId, user.id);
      setHasAccess(hasCounselorAccess);
    };

    checkAccess();
  }, [studentId]);

  console.log("SharedFolderSection - studentId:", studentId);
  console.log("SharedFolderSection - hasAccess:", hasAccess);
  console.log("SharedFolderSection - Current user profile:", profile);

  const { data: sharedFolder, isLoading } = useQuery({
    queryKey: ["shared-folder", studentId],
    queryFn: async () => {
      if (!studentId) return null;
      
      const { data, error } = await supabase
        .from("shared_folders")
        .select("*")
        .eq("created_by", studentId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching shared folder:", error);
        return null;
      }
      console.log("SharedFolderSection - folder data:", data);
      return data;
    },
  });

  const handleSaveFolder = async (data: { title: string; folder_url: string; description?: string }) => {
    try {
      if (!studentId) throw new Error("No student ID provided");

      // Check if folder already exists
      const existingFolder = sharedFolder?.id;
      
      const { error } = await supabase
        .from("shared_folders")
        .upsert({
          id: existingFolder, // Include ID if updating existing folder
          created_by: studentId,
          ...data,
        });

      if (error) {
        console.error("Error saving folder:", error);
        throw error;
      }

      toast.success("文件夹保存成功");
      setIsEditingFolder(false);
      queryClient.invalidateQueries({ queryKey: ["shared-folder", studentId] });
    } catch (error) {
      console.error("Error saving folder:", error);
      toast.error("保存文件夹失败");
    }
  };

  // Always show the shared folder section, regardless of access
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
        initialData={sharedFolder || undefined}
      />
    </>
  );
}
