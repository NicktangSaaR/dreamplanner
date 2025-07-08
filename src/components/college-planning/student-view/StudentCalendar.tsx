import { useParams } from "react-router-dom";
import CalendarSection from "../CalendarSection";

interface StudentCalendarProps {
  studentId: string;
}

export default function StudentCalendar({ studentId }: StudentCalendarProps) {
  // The CalendarSection component will automatically use the studentId
  // from the URL params or the passed prop to fetch and manage todos
  return (
    <div className="space-y-4">
      <CalendarSection />
    </div>
  );
}