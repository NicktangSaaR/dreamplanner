import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useVideoRecording = (selectedQuestionId?: string) => {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const saveRecording = async (recordedVideoUrl: string) => {
    console.log("Starting to save recording...");
    setIsSaving(true);
    
    try {
      if (!recordedVideoUrl) {
        throw new Error("No recorded video URL available");
      }

      if (!selectedQuestionId) {
        throw new Error("No question selected");
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        throw new Error("No authenticated user found");
      }

      console.log("Saving practice record to database...", {
        videoUrl: recordedVideoUrl,
        questionId: selectedQuestionId,
        userId: session.user.id
      });

      const { error } = await supabase
        .from("interview_practice_records")
        .insert({
          video_url: recordedVideoUrl,
          question_id: selectedQuestionId,
          user_id: session.user.id,
          practice_date: new Date().toISOString()
        });

      if (error) {
        console.error("Database error while saving practice record:", error);
        throw error;
      }

      console.log("Practice record saved successfully");
      await queryClient.invalidateQueries({ queryKey: ["practice-records"] });
      toast.success("练习记录已保存");
    } catch (error) {
      console.error("Error saving practice record:", error);
      toast.error("保存练习记录失败，请重试", {
        description: error instanceof Error ? error.message : "未知错误"
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    saveRecording
  };
};