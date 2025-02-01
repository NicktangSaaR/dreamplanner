import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useYouTubeVideo = () => {
  const openYouTubeVideo = async (questionId: string) => {
    try {
      console.log("Attempting to open YouTube video for question:", questionId);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        console.log("No authenticated user found");
        toast.error("请先登录");
        return;
      }

      console.log("Fetching practice record for user:", session.user.id);
      const { data: practiceRecord, error: recordError } = await supabase
        .from('interview_practice_records')
        .select('youtube_video_url')
        .eq('question_id', questionId)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recordError) {
        console.error("Error fetching YouTube URL:", recordError);
        toast.error("获取YouTube链接失败");
        return;
      }

      if (!practiceRecord) {
        console.log("No practice record found for this question");
        toast.info("未找到该问题的练习记录");
        return;
      }

      if (!practiceRecord.youtube_video_url) {
        console.log("YouTube video still processing");
        toast.info("视频正在处理中，请稍后再试");
        return;
      }

      console.log("Opening YouTube video URL:", practiceRecord.youtube_video_url);
      window.open(practiceRecord.youtube_video_url, '_blank');
    } catch (error) {
      console.error("Error viewing YouTube video:", error);
      toast.error("打开YouTube视频失败");
    }
  };

  return {
    openYouTubeVideo
  };
};