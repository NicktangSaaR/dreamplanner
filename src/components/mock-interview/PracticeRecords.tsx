import { useState, useEffect } from "react";
import { Video, AlertCircle } from "lucide-react";
import VideoPlayer from "./practice-records/VideoPlayer";
import RecordItem from "./practice-records/RecordItem";
import { usePracticeRecords } from "@/hooks/usePracticeRecords";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

const PracticeRecords = () => {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const { records, isLoading, deleteRecord, refetchRecords } = usePracticeRecords();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setUserId(session.user.id);
        console.log("Current user ID:", session.user.id);
        refetchRecords();
      } else {
        console.log("No authenticated user found");
      }
    };

    checkAuth();
  }, [refetchRecords]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!userId) return;

    console.log("Setting up realtime subscription for user:", userId);
    const channel = supabase
      .channel('practice-records')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'interview_practice_records',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Realtime update received:', payload);
          refetchRecords();
        }
      )
      .subscribe();

    return () => {
      console.log("Cleaning up realtime subscription");
      supabase.removeChannel(channel);
    };
  }, [userId, refetchRecords]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!userId) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          请先登录后查看练习记录
        </AlertDescription>
      </Alert>
    );
  }

  console.log("Rendering practice records:", records?.length || 0, "records found");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">练习记录</h2>
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-gray-500" />
          <span className="text-gray-500">
            共 {records?.length || 0} 条记录
          </span>
        </div>
      </div>

      {selectedVideo && (
        <VideoPlayer
          videoUrl={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}

      {records && records.length > 0 ? (
        <div className="grid gap-4">
          {records.map((record) => (
            <RecordItem
              key={record.id}
              title={record.mock_interview_questions?.title || "未知题目"}
              date={record.practice_date}
              onPlay={() => setSelectedVideo(record.video_url)}
              onDelete={() => {
                console.log("Deleting record:", record.id);
                deleteRecord.mutate(record.id);
              }}
            />
          ))}
        </div>
      ) : (
        <Alert className="bg-gray-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            您还没有任何练习记录。开始一次模拟面试来创建您的第一条记录吧！
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default PracticeRecords;