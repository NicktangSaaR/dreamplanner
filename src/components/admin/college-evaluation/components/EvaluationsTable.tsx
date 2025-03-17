
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
    <div className="border rounded-md w-full">
      <div className="p-4 bg-white border-b">
        <h3 className="text-lg font-semibold">Evaluations by University Type</h3>
        <p className="text-sm text-gray-500">
          Viewing {evaluations.length} evaluation{evaluations.length !== 1 ? 's' : ''} for {universityType === 'ivyLeague' ? 'Ivy League' : universityType === 'top30' ? 'Top 20-30' : 'UC System'} universities
        </p>
      </div>

      <div className="w-full overflow-x-auto">
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader className="bg-gray-50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="font-semibold">Student</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Score</TableHead>
                <TableHead className="font-semibold">Academics</TableHead>
                <TableHead className="font-semibold">Extracurriculars</TableHead>
                <TableHead className="font-semibold">Athletics</TableHead>
                <TableHead className="font-semibold">Personal Qualities</TableHead>
                <TableHead className="font-semibold">Recommendations</TableHead>
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
        </ScrollArea>
      </div>
    </div>
  );
}
