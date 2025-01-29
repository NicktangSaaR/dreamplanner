import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

interface Activity {
  id: string;
  name: string;
  role: string;
  description?: string | null;
  time_commitment?: string | null;
}

interface ActivitiesSectionProps {
  activities: Activity[];
}

export default function ActivitiesSection({ activities }: ActivitiesSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          <CardTitle>Extracurricular Activities</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex flex-col p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{activity.name}</p>
                  <p className="text-sm text-gray-600">{activity.role}</p>
                </div>
                {activity.time_commitment && (
                  <Badge variant="secondary">{activity.time_commitment}</Badge>
                )}
              </div>
              {activity.description && (
                <p className="text-sm text-gray-600 mt-2">{activity.description}</p>
              )}
            </div>
          ))}
          {activities.length === 0 && (
            <p className="text-gray-500 text-center">No extracurricular activities recorded</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}