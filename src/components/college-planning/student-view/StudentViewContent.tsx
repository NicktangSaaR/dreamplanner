import { Profile } from "@/hooks/useProfile";
import StudentProfile from "../student-summary/StudentProfile";
import ActivitiesSection from "../student-summary/ActivitiesSection";
import TodoSection from "../TodoSection";
import { PlanningMilestones } from "../google-drive";

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
  return (
    <div className="space-y-6">
      <StudentProfile profile={profile} />

      <StudentTeamCard studentId={studentId} />

      <AcademicBriefCard studentId={studentId} />

      {/* Planning Engines - Core Planning Hub */}
      <EnginesDashboard studentId={studentId} grade={profile.grade} readOnly={false} />

      <ActivitiesSection activities={activities} />

      <PlanningMilestones studentId={studentId} refreshTrigger={0} />

      {/* Todos & Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TodoSection />
        <NotesSection onNotesChange={() => {}} studentId={studentId} />
      </div>
    </div>
  );
}
