import { useState } from "react";
import { Video } from "lucide-react";
import VideoPlayer from "./practice-records/VideoPlayer";
import RecordItem from "./practice-records/RecordItem";
import { usePracticeRecords } from "@/hooks/usePracticeRecords";

const PracticeRecords = () => {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const { records, isLoading, deleteRecord } = usePracticeRecords();

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
        <VideoPlayer
          videoUrl={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}

      <div className="grid gap-4">
        {records?.map((record) => (
          <RecordItem
            key={record.id}
            title={record.mock_interview_questions?.title}
            date={record.practice_date}
            onPlay={() => setSelectedVideo(record.video_url)}
            onDelete={() => deleteRecord.mutate(record.id)}
          />
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