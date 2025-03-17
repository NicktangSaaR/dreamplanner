
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StudentEvaluation, UniversityType } from "../types";
import { EvaluationRow } from "./EvaluationRow";

interface EvaluationTableProps {
  evaluations: StudentEvaluation[];
  universityType: UniversityType | string;
}

export const EvaluationTable = ({ evaluations, universityType }: EvaluationTableProps) => {
  const isUcSystem = universityType === 'ucSystem';
  
  if (evaluations.length === 0) {
    return <p className="text-center py-4 text-gray-500">No evaluations found for this type.</p>;
  }

  return (
    <div className="border rounded-md overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-semibold">Student Name</TableHead>
            <TableHead className="font-semibold">Evaluation Date</TableHead>
            <TableHead className="font-semibold">University Type</TableHead>
            <TableHead className="font-semibold">Total Score (Total/Average)</TableHead>
            <TableHead className="font-semibold">Academics</TableHead>
            <TableHead className="font-semibold">Extracurriculars</TableHead>
            <TableHead className="font-semibold">Athletics/Talents</TableHead>
            <TableHead className="font-semibold">Personal Qualities</TableHead>
            <TableHead className="font-semibold">Recommendations/PIQs</TableHead>
            {!isUcSystem && <TableHead className="font-semibold">Interview</TableHead>}
            <TableHead className="font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {evaluations.map((evaluation) => (
            <EvaluationRow 
              key={evaluation.id} 
              evaluation={evaluation} 
              universityType={universityType} 
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
