
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

interface ActivitiesCardProps {
  activities: Array<{
    timeCommitment: string;
  }>;
}

export default function ActivitiesCard({ activities }: ActivitiesCardProps) {
  const calculateWeeklyHours = (activities: Array<{ timeCommitment: string }>) => {
    return activities.reduce((total, activity) => {
      const hours = activity.timeCommitment.match(/(\d+)\s*hours?\/week/i);
      return total + (hours ? parseInt(hours[1]) : 0);
    }, 0);
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-950">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activities
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{activities.length} Activities</div>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>{calculateWeeklyHours(activities)} hours/week total</p>
          {activities.length > 0 && (
            <p className="text-xs">
              ~{(calculateWeeklyHours(activities) / activities.length).toFixed(1)} hours per activity
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
