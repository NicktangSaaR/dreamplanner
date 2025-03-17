
import { useState } from "react";
import { useUserStatus } from "@/hooks/useUserStatus";
import StudentSearchSection from "./components/StudentSearchSection";
import EvaluationsTable from "./components/EvaluationsTable";
import EvaluationFormDialog from "./components/EvaluationFormDialog";
import { useStudentsQuery, Student } from "./hooks/useStudentsQuery";
import { useEvaluationsQuery } from "./hooks/useEvaluationsQuery";
import { UniversityType } from "./types";
import UniversityTypeTabs from "./components/UniversityTypeTabs";

export default function StudentEvaluationManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeUniversityType, setActiveUniversityType] = useState<UniversityType>('ivyLeague');
  const { isAdmin } = useUserStatus();

  // Fetch students using the custom hook
  const { 
    data: students, 
    isLoading: isLoadingStudents 
  } = useStudentsQuery(isAdmin);

  // Fetch evaluations using the custom hook
  const { 
    data: evaluations, 
    isLoading: isLoadingEvals, 
    refetch: refetchEvaluations 
  } = useEvaluationsQuery(isAdmin);

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setDialogOpen(true);
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    refetchEvaluations();
  };

  if (!isAdmin) {
    return <div className="p-4 text-center">您没有访问该页面的权限</div>;
  }

  return (
    <div className="w-full max-w-full space-y-6">
      {/* Student Search Section */}
      <StudentSearchSection 
        students={students}
        isLoading={isLoadingStudents}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSelectStudent={handleSelectStudent}
      />

      {/* University Type Selector */}
      <div className="mb-4">
        <UniversityTypeTabs
          activeType={activeUniversityType}
          onChange={setActiveUniversityType}
        />
      </div>

      {/* Evaluations Table */}
      <div className="w-full overflow-x-auto">
        <EvaluationsTable 
          evaluations={evaluations}
          isLoading={isLoadingEvals}
          universityType={activeUniversityType}
        />
      </div>

      {/* Evaluation Form Dialog */}
      <EvaluationFormDialog
        isOpen={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedStudent={selectedStudent}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
