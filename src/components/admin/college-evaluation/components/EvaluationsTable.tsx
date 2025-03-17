
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { StudentEvaluation, UniversityType } from "../types";
import { EvaluationRow } from "./EvaluationRow";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EvaluationsTableProps {
  evaluations: StudentEvaluation[];
  universityType: UniversityType;
  isLoading?: boolean;
}

export default function EvaluationsTable({ evaluations, universityType, isLoading }: EvaluationsTableProps) {
  const isUcSystem = universityType === 'ucSystem';
  
  if (isLoading) {
    return <p className="text-center py-4 text-gray-500">Loading evaluations...</p>;
  }
  
  if (evaluations.length === 0) {
    return <p className="text-center py-4 text-gray-500">No evaluations found.</p>;
  }
  
  return (
    <div className="border rounded-md">
      <div className="p-4 bg-white border-b">
        <h3 className="text-lg font-semibold">Evaluations by University Type</h3>
        <p className="text-sm text-gray-500">
          Viewing {evaluations.length} evaluation{evaluations.length !== 1 ? 's' : ''} for {universityType === 'ivyLeague' ? 'Ivy League' : universityType === 'top30' ? 'Top 20-30' : 'UC System'} universities
        </p>
      </div>

      <ScrollArea className="h-[600px]">
        <Table>
          <TableHeader className="bg-gray-50 sticky top-0">
            <TableRow>
              <TableCell className="font-semibold">Student</TableCell>
              <TableCell className="font-semibold">Date</TableCell>
              <TableCell className="font-semibold">Type</TableCell>
              <TableCell className="font-semibold">Score</TableCell>
              {/* New admission factors */}
              <TableCell className="font-semibold">Academic Excellence</TableCell>
              <TableCell className="font-semibold">Impact & Leadership</TableCell>
              <TableCell className="font-semibold">Unique Narrative</TableCell>
              {/* Traditional criteria */}
              <TableCell className="font-semibold">Academics</TableCell>
              <TableCell className="font-semibold">Extracurriculars</TableCell>
              <TableCell className="font-semibold">Athletics</TableCell>
              <TableCell className="font-semibold">Personal Qualities</TableCell>
              <TableCell className="font-semibold">Recommendations</TableCell>
              {!isUcSystem && <TableCell className="font-semibold">Interview</TableCell>}
              <TableCell className="font-semibold">Actions</TableCell>
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
      </ScrollArea>
    </div>
  );
}
