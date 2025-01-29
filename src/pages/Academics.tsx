import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import AcademicsSection from "@/components/college-planning/AcademicsSection";
import { Course } from "@/components/college-planning/types/course";
import { supabase } from "@/integrations/supabase/client";

export default function Academics() {
  const navigate = useNavigate();
  const { studentId = '' } = useParams<{ studentId: string }>();
  const location = useLocation();
  const [courses, setCourses] = useState<Course[]>([]);
  const isCounselorView = location.pathname.includes('/counselor-dashboard');

  console.log("Academics page - Student ID:", studentId);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!studentId) {
        toast.error("No student ID provided");
        return;
      }

      try {
        console.log("Fetching courses for student:", studentId);
        const { data, error } = await supabase
          .from("courses")
          .select("*")
          .eq("student_id", studentId);

        if (error) {
          console.error("Error fetching courses:", error);
          toast.error("Failed to fetch courses");
          return;
        }

        console.log("Fetched courses:", data);
        setCourses(data || []);
      } catch (error) {
        console.error("Error:", error);
        toast.error("An unexpected error occurred");
      }
    };

    fetchCourses();
  }, [studentId]);

  const handleBack = () => {
    if (!studentId) {
      navigate('/college-planning');
      return;
    }

    if (isCounselorView) {
      navigate(`/counselor-dashboard/student/${studentId}`);
    } else {
      navigate(`/student-dashboard/${studentId}`);
    }
  };

  if (!studentId) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
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

      <AcademicsSection 
        courses={courses}
        onCoursesChange={setCourses}
      />
    </div>
  );
}