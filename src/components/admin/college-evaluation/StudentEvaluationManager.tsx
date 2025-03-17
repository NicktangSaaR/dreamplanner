
import { useState } from "react";
import { useUserStatus } from "@/hooks/useUserStatus";
import StudentSearchSection from "./components/StudentSearchSection";
import { useStudentsQuery, Student } from "./hooks/useStudentsQuery";
import { useEvaluationsQuery } from "./hooks/useEvaluationsQuery";
import { UniversityType } from "./types";
import { UniversityTypeTabs } from "./components/UniversityTypeTabs";
import { getUniqueUniversityTypes } from "./utils/evaluationGroupingUtils";
import EvaluationFormDialog from "./components/EvaluationFormDialog";
import { groupEvaluationsByType } from "./utils/evaluationGroupingUtils";
import { EvaluationSection } from "./components/EvaluationSection";

export default function StudentEvaluationManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeUniversityType, setActiveUniversityType] = useState<UniversityType | 'all'>('all');
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

  // Get unique university types from evaluations
  const universityTypes = getUniqueUniversityTypes(evaluations);

  const handleTabChange = (tab: UniversityType | 'all') => {
    setActiveUniversityType(tab);
  };

  // Group evaluations by university type
  const groupedEvaluations = groupEvaluationsByType(evaluations);

  // Filter evaluations based on active tab
  const filteredEvaluations = activeUniversityType === 'all'
    ? evaluations || []
    : (groupedEvaluations[activeUniversityType] || []);

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
          activeTab={activeUniversityType}
          setActiveTab={handleTabChange}
          universityTypes={['all', ...universityTypes]}
        />
      </div>

      {/* Evaluations Sections */}
      <div className="w-full space-y-8">
        {isLoadingEvals ? (
          <p className="text-center py-4 text-gray-500">Loading evaluations...</p>
        ) : activeUniversityType === 'all' ? (
          // When "All" is selected, show sections for each university type
          Object.entries(groupedEvaluations).map(([type, typeEvaluations]) => (
            <EvaluationSection
              key={type}
              type={type}
              evaluations={typeEvaluations}
            />
          ))
        ) : (
          // When a specific type is selected, show only that section
          <EvaluationSection
            type={activeUniversityType}
            evaluations={filteredEvaluations}
          />
        )}
        
        {evaluations && evaluations.length === 0 && (
          <p className="text-center py-4 text-gray-500">No evaluations found.</p>
        )}
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
