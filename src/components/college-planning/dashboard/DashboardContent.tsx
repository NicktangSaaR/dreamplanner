
import { Toaster } from "@/components/ui/toaster";
import DashboardHeader from "@/components/college-planning/DashboardHeader";
import StatisticsCards from "@/components/college-planning/StatisticsCards";
import DashboardTabs from "@/components/college-planning/DashboardTabs";
import { QueryClient } from "@tanstack/react-query";

interface DashboardContentProps {
  studentId: string;
  courses: any[];
  activities: any[];
  notes: any[];
  queryClient: QueryClient;
}

export default function DashboardContent({
  studentId,
  courses,
  activities,
  notes,
  queryClient
}: DashboardContentProps) {
  const transformedActivities = activities.map(activity => ({
    timeCommitment: activity.time_commitment || "",
  }));

  return (
    <>
      <Toaster />
      <div className="container mx-auto px-4 py-6 space-y-8">
        <div className="max-w-7xl mx-auto">
          <DashboardHeader />
          <div className="mt-8">
            <StatisticsCards 
              courses={courses}
              activities={transformedActivities}
              notes={notes}
              studentId={studentId || ''} 
            />
          </div>
          <div className="mt-8">
            <DashboardTabs
              courses={courses}
              onCoursesChange={(newCourses) => {
                queryClient.setQueryData(["student-courses", studentId], newCourses);
              }}
              onActivitiesChange={(newActivities) => {
                queryClient.setQueryData(["student-activities", studentId], newActivities);
              }}
              onNotesChange={(newNotes) => {
                queryClient.setQueryData(["student-notes", studentId], newNotes);
              }}
              studentId={studentId}
            />
          </div>
        </div>
      </div>
    </>
  );
}
