import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Play, Trash, Video } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface PracticeRecord {
  id: string;
  video_url: string;
  practice_date: string;
  mock_interview_questions: {
    title: string;
  };
}

const PracticeRecords = () => {
  const queryClient = useQueryClient();
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const { data: records, isLoading } = useQuery({
    queryKey: ["practice-records"],
    queryFn: async () => {
      console.log("Fetching practice records...");
      const { data, error } = await supabase
        .from("interview_practice_records")
        .select(`
          id,
          video_url,
          practice_date,
          mock_interview_questions (
            title
          )
        `)
        .order("practice_date", { ascending: false });

      if (error) {
        console.error("Error fetching practice records:", error);
        throw error;
      }

      console.log("Fetched practice records:", data);
      return data as PracticeRecord[];
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  const deleteRecord = useMutation({
    mutationFn: async (recordId: string) => {
      console.log("Deleting practice record:", recordId);
      const { error } = await supabase
        .from("interview_practice_records")
        .delete()
        .eq("id", recordId);

      if (error) {
        console.error("Error deleting practice record:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["practice-records"] });
      toast.success("练习记录已删除");
      setSelectedVideo(null);
    },
    onError: (error) => {
      console.error("Error in deleteRecord mutation:", error);
      toast.error("删除记录失败");
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">加载练习记录中...</div>;
  }

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
        <Card className="p-4">
          <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
            <video
              src={selectedVideo}
              controls
              className="w-full h-full object-contain"
            />
          </div>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setSelectedVideo(null)}
          >
            关闭回放
          </Button>
        </Card>
      )}

      <div className="grid gap-4">
        {records?.map((record) => (
          <Card key={record.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-medium">
                  {record.mock_interview_questions?.title || "未知题目"}
                </h3>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-1" />
                  {format(new Date(record.practice_date), "yyyy-MM-dd HH:mm")}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSelectedVideo(record.video_url)}
                >
                  <Play className="w-4 h-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => {
                    if (window.confirm("确定要删除这条练习记录吗？")) {
                      deleteRecord.mutate(record.id);
                    }
                  }}
                >
                  <Trash className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {(!records || records.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            暂无练习记录
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticeRecords;