
import { StudentEvaluation, UniversityType } from "../types";
import { getUniversityTypeDisplay } from "../utils/pdfExportUtils";
import { EvaluationTable } from "./EvaluationTable";

interface EvaluationSectionProps {
  type: string;
  evaluations: StudentEvaluation[];
}

export const EvaluationSection = ({ type, evaluations }: EvaluationSectionProps) => {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium">{getUniversityTypeDisplay(type as UniversityType)}</h3>
      <EvaluationTable 
        evaluations={evaluations} 
        universityType={type as UniversityType} 
      />
    </div>
  );
};
