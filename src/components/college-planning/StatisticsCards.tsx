
import AcademicsCard from "./statistics/AcademicsCard";
import ActivitiesCard from "./statistics/ActivitiesCard";
import NotesCard from "./statistics/NotesCard";
import TodosCard from "./statistics/TodosCard";

interface StatisticsCardsProps {
  courses: Array<{
    grade: string;
    course_type: string;
    grade_type?: string;
    grade_level?: string;
  }>;
  activities: Array<{
    timeCommitment: string;
  }>;
  notes: Array<{
    date: string;
  }>;
  studentId: string;
}

export default function StatisticsCards({ 
  courses, 
  activities, 
  notes, 
  studentId 
}: StatisticsCardsProps) {
  console.log("StatisticsCards - Current notes count:", notes.length);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <AcademicsCard courses={courses} />
      <ActivitiesCard activities={activities} />
      <NotesCard notes={notes} />
      <TodosCard studentId={studentId} />
    </div>
  );
}
