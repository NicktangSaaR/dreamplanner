import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import AcademicsSection from "@/components/college-planning/AcademicsSection";
import { Course } from "@/components/college-planning/types/course";

export default function Academics() {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const location = useLocation();
  const [courses, setCourses] = useState<Course[]>([]);
  const isCounselorView = location.pathname.includes('/counselor-dashboard');

  const handleBack = () => {
    if (isCounselorView) {
      navigate(`/counselor-dashboard/student/${studentId}`);
    } else {
      navigate(`/student-dashboard/${studentId}`);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Academic Records</h1>
        </div>
      </div>
      
      <AcademicsSection onCoursesChange={setCourses} />
    </div>
  );
}