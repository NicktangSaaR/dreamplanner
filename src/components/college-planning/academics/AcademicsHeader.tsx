import { CardHeader, CardTitle } from "@/components/ui/card";
import GradeCalculator from "./GradeCalculator";
import { Course } from "../types/course";

interface AcademicsHeaderProps {
  courses: Course[];
}

export default function AcademicsHeader({ courses }: AcademicsHeaderProps) {
  return (
    <CardHeader>
      <div className="flex justify-between items-center">
        <CardTitle>Academic Records</CardTitle>
        <GradeCalculator courses={courses} />
      </div>
    </CardHeader>
  );
}