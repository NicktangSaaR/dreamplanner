import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import AcademicsSection from "@/components/college-planning/AcademicsSection";

export default function Academics() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/college-planning')}
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