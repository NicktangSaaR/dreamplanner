import { format } from "date-fns";
import { Calendar, Play, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface RecordItemProps {
  title: string | null;
  date: string;
  onPlay: () => void;
  onDelete: () => void;
}

const RecordItem = ({ title, date, onPlay, onDelete }: RecordItemProps) => {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="font-medium">
            {title || "未知题目"}
          </h3>
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="w-4 h-4 mr-1" />
            {format(new Date(date), "yyyy-MM-dd HH:mm")}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onPlay}
          >
            <Play className="w-4 h-4" />
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={() => {
              if (window.confirm("确定要删除这条练习记录吗？")) {
                onDelete();
              }
            }}
          >
            <Trash className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default RecordItem;