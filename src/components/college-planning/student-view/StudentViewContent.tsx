import { Profile } from "@/hooks/useProfile";
import StatisticsCards from "../StatisticsCards";
import StudentProfile from "../student-summary/StudentProfile";
import AcademicSection from "../student-summary/AcademicSection";
import ActivitiesSection from "../student-summary/ActivitiesSection";
import TodoSection from "../TodoSection";
import StudentCalendar from "./StudentCalendar";
import CollegeListSection from "../CollegeListSection";
import SharedFolderSection from "../student-summary/SharedFolderSection";
import { PlanningDocumentSection } from "../google-drive";
import { useQueryClient } from "@tanstack/react-query";

interface StudentViewContentProps {
  studentId: string;
  profile: Profile;
  courses: any[];
  activities: any[];
  notes: any[];
  todos: any[];
}

export default function StudentViewContent({
  studentId,
  profile,
  courses,
  activities,
  notes,
  todos,
}: StudentViewContentProps) {
  const queryClient = useQueryClient();

  const transformedActivities = activities.map(activity => ({
    timeCommitment: activity.time_commitment || "",
  }));

  return (
    <div className="space-y-6">
      <StudentProfile profile={profile} />
      
      <StatisticsCards
        courses={courses}
        activities={transformedActivities}
        notes={notes}
        studentId={studentId}
      />

      <AcademicSection 
        courses={courses} 
        studentId={studentId}
      />
      
      <ActivitiesSection activities={activities} />

      {/* Full-width Calendar Section */}
      <StudentCalendar studentId={studentId} />

      {/* Planning Document Section - Replaces Notes */}
      <PlanningDocumentSection studentId={studentId} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <TodoSection />
          <CollegeListSection />
          <SharedFolderSection studentId={studentId} />
        </div>
      </div>
    </div>
  );
}
