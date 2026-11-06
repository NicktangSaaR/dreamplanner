import { Profile } from "@/hooks/useProfile";
import StatisticsCards from "../StatisticsCards";
import StudentProfile from "../student-summary/StudentProfile";
import AcademicSection from "../student-summary/AcademicSection";
import ActivitiesSection from "../student-summary/ActivitiesSection";
import TodoSection from "../TodoSection";
import { PlanningMilestones } from "../google-drive";

import { useQueryClient } from "@tanstack/react-query";
import EnginesDashboard from "@/components/engines/EnginesDashboard";
import NotesSection from "../NotesSection";
import StudentTeamCard from "@/features/team/StudentTeamCard";
import AcademicBriefCard from "@/features/grades/AcademicBriefCard";

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

      <StudentTeamCard studentId={studentId} />

      <AcademicBriefCard studentId={studentId} />

      {/* Planning Engines - Core Planning Hub */}
      <EnginesDashboard studentId={studentId} grade={profile.grade} readOnly={false} />

      {/* Statistics Overview */}
      <StatisticsCards
        courses={courses}
        activities={transformedActivities}
        notes={notes}
        studentId={studentId}
      />

      {/* Academic & Activities side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AcademicSection courses={courses} studentId={studentId} />
        <ActivitiesSection activities={activities} />
      </div>

      {/* Calendar & Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlanningMilestones studentId={studentId} refreshTrigger={0} />
      </div>

      {/* Todos & Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TodoSection />
        <NotesSection onNotesChange={() => {}} studentId={studentId} />
      </div>
    </div>
  );
}
