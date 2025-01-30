import { Activity } from "../types/activity";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ActivityListProps {
  activities: Activity[];
}

export default function ActivityList({ activities }: ActivityListProps) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {activities.map((activity) => (
        <Card key={activity.id} className="p-3 bg-white/50 hover:bg-white/80 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">{activity.name}</p>
              <p className="text-sm text-gray-600">{activity.role}</p>
            </div>
            {activity.timeCommitment && (
              <Badge variant="secondary">{activity.timeCommitment}</Badge>
            )}
          </div>
          {activity.description && (
            <p className="text-sm text-gray-600 mt-2">{activity.description}</p>
          )}
        </Card>
      ))}
      {activities.length === 0 && (
        <p className="text-gray-500 text-center">No extracurricular activities recorded</p>
      )}
    </div>
  );
}