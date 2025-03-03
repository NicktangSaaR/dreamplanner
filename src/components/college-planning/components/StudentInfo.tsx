
import React from "react";
import { User } from "lucide-react";
import { StatusBadge } from "./StatusBadge";

interface StudentInfoProps {
  student: {
    full_name: string | null;
    grade: string | null;
    school: string | null;
    interested_majors: string[] | null;
  };
  status: string;
}

export const StudentInfo = ({ student, status }: StudentInfoProps) => {
  return (
    <div className="flex gap-3 flex-1 min-w-0">
      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <User className="h-5 w-5 text-primary" />
      </div>
      <div className="flex flex-col min-w-0">
        <div className="flex items-center flex-wrap gap-1">
          <h3 className="font-semibold text-base text-gray-900 truncate max-w-[calc(100%-70px)]">
            {student.full_name}
          </h3>
          <StatusBadge status={status} />
        </div>
        <p className="text-sm text-gray-600 truncate">
          {student.grade || "Grade not set"} • {student.school || "School not set"}
        </p>
        {student.interested_majors && student.interested_majors.length > 0 && (
          <p className="text-sm text-gray-500 truncate">
            Interested in: {student.interested_majors.join(", ")}
          </p>
        )}
      </div>
    </div>
  );
};
